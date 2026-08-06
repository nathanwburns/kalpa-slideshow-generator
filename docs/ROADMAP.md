# Implementation Roadmap

## Purpose
This roadmap defines the build order for the Kalpa Slideshow Generator. Codex should implement one milestone at a time, satisfy the acceptance criteria, and open a pull request before beginning the next milestone unless explicitly instructed otherwise.

## Delivery principles
- Build the highest-risk technical foundations early.
- Keep every milestone demonstrable.
- Preserve a working local demo throughout development.
- Use feature flags for incomplete live integrations.
- Do not mix unrelated milestones in one pull request.
- Add tests with each subsystem rather than postponing testing.
- Prefer production-oriented interfaces with mock implementations over temporary tightly coupled code.

# Milestone 1: Application scaffold and mocked product flow

## Goal
Create a polished, navigable application that demonstrates the complete product workflow using mock data and no external credentials.

## Scope
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-compatible component primitives
- Kalpa design tokens
- responsive application shell
- dashboard
- new presentation brief
- clarifying questions
- outline review
- template selection
- presentation editor
- revision timeline
- export dialog
- admin portal shell
- Zod presentation schemas
- four template-family definitions
- Prisma schema
- repository interfaces and in-memory repositories
- provider interfaces
- fake queue and mock AI stages
- GitHub Actions
- Railway-ready configuration

## Acceptance criteria
- `npm install` succeeds.
- `npm run lint` succeeds.
- `npm run typecheck` succeeds.
- `npm test` succeeds.
- `npm run build` succeeds.
- Playwright smoke tests pass.
- The complete workflow is navigable without a database or API key.
- All four template families are visible.
- The editor supports mocked slide- and deck-level instructions.
- Presentation and template schemas have tests.
- No secrets are committed.

## Exit artifact
A pull request with screenshots, architecture summary, test results, and follow-up notes.

# Milestone 2: PowerPoint rendering proof of concept

## Goal
Prove that structured presentation data can generate a professional, editable PowerPoint that imports acceptably into Google Slides.

## Scope
- PptxGenJS or equivalent isolated behind a renderer interface
- normalized coordinate conversion
- semantic token resolution
- text boxes
- native shapes
- images and crops
- icons
- one editable chart
- one editable table
- one editable diagram
- speaker notes where supported
- compatibility report
- post-render package validation
- fixed ten-slide JSON fixture
- one approved template family

## Acceptance criteria
- Generated `.pptx` opens without repair warnings.
- Text, shapes, images, chart, table, and diagram are independently editable.
- The file imports into Google Slides with acceptable fidelity.
- The web preview and exported slides are visually close.
- Unsupported features are reported rather than silently flattened.
- Automated package tests pass.
- Representative slides are manually reviewed in PowerPoint and Google Slides.

## Risk gate
Do not expand live AI generation substantially until this milestone demonstrates acceptable export fidelity.

# Milestone 3: Live brief and outline generation

## Goal
Connect the application to OpenAI for the first stable, evaluated part of the workflow.

## Scope
- approved OpenAI provider integration
- environment configuration
- brief interpreter
- clarifying-question planner
- story architect
- structured outputs
- prompt registry and versioning
- source-free initial workflow
- usage and cost records
- quality scoring
- prompt evaluation fixtures

## Acceptance criteria
- A freeform sales brief becomes a normalized brief.
- Missing critical information generates no more than five useful questions.
- Skipped questions create explicit assumptions.
- Approved answers generate a six-to-ten-slide outline.
- Every slide has a purpose, takeaway headline, key message, and transition.
- Claims and assumptions remain traceable.
- Invalid model output is retried and safely rejected after limits.
- Evaluation fixtures meet agreed thresholds.

# Milestone 4: Structured deck generation

## Goal
Generate a complete structured presentation document from an approved outline and selected template family.

## Scope
- slide planner
- content writer
- visual director without live image generation
- layout composer
- quality reviewer
- all four template families
- web slide preview renderer
- sample asset library
- slide validation
- immutable revisions

## Acceptance criteria
- Three distinct sales prompts generate coherent decks.
- Decks use only registered layouts.
- Slide density limits are enforced.
- The web preview renders all supported element types.
- Quality review catches weak headlines, overflow risks, unsupported claims, and poor layout compatibility.
- New revisions are immutable and restorable.
- Switching template family remaps layouts without losing approved content.

# Milestone 5: Conversational editing

## Goal
Allow users to revise one slide, a section, or the full deck through natural-language instructions.

## Scope
- scope resolver
- intent interpreter
- structured presentation commands
- deterministic command execution
- targeted AI stage execution
- slide add, remove, duplicate, split, merge, and reorder
- deck-wide rewrite instructions
- revision conflict handling
- impact preview for high-risk operations

## Acceptance criteria
- Slide-specific edits do not change unrelated slides.
- Explicit text replacements avoid unnecessary model calls.
- A slide can be split into two with updated transitions.
- A deck-wide concision request updates all slides and creates one revision.
- Stale revision edits return a conflict rather than overwriting work.
- High-impact template changes require confirmation.
- Revision restoration creates a new revision.

# Milestone 6: Source uploads and retrieval

## Goal
Allow users to upload documents, images, spreadsheets, and existing presentations for generation context.

