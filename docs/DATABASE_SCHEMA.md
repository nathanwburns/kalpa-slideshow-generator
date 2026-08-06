# Database Schema

## Purpose
The database stores durable application state, ownership, revision history, prompts, structured presentation documents, usage records, administrator rules, and export metadata. Large binary files must not be stored directly in PostgreSQL; they belong in private object storage and are referenced by storage keys.

The production database should use PostgreSQL with Prisma. Sprint 1 should include the Prisma schema and repository abstractions, while the local demo remains usable with in-memory repositories and no live database.

## Design principles
- Every user-owned record must be scoped by user or project ownership.
- Presentation revisions are immutable after creation.
- Structured presentation JSON is validated before persistence.
- Uploaded files and generated artifacts are referenced, not embedded.
- Retention and deletion states must be explicit.
- Administrative changes are versioned and auditable.
- Usage data is append-only where practical.
- Provider-specific identifiers remain optional and isolated.
- Soft deletion is used for recoverable user records; retention jobs permanently purge expired binaries and eligible metadata.

## Core entities

```text
User
 ├── Project
 │    ├── Presentation
 │    │    ├── PresentationRevision
 │    │    ├── PromptRecord
 │    │    ├── AssumptionRecord
 │    │    └── ExportRecord
 │    ├── Asset
 │    └── UsageEvent
 ├── Account / Session
 └── AdminMembership

TemplateFamily
 └── TemplateVersion
      └── LayoutVersion

AdminRuleSet
 └── AdminRuleVersion

GenerationJob
 └── GenerationStageRun
```

## Prisma model guidance
The exact Prisma syntax may change during implementation, but the following fields and relationships are required.

## User

```prisma
model User {
  id              String      @id @default(cuid())
  email           String      @unique
  name            String?
  imageUrl        String?
  status          UserStatus  @default(ACTIVE)
  role            UserRole    @default(MEMBER)
  googleSubject   String?     @unique
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deletedAt       DateTime?

  projects        Project[]
  prompts         PromptRecord[]
  exports         ExportRecord[]
  usageEvents     UsageEvent[]
  auditEvents     AuditEvent[] @relation("AuditActor")
}
```

Enums:

```prisma
enum UserStatus {
  ACTIVE
  SUSPENDED
  BLOCKED
  DELETED
}

enum UserRole {
  MEMBER
  ADMIN
  SUPER_ADMIN
}
```

Future Google Workspace enforcement should validate `@kalpainc.com` at sign-in and still check `User.status` so blocked accounts cannot re-enter.

## Project
A project is the user-facing container shown in project history. A project may contain one primary presentation and future derived versions or related presentations.

```prisma
model Project {
  id              String        @id @default(cuid())
  ownerId         String
  title           String
  description     String?
  status          ProjectStatus @default(ACTIVE)
  sourceProjectId String?
  lastOpenedAt    DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  owner           User          @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  presentations   Presentation[]
  assets          Asset[]
  usageEvents     UsageEvent[]

  @@index([ownerId, updatedAt])
  @@index([status, updatedAt])
}
```

```prisma
enum ProjectStatus {
  ACTIVE
  ARCHIVED
  DELETED
}
```

Shared projects are out of scope for version one. Do not add collaboration tables until required.

## Presentation
Stores current metadata and pointers. The canonical presentation document lives in revisions, not as a mutable JSON blob on this table.

```prisma
model Presentation {
  id                  String               @id @default(cuid())
  projectId           String
  title               String
  type                PresentationType
  status              PresentationStatus  @default(BRIEF)
  schemaVersion       String
  templateFamilyId    String?
  templateVersion     String?
  currentRevisionId   String?              @unique
  publishedRevisionId String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  deletedAt           DateTime?

  project             Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  revisions           PresentationRevision[] @relation("PresentationRevisions")
  currentRevision     PresentationRevision?  @relation("CurrentPresentationRevision", fields: [currentRevisionId], references: [id], onDelete: SetNull)
  prompts             PromptRecord[]
  assumptions         AssumptionRecord[]
  exports             ExportRecord[]
  generationJobs      GenerationJob[]

  @@index([projectId, updatedAt])
  @@index([status, updatedAt])
}
```

Enums should align with `PRESENTATION_SCHEMA.md`.

## PresentationRevision
Every meaningful mutation creates an immutable revision.

