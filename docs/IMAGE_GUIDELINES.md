# Image and Visual Asset Guidelines

## Purpose
Define how the system selects, generates, crops, validates, and uses photography, icons, diagrams, charts, logos, and visual assets in Kalpa presentations.

## Visual objective
Images must strengthen the story, clarify the subject, and raise perceived quality. They must not exist merely to fill space. Every visual should support one of these functions:
- establish context;
- humanize the narrative;
- demonstrate a process or environment;
- provide proof;
- explain a relationship;
- create emphasis;
- improve scanning;
- reinforce brand tone.

## Asset priority order
1. User-provided and approved source imagery
2. Approved Kalpa brand library
3. Existing project assets
4. Generated imagery
5. Licensed stock or public imagery with valid usage and attribution

The system should not use a lower-priority source when a highly relevant approved asset already exists.

## Photography direction
Preferred photography is:
- realistic;
- editorial rather than staged;
- professionally composed;
- credible for the industry and audience;
- naturally lit;
- visually calm enough to support slide text;
- specific rather than generic.

Preferred subjects:
- real working environments;
- manufacturing floors;
- logistics and operations;
- technology in context;
- professional teams collaborating naturally;
- equipment, infrastructure, and processes;
- leadership and decision-making moments;
- authentic customer or employee experiences.

Avoid:
- staged handshakes;
- people pointing at transparent holograms;
- generic futuristic interfaces;
- glowing AI brains;
- excessive neon lighting;
- uncanny faces, hands, or anatomy;
- implausibly clean industrial settings;
- overdramatic cinematic compositions;
- generic smiling teams looking at the camera;
- obvious visual metaphors such as lightbulbs and puzzle pieces unless explicitly requested.

## People
Generated or selected people must appear:
- anatomically credible;
- professionally presented;
- contextually appropriate;
- naturally posed;
- diverse without looking artificially assembled;
- age- and role-appropriate;
- consistent with the environment and task.

Avoid:
- duplicated people;
- mismatched eye direction;
- distorted fingers;
- impossible machinery interaction;
- inappropriate safety equipment;
- inconsistent uniforms;
- exaggerated expressions;
- unrealistically perfect skin or plastic texture.

## Industrial and manufacturing imagery
When showing industrial environments:
- use realistic machinery and materials;
- include appropriate personal protective equipment where required;
- avoid unsafe worker behavior;
- avoid impossible equipment layouts;
- preserve believable scale;
- use clean but not sterile environments;
- prefer process-specific imagery over generic factories.

The visual brief should identify:
- industry;
- facility type;
- worker role;
- action;
- machinery or process;
- safety context;
- lighting;
- camera perspective;
- negative constraints.

## Image-generation brief
Generated-image requests should use structured fields:

```ts
interface ImageGenerationBrief {
  purpose: string;
  subject: string;
  environment: string;
  action?: string;
  audienceContext?: string;
  composition: string;
  cameraPerspective?: string;
  lighting: string;
  realism: "documentary" | "editorial" | "commercial";
  colorDirection: string[];
  negativeConstraints: string[];
  targetAspectRatio: string;
  intendedCrop: string;
}
```

Example brief:
- Purpose: establish operational credibility
- Subject: maintenance engineer reviewing production-line diagnostics
- Environment: modern automotive manufacturing plant
- Action: examining a machine-side tablet while another technician inspects equipment
- Composition: subjects on the right third with negative space on the left for headline
- Lighting: natural industrial daylight with balanced overhead fixtures
- Realism: editorial
- Color direction: neutral steel, navy workwear, subtle Kalpa blue accents
- Negative constraints: no holograms, no dramatic sparks, no visible brand logos, no distorted hands
- Aspect ratio: 16:9
- Intended crop: wide landscape

## Prompt consistency across a deck
When multiple generated images appear in one presentation, maintain:
- compatible lighting;
- similar realism level;
- coherent color temperature;
- consistent camera language;
- related environments;
- non-repeating subjects and compositions.

Do not create a deck where every slide uses the same person, angle, or visual pattern.

## Cropping
Store crop coordinates in the presentation schema.

Rules:
- preserve the focal subject;
- avoid cutting through faces, hands, or important equipment;
- leave intentional negative space for text when required;
- keep horizon and strong architectural lines aligned;
- avoid extremely tight crops on low-resolution images;
- ensure the crop works in both the web preview and export.

Preferred crop types:
- wide context crop;
- portrait subject crop;
- detail crop;
- split-frame crop;
- circular or rounded feature crop when supported by the template.

