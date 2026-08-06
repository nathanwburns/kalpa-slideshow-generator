# Master Architecture

## Purpose
This document is the engineering entry point for the Kalpa Slideshow Generator. It summarizes the product, system boundaries, architectural decisions, repository organization, build order, and acceptance standards. Detailed behavior lives in the linked specifications under `docs/`.

Codex and human contributors should read this document, `AGENTS.md`, GitHub Issue #1, and `docs/ROADMAP.md` before implementation.

## Product mission
Build an internal Kalpa Inc. application that transforms a business objective, source material, and conversational instructions into polished, editable presentations.

Primary outputs:
- PowerPoint (`.pptx`)
- Google Slides-compatible PowerPoint
- Direct Google Slides publishing later
- PDF
- PNG slide images

Primary use cases:
- sales decks
- proposals
- internal strategy presentations
- project decks

The system is presentation-first, not web-first. Every design and architecture choice must protect editable PowerPoint and Google Slides fidelity.

## Product principles
1. Start with the user's desired outcome, not merely the requested topic.
2. Ask focused clarifying questions before generation when information materially affects the story.
3. Produce an outline for approval before a full draft.
4. Use approved Kalpa template families and reusable layouts.
5. Preserve native editability in exported presentations.
6. Support slide-level and deck-level conversational editing.
7. Preserve revision history and unaffected slides.
8. Keep assumptions and factual sources traceable.
9. Use realistic, professional imagery rather than generic AI visuals.
10. Keep confidential project data isolated and private.

## Current scope
The current branch is `codex/sprint-1-scaffold`.

The immediate implementation target is Milestone 1 from `docs/ROADMAP.md`:
- production-oriented application scaffold;
- complete mocked product flow;
- typed design system;
- canonical schemas;
- four template families;
- in-memory repositories;
- mocked AI orchestration;
- basic web slide preview;
- API and provider boundaries;
- tests, CI, and Railway-ready configuration.

Do not implement live OpenAI, Google login, direct Google Slides publishing, real uploads, or final PowerPoint rendering in the first pull request.

## System architecture

```text
Browser
  |
  v
Next.js Web Application
  |- Server-rendered and client UI
  |- Route handlers under /api/v1
  |- Authentication boundary
  |- Application services
  |
  +--> Domain Layer
  |      |- Presentation schemas
  |      |- Template definitions
  |      |- Commands and revisions
  |      |- Validation rules
  |
  +--> AI Orchestrator
  |      |- Generation plans
  |      |- Stage registry
  |      |- Context assembly
  |      |- Model routing
  |      |- Quality gates
  |
  +--> Rendering Core
  |      |- Token resolution
  |      |- Layout and geometry
  |      |- Web preview
  |      |- Export adapters
  |
  +--> Provider Interfaces
  |      |- OpenAI
  |      |- Object storage
  |      |- PowerPoint
  |      |- Google Slides
  |      |- PDF and PNG
  |
  +--> Persistence
         |- PostgreSQL through Prisma
         |- In-memory demo repositories
         |- Redis-backed jobs later
         |- Private object storage later
```

## Architectural layers

### 1. Domain layer
Contains business models and rules without React, HTTP, Prisma, or provider dependencies.

Responsibilities:
- canonical presentation schema;
- template-family definitions;
- slide and element types;
- narrative and outline models;
- revision and command types;
- validation rules;
- semantic design tokens.

Detailed specification: `PRESENTATION_SCHEMA.md`, `TEMPLATE_ENGINE.md`, and `STORY_ENGINE.md`.

### 2. Application layer
Coordinates user-facing use cases.

Recommended services:
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

Application services depend on domain types and provider or repository interfaces, not concrete SDKs.

### 3. Interface layer
Includes:
- Next.js pages and components;
- API route handlers;
- authentication adapters;
- form and request validation;
- response serialization.

Route handlers must remain thin.

Detailed specification: `UI_COMPONENTS.md` and `API_SPEC.md`.

### 4. Infrastructure layer
Includes concrete integrations:
- Prisma repositories;
- OpenAI provider;
- storage provider;
- queue and worker implementation;
- PowerPoint renderer;
- Google Slides publisher;
- monitoring and telemetry.

Infrastructure-specific code must stay behind interfaces.

## Canonical presentation model
The `PresentationDocument` is the source of truth for:
- web preview;
- conversational editing;
- revisions;
- PowerPoint rendering;
- Google Slides publishing;
- PDF and PNG rendering.

The document is:
- JSON serializable;
- Zod validated;
- explicitly versioned;
- immutable inside a stored revision;
- platform neutral;
- based on normalized slide coordinates;
- composed of editable semantic elements.