```prisma
model PresentationRevision {
  id                String       @id @default(cuid())
  presentationId    String
  parentRevisionId  String?
  revisionNumber    Int
  label             String
  reason            String
  actorType         RevisionActorType
  actorUserId       String?
  schemaVersion     String
  documentJson      Json
  changedSlideIds   String[]
  contentHash       String
  createdAt         DateTime     @default(now())

  presentation      Presentation @relation("PresentationRevisions", fields: [presentationId], references: [id], onDelete: Cascade)
  currentFor        Presentation? @relation("CurrentPresentationRevision")
  parentRevision    PresentationRevision? @relation("RevisionParent", fields: [parentRevisionId], references: [id], onDelete: SetNull)
  childRevisions    PresentationRevision[] @relation("RevisionParent")
  exports           ExportRecord[]

  @@unique([presentationId, revisionNumber])
  @@index([presentationId, createdAt])
  @@index([parentRevisionId])
  @@index([contentHash])
}
```

Implementation requirements:
- Validate `documentJson` through the canonical Zod schema before write.
- Calculate `contentHash` from canonicalized JSON.
- Never update `documentJson` after creation.
- Restoration creates a new revision copied from the historical revision; it does not move history backward destructively.

For early versions, full snapshots are preferred over JSON patches because they simplify deterministic restoration. Storage optimization can later introduce periodic snapshots plus patches.

## PromptRecord
Stores user prompts, clarifying answers, edit instructions, and approved admin interpretations.

```prisma
model PromptRecord {
  id                 String       @id @default(cuid())
  userId             String?
  presentationId     String?
  revisionId         String?
  kind               PromptKind
  scope              PromptScope
  rawText            String
  normalizedIntent   Json?
  targetSlideIds     String[]
  promptVersion      String?
  modelRoute         String?
  status             PromptStatus @default(RECEIVED)
  createdAt          DateTime     @default(now())

  user               User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  presentation       Presentation? @relation(fields: [presentationId], references: [id], onDelete: Cascade)

  @@index([presentationId, createdAt])
  @@index([userId, createdAt])
}
```

Prompt history is retained for reuse. Application logs must not duplicate raw confidential prompt contents.

## AssumptionRecord

```prisma
model AssumptionRecord {
  id               String           @id @default(cuid())
  presentationId   String
  revisionId       String?
  text             String
  reason           String
  status           AssumptionStatus @default(ACTIVE)
  sourcePromptId   String?
  createdAt        DateTime         @default(now())
  resolvedAt       DateTime?

  presentation     Presentation     @relation(fields: [presentationId], references: [id], onDelete: Cascade)

  @@index([presentationId, status])
}
```

## Asset
Represents uploaded, generated, brand, stock, logo, and icon assets.

```prisma
model Asset {
  id                String      @id @default(cuid())
  projectId         String?
  ownerId           String?
  kind              AssetKind
  status            AssetStatus @default(ACTIVE)
  filename          String?
  mimeType          String
  storageKey        String?
  checksum          String?
  byteSize          BigInt?
  width             Int?
  height            Int?
  sourceUrl         String?
  sourceAttribution String?
  metadataJson      Json?
  createdAt         DateTime    @default(now())
  expiresAt         DateTime?
  deletedAt         DateTime?

  project           Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
  @@index([expiresAt, status])
  @@index([checksum])
}
```

Rules:
- Source uploads default to `expiresAt = createdAt + 24 hours`.
- Temporary render assets default to 24 hours.
- Published export artifacts use 30 days and are represented through `ExportRecord`.
- Brand assets may be non-expiring.
- Deduplicate identical uploads by checksum where authorization permits.
- A deleted or expired asset must not leave a live public URL.

## ExportRecord

```prisma
model ExportRecord {
  id               String       @id @default(cuid())
  presentationId   String
  revisionId       String
  requestedById    String?
  format            ExportFormat
  status            ExportStatus @default(QUEUED)
  storageKey        String?
  externalUrl       String?
  providerFileId    String?
  byteSize          BigInt?
  errorCode         String?
  errorMessageSafe  String?
  createdAt         DateTime      @default(now())
  completedAt       DateTime?
  expiresAt         DateTime?
  downloadedAt      DateTime?
  downloadCount     Int           @default(0)

  presentation     Presentation  @relation(fields: [presentationId], references: [id], onDelete: Cascade)
  revision         PresentationRevision @relation(fields: [revisionId], references: [id], onDelete: Restrict)
  requestedBy      User?         @relation(fields: [requestedById], references: [id], onDelete: SetNull)

  @@index([presentationId, createdAt])
  @@index([requestedById, createdAt])
  @@index([expiresAt, status])
}
```

Every export creates a new record and artifact. Exports expire after 30 days by default.

