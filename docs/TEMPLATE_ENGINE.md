# Template Engine

## Purpose
The template engine converts approved Kalpa visual systems into reusable, machine-readable presentation families. It does not store static decks. It stores layout definitions, content-role constraints, visual rules, and selection guidance.

## Approved template families

### 1. Blue Architectural
Best for:
- strategy
- transformation
- technology
- operating-model stories

Visual language:
- layered navy and blue fields
- technical grids and structural lines
- crisp image frames
- connector paths
- selective peach/orange accents

Tone:
- precise
- modern
- confident

### 2. Editorial Signal
Best for:
- executive sales decks
- proposals
- insight-led narratives
- thought leadership

Visual language:
- large editorial headlines
- strong whitespace
- asymmetrical image crops
- small labels and annotations
- restrained geometric markers

Tone:
- sophisticated
- persuasive
- premium

### 3. Strategic Frameworks
Best for:
- consulting-style presentations
- internal strategy
- operating models
- roadmaps
- prioritization

Visual language:
- diagrams
- frameworks
- matrices
- timelines
- process flows
- numbered systems

Tone:
- analytical
- structured
- clear

### 4. Human-Centered Sales
Best for:
- customer stories
- manufacturing and operations sales
- proposals
- case studies
- relationship-led narratives

Visual language:
- realistic people and workplace imagery
- warm peach fields
- blue structural accents
- quotes and proof points
- human outcomes paired with metrics

Tone:
- credible
- approachable
- commercially focused

## Required layout IDs
Every family must implement these layout IDs:
- title
- section-divider
- problem
- opportunity
- three-point
- four-part-framework
- process
- timeline
- comparison
- data-chart
- case-study
- image-led-statement
- capability
- closing-call-to-action

Families may add specialized layouts, but required IDs must remain stable across versions.

## Layout definition contract
Each layout definition must include:
- `id`
- `familyId`
- `version`
- `name`
- `description`
- `supportedContentRoles`
- `requiredContentRoles`
- `optionalContentRoles`
- `maxWordCount`
- `maxHeadlineCharacters`
- `maxItems`
- `preferredVisualTypes`
- `selectionHints`
- `avoidWhen`
- `backgroundToken`
- `accentTokens`
- `typographyScale`
- `gridDefinition`
- `exportCompatibility`

## Content roles
Standard content roles:
- eyebrow
- headline
- subheadline
- body
- bullet-list
- metric
- metric-label
- quote
- attribution
- image
- icon
- chart
- table
- diagram
- caption
- source
- call-to-action

## Layout-selection rules
The planner chooses a layout based on:
1. Slide purpose
2. Narrative position
3. Content type
4. Number of ideas
5. Data availability
6. Need for emotional or visual emphasis
7. Chosen template family
8. Density and export constraints

Examples:
- A claim supported by three proof points should prefer `three-point`.
- A before/after argument should prefer `comparison`.
- A sequence of four stages should prefer `process` or `timeline` depending on whether time is explicit.
- A customer story with one image and two metrics should prefer `case-study`.

## Density rules
- One dominant idea per slide.
- No more than six discrete text blocks unless the layout explicitly supports a matrix or table.
- Default body limit: 45 words.
- Default bullet limit: five bullets.
- Default bullet length: 12 words.
- Default metric count: four.
- Default chart series: four.

## Creative-element rules
Creative elements must explain or reinforce:
- order
- hierarchy
- comparison
- movement
- grouping
- causality
- emphasis

Do not add decorative shapes that have no narrative function.

## Template switching
When a user changes template family:
- preserve slide purpose and content
- remap each slide to the closest compatible layout
- retain locked assets and approved imagery
- re-run density validation
- create a new revision checkpoint

## Template versioning
- Every family and layout has a semantic version.
- Existing presentations retain the version used at creation.
- Users may explicitly upgrade a deck to the latest template version.
- Admin changes must create a new version rather than mutating historical definitions.

## Validation
Automated tests must verify:
- unique family IDs
- unique layout IDs within families
- all required layout IDs exist
- all semantic token references resolve
- content limits are positive
- export compatibility is declared
- selection hints are not empty
