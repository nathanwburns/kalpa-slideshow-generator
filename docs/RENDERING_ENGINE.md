# Rendering Engine

## Purpose
The rendering engine converts a validated `PresentationDocument` into visually consistent, editable outputs for:

- PowerPoint (`.pptx`)
- Google Slides
- PDF
- PNG slide images
- High-fidelity web previews

The renderer must not invent content, rewrite text, choose a different narrative, or silently modify the presentation document. Its job is deterministic translation from structured presentation data into platform-specific output.

The product succeeds only if exported presentations closely match the web preview and remain genuinely editable.

## Core principles

1. **Editable-object first**
   - Text remains text.
   - Shapes remain native shapes.
   - Images remain replaceable image objects.
   - Tables remain editable tables where supported.
   - Charts remain editable charts where supported.
   - Diagrams remain groups of native shapes, lines, and text.

2. **Single source of truth**
   - All renderers consume the same validated presentation schema.
   - Preview, PowerPoint, Google Slides, PDF, and PNG outputs must resolve the same layout, tokens, and assets.

3. **Deterministic rendering**
   - Given the same presentation revision, template version, theme version, assets, and renderer version, output should be repeatable.

4. **Platform-aware fidelity**
   - Use only features that can be represented reliably across PowerPoint and Google Slides unless the presentation explicitly allows platform-specific degradation.

5. **No silent flattening**
   - Editable content must not be converted to a single slide image without a warning and explicit compatibility decision.

## Renderer architecture

```text
Validated PresentationDocument
        ↓
Render Context Builder
        ↓
Token Resolver
        ↓
Template and Layout Resolver
        ↓
Asset Resolver
        ↓
Slide Layout Engine
        ↓
Element Normalizer
        ↓
Platform Adapter
        ↓
Validation and Compatibility Report
        ↓
Artifact Writer
```

Recommended interfaces:

```ts
interface RenderContext {
  presentation: PresentationDocument;
  revisionId: string;
  theme: ResolvedTheme;
  templateFamily: ResolvedTemplateFamily;
  layouts: Record<string, ResolvedLayout>;
  assets: Map<string, ResolvedAsset>;
  rendererVersion: string;
  options: RenderOptions;
}

interface PresentationRenderer {
  readonly format: RenderFormat;
  validate(context: RenderContext): Promise<RenderValidationReport>;
  render(context: RenderContext): Promise<RenderResult>;
}

interface RenderResult {
  artifact: RenderArtifact;
  warnings: RenderWarning[];
  unsupportedFeatures: UnsupportedFeature[];
  slideResults: SlideRenderResult[];
  rendererVersion: string;
}
```

## Slide geometry

### Canonical slide size
Use 16:9 widescreen as the canonical format.

PowerPoint dimensions:
- Width: 13.333 inches
- Height: 7.5 inches

All presentation bounds are stored in normalized coordinates from `0` to `1`.

```ts
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}
```

Conversion:

```ts
pptxX = bounds.x * 13.333;
pptxY = bounds.y * 7.5;
pptxW = bounds.width * 13.333;
pptxH = bounds.height * 7.5;
```

Google Slides uses points. Convert from inches using 72 points per inch.

Browser preview converts normalized units into pixels based on the current preview width.

## Coordinate precision
- Store normalized values with sufficient precision for stable layout.
- Round only in platform adapters.
- Avoid repeated conversion between pixels, inches, and normalized coordinates.
- Geometry calculations should use floating-point values until final serialization.

## Safe areas and layout grid
Every template must define:
- outer safe margins;
- content grid columns;
- row rhythm;
- title region;
- footer region;
- optional bleed regions for full-bleed imagery;
- minimum spacing between objects.

The layout engine must validate that essential content stays inside safe areas.

Full-bleed background objects may exceed safe areas. Essential text, logos, and controls may not.

## Render pipeline by slide

For each slide:
1. Resolve layout definition and variant.
2. Resolve semantic theme tokens.
3. Resolve all referenced assets.
4. Validate element IDs, bounds, and z-order.
5. Expand semantic diagrams into native elements.
6. Normalize text runs and paragraphs.
7. Calculate image crop geometry.
8. Validate text fit and minimum sizes.
9. Map elements to platform-native objects.
10. Record warnings and unsupported features.
11. Write slide objects in z-order.
12. Produce slide-level render metadata.