## TemplateFamily, TemplateVersion, and LayoutVersion
Template definitions should primarily live in source control for Sprint 1. Database records support administration, publication, and historical resolution later.

```prisma
model TemplateFamily {
  id             String      @id
  name           String
  status         PublishStatus @default(DRAFT)
  currentVersion String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  versions       TemplateVersion[]
}

model TemplateVersion {
  id                String      @id @default(cuid())
  familyId          String
  version            String
  definitionJson     Json
  status             PublishStatus @default(DRAFT)
  createdById        String?
  createdAt          DateTime    @default(now())
  publishedAt        DateTime?

  family             TemplateFamily @relation(fields: [familyId], references: [id], onDelete: Cascade)
  layouts            LayoutVersion[]

  @@unique([familyId, version])
}

model LayoutVersion {
  id                String      @id @default(cuid())
  templateVersionId String
  layoutId          String
  version           String
  definitionJson    Json

  templateVersion   TemplateVersion @relation(fields: [templateVersionId], references: [id], onDelete: Cascade)

  @@unique([templateVersionId, layoutId, version])
}
```

Do not persist arbitrary unvalidated template JSON. Validate all definitions against the template schema.

## AdminRuleSet and AdminRuleVersion
Global administrator instructions must be versioned and published only after approval.

```prisma
model AdminRuleSet {
  id               String      @id @default(cuid())
  name             String
  category         AdminRuleCategory
  currentVersionId String?     @unique
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  versions         AdminRuleVersion[] @relation("RuleSetVersions")
  currentVersion   AdminRuleVersion?  @relation("CurrentRuleVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
}

model AdminRuleVersion {
  id                String      @id @default(cuid())
  ruleSetId         String
  version           Int
  rawInstruction    String
  normalizedRuleJson Json
  impactSummary     String
  status            PublishStatus @default(DRAFT)
  createdById       String?
  approvedById      String?
  createdAt         DateTime    @default(now())
  publishedAt       DateTime?

  ruleSet            AdminRuleSet @relation("RuleSetVersions", fields: [ruleSetId], references: [id], onDelete: Cascade)
  currentFor         AdminRuleSet? @relation("CurrentRuleVersion")

  @@unique([ruleSetId, version])
}
```

Published rule versions are immutable. A change creates a new version.

## GenerationJob
Long-running generation, revision, and export tasks must run as jobs.

```prisma
model GenerationJob {
  id                String       @id @default(cuid())
  presentationId    String?
  revisionId        String?
  type              JobType
  status            JobStatus    @default(QUEUED)
  idempotencyKey    String       @unique
  requestedById     String?
  inputJson         Json
  outputJson        Json?
  attemptCount      Int          @default(0)
  maxAttempts       Int          @default(3)
  errorCode         String?
  errorMessageSafe  String?
  queuedAt          DateTime     @default(now())
  startedAt         DateTime?
  completedAt       DateTime?

  presentation      Presentation? @relation(fields: [presentationId], references: [id], onDelete: Cascade)
  stageRuns          GenerationStageRun[]

  @@index([status, queuedAt])
  @@index([presentationId, queuedAt])
}
```

## GenerationStageRun

```prisma
model GenerationStageRun {
  id                String      @id @default(cuid())
  jobId             String
  stageId           String
  stageVersion      String
  modelRoute        String?
  status            JobStatus
  attempt           Int
  inputHash         String
  outputJson        Json?
  warningJson       Json?
  promptTokens      Int?
  completionTokens  Int?
  estimatedCostUsd  Decimal?    @db.Decimal(12, 6)
  startedAt         DateTime    @default(now())
  completedAt       DateTime?
  errorCode         String?

  job               GenerationJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([jobId, stageId, attempt])
  @@index([jobId, startedAt])
}
```

Do not store hidden chain-of-thought. Store structured inputs, structured outputs, usage, warnings, and safe error metadata.

## UsageEvent
Usage limits are disabled initially, but usage must be recorded from launch.

```prisma
model UsageEvent {
  id                String      @id @default(cuid())
  userId            String?
  projectId         String?
  eventType         UsageEventType
  quantity          Int         @default(1)
  estimatedCostUsd  Decimal?    @db.Decimal(12, 6)
  metadataJson      Json?
  occurredAt        DateTime    @default(now())

  user              User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  project           Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([userId, occurredAt])
  @@index([eventType, occurredAt])
}
```

Examples:
- presentation created
- slide generated
- image generated
- revision created
- export completed
- file uploaded
- provider tokens consumed

## AuditEvent
Security- and administration-relevant actions require an audit trail.

