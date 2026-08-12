# Kalpa Slide Composition System

This is the rendering contract for Kalpa decks. It is based on the approved
`Kalpa-Implementation-1440p` reference and supplements the broader brand book.

## Core Principle

Kalpa slides should feel editorial, operational, and deliberate. A slide is not
a web dashboard inside a rounded container. It is one clear business point with
strong reading order, disciplined whitespace, and one visual gesture.

## Deck Rhythm

Alternate dark teal statement slides and warm-white evidence slides. Do not put
the same frame, background treatment, or card grid on every slide.

- Dark teal: title, tension, process, transition, and close.
- Warm white: proof, rationale, comparison, evidence, and recommendation.
- Coral: one decisive emphasis per composition, never a general-purpose fill.
- Blue: restrained navigation, secondary marks, and data emphasis.

## Typography

- Use oversized, outcome-led headlines before any supporting content.
- Keep labels compact and uppercase; they should introduce, not compete.
- Give the headline enough width and height to read as a single composition.
- Supporting copy is concise and subordinate. Avoid dense paragraph blocks.
- Never reduce type solely to retain excess copy. Shorten the copy instead.

## Logo And Brand Marks

- The full logo belongs on light slides in a small, quiet position.
- Dark slides use a compact Kalpa wordmark treatment, not a high-contrast logo
  pasted into the corner.
- The logo is a signature, not the main decoration.
- Use thin rules and wireframe diamonds as occasional structural motifs.

## Layout Contracts

### Hero

Dark statement slide. One oversized headline, optional image on the right, and
up to three short evidence points. If there is no image, use a wireframe diamond
and one coral diamond as the visual anchor.

### Challenge

Dark tension slide. Show the problem through a concise editorial list rather
than a grid of identical cards. Use one geometric marker or image as support.

### Proof

Warm-white evidence slide. A single proof point can become a very large number.
Do not force every stat into a uniform card. Pair the number with a short reason
to believe or a concise evidence list.

### Pillars

Warm-white three-part slide. Three cards are acceptable only when they represent
three genuinely parallel ideas. Cards use the crystal-gel surface: roomy, tinted,
and lightly highlighted rather than opaque white.

### Process

Dark methodology slide. Use a horizontal line and diamond sequence. Each step is
short; the process should read at a glance before its supporting detail is read.

### Comparison

Warm-white decision slide. Use two calm columns with minimal framing, a small
rule, and clearly different headings. This is not a dashboard table.

### Quote

Warm-white pause slide. Large statement, generous empty space, compact source.

### Close

Dark invitation slide. Use a large action statement and a single coral gesture.
The call to action is content, not a generic button component.

## Constraints

- No global rounded-panel frame.
- No repeated visual asset unless the user explicitly requests it.
- No more than one major decorative motif per slide.
- No arbitrary card grids to fill empty space.
- No text overlap, clipping, or placeholder-like empty image areas.
## Crystal Gel Surfaces

Reusable information surfaces use the Kalpa crystal-gel treatment inspired by the visual-composition patterns explored in HyperFrames: a translucent Kalpa-blue tint, controlled highlight glint, fine edge, and restrained depth. Use these for pillars, comparisons, metric modules, and image frames instead of opaque white UI cards.

- Light surfaces: pale blue glass with enough opacity for readable navy copy.
- Dark surfaces: translucent cyan gel with a high-contrast white edge and glint.
- Keep the treatment for information containers, not every decorative element.
- Export the gel as editable layered PowerPoint shapes. Browser blur is decorative only; the tint, highlight, edge, and shadow are all preserved in the PPTX.