## Theme token resolution
Presentation documents reference semantic tokens rather than hard-coded styling.

Examples:
- `brand.primary`
- `brand.primaryDark`
- `accent.peach`
- `surface.canvas`
- `text.primary`
- `font.display`
- `font.body`
- `radius.medium`

Resolution order:
1. System defaults
2. Published Kalpa brand version
3. Template-family overrides
4. Layout variant overrides
5. Presentation-level approved overrides
6. Element-level explicit properties

Invalid token references must block publishing unless an approved fallback exists.

## Typography

### Font policy
Use official Kalpa fonts when confirmed and licensed for application and presentation use. Until then, use configured fallback tokens.

Each font token must define:
- preferred family;
- PowerPoint fallback;
- Google Slides fallback;
- browser fallback;
- available weights;
- supported scripts;
- licensing notes.

### Font portability
Because PowerPoint and Google Slides may substitute unavailable fonts:
- prefer broadly available or Google-compatible fonts;
- test fallbacks for line-length changes;
- store platform-specific font substitutions in the compatibility report;
- do not rely on embedded fonts unless licensing and platform support are verified.

### Text sizing
Text sizes are stored in points.

Rules:
- Never reduce below configured minimum size to avoid overflow without warning.
- Prefer content revision or layout change over extreme font shrinking.
- Maintain consistent hierarchy across slides.

### Text fitting strategy
Each text element declares a strategy:

```ts
type TextFitStrategy =
  | "fixed"
  | "shrink-to-fit"
  | "resize-height"
  | "truncate-with-warning"
  | "fail-on-overflow";
```

Default behavior:
- Headlines: fail or request rewrite before shrinking below minimum.
- Body copy: shrink within a narrow allowed range.
- Captions: may resize height if layout permits.
- Tables: use column or row adjustments before shrinking aggressively.

### Text measurement
The preview renderer and export renderer must use a shared text-measurement abstraction.

Because browser metrics, PowerPoint metrics, and Google Slides metrics differ, maintain calibration fixtures per font and size.

Recommended service:

```ts
interface TextMeasurer {
  measure(input: TextMeasureInput): TextMeasureResult;
}
```

Test against representative headlines, paragraphs, bullets, metrics, and tables.

## Text rendering
Text elements must support:
- paragraphs;
- bullets;
- numbered lists;
- bold, italic, and color spans;
- paragraph spacing;
- line spacing;
- horizontal alignment;
- vertical alignment;
- margins or insets;
- semantic accessibility labels;
- speaker-note source references where needed.

Avoid rich-text features that cannot be reproduced consistently across platforms.

## Images

### Asset resolution
Images are referenced by asset ID. Before rendering, resolve:
- storage object;
- MIME type;
- dimensions;
- crop metadata;
- attribution;
- expiration state;
- checksum;
- orientation metadata.

Expired or missing assets block final publishing unless an explicit placeholder policy is active.

### Supported formats
Preferred:
- PNG
- JPEG
- SVG where supported and tested

SVG may require platform-specific handling. Preserve vector fidelity where possible; otherwise rasterize at sufficient resolution with a warning.

### Cropping
Store crops as normalized source-image coordinates.

```ts
interface ImageCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
```

Crop conversion must reproduce the same focal area in preview, PowerPoint, and Google Slides.

### Fit modes
- `cover`: fill bounds while preserving aspect ratio and applying crop.
- `contain`: show full image and allow empty space.
- `stretch`: discouraged; use only when explicitly approved.

### Image masks
Supported masks:
- rectangle;
- rounded rectangle;
- circle.

Complex clipping paths should be avoided unless they can be reproduced reliably.

### Image effects
Allowed:
- simple transparency;
- border;
- rounded mask;
- simple shadow;
- basic color overlay implemented as a separate translucent shape.

Avoid browser-only filters and complex blending.

## Logos
- Resolve only approved logo assets.
- Preserve aspect ratio.
- Respect clear-space rules.
- Use approved color variants.
- Flag low-contrast placement.
- Do not rasterize SVG logos unnecessarily.

## Shapes
Supported native shapes should include:
- rectangle;
- rounded rectangle;
- ellipse;
- triangle;
- chevron;
- line;
- arc when supported reliably.

