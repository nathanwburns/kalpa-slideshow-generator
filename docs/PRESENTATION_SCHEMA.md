# Presentation Schema

## Purpose
The presentation schema is the canonical source of truth for every deck in the system. The web preview, conversational editor, revision history, PowerPoint renderer, Google Slides publisher, PDF renderer, PNG renderer, and admin validation tools must all operate on this same structured model.

The schema must be implemented with Zod and exported TypeScript types. Persisted presentation documents must include an explicit schema version.

## Design principles
- Platform neutral
- Serializable as JSON
- Runtime validated
- Versioned and migratable
- Stable IDs for all editable objects
- Native-slide-object first
- No browser-only styling assumptions
- Traceable claims, assets, and assumptions
- Deterministic enough for repeatable rendering

## Root document

```ts
interface PresentationDocument {
  schemaVersion: string;
  id: string;
  projectId: string;
  title: string;
  status: PresentationStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  brief: PresentationBrief;
  narrative: NarrativePlan;
  theme: ThemeReference;
  slides: Slide[];
  assets: AssetReference[];
  assumptions: Assumption[];
  sources: SourceReference[];
  revisions: RevisionSummary[];
  exports: ExportRecord[];
  metadata: PresentationMetadata;
}
```

## Presentation status

```ts
type PresentationStatus =
  | "brief"
  | "questions"
  | "outline"
  | "draft"
  | "review"
  | "ready"
  | "publishing"
  | "published"
  | "archived";
```

## Presentation brief

```ts
interface PresentationBrief {
  rawPrompt: string;
  type: "sales" | "strategy" | "project" | "proposal" | "other";
  situation?: string;
  audience: AudienceProfile;
  objective: PresentationObjective;
  desiredOutcome?: string;
  meetingContext?: string;
  requestedSlideCount?: number;
  tone?: string[];
  constraints: string[];
  prohibitedClaims: string[];
  sourceAssetIds: string[];
  clarifyingQuestions: ClarifyingQuestion[];
}
```

## Audience profile

```ts
interface AudienceProfile {
  description: string;
  roles: string[];
  seniority?: string;
  industry?: string;
  knowledgeLevel?: "low" | "medium" | "high";
  priorities: string[];
  likelyObjections: string[];
}
```

## Objective

```ts
interface PresentationObjective {
  mode: "persuade" | "sell" | "align" | "explain" | "recommend" | "update";
  desiredBelief: string;
  desiredAction: string;
  successCriteria: string[];
}
```

## Narrative plan

```ts
interface NarrativePlan {
  centralThesis: string;
  supportingClaims: Claim[];
  evidenceInventory: EvidenceItem[];
  narrativeArc: string;
  openingStrategy: string;
  closingStrategy: string;
  outline: OutlineItem[];
  qualityScores: NarrativeQualityScores;
}
```

Each outline item should include:
- stable ID
- sequence
- slide purpose
- working headline
- key message
- supporting evidence IDs
- recommended layout ID
- transition from previous slide
- transition to next slide

## Slide

```ts
interface Slide {
  id: string;
  sequence: number;
  status: "planned" | "generated" | "reviewed" | "approved";
  purpose: SlidePurpose;
  layout: LayoutReference;
  headline: string;
  speakerNotes?: string;
  transitionIn?: string;
  transitionOut?: string;
  elements: SlideElement[];
  sourceIds: string[];
  assumptionIds: string[];
  lockedElementIds: string[];
  validation: SlideValidation;
  metadata: SlideMetadata;
}
```

## Slide purposes

```ts
type SlidePurpose =
  | "orient"
  | "establish-problem"
  | "quantify-impact"
  | "introduce-insight"
  | "explain-solution"
  | "demonstrate-process"
  | "compare-options"
  | "provide-proof"
  | "show-case-study"
  | "establish-capability"
  | "present-roadmap"
  | "address-risk"
  | "recommend-action"
  | "close";
```

## Layout reference

```ts
interface LayoutReference {
  familyId: string;
  familyVersion: string;
  layoutId: string;
  layoutVersion: string;
  variantId?: string;
}
```

## Coordinate system
Use a normalized coordinate system independent of pixels or inches.

```ts
interface Bounds {
  x: number;      // 0 to 1
  y: number;      // 0 to 1
  width: number;  // 0 to 1
  height: number; // 0 to 1
  rotation?: number;
}
```

Renderers convert normalized coordinates to PowerPoint inches, Google Slides points, browser pixels, PDF units, or PNG pixels.

## Base slide element

```ts
interface BaseElement {
  id: string;
  type: SlideElementType;
  role?: string;
  bounds: Bounds;
  zIndex: number;
  visible: boolean;
  locked?: boolean;
  groupId?: string;
  accessibilityLabel?: string;
  metadata?: Record<string, unknown>;
}
```

## Slide element union

```ts
type SlideElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | IconElement
  | LineElement
  | ChartElement
  | TableElement
  | DiagramElement
  | GroupElement;
```

## Text element

```ts
interface TextElement extends BaseElement {
  type: "text";
  content: string;
  textStyle: TextStyle;
  paragraphs?: ParagraphStyle[];
  sourceClaimIds?: string[];
}
```

Text style must support:
- semantic font token
- font size
- font weight
- color token
- line spacing
- paragraph spacing
- alignment
- vertical alignment
- bullet style
- text fitting behavior
- emphasis spans

Do not store arbitrary CSS.

## Image element

```ts
interface ImageElement extends BaseElement {
  type: "image";
  assetId: string;
  crop: ImageCrop;
  fit: "cover" | "contain" | "stretch";
  mask?: "rectangle" | "rounded-rectangle" | "circle";
  border?: BorderStyle;
  attributionSourceId?: string;
  generationPrompt?: string;
}
```