## Image overlays
Allowed:
- subtle navy or blue tint for text contrast;
- restrained gradient from image to solid field when reproducible in PowerPoint and Google Slides;
- simple translucent rectangle behind text;
- thin border or frame;
- simple rounded mask.

Avoid:
- complex blend modes;
- browser-only filters;
- heavy duotone effects;
- decorative grain that cannot export reliably;
- excessive blur.

## Resolution and quality
Before publishing:
- verify effective resolution at export size;
- warn on visibly soft images;
- do not upscale low-quality assets without disclosure;
- prefer source images large enough for the intended crop;
- preserve original aspect ratio unless intentional distortion is approved.

Validation should flag:
- low effective DPI;
- severe compression artifacts;
- watermarks;
- visible stock-site marks;
- unsupported formats;
- missing attribution when required.

## Logos
- Use approved Kalpa logo assets only.
- Preserve aspect ratio.
- Do not recolor outside approved variants.
- Respect clear space.
- Do not place the logo over visually noisy backgrounds without sufficient contrast.
- Do not use third-party logos without authorization or source context.

Logo placement should be purposeful. Not every slide requires a large logo. A small consistent footer or master placement is preferred.

## Icons
Preferred icon style:
- single consistent family per deck;
- simple line or restrained duotone;
- compatible stroke weights;
- editable vector or SVG;
- clear at small sizes.

Use icons for:
- categories;
- process steps;
- capabilities;
- risks;
- outcomes;
- navigation or interface controls.

Do not use icons as substitutes for evidence or meaningful imagery.

## Diagrams
Diagrams should be semantic, editable, and composed of native shapes, text, and lines.

Supported diagram types:
- process;
- timeline;
- cycle;
- hierarchy;
- matrix;
- network;
- funnel;
- operating model;
- value chain;
- before-and-after flow.

Rules:
- one clear reading order;
- concise labels;
- visible hierarchy;
- meaningful connectors;
- limited node count;
- consistent shape language;
- no decorative arrows without direction or causality.

Do not generate diagrams as flat images unless the user explicitly requests an illustrative visual and editability is not needed.

## Charts
Charts require valid structured data.

Rules:
- lead with a takeaway headline;
- emphasize one important series or data point;
- label directly when possible;
- minimize legends and grid lines;
- use Kalpa Blue as the primary series;
- use orange only for emphasis;
- avoid more than four visible series by default;
- do not use 3D charts;
- use native editable chart objects where possible.

If data is incomplete, do not fabricate exact values. Use a conceptual diagram or clearly labeled illustrative data only with user approval.

## Visual selection decision tree
For each slide:
1. Does the slide contain quantitative evidence? Use a chart or metric-led visual.
2. Does it explain sequence or relationships? Use a diagram or process.
3. Does it need proof or context? Use relevant photography or a case-study visual.
4. Is it a simple category structure? Use icons or labeled shapes.
5. Is the visual unnecessary? Use typography and layout rather than filler imagery.

## Visual diversity across a deck
A typical eight-slide deck should not use eight identical image-led layouts.

Recommended mix:
- one strong title visual;
- one or two photography-led slides;
- two framework or process slides;
- one chart or metric slide;
- one case-study or proof slide;
- one closing slide.

The exact mix depends on the story and available evidence.

## Asset retrieval metadata
Assets should support tags such as:
- industry;
- subject;
- environment;
- action;
- mood;
- orientation;
- dominant colors;
- people count;
- safety equipment;
- approved use;
- source;
- expiration;
- quality score.

Retrieval should use both semantic relevance and hard filters.

## Copyright and attribution
- Track source and license metadata for stock and public imagery.
- Do not remove watermarks.
- Do not assume public availability means unrestricted commercial use.
- Preserve attribution when required.
- Generated assets should record provider, generation timestamp, and prompt reference.

## Admin controls
Administrators should be able to:
- prohibit visual patterns;
- publish preferred image directions;
- approve or remove brand assets;
- mark example imagery as preferred or unsuitable;
- change logo variants;
- define required attribution behavior;
- set generation restrictions by category.

## Quality review
The visual reviewer should score:
- relevance;
- realism;
- composition;
- technical quality;
- consistency;
- brand fit;
- export suitability;
- legal or attribution readiness.

Low-scoring visuals should be replaced or flagged before publishing.

## Sprint 1 requirements
Codex should implement:
- typed visual brief schemas;
- asset metadata types;
- mock asset library;
- image placeholders and realistic sample thumbnails;
- crop metadata support;
- visual selection and validation interfaces;
- no live image generation or stock licensing integration.
