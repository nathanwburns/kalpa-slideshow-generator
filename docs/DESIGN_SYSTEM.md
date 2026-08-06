# Kalpa Design System

## Purpose
The design system governs both the web application and generated presentations. The presentation system takes priority: every visual rule must translate reliably into editable PowerPoint and Google Slides objects.

## Brand character
Kalpa should feel:
- intelligent
- confident
- precise
- optimistic
- modern
- human
- commercially credible

Avoid:
- sterile minimalism
- generic AI gradients
- excessive glassmorphism
- novelty typography
- decorative clutter without narrative purpose
- red, burgundy, or amber-led palettes

## Core palette
Exact production values remain configurable tokens, but the initial palette must center on:
- Kalpa Blue: vivid logo blue, primary action and emphasis
- Deep Navy: primary dark background and text
- Mid Blue: secondary panels, charts, and diagrams
- Pale Blue: soft fields and structural backgrounds
- Peach: warm secondary accent
- Orange: selective emphasis and calls to action
- White: primary light surface
- Cool Gray: neutral backgrounds, borders, and secondary text

Use orange and peach sparingly. Blue and navy should carry the majority of visual weight.

## Color roles
- `brand.primary`: Kalpa Blue
- `brand.primaryDark`: Deep Navy
- `brand.secondary`: Mid Blue
- `brand.soft`: Pale Blue
- `accent.peach`: Peach
- `accent.orange`: Orange
- `surface.canvas`: White
- `surface.subtle`: Cool Gray 50
- `text.primary`: Deep Navy
- `text.secondary`: Cool Gray 600
- `border.default`: Cool Gray 200

All colors must meet reasonable contrast requirements in the web application. Presentation contrast must be visually checked against projector conditions.

## Typography
Use a modern geometric or grotesk sans serif with excellent PowerPoint and Google Slides compatibility. Until official Kalpa fonts are confirmed, use typed placeholders:
- display font token
- body font token
- monospace/data font token

Fallback sequence should favor broadly available fonts.

Presentation hierarchy:
- Display: 28–44 pt
- Slide title: 24–34 pt
- Section label: 11–14 pt uppercase or small caps
- Body: 15–21 pt
- Caption: 10–13 pt
- Metric: 30–56 pt

Rules:
- Headlines should normally stay under 55 characters.
- Body content should normally stay under 45 words per slide.
- Use sentence case by default.
- Avoid more than three typographic weights on one slide.

## Spacing and geometry
Use a consistent 8-unit spacing system in the web application and a proportional slide grid for presentations.

Presentation safe area:
- 16:9 widescreen
- generous outer margins
- no essential content within 3 percent of slide edges
- align elements to a shared grid

## Shape language
Approved:
- rounded rectangles with restrained radii
- circles used for metrics, nodes, or image crops
- thin rules and connector lines
- stepped blocks
- brackets
- arcs and partial rings
- subtle grid lines
- small geometric corner accents
- image masks with simple geometry

Avoid:
- random blobs
- cartoon speech bubbles
- excessive pill shapes
- ornamental polygons without meaning
- heavy shadows

## Creative storytelling devices
Every slide should use at least one meaningful visual device when appropriate:
- path or progression line
- numbered sequence
- layered cards
- comparison axis
- highlighted region
- callout annotation
- icon cluster
- cropped photography
- metric tile
- process ribbon
- frame-within-frame

Creative devices must clarify relationships, sequence, hierarchy, or emphasis.

## Iconography
- Use a single consistent icon family per deck.
- Prefer simple line or duotone icons.
- Use icons only when they improve scanning or comprehension.
- Maintain consistent stroke weight.
- Do not mix illustrative and technical icon styles.

## Photography
Preferred characteristics:
- realistic professional photography
- authentic industrial, business, technology, and team settings
- natural lighting
- credible environments and wardrobe
- clear subject hierarchy
- editorial composition

Avoid:
- uncanny faces or hands
- staged handshake clichés
- generic glowing holograms
- overly cinematic fantasy lighting
- excessive depth-of-field blur
- random people looking at transparent screens

## Charts
- Use Kalpa Blue as the primary series.
- Use Mid Blue and Pale Blue for secondary series.
- Reserve Orange for one emphasized series or threshold.
- Remove unnecessary grid lines and chart chrome.
- Label data directly when possible.
- Use clear takeaway headlines above charts.
- Do not use 3D charts.

## Web UI style
The application should be polished and information-rich without feeling crowded.
- Layered panels
- clear side navigation
- visible project status
- purposeful empty states
- restrained transitions
- strong selected states
- visual previews of slides and templates

## Accessibility
- Keyboard-navigable primary workflows
- Visible focus states
- Semantic forms and labels
- Adequate color contrast
- Do not encode status by color alone

## Implementation requirement
Represent tokens in TypeScript and CSS variables. Presentation templates must reference semantic tokens rather than hard-coded colors or fonts.