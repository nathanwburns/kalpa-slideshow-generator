# Presentation Rendering Research

Date: August 12, 2026

This note captures the external open-source presentation systems reviewed while improving Kalpa's slide quality. The goal was not to copy their visual brands. The goal was to extract the architectural patterns that consistently produce professional output.

## Repositories Reviewed

### 1. Presenton

Repo: https://github.com/presenton/presenton

Relevant takeaways:

- template-first generation rather than one-off pixel improvisation
- multiple built-in business templates instead of a single generic deck shell
- reusable design authored through templates and themes
- explicit support for creating templates from existing PowerPoint files

Why it matters for Kalpa:

Kalpa needs a slide system with stronger template identity and more layout variation. A single generic renderer cannot carry the whole product.

### 2. PptxGenJS

Repo: https://github.com/gitbrent/PptxGenJS

Relevant takeaways:

- mature PPTX primitives for real editable PowerPoint output
- slide masters and demos for consistent branded structure
- broad examples of text, shapes, tables, charts, and layout patterns

Why it matters for Kalpa:

The generated preview and exported PPTX must stay aligned. The system should remain editable and native, not screenshot-based.

### 3. Marp Core

Repo: https://github.com/marp-team/marp-core

Relevant takeaways:

- auto-scaling and fitting behavior is treated as a first-class rendering concern
- themes define what can scale and how
- content is constrained to known slide systems instead of being allowed to overflow

Why it matters for Kalpa:

The current renderer needs stricter fitting logic. It cannot assume the model will always produce perfectly sized copy.

### 4. Slidev

Repo: https://github.com/slidevjs/slidev

Relevant takeaways:

- theming is modular and reusable
- layouts are separate from content
- the presentation system is designed as a composable slide framework, not a one-off export utility

Why it matters for Kalpa:

Kalpa should continue moving toward reusable layout primitives and theme families instead of hard-coding every slide treatment inline.

### 5. IBM chuk-mcp-pptx

Repo: https://github.com/IBM/chuk-mcp-pptx

Relevant takeaways:

- template-first workflow
- universal component API
- design tokens for color, typography, and spacing
- explicit theme and layout helpers

Why it matters for Kalpa:

The renderer needs clearer separation between components, layout helpers, and theme tokens. That makes quality control far easier.

### 6. PPT Agent

Repo: https://github.com/cobacha/ppt-agent

Relevant takeaways:

- curated themes instead of unlimited random styling
- quality auto-retry when generated slides fail design checks
- smart layout variation so consecutive slides do not all feel the same
- layout patterns and style presets are stored as reusable config

Why it matters for Kalpa:

Kalpa should eventually reject weak slides automatically instead of accepting every model output. It also needs more deliberate variation within a stable brand system.

### 7. Kami

Repo: https://github.com/tw93/kami

Relevant takeaways:

- brand is treated as a constraint system
- deterministic quality gates validate content before layout
- visual QA is part of the workflow, not an afterthought

Why it matters for Kalpa:

We need slide acceptance rules, not just slide rendering code.

### 8. PPT Master

Repo: https://github.com/hugohe3/ppt-master

Relevant takeaways:

- narrative skeleton and visual style are separate concerns
- real editable PowerPoint matters more than HTML prettiness
- argument structure comes before visual decoration

Why it matters for Kalpa:

The outline and slide renderer should stay closely linked. Better visuals will not rescue weak structure.

## Cross-Repo Conclusions

The strongest systems all converge on the same principles:

1. Template-first, not freehand
2. Strong design tokens, not ad hoc colors and spacing
3. Content budgets per layout
4. Automatic fitting and overflow prevention
5. Slide-level quality checks before export
6. Reusable layout catalogs with multiple professional variants

## Immediate Kalpa Changes

The first improvement pass in this branch applies those principles by:

- adding content normalization before rendering
- tightening slide-generation prompt budgets
- improving layout fallbacks when ideal slide fields are missing
- reducing overflow risk in preview rendering
- replacing dead placeholders with more professional fallback compositions

## Next Work

The next implementation pass should focus on:

1. layout variants inside each slide family
2. image strategy and image-safe compositions
3. slide validation scoring before save/export
4. richer charts, metric panels, and proof modules
5. a dedicated layout catalog rather than a single `resolveSlide()` switch