Image crop must be stored as normalized source-image coordinates so the crop can be reproduced across renderers.

## Shape element
Shapes should map to forms supported in both PowerPoint and Google Slides.

```ts
interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rectangle" | "rounded-rectangle" | "ellipse" | "arc" | "chevron" | "triangle";
  fill?: FillStyle;
  border?: BorderStyle;
  radius?: number;
}
```

## Line element

```ts
interface LineElement extends BaseElement {
  type: "line";
  start: Point;
  end: Point;
  lineStyle: LineStyle;
  startArrow?: ArrowType;
  endArrow?: ArrowType;
}
```

## Icon element

```ts
interface IconElement extends BaseElement {
  type: "icon";
  iconId: string;
  iconSet: string;
  colorToken: string;
  backgroundShape?: ShapeElement;
}
```

Icons must be vector-compatible and rendered as SVG, native geometry, or a safely embedded vector representation.

## Chart element

```ts
interface ChartElement extends BaseElement {
  type: "chart";
  chartType: "bar" | "column" | "line" | "area" | "pie" | "donut" | "scatter";
  data: ChartData;
  options: ChartOptions;
  takeaway?: string;
  sourceIds: string[];
}
```

Chart data must be stored separately from its visual style so the future renderer can create native editable charts when supported.

## Table element

```ts
interface TableElement extends BaseElement {
  type: "table";
  rows: TableRow[];
  columnWidths?: number[];
  headerRowCount: number;
  style: TableStyle;
}
```

## Diagram element
A diagram is a semantic model that can be expanded into native shapes, lines, and text.

```ts
interface DiagramElement extends BaseElement {
  type: "diagram";
  diagramType: "process" | "timeline" | "cycle" | "hierarchy" | "matrix" | "network" | "funnel";
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  style: DiagramStyle;
}
```

The renderer should not flatten a diagram to an image unless explicitly allowed.

## Groups

```ts
interface GroupElement extends BaseElement {
  type: "group";
  childElementIds: string[];
}
```

Grouping is advisory. Renderers may create native groups when supported.

## Assets

```ts
interface AssetReference {
  id: string;
  kind: "upload" | "generated-image" | "brand" | "stock" | "icon" | "logo";
  filename?: string;
  mimeType: string;
  storageKey?: string;
  width?: number;
  height?: number;
  checksum?: string;
  createdAt: string;
  expiresAt?: string;
  sourceId?: string;
  metadata: Record<string, unknown>;
}
```

The presentation document should reference assets by ID, never embed large binary data.

## Sources and claims

```ts
interface SourceReference {
  id: string;
  type: "upload" | "user" | "public" | "generated";
  title: string;
  assetId?: string;
  citation?: string;
  retrievedAt?: string;
}

interface Claim {
  id: string;
  text: string;
  classification: "user-supplied" | "source-extracted" | "assumption" | "public-fact" | "recommendation";
  sourceIds: string[];
  confidence?: number;
}
```

## Assumptions

```ts
interface Assumption {
  id: string;
  text: string;
  reason: string;
  status: "active" | "confirmed" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}
```

## Revisions
Each meaningful mutation creates a revision.

```ts
interface RevisionSummary {
  id: string;
  parentRevisionId?: string;
  number: number;
  label: string;
  reason: string;
  actorType: "user" | "admin" | "system";
  actorId?: string;
  createdAt: string;
  changedSlideIds: string[];
  changeSetRef: string;
}
```

Persist either:
- full immutable snapshots, or
- a hybrid of periodic snapshots and validated patches.

The application must make restoration deterministic.

## Export record

```ts
interface ExportRecord {
  id: string;
  format: "pptx" | "google-slides" | "pdf" | "png-bundle";
  status: "queued" | "processing" | "completed" | "failed" | "expired";
  revisionId: string;
  storageKey?: string;
  externalUrl?: string;
  createdAt: string;
  expiresAt?: string;
  errorCode?: string;
}
```

## Validation results

```ts
interface SlideValidation {
  overflow: ValidationIssue[];
  contrast: ValidationIssue[];
  unsupportedFeatures: ValidationIssue[];
  missingSources: ValidationIssue[];
  unresolvedAssumptions: ValidationIssue[];
  densityScore: number;
}
```

Validation must run before final publishing.

## Editing commands
Natural-language editing should be converted into structured commands before mutation.

```ts
type PresentationCommand =
  | AddSlideCommand
  | RemoveSlideCommand
  | DuplicateSlideCommand
  | SplitSlideCommand
  | MergeSlidesCommand
  | ReorderSlideCommand
  | UpdateElementCommand
  | ReplaceAssetCommand
  | ChangeLayoutCommand
  | ChangeTemplateFamilyCommand
  | ApplyDeckInstructionCommand;
```

Each command must include:
- command ID
- target revision ID
- affected object IDs
- user instruction
- interpreted intent
- validation result
- execution timestamp

## Schema versioning
- Use semantic versions for persisted documents.
- Minor versions may add optional fields.
- Major versions may change structure or semantics.
- Provide explicit migration functions between supported versions.
- Never silently mutate stored historical revisions.
- Tests must cover migration fixtures.

## Required implementation tests
- Valid complete presentation fixture
- Minimal valid presentation fixture
- Invalid coordinates
- Duplicate element IDs
- Missing asset reference
- Invalid layout reference
- Unsupported slide element type
- Revision restoration
- Schema migration
- Round-trip serialization

## Renderer contract
Every renderer receives:
- a validated presentation document
- a specific revision
- resolved theme tokens
- resolved template definitions
- resolved assets

Every renderer returns:
- render result
- validation warnings
- artifact reference
- unsupported-feature report

The preview renderer and export renderers must not invent content or modify the presentation document during rendering.