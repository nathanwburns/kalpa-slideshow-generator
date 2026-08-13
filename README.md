# Kalpa Slideshow Generator

Real AI-assisted presentation generator for Kalpa Inc. built for Railway deployment.

## Current product shape

- Next.js App Router web app
- Live OpenAI generation for:
  - clarifying questions
  - outline generation
  - slide generation
  - deck or slide-level edits
- Real file ingestion with local extraction for:
  - text
  - markdown
  - CSV
  - PDF
  - DOCX
- Kalpa-branded presentation preview in the browser
- Editable native Google Slides export through the Google Slides API
- Admin rule surface for prompt, writing, and brand controls
- Local filesystem persistence for projects and uploads

## Current workflow

1. Create a project
2. Write the brief
3. Upload source files
4. Generate clarifying questions
5. Generate the outline
6. Generate slides
7. Edit the active slide or full deck in natural language
8. Export an editable Google Slides presentation

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Zod
- OpenAI Node SDK
- PptxGenJS
- Prisma schema included for later PostgreSQL migration

## Local development

Copy `.env.example` into your environment and provide:

- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`
- `GOOGLE_SERVICE_ACCOUNT_JSON` (service account JSON with Slides and Drive APIs enabled)
- `GOOGLE_SLIDES_SHARE_EMAIL` (the Google account that receives editor access)

Then run:

```bash
pnpm install
pnpm build
pnpm start
```

For development:

```bash
pnpm dev
```

## Railway

This repo is configured to deploy as a Railway Node web app.

- Build command: `pnpm build`
- Start command: `node .next/standalone/server.js`
- Health check: `/api/health`

## Important current limitation

This build uses local filesystem persistence because you chose an app-only Railway deployment first.
That means project data and uploads can reset on redeploy or instance replacement until Postgres/object storage are added.

## Google Slides setup

The export creates a native Google Slides presentation from the same normalized layout used by the browser preview. In Google Cloud, enable the Google Slides API and Google Drive API, create a service account, then add its JSON key as `GOOGLE_SERVICE_ACCOUNT_JSON`. Set `GOOGLE_SLIDES_SHARE_EMAIL` to the account that should receive editor access. The app creates each presentation in the service account's Drive and shares it directly with that account.