Shape styling:
- fill color;
- transparency;
- border color;
- border width;
- dash pattern;
- corner radius where platform permits;
- simple shadow.

Avoid effects that differ materially between PowerPoint and Google Slides.

## Lines and connectors
Lines should support:
- start and end coordinates;
- thickness;
- color;
- transparency;
- dash style;
- start and end arrows;
- straight and elbow connectors when supported.

Connectors in diagrams should be anchored semantically to nodes, then resolved into platform geometry.

## Icons
Preferred icon representation:
1. Native SVG or vector form
2. Platform-compatible vector conversion
3. High-resolution transparent PNG fallback

Icons must preserve consistent stroke weight and color tokens.

The renderer should not embed remote icon URLs. Assets must be resolved before rendering.

## Groups
Group semantics should preserve related slide objects.

Examples:
- icon plus label;
- metric number plus caption;
- diagram node;
- image plus overlay and caption.

If a platform supports native grouping reliably, create groups. Otherwise preserve child IDs and relative positions so the objects remain independently editable.

Group failure must not flatten the group to an image unless explicitly permitted.

## Diagrams
Semantic diagrams must expand into native elements before platform rendering.

Pipeline:
1. Resolve diagram type.
2. Calculate node positions from normalized diagram bounds.
3. Create node shapes and text.
4. Create connectors.
5. Apply semantic colors and emphasis.
6. Create advisory or native groups.
7. Validate overlaps and reading order.

Supported diagram types:
- process;
- timeline;
- cycle;
- hierarchy;
- matrix;
- network;
- funnel;
- operating model;
- value chain.

Diagram layout algorithms must be deterministic.

## Charts

### Preferred behavior
Create native editable charts where the target platform and rendering library support the required chart type and styling.

Supported first:
- column;
- bar;
- line;
- area;
- pie;
- donut;
- scatter where feasible.

### Chart data model
Chart data and chart styling remain separate.

Native chart creation must preserve:
- categories;
- series names;
- values;
- data labels;
- legend settings;
- axis titles;
- source references.

### Fallback hierarchy
1. Native editable chart
2. Native grouped shapes for simple charts
3. Raster chart image with blocking warning if editability was required

Do not silently use fallback level 3.

### Chart consistency
- Use resolved Kalpa color tokens.
- Avoid 3D charts.
- Minimize legends and grid lines.
- Emphasize only one primary series or data point by default.

## Tables
Tables should be native editable tables when supported.

Must support:
- header rows;
- row and column counts;
- fixed or proportional column widths;
- cell padding;
- border styles;
- fills;
- text alignment;
- merged cells only when platform fidelity is reliable.

When PowerPoint and Google Slides table behavior differs, prefer the simpler compatible model.

## Backgrounds
Slide backgrounds may be:
- solid color;
- full-bleed image;
- simple gradient if verified across platforms;
- structured shapes covering the slide.

For maximum fidelity, prefer solid fills and shape-based composition over complex gradients.

## Z-order
Elements render in ascending `zIndex`.

Validation must detect:
- duplicate z-index values when ordering is ambiguous;
- essential text hidden behind images;
- background objects above content;
- overlays detached from intended images.

Stable tie-breaking uses element order in the validated slide document.

## Slide masters and layouts
PowerPoint export should use slide masters and layouts where practical for:
- logo placement;
- page numbers;
- standard footer;
- background elements;
- recurring title regions.

However, master usage must not reduce fidelity or make user editing confusing.

Google Slides publishing should reproduce the same recurring elements through theme or slide objects as supported.

## Speaker notes
Speaker notes may include:
- slide narrative;
- transition guidance;
- source references;
- assumption notes;
- presenter cues.

PowerPoint renderer should add notes when supported by the chosen library. Google Slides publisher should add notes only when supported and tested.

Failure to add optional notes should produce a warning, not corrupt the deck.

## Page numbers, footers, and sources
Support configurable:
- slide numbers;
- Kalpa logo or wordmark;
- confidentiality label;
- source line;
- client name;
- date.

These should be template-controlled and editable.

Long sources may be placed in speaker notes or appendix slides rather than rendered unreadably.

## PowerPoint rendering

### Recommended approach
Use a mature PowerPoint generation library such as PptxGenJS unless a prototype demonstrates a better supported option.

