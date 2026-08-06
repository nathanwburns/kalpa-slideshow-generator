# API Specification

## Purpose
This document defines the application API, background-job boundaries, provider interfaces, error model, authorization requirements, and versioning rules for the Kalpa Slideshow Generator.

Sprint 1 should implement route handlers and service interfaces with mock behavior. Live OpenAI, storage, PowerPoint, Google Slides, and database integrations remain deferred.

## API style
- Use Next.js route handlers for the initial application.
- Expose JSON APIs under `/api/v1`.
- Validate request and response payloads with Zod.
- Keep route handlers thin: authenticate, authorize, validate, call an application service, and serialize the result.
- Domain services must not depend on HTTP-specific types.
- Long-running operations return jobs rather than holding open HTTP requests.
- Use ISO 8601 UTC timestamps.
- Use opaque string IDs.

## Standard response envelope

Successful response:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_123"
  }
}
```

List response:

```json
{
  "data": [],
  "meta": {
    "requestId": "req_123",
    "nextCursor": null
  }
}
```

Error response:

```json
{
  "error": {
    "code": "PRESENTATION_REVISION_CONFLICT",
    "message": "The presentation changed after this editor session loaded.",
    "requestId": "req_123",
    "details": {
      "expectedRevisionId": "rev_1",
      "actualRevisionId": "rev_2"
    }
  }
}
```

Do not return stack traces, provider secrets, raw provider responses, confidential document contents, or internal SQL errors.

## Authentication and authorization
Sprint 1 may use a mock current user. Production behavior must:
- authenticate with Google Workspace;
- require a verified `@kalpainc.com` email;
- reject blocked or suspended users;
- authorize every project and presentation operation through the service or repository layer;
- require admin role for `/api/v1/admin/*` routes.

Do not rely on hidden navigation or client-side checks for security.

## Idempotency
Mutating operations that can create duplicate work must accept an `Idempotency-Key` header.

Required for:
- presentation generation;
- slide or deck revision commands;
- export creation;
- direct Google Slides publishing;
- asset-finalization requests.

A repeated request with the same user, route, and key should return the original operation or job unless the payload differs. Payload mismatch should return `IDEMPOTENCY_KEY_REUSED`.

## Concurrency
Presentation mutations must include `expectedRevisionId`.

If the current revision differs, return HTTP 409 with `PRESENTATION_REVISION_CONFLICT` and include:
- expected revision ID;
- actual revision ID;
- changed slide IDs when available.

## Pagination
Use cursor-based pagination for project history, revisions, exports, users, and audit events.

Query fields:
- `cursor`
- `limit`, default 20, maximum 100

## Health endpoints

### `GET /api/health`
Public liveness endpoint.

Response:

```json
{
  "status": "ok",
  "version": "git-sha-or-release",
  "timestamp": "2026-08-06T12:00:00Z"
}
```

### `GET /api/ready`
Readiness endpoint for Railway. It may check required production dependencies but must not expose credentials or sensitive topology.

## Current user

### `GET /api/v1/me`
Returns the current user, role, status, usage summary, and enabled feature flags.

## Projects

### `GET /api/v1/projects`
Returns projects owned by the current user.

Filters:
- `status`
- `query`
- `templateFamilyId`
- `updatedAfter`

### `POST /api/v1/projects`
Creates a project and initial presentation shell.

Request:

```json
{
  "title": "Manufacturing downtime sales deck",
  "description": "Optional internal project description",
  "presentationType": "sales"
}
```

Response includes project and presentation IDs.

### `GET /api/v1/projects/:projectId`
Returns project summary, presentation metadata, current revision summary, recent exports, and eligible actions.

### `PATCH /api/v1/projects/:projectId`
Updates title, description, or archive status.

### `DELETE /api/v1/projects/:projectId`
Soft deletes the project. This must not immediately remove historical metadata or binaries outside the configured deletion workflow.

### `POST /api/v1/projects/:projectId/restore`
Restores a project during the recovery period.

### `POST /api/v1/projects/:projectId/duplicate`
Creates a new independent project from a selected revision.

Request:

```json
{
  "revisionId": "rev_123",
  "title": "New shorter manufacturing deck"
}
```

## Brief and sources

### `PUT /api/v1/presentations/:presentationId/brief`
Creates or updates the structured brief.

Request includes:
- raw prompt;
- type;
- audience;
- objective;
- desired outcome;
- constraints;
- requested slide count;
- selected source asset IDs;
- expected revision ID when updating an existing draft.

### `POST /api/v1/presentations/:presentationId/analyze-brief`
Creates a background job for brief normalization and source analysis.

Response: HTTP 202 with `GenerationJob` summary.

### `GET /api/v1/presentations/:presentationId/questions`
Returns open clarifying questions and fallback assumptions.

### `POST /api/v1/presentations/:presentationId/questions/answers`
Submits answers or skipped-question decisions.

Request:

```json
{
  "answers": [
    {
      "questionId": "question_1",
      "answer": "VP of Operations and plant managers",
      "skipped": false
    }
  ]
}
```

## Uploads and assets

### `POST /api/v1/projects/:projectId/assets/upload-intents`
Creates one or more private upload intents.

Request:

```json
{
  "files": [
    {
      "filename": "client-brief.pdf",
      "mimeType": "application/pdf",
      "byteSize": 842311,
      "checksum": "sha256-value"
    }
  ]
}
```

Response contains asset IDs and short-lived signed upload data. Sprint 1 should return mock intents.

### `POST /api/v1/assets/:assetId/finalize`
Confirms successful upload, validates metadata, and queues processing.

### `GET /api/v1/assets/:assetId`
Returns asset metadata only. Binary access requires a separate short-lived signed URL.

### `POST /api/v1/assets/:assetId/download-url`
Returns a short-lived signed URL when the current user is authorized.

### `DELETE /api/v1/assets/:assetId`
Marks an asset for deletion and removes it from future generation context.

### `POST /api/v1/assets/:assetId/regenerate`
For generated images only, creates a new generation job using a revised visual brief.

## Outline

### `POST /api/v1/presentations/:presentationId/outline/generate`
Queues Story Architect generation.

Request:

```json
{
  "expectedRevisionId": "rev_123",
  "targetSlideCount": 8
}
```

### `GET /api/v1/presentations/:presentationId/outline`
Returns narrative plan, outline items, assumptions, evidence mapping, and quality scores.

### `PUT /api/v1/presentations/:presentationId/outline`
Persists user edits to the outline and creates a revision.

Supported changes:
- reorder;
- add;
- remove;
- split;
- merge;
- update working headline;
- update purpose;
- update key message.

### `POST /api/v1/presentations/:presentationId/outline/approve`
Marks the outline approved and makes the presentation eligible for draft generation.

## Templates

### `GET /api/v1/templates`
Returns published template families and representative preview metadata.

### `GET /api/v1/templates/:familyId`
Returns the published family definition, layouts, versions, use cases, and preview assets.

### `POST /api/v1/presentations/:presentationId/template`
Selects or changes a template family.

Request:

```json
{
  "familyId": "editorial-signal",
  "expectedRevisionId": "rev_123",
  "previewOnly": false
}
```

A family change must remap layouts, run validation, and create a revision. `previewOnly` may return a transient remapping proposal without persistence.

## Draft generation

### `POST /api/v1/presentations/:presentationId/generate`
Queues initial draft generation.

Request:

```json
{
  "expectedRevisionId": "rev_123",
  "templateFamilyId": "human-centered-sales",
  "imagePolicy": "generate-when-useful"
}
```

Response: HTTP 202 job summary.

### `GET /api/v1/presentations/:presentationId`
Returns presentation metadata and the current validated presentation document, optionally excluding heavy element data for list views.

Query:
- `revisionId`
- `includeDocument=true|false`

### `GET /api/v1/presentations/:presentationId/slides/:slideId`
Returns one slide and directly referenced assets, sources, assumptions, and validation results.

## Conversational editing

### `POST /api/v1/presentations/:presentationId/commands/interpret`
Interprets a natural-language edit without applying it.

Request:

```json
{
  "instruction": "Make slide seven more visual and reduce the text",
  "scope": {
    "type": "slide",
    "slideIds": ["slide_7"]
  },
  "expectedRevisionId": "rev_123"
}
```

Response:
- typed command proposal;
- interpreted intent;
- affected slide IDs;
- expected impact;
- whether explicit confirmation is recommended;
- warnings.

### `POST /api/v1/presentations/:presentationId/commands`
Applies a structured command or interprets and applies a natural-language instruction.

Request may include either:
- `command`, or
- `instruction` and `scope`.

High-impact operations should require `confirmed: true` after an interpretation step.

Response: job summary for AI-dependent changes or a new revision for deterministic commands.

### `POST /api/v1/presentations/:presentationId/slides`
Adds a slide using structured outline information.

### `DELETE /api/v1/presentations/:presentationId/slides/:slideId`
Removes a slide through a validated command and creates a revision.

### `POST /api/v1/presentations/:presentationId/slides/:slideId/duplicate`
Duplicates a slide with new object IDs.

### `POST /api/v1/presentations/:presentationId/slides/:slideId/split`
Splits one slide into two or more slides and queues targeted narrative and design work.

### `POST /api/v1/presentations/:presentationId/slides/merge`
Merges adjacent slides and updates narrative transitions.

### `POST /api/v1/presentations/:presentationId/slides/reorder`
Reorders slides and validates narrative dependencies.

## Revisions

### `GET /api/v1/presentations/:presentationId/revisions`
Returns revision summaries.

### `GET /api/v1/presentations/:presentationId/revisions/:revisionId`
Returns the immutable presentation document for that revision.

### `POST /api/v1/presentations/:presentationId/revisions/:revisionId/restore`
Creates a new revision based on the selected historical revision.

### `POST /api/v1/presentations/:presentationId/revisions/:revisionId/duplicate-project`
Creates a new project from the historical revision.

### `GET /api/v1/presentations/:presentationId/revisions/compare`
Query:
- `fromRevisionId`
- `toRevisionId`

Returns changed slide IDs, added and removed slides, changed element IDs, and summary metadata. It does not need to generate a visual diff in Sprint 1.

## Validation

### `POST /api/v1/presentations/:presentationId/validate`
Runs final presentation validation against a revision.

Checks:
- schema validity;
- text overflow risk;
- content density;
- unresolved assumptions;
- unsupported export features;
- missing assets;
- missing source links;
- visual contrast metadata;
- layout compatibility;
- image-resolution warnings.

### `GET /api/v1/presentations/:presentationId/validation`
Returns the latest validation report.

## Preview

### `GET /api/v1/presentations/:presentationId/preview`
Returns preview manifest data for a revision.

Query:
- `revisionId`
- `slideId`
- `scale`

The web application should generally render from structured data directly. This route may later provide pre-rendered thumbnails or cached manifests.

### `POST /api/v1/presentations/:presentationId/preview/render`
Queues high-fidelity preview rendering when needed.

## Exports

### `POST /api/v1/presentations/:presentationId/exports`
Creates an export job.

Request:

```json
{
  "revisionId": "rev_123",
  "format": "pptx",
  "options": {
    "includeSpeakerNotes": true,
    "includeSources": true
  }
}
```

Supported formats:
- `pptx`
- `google-slides`
- `pdf`
- `png-bundle`

Every request creates a new independent export artifact.

### `GET /api/v1/presentations/:presentationId/exports`
Returns export history and expiration dates.

### `GET /api/v1/exports/:exportId`
Returns export metadata and status.

### `POST /api/v1/exports/:exportId/download-url`
Returns a short-lived signed download URL for completed, unexpired artifacts.

### `POST /api/v1/exports/:exportId/retry`
Retries an eligible failed export using the same revision and options.

### `DELETE /api/v1/exports/:exportId`
Deletes the artifact early and marks the export deleted or expired.

## Jobs

### `GET /api/v1/jobs/:jobId`
Returns job status, progress, safe stage name, warnings, and error information.

Example:

```json
{
  "data": {
    "id": "job_123",
    "type": "GENERATE_PRESENTATION",
    "status": "PROCESSING",
    "progress": 0.62,
    "currentStage": "visual-director",
    "warnings": []
  }
}
```

### `POST /api/v1/jobs/:jobId/cancel`
Requests cancellation. Cancellation is best effort; completed immutable outputs remain valid.

### `POST /api/v1/jobs/:jobId/retry`
Creates or resumes an eligible retry using the original idempotency context.

## Admin users

### `GET /api/v1/admin/users`
Lists users with filters for role, status, email, and last login.

### `PATCH /api/v1/admin/users/:userId`
Updates status or role.

Allowed actions:
- activate;
- suspend;
- block;
- restore;
- promote to admin;
- demote from admin.

Every change requires an audit event.

## Admin rules

### `GET /api/v1/admin/rules`
Lists rule sets and current published versions.

### `POST /api/v1/admin/rules/proposals`
Interprets a freeform administrator instruction into a normalized proposed rule.

Request:

```json
{
  "category": "imagery",
  "instruction": "Stop using images of people looking at transparent screens"
}
```

Response:
- normalized rule;
- scope;
- impact summary;
- examples of affected future behavior;
- warnings.

### `POST /api/v1/admin/rule-sets`
Creates a new rule set or draft version.

### `POST /api/v1/admin/rule-sets/:ruleSetId/versions/:versionId/publish`
Publishes the approved version immediately and updates the current pointer.

### `GET /api/v1/admin/rule-sets/:ruleSetId/versions`
Returns immutable version history.

## Admin templates

### `GET /api/v1/admin/templates`
Returns draft and published template versions.

### `POST /api/v1/admin/templates/:familyId/versions`
Creates a draft version from a validated template definition.

### `POST /api/v1/admin/templates/:familyId/versions/:version/publish`
Publishes a template version and updates the current pointer.

Template editing UI is not required in Sprint 1; route and service interfaces may be placeholders.

## Usage and audit

### `GET /api/v1/admin/usage`
Returns usage summaries by period, user, event type, and provider route.

### `GET /api/v1/admin/audit-events`
Returns paginated audit events.

Raw confidential prompt text should not be exposed through broad administrator usage or audit endpoints.

## Background job types

```ts
type JobType =
  | "PROCESS_ASSET"
  | "ANALYZE_BRIEF"
  | "GENERATE_OUTLINE"
  | "GENERATE_PRESENTATION"
  | "APPLY_PRESENTATION_COMMAND"
  | "GENERATE_IMAGE"
  | "VALIDATE_PRESENTATION"
  | "RENDER_PREVIEW"
  | "EXPORT_PPTX"
  | "EXPORT_GOOGLE_SLIDES"
  | "EXPORT_PDF"
  | "EXPORT_PNG_BUNDLE"
  | "PURGE_EXPIRED_ASSETS"
  | "PURGE_EXPIRED_EXPORTS";
```

## Job lifecycle

```text
QUEUED
  → PROCESSING
      → COMPLETED
      → FAILED
      → CANCELLED
      → WAITING_FOR_APPROVAL
```

Jobs must:
- have an idempotency key;
- record attempts;
- expose safe progress;
- support retries where appropriate;
- write structured stage runs;
- avoid duplicate revisions or artifacts;
- emit usage events;
- preserve safe failure metadata.

## Queue design
Initial production recommendation:
- Redis-backed queue and worker service on Railway;
- separate web and worker processes;
- job payloads contain IDs and small structured inputs, not binary files;
- workers fetch authorized data through repositories and private storage;
- scheduled cleanup jobs run through the same queue or a dedicated scheduler.

Sprint 1 may implement an in-process fake queue for local navigation and tests.

## Provider interfaces

### AI provider

```ts
interface AIProvider {
  executeStructured<Input, Output>(request: StructuredAIRequest<Input, Output>): Promise<StructuredAIResult<Output>>;
  analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
  generateImage(request: ImageGenerationRequest): Promise<GeneratedImageResult>;
}
```

Domain services should depend on generation-stage interfaces rather than directly on a provider SDK.

### Storage provider

```ts
interface StorageProvider {
  createUploadIntent(input: UploadIntentInput): Promise<UploadIntent>;
  createDownloadUrl(storageKey: string, expiresInSeconds: number): Promise<string>;
  putObject(input: PutObjectInput): Promise<StoredObject>;
  getObject(storageKey: string): Promise<ReadableStream | Buffer>;
  deleteObject(storageKey: string): Promise<void>;
  objectExists(storageKey: string): Promise<boolean>;
}
```

### Presentation renderer

```ts
interface PresentationRenderer {
  format: "pptx" | "pdf" | "png-bundle";
  render(input: RenderPresentationInput): Promise<RenderPresentationResult>;
}
```

### Google Slides publisher

```ts
interface GoogleSlidesPublisher {
  publish(input: PublishGoogleSlidesInput): Promise<PublishGoogleSlidesResult>;
}
```

Every Google Slides publish creates a new file in version one.

### Repository interfaces
Required repositories:
- `ProjectRepository`
- `PresentationRepository`
- `RevisionRepository`
- `AssetRepository`
- `ExportRepository`
- `TemplateRepository`
- `AdminRuleRepository`
- `JobRepository`
- `UsageRepository`
- `AuditRepository`

Repository methods must accept an authorization context or be wrapped by services that enforce ownership before retrieval.

## Application services
Recommended service boundaries:
- `ProjectService`
- `BriefService`
- `OutlineService`
- `PresentationGenerationService`
- `PresentationCommandService`
- `RevisionService`
- `AssetService`
- `TemplateService`
- `ValidationService`
- `ExportService`
- `AdminUserService`
- `AdminRuleService`
- `UsageService`

## Error codes
Minimum typed error codes:
- `AUTHENTICATION_REQUIRED`
- `ACCESS_DENIED`
- `USER_BLOCKED`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_FAILED`
- `PRESENTATION_REVISION_CONFLICT`
- `IDEMPOTENCY_KEY_REUSED`
- `JOB_NOT_RETRYABLE`
- `UNSUPPORTED_FILE_TYPE`
- `FILE_TOO_LARGE`
- `ASSET_EXPIRED`
- `EXPORT_EXPIRED`
- `TEMPLATE_NOT_FOUND`
- `LAYOUT_NOT_COMPATIBLE`
- `UNSUPPORTED_EXPORT_FEATURE`
- `PROVIDER_NOT_CONFIGURED`
- `PROVIDER_RATE_LIMITED`
- `PROVIDER_UNAVAILABLE`
- `GENERATION_SCHEMA_INVALID`
- `GENERATION_FAILED`
- `QUOTA_EXCEEDED`

Suggested HTTP mapping:
- 400 invalid request
- 401 unauthenticated
- 403 unauthorized or blocked
- 404 not found
- 409 revision or idempotency conflict
- 410 expired asset or export
- 413 file too large
- 422 semantically invalid request
- 429 quota or provider throttling
- 500 unexpected internal failure
- 503 dependency unavailable

## Feature flags
Feature flags may control:
- live AI generation;
- real uploads;
- authentication;
- PowerPoint export;
- Google Slides export;
- PDF export;
- admin rule editing;
- monthly quotas.

The `/me` response may return flags needed by the client. Server-side authorization and configuration remain authoritative.

## API telemetry
Record:
- request ID;
- route name;
- method;
- status code;
- latency;
- user ID when available;
- project ID when safe;
- job ID;
- error code.

Do not record:
- raw authorization headers;
- API keys;
- full prompts in general application logs;
- uploaded document contents;
- signed URLs;
- confidential slide text unless stored in authorized project records.

## Rate limiting
Before broad access, apply limits by user and route category:
- upload intents;
- generation jobs;
- image generation;
- exports;
- admin operations.

Testing may use unlimited product quotas, but protective burst limits should remain possible.

## API versioning
- Begin with `/api/v1`.
- Additive optional response fields do not require a new API version.
- Breaking route or semantic changes require a new API version or a documented transition.
- Presentation document schema versioning remains independent from HTTP API versioning.

## Sprint 1 requirements
Codex should implement:
- route directory structure;
- shared response and error helpers;
- Zod request schemas for core routes;
- mock current-user provider;
- project list and detail mock routes;
- brief, outline, template, presentation, command, revision, export, job, and admin route shells;
- application-service interfaces;
- fake queue with deterministic mock jobs;
- provider interfaces and `NotConfiguredError` live placeholders;
- route tests for validation, authorization boundaries, error envelopes, and revision conflicts;
- no live provider calls.

## Acceptance tests
At minimum:
- unauthenticated route returns standard 401 envelope when authentication is enabled;
- user cannot fetch another user's project;
- invalid request body returns field-level validation details;
- repeated idempotent export request returns the same job;
- changed payload with reused idempotency key returns 409;
- stale revision edit returns revision conflict;
- expired export returns 410;
- generation route returns a mock job and later a deterministic mock revision;
- admin route rejects non-admin user;
- health endpoint succeeds without database or provider credentials in demo mode.