## Scope
- private object storage
- signed upload intents
- file metadata validation
- PDF, Office, image, and spreadsheet processing
- source chunk extraction
- image analysis
- project-scoped retrieval
- source and claim links
- 24-hour source expiration
- cleanup jobs
- prompt-injection defenses

## Acceptance criteria
- Supported files upload privately.
- Source extraction preserves page, slide, sheet, or section provenance.
- Generated claims link to source IDs.
- Expired files are deleted and no longer retrievable.
- A user cannot retrieve another user's assets.
- Prompt-injection test fixtures do not override system behavior.
- Duplicate uploads are detected by checksum where appropriate.

# Milestone 7: Production PowerPoint export

## Goal
Export live generated decks into polished, editable `.pptx` files.

## Scope
- all required layouts in all four families
- production font mapping
- editable charts, tables, and diagrams
- image generation assets when available
- pre-publish validation
- export jobs and history
- 30-day artifact retention
- signed download URLs
- visual regression tests
- renderer observability

## Acceptance criteria
- Every required layout has a rendering fixture.
- PowerPoint opens without repair warnings.
- Promised elements remain editable.
- Text overflow is blocked or resolved before publish.
- Export records identify revision and renderer version.
- Export artifacts expire after 30 days.
- Visual regression results stay within approved thresholds.

# Milestone 8: Google Workspace authentication and persistence

## Goal
Make the application safe for confidential internal use.

## Scope
- Google OAuth
- verified `@kalpainc.com` restriction
- user status enforcement
- PostgreSQL persistence
- Railway PostgreSQL
- session security
- project ownership
- production migrations
- audit events
- soft deletion and purge workflows

## Acceptance criteria
- Only verified `@kalpainc.com` users can sign in.
- Blocked and suspended users are denied.
- Users see only their own projects.
- Project history survives restarts and deployments.
- Revisions, prompts, exports, and usage are durable.
- Sensitive actions create audit events.
- Database migrations run successfully in staging.

# Milestone 9: Direct Google Slides publishing

## Goal
Create a new Google Slides presentation directly from a selected revision.

## Scope
- Google Slides API integration
- Google Drive permissions
- slide, text, shape, image, line, table, and grouping batch operations
- compatibility reporting
- new-copy-only publishing
- provider file IDs and URLs
- retry and cleanup behavior

## Acceptance criteria
- Every publish creates a new Google Slides file.
- The file is owned by or shared with the requesting user as configured.
- Layout fidelity is acceptable against the PowerPoint baseline.
- Unsupported elements use documented fallbacks.
- No synchronization with prior exports is implied.
- Failed jobs are retryable without duplicate files.

# Milestone 10: PDF, PNG, and generated imagery

## Goal
Complete the primary export set and introduce controlled image generation.

## Scope
- PDF export
- PNG slide bundle
- preview thumbnails
- OpenAI image generation
- structured visual briefs
- generated-asset metadata
- image quality review
- regeneration workflow
- deck-level visual consistency

## Acceptance criteria
- PDF and PNG outputs match approved preview fidelity.
- Generated imagery follows Kalpa visual guidelines.
- Generated people and industrial scenes pass quality review.
- Image prompts and provider metadata are recorded.
- Low-quality or unsuitable images can be regenerated.
- Visuals do not silently introduce unsupported claims.

# Milestone 11: Administrator system

## Goal
Allow administrators to manage users, global rules, brand assets, templates, and usage.

## Scope
- admin role authorization
- user status and role management
- rule proposal and approval
- immutable rule versions
- template version management
- asset approvals
- usage dashboard
- audit log
- sample-deck testing sandbox

## Acceptance criteria
- Members cannot access admin routes.
- Admins can block and restore users.
- Freeform rules are normalized and previewed before publication.
- Published rules apply to future generations immediately.
- Existing decks retain historical rule versions.
- Template versions cannot publish with validation errors.
- All sensitive changes are audited.

# Milestone 12: Production hardening and internal launch

## Goal
Prepare the application for a confidential Kalpa pilot.

## Scope
- staging and production Railway environments
- private networking where available
- secrets management
- monitoring and alerts
- structured logs
- performance testing
- dependency and security scanning
- backups and recovery tests
- data-retention verification
- accessibility review
- user documentation
- internal pilot feedback loop

## Acceptance criteria
- Staging and production deploy from protected branches.
- Health and readiness checks pass.
- Backup restoration is tested.
- Source and export cleanup jobs are verified.
- Confidential data is absent from generic logs.
- Critical errors alert administrators.
- Five to ten pilot users complete real presentation workflows.
- Pilot feedback is converted into prioritized issues.

# Future milestones
Potential future work, not required for version one:
- monthly generation quotas;
- shared team projects;
- comments and approvals;
- organization workspaces;
- reusable content modules;
- CRM or document-system integrations;
- template marketplace;
- analytics on deck performance;
- presenter mode;
- multilingual deck generation;
- slide-level manual editing tools;
- two-way Google Slides synchronization.

# Pull request policy
Each milestone PR should include:
- scope completed;
- architecture changes;
- screenshots or artifacts;
- tests run;
- acceptance-criteria checklist;
- known limitations;
- follow-up issues;
- confirmation that no secrets were committed.

# Immediate instruction to Codex
Begin with Milestone 1 on `codex/sprint-1-scaffold`. Do not implement later live integrations in the first pull request. Build the complete mocked workflow, schemas, template foundations, interfaces, tests, CI, and documentation specified in Issue #1 and the repository documents.