The adapter must isolate library-specific calls behind a platform interface.

### PowerPoint requirements
- 16:9 layout;
- native text boxes;
- native shapes;
- editable images;
- native tables;
- native charts when supported;
- grouped diagrams when supported;
- speaker notes where feasible;
- accurate crop handling;
- embedded metadata for revision and renderer version where appropriate.

### PowerPoint-specific validation
- font availability and substitution;
- unsupported SVG behavior;
- chart compatibility;
- notes support;
- grouping fidelity;
- text overflow in Office desktop and web.

## Google Slides rendering

### Two export paths
1. Google Slides-compatible PPTX import
2. Direct Google Slides API publishing

The first path should be supported earlier because it uses the PowerPoint renderer and allows manual upload.

Direct publishing should create a new Google Slides file for every export in version one.

### Google Slides API mapping
Use batch requests to create:
- slides;
- text boxes;
- shapes;
- images;
- tables;
- lines;
- groups when supported.

### Google Slides limitations
The compatibility report must document differences in:
- font availability;
- crop semantics;
- grouping;
- gradients;
- shadows;
- charts;
- table formatting;
- notes;
- connector behavior.

When direct Google Slides cannot reproduce a native editable chart reliably, prefer a documented fallback or use the PPTX import path.

## PDF rendering
PDF is a presentation snapshot, not an editable format.

Preferred generation order:
1. Render from the same structured slide model through a server-side vector renderer.
2. Or convert a generated PPTX through a reliable office-rendering service.

The implementation must compare fidelity, operational complexity, and licensing before choosing.

PDF output must preserve:
- fonts or approved substitutions;
- vector shapes;
- image quality;
- slide dimensions;
- links where supported.

## PNG rendering
PNG output is used for:
- slide previews;
- thumbnail carousels;
- review sharing;
- visual regression tests;
- PNG bundle export.

Render at configurable sizes:
- thumbnail;
- standard preview;
- high-resolution export.

The preview system should cache rendered thumbnails by:
- presentation revision;
- slide ID;
- renderer version;
- scale;
- template version;
- asset checksums.

## Web preview renderer
The web preview should consume the same normalized slide elements and theme tokens.

It must:
- preserve exact aspect ratio;
- scale all bounds uniformly;
- use a shared font and text-fit strategy;
- reproduce image crops;
- render diagrams and charts from structured data;
- expose warnings in editor mode;
- avoid CSS effects unavailable in exports.

The web preview should not be treated as the final truth when font metrics differ. The export compatibility tests remain authoritative.

## Compatibility levels
Each slide or element may have a compatibility classification:

```ts
type CompatibilityLevel =
  | "full"
  | "minor-variation"
  | "degraded-editability"
  | "flattened"
  | "unsupported";
```

Publishing policy:
- `full`: allowed.
- `minor-variation`: allowed with warning.
- `degraded-editability`: user confirmation required.
- `flattened`: blocked by default for editable exports.
- `unsupported`: blocked.

## Unsupported-feature report
Each unsupported feature record should include:
- slide ID;
- element ID;
- target format;
- feature;
- compatibility level;
- reason;
- fallback option;
- whether user confirmation is required.

## Pre-publish validation
Before an export job begins, validate:
- presentation schema;
- resolved template and theme versions;
- asset availability;
- font mapping;
- text overflow;
- object bounds;
- minimum sizes;
- chart data;
- diagram integrity;
- unsupported platform features;
- unresolved assumptions;
- low-resolution images;
- missing sources when required.

Blockers prevent export. Warnings may proceed with user approval.

## Post-render validation
After artifact generation:
- ensure file exists and is non-empty;
- reopen or parse generated PPTX when possible;
- count slides;
- verify expected object counts;
- verify no missing media relationships;
- ensure no corrupt package entries;
- render representative slides to images for fidelity checks;
- store artifact checksum;
- record renderer version.

## Visual regression testing
Maintain golden fixtures for:
- every required layout in every template family;
- long and short headlines;
- body text near limits;
- image crops;
- charts;
- tables;
- diagrams;
- logos;
- dark and light slides;
- mixed template slides if supported.

For each fixture:
1. Render web preview.
2. Render PPTX.
3. Convert PPTX to image using a deterministic test environment.
4. Compare image outputs using threshold-based visual diff.
5. Manually review meaningful platform differences.