```prisma
model AuditEvent {
  id               String      @id @default(cuid())
  actorUserId      String?
  action           String
  targetType       String
  targetId         String?
  projectId        String?
  metadataJson     Json?
  occurredAt       DateTime    @default(now())

  actor            User?       @relation("AuditActor", fields: [actorUserId], references: [id], onDelete: SetNull)

  @@index([actorUserId, occurredAt])
  @@index([targetType, targetId])
  @@index([occurredAt])
}
```

Audit examples:
- user blocked or restored
- admin promoted or removed
- rule version published
- template version published
- project deleted
- export downloaded
- retention purge executed

Audit metadata must not contain raw secrets or full confidential documents.

## Authentication tables
When Google login is added, use the authentication framework's standard account, session, and verification-token models. Keep identity provider records separate from core `User` data.

Required behavior:
- Google subject ID is durable identity.
- Email must be verified.
- Domain must equal `kalpainc.com` before confidential pilot use.
- Blocked or suspended status overrides successful OAuth.

## Data retention

### Source uploads
- Expire 24 hours after creation.
- Background cleanup marks the asset expired, deletes object storage content, and records a cleanup audit event.
- Metadata may be retained only when necessary for history, but storage keys and signed URLs must be invalidated.

### Temporary files
- Expire after 24 hours.
- Includes render intermediates, conversion files, thumbnails not required for durable project history, and transient AI-processing artifacts.

### Exports
- Expire after 30 days.
- Preserve export metadata after artifact deletion if needed for audit and usage history.
- Status becomes `EXPIRED` and storage content is removed.

### Prompts and structured presentations
- Retained until the user deletes the project or organization policy requires deletion.
- Deleting a project should begin with a recoverable soft-delete window, then permanent purge.

## Cleanup jobs
Required recurring jobs:
- expire source assets
- expire temporary assets
- expire exports
- permanently purge soft-deleted projects after the recovery period
- remove orphaned storage objects
- reconcile failed storage deletions

Cleanup jobs must be idempotent and safe to retry.

## Authorization rules
Every repository method must accept an authorization context. Do not fetch a project by ID and authorize later in UI code.

Examples:
- Members can access only their own projects.
- Administrators may manage users and global rules.
- Administrators should not automatically receive access to confidential project content unless product policy explicitly grants it.
- System jobs operate through a restricted service identity.

## Indexing strategy
Minimum indexes:
- projects by owner and updated date
- presentations by project and updated date
- revisions by presentation and revision number
- prompts by presentation and creation date
- assets by expiration and status
- exports by expiration and status
- jobs by status and queue date
- usage by user and date
- audits by actor, target, and date

Use partial indexes in production for active queued jobs and unexpired artifacts when beneficial.

## JSON field policy
JSON is appropriate for:
- immutable presentation documents
- template definitions
- normalized AI outputs
- provider metadata
- flexible audit metadata

Use relational columns for:
- ownership
- lifecycle state
- dates
- identifiers
- commonly filtered fields
- authorization boundaries
- retention fields

Do not hide important queryable relationships inside JSON.

## Transaction boundaries
Use database transactions for:
- creating a revision and updating `currentRevisionId`
- publishing an admin rule version and updating the current pointer
- publishing a template version and updating the current pointer
- completing an export and recording usage
- blocking a user and writing the audit event

Object-storage writes cannot participate in PostgreSQL transactions. Use job states and compensating cleanup for cross-system consistency.

## Optimistic concurrency
Editing commands should include the expected current revision ID. Reject or reconcile the mutation if the presentation has changed since the client loaded it.

Return a typed conflict containing:
- expected revision
- actual revision
- changed slide IDs when available

## Migration strategy
- Prisma migrations are committed to source control.
- Production migrations run as a controlled deployment step.
- Destructive changes require explicit data migration plans.
- Presentation schema migrations are separate from relational database migrations.
- Seed data must be safe to run only in development or test environments.

## Sprint 1 requirements
Codex should implement:
- `prisma/schema.prisma` with the core models above
- enums aligned with domain schemas
- repository interfaces for projects, presentations, revisions, templates, and admin rules
- in-memory repository implementations
- fixture builders
- tests for revision immutability, ownership filtering, and current revision updates
- no requirement for a running PostgreSQL instance in the demo workflow

## Deferred database work
- Real authentication tables and sessions
- Production migrations and Railway PostgreSQL provisioning
- Team collaboration tables
- Fine-grained organization roles
- Full-text or vector retrieval indexes
- Analytics warehouse integration
- Billing records
