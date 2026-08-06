# Implementation Plan

## Objective
Build a production-oriented foundation for the Kalpa Slideshow Generator while keeping Sprint 1 fully usable without live credentials or external services.

## Recommended repository structure

```text
src/
  app/
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
    templates/
    slides/
    ui/
  domain/
    presentations/
    templates/
    revisions/
    projects/
  lib/
    design-system/
    schemas/
    demo-data/
  providers/
    ai/
    persistence/
    storage/
    pptx/
    google-slides/
prisma/
tests/
docs/
```

## Architecture principles
- Domain types and rules must not depend on React.
- UI components must not call external providers directly.
- Provider integrations must be hidden behind interfaces.
- Every presentation is represented by structured data.
- The web preview and future exporters consume the same presentation model.
- Mock implementations must allow the entire product flow to run locally.

## Sprint 1 workstreams

### 1. Application foundation
- Scaffold Next.js App Router application.
- Enable strict TypeScript.
- Configure Tailwind CSS and shadcn/ui-compatible primitives.
- Add ESLint, Prettier, Vitest, and Playwright.
- Add GitHub Actions for install, lint, typecheck, unit test, build, and smoke test.
- Add Railway deployment metadata and health route.

### 2. Design system
- Implement typed tokens for color, typography, spacing, radius, shadows, icon sizes, motion, and slide geometry.
- Mirror tokens in CSS variables.
- Build reusable app components: button, card, badge, input, textarea, tabs, dialog, tooltip, progress, empty state, navigation rail, and panel.
- Build presentation-specific components: slide frame, slide thumbnail, template card, instruction composer, revision item, assumption badge, and export option.

### 3. Domain model
Create Zod schemas and inferred types for:
- project
- presentation
- presentation brief
- audience
- objective
- assumptions
- slide
- slide element union
- template family
- layout definition
- revision
- asset reference
- export record
- admin rule

All schemas must be versioned and tested with valid and invalid fixtures.

### 4. Template engine foundation
- Define four template families as immutable data.
- Define layout metadata and layout-selection hints.
- Define supported content roles and density limits.
- Provide template lookup and layout compatibility utilities.
- Add tests for unique IDs, required layouts, and valid token references.

### 5. Mock application workflow
Implement a fully navigable mocked workflow:
1. Dashboard
2. New brief
3. Clarifying questions
4. Outline review
5. Template selection
6. Presentation editor
7. Export dialog
8. Admin shell

Persist mock changes in client state or an in-memory repository abstraction. Avoid a database requirement.

### 6. Persistence model
- Add Prisma schema for future PostgreSQL use.
- Include users, projects, presentations, revisions, prompts, assets, exports, admin rules, usage events, and template versions.
- Do not require migrations to run for local demo mode.

### 7. Provider boundaries
Create interfaces and mock implementations for:
- AI orchestration
- asset storage
- project persistence
- presentation persistence
- export rendering
- Google Slides publishing

The live implementations may throw `NotConfiguredError`, but the mock experience must work.

## Implementation order
1. Tooling and application shell
2. Design tokens and global styling
3. Domain schemas and tests
4. Template family definitions and tests
5. Demo data
6. Dashboard and brief flow
7. Outline and template selection
8. Presentation editor
9. Admin shell
10. Prisma and provider boundaries
11. CI and documentation
12. Screenshots, final checks, and pull request

## Quality gates
Before opening a pull request:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke tests

## Pull request requirements
The PR must include:
- architecture summary
- screenshots of all main screens
- commands run and results
- known tradeoffs
- follow-up tasks
- confirmation that no secrets were committed

## Deferred work
- Live OpenAI calls
- Upload ingestion and deletion jobs
- Authentication
- Postgres runtime dependency
- PPTX rendering
- Direct Google Slides publishing
- Production observability