Do not rely only on snapshot tests of JSON or XML.

## Cross-platform acceptance tests
Test output in:
- PowerPoint desktop;
- PowerPoint web;
- Google Slides after importing PPTX;
- direct Google Slides publish when implemented;
- PDF viewer;
- browser preview.

Key test categories:
- alignment;
- text wrapping;
- font substitution;
- chart editability;
- image crop fidelity;
- grouping;
- transparency;
- table layout;
- speaker notes;
- slide order;
- page numbering.

## Performance
Target expectations for an eight-slide deck:
- web preview updates for one slide should feel near real-time;
- deterministic slide-only render should avoid re-rendering all slides when possible;
- export jobs may run asynchronously;
- image and font assets should be cached within a job;
- repeated exports of the same revision and options may reuse validated intermediate results but should still create a new export record.

## Caching
Cache keys should include:
- revision content hash;
- target format;
- renderer version;
- template version;
- theme version;
- asset checksums;
- export options.

Do not reuse cached output when an asset has changed under the same logical ID.

## Error handling
Typed errors should include:
- `RENDER_SCHEMA_INVALID`
- `RENDER_ASSET_MISSING`
- `RENDER_FONT_UNAVAILABLE`
- `RENDER_TEXT_OVERFLOW`
- `RENDER_UNSUPPORTED_FEATURE`
- `RENDER_CHART_FAILED`
- `RENDER_DIAGRAM_FAILED`
- `RENDER_PACKAGE_CORRUPT`
- `RENDER_PROVIDER_UNAVAILABLE`

Error messages shown to users should be actionable and safe.

## Security
- Never fetch arbitrary URLs during rendering.
- Resolve only authorized stored assets.
- Sanitize SVG and vector content.
- Reject active or executable embedded content.
- Never write secrets or raw provider tokens into artifacts.
- Use isolated temporary directories.
- Delete temporary render files after 24 hours or sooner.
- Limit file sizes and decompression ratios.

## Observability
Record:
- render format;
- revision ID;
- slide count;
- duration;
- per-slide duration;
- warning count;
- compatibility levels;
- artifact size;
- cache hit or miss;
- renderer version;
- failure code.

Do not log confidential slide text in generic rendering logs.

## Provider and adapter structure

Recommended source layout:

```text
src/rendering/
  core/
    render-context.ts
    token-resolver.ts
    layout-engine.ts
    text-measurer.ts
    compatibility.ts
    validation.ts
  elements/
    text.ts
    image.ts
    shape.ts
    line.ts
    icon.ts
    chart.ts
    table.ts
    diagram.ts
  adapters/
    web/
    pptx/
    google-slides/
    pdf/
    png/
  testing/
    fixtures/
    visual-regression/
```

Platform adapters must not contain storytelling or AI logic.

## Sprint 1 requirements
Sprint 1 should not implement final export rendering, but Codex should create:
- renderer interfaces;
- normalized coordinate utilities;
- token-resolution utilities;
- compatibility types;
- render validation types;
- basic web preview renderer for mock slides;
- adapter placeholders for PPTX, Google Slides, PDF, and PNG;
- `NotConfiguredError` or `NotImplementedError` live placeholders;
- representative rendering fixtures;
- tests for coordinate conversion, token resolution, z-order, and bounds validation.

## PowerPoint proof-of-concept milestone
Before broader backend development, build a focused proof of concept that:
- accepts one fixed presentation JSON fixture;
- renders at least ten slides using one approved template family;
- produces native editable text, shapes, images, one chart, one table, and one diagram;
- opens without repair warnings in PowerPoint;
- imports into Google Slides with acceptable fidelity;
- matches the web preview closely;
- generates a compatibility report.

This milestone is the primary technical risk gate for the product.

## Definition of done for the rendering subsystem
The renderer is production-ready when:
- all required template layouts have passing fixtures;
- PowerPoint output is editable and opens without repair;
- imported Google Slides output remains acceptably faithful;
- text overflow and unsupported features are detected before publish;
- diagrams remain editable;
- charts remain editable where promised;
- visual regression tests run in CI or a controlled test environment;
- renderer versions are traceable to every export;
- failures are typed, recoverable, and observable;
- export security and cleanup requirements are implemented.