Do not create separate data models for the web editor and export system.

Detailed specification: `PRESENTATION_SCHEMA.md`.

## Template system
Approved families:
1. Blue Architectural
2. Editorial Signal
3. Strategic Frameworks
4. Human-Centered Sales

Each family implements stable layout IDs such as:
- title
- section divider
- problem
- opportunity
- three point
- framework
- process
- timeline
- comparison
- data chart
- case study
- image-led statement
- capability
- closing call to action

Templates are versioned definitions, not static deck files.

Detailed specification: `TEMPLATE_ENGINE.md`.

## Design system
The Kalpa visual system centers on:
- vivid Kalpa blue;
- layered navy tones;
- secondary blues;
- peach and orange accents;
- white and cool neutrals;
- clear typography;
- restrained geometry;
- meaningful visual connectors;
- realistic photography;
- editable diagrams and charts.

Avoid sterile minimalism, generic AI gradients, random decorative blobs, and amber, burgundy, or red-led palettes.

Detailed specification: `DESIGN_SYSTEM.md` and `IMAGE_GUIDELINES.md`.

## AI architecture
The AI pipeline is staged:
1. Input processor
2. Brief interpreter
3. Clarifying-question planner
4. Story architect
5. Slide planner
6. Content writer
7. Visual director
8. Layout composer
9. Quality reviewer
10. Structured presentation revision

Every model-dependent output must be validated with a stage-specific schema.

The model never directly writes a PowerPoint binary or performs persistence. It produces structured outputs that application services validate and store.

Detailed specifications: `PROMPTING_ARCHITECTURE.md` and `AI_ORCHESTRATOR.md`.

## Rendering architecture
All renderers consume the same validated presentation revision and resolved theme, template, and assets.

Required outputs:
- web preview;
- editable PowerPoint;
- Google Slides;
- PDF;
- PNG.

The rendering system must preserve native text, shapes, images, tables, charts, and diagrams wherever promised. Unsupported features must be reported and never silently flattened.

The PowerPoint proof of concept is the primary technical risk gate after the mocked application scaffold.

Detailed specification: `RENDERING_ENGINE.md`.

## Persistence architecture
Production persistence:
- PostgreSQL;
- Prisma;
- immutable presentation revisions;
- project-scoped ownership;
- prompt history;
- assets and exports referenced through private object storage;
- generation jobs and stage runs;
- usage and audit events;
- versioned templates and administrator rules.

Sprint 1 must provide in-memory repositories so the app works without PostgreSQL.

Detailed specification: `DATABASE_SCHEMA.md`.

## API architecture
- JSON routes under `/api/v1`;
- Zod request validation;
- standard response and error envelopes;
- cursor pagination;
- idempotency for job-creating operations;
- optimistic revision concurrency;
- server-side authorization;
- asynchronous jobs for long-running work.

Detailed specification: `API_SPEC.md`.

## Administrator architecture
Administrators manage:
- users and account status;
- published brand and generation rules;
- template versions;
- brand assets;
- usage and cost summaries;
- audit history.

A freeform administrator instruction must be normalized and previewed before publication. Published rules are immutable versions.

Detailed specification: `ADMIN_SYSTEM.md`.

## Security and data handling
Before confidential pilot use:
- Google Workspace authentication is required;
- only verified `@kalpainc.com` accounts may enter;
- blocked and suspended users are denied;
- storage is private;
- assets use short-lived signed URLs;
- source files expire after 24 hours;
- temporary files expire after 24 hours;
- exports expire after 30 days;
- project ownership is enforced in repositories or services;
- secrets remain in environment variables;
- generic logs exclude confidential prompts and document contents;
- uploaded content is treated as untrusted data;
- prompt-injection fixtures must pass.

## Repository structure
Recommended structure:

```text
src/
  app/
    api/
    dashboard/
    new/
    outline/
    templates/
    editor/[projectId]/
    admin/
  components/
    app-shell/
    briefs/
    editor/
    slides/
    templates/
    admin/
    ui/
  domain/
    projects/
    presentations/
    templates/
    revisions/
    assets/
  ai/
    orchestration/
    stages/
    prompts/
    retrieval/
    routing/
    providers/
    evaluation/
  rendering/
    core/
    elements/
    adapters/
    testing/
  application/
    services/
    commands/
  providers/
    persistence/
    storage/
    google-slides/
  lib/
    design-system/
    schemas/
    demo-data/
    errors/
  test/
prisma/
docs/
```

Codex may refine this structure, but must preserve domain and provider boundaries.

## Coding standards
- TypeScript strict mode.
- Prefer explicit types at subsystem boundaries.
- Use Zod for external, persisted, and model-generated data.
- Avoid `any`; isolate unavoidable provider types.
- Keep React components small and purpose-driven.
- Keep domain logic out of components and route handlers.
- Use semantic token references rather than hard-coded presentation styling.
- Add typed errors with safe user messages.
- Never commit secrets.
- Add tests for behavior, not only implementation details.
- Document non-obvious architectural tradeoffs.

## Testing strategy

### Unit tests
- schemas;
- template definitions;
- coordinate conversion;
- token resolution;
- state machines;
- commands;
- revision behavior;
- repository ownership;
- idempotency;
- validation.

### Integration tests
- mocked brief-to-draft flow;
- project history;
- slide-specific edit;
- deck-wide edit;
- revision restore;
- admin authorization;
- mock job lifecycle.

### End-to-end tests
- dashboard to new presentation;
- clarifying questions;
- outline approval;
- template selection;
- editor navigation;
- export dialog;
- admin shell.

### Later visual tests
- web preview fixtures;
- PowerPoint rendering;
- Google Slides import;
- cross-platform visual regression.

## CI and deployment
GitHub Actions must run:
- dependency installation;
- lint;
- typecheck;
- unit tests;
- production build;
- Playwright smoke tests where practical.

Railway deployment target:
- web service;
- worker service later;
- PostgreSQL later;
- Redis later;
- private storage later.

The application must expose health and readiness routes.

## Feature flags
Use flags to isolate incomplete integrations:
- live AI;
- uploads;
- authentication;
- PowerPoint export;
- Google Slides export;
- PDF export;
- generated imagery;
- admin rule editing;
- quotas.

Mock mode must remain available for development and demonstrations.

## Source-of-truth hierarchy
When documents conflict, use this order:
1. Explicit user decision recorded in the repository
2. `MASTER_ARCHITECTURE.md`
3. Subsystem-specific detailed specification
4. `PRODUCT_SPEC.md`
5. `ROADMAP.md`
6. GitHub issue or task scope
7. Implementation assumption

If a conflict remains material, document the decision in the pull request instead of silently choosing.

## Specification index

- `PRODUCT_SPEC.md` — product behavior and user requirements
- `IMPLEMENTATION_PLAN.md` — Sprint 1 structure and workstreams
- `DESIGN_SYSTEM.md` — Kalpa visual language
- `TEMPLATE_ENGINE.md` — template families and layout rules
- `STORY_ENGINE.md` — persuasive narrative creation
- `PRESENTATION_SCHEMA.md` — canonical presentation document
- `PROMPTING_ARCHITECTURE.md` — staged AI prompt design
- `AI_ORCHESTRATOR.md` — production AI workflow execution
- `IMAGE_GUIDELINES.md` — imagery, icons, charts, and diagrams
- `RENDERING_ENGINE.md` — PowerPoint, Google Slides, PDF, PNG, and preview rendering
- `DATABASE_SCHEMA.md` — Prisma and durable data model
- `API_SPEC.md` — routes, jobs, services, and errors
- `UI_COMPONENTS.md` — screens and React components
- `ADMIN_SYSTEM.md` — users, rules, templates, assets, and auditing
- `ROADMAP.md` — milestone-by-milestone build plan

## Immediate Codex task
On branch `codex/sprint-1-scaffold`:

1. Read `AGENTS.md`, Issue #1, this document, `ROADMAP.md`, and the subsystem specifications.
2. Implement Milestone 1 only.
3. Build a polished mocked application with the complete workflow.
4. Add domain schemas, template definitions, interfaces, in-memory repositories, fake jobs, and tests.
5. Ensure all quality commands pass.
6. Open a pull request against `main` with screenshots and an acceptance-criteria checklist.

## Milestone 1 definition of done
- Complete mocked workflow is navigable.
- Four template families are represented.
- Web slide preview renders sample structured slides.
- Presentation schemas and template definitions are runtime validated.
- In-memory repositories support project and revision history.
- Mock orchestration demonstrates staged generation and editing.
- API route shells and standard errors exist.
- Admin screens and authorization boundaries are represented.
- CI, build, lint, typecheck, tests, and smoke tests pass.
- No live credentials are required.
- No secrets are committed.

## Documentation stop point
This is the final planned architecture document before implementation. Do not create new specification documents unless coding reveals a concrete, blocking ambiguity that cannot be resolved in an existing document or pull-request decision record.
