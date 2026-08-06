# Codex Execution Instructions

## Mission
Implement Sprint 1 for the Kalpa Slideshow Generator on this branch. Treat GitHub Issue #1 and the documents under `docs/` as the product and technical specification.

## Required workflow
1. Read `docs/PRODUCT_SPEC.md` and `docs/IMPLEMENTATION_PLAN.md` before coding.
2. Inspect the existing repository and preserve useful work.
3. Build the application incrementally with clear separation between domain logic, provider integrations, and UI.
4. Keep the app usable without external credentials by providing mock repositories and seeded demo data.
5. Run lint, typecheck, unit tests, end-to-end smoke tests, and production build before opening a pull request.
6. Fix failures rather than documenting them as future work.
7. Commit logically and open a pull request against `main` when acceptance criteria pass.

## Technical defaults
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-compatible primitives
- Zod for runtime schemas
- Prisma for the PostgreSQL data model
- Vitest for unit tests
- Playwright for smoke tests
- Provider interfaces for OpenAI, storage, PPTX rendering, Google Slides, and persistence

## Product priorities
1. Editable PowerPoint and Google Slides compatibility
2. Clear presentation storytelling
3. Strong Kalpa visual identity
4. Conversational editing at deck and slide level
5. Maintainable architecture

## UI direction
Use Kalpa blue, layered navy tones, peach, orange, white, and cool neutrals. Avoid sterile minimalism. Add restrained geometric devices, visual connectors, icons, image frames, number treatments, progress lines, and storytelling cues while preserving clarity.

## Out of scope for Sprint 1
- Live OpenAI requests
- Real uploads
- Google authentication
- Direct Google Slides publishing
- Final PPTX rendering
- Production database dependency

## Definition of done
- All acceptance criteria in Issue #1 pass.
- The complete mocked workflow is navigable.
- Schemas and template definitions have tests.
- Architecture and setup documentation are complete.
- A pull request is opened with screenshots, test results, tradeoffs, and follow-up work.
