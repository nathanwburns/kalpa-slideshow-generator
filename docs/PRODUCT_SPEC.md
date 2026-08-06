# Product Specification

## Product
Kalpa Slideshow Generator is an internal AI-assisted presentation creation tool for Kalpa Inc. It turns a business objective, supporting files, and user instructions into a polished, editable presentation that can be exported to PowerPoint or Google Slides.

## Primary users
- Sales professionals
- Strategy and operations teams
- Project teams
- Proposal authors
- Administrators managing brand and generation rules

## Core jobs to be done
1. Create a strong sales or strategy deck from a short brief.
2. Upload source documents, images, contracts, and data for context.
3. Answer clarifying questions before generation.
4. Review and revise the outline.
5. Choose a template family.
6. Generate a near-finished deck.
7. Edit the entire deck or one slide through natural-language instructions.
8. Publish a new editable export.
9. Reopen prior projects and continue from any revision.

## Initial presentation types
- Sales decks
- Internal strategy presentations
- Project decks
- Proposals

Sales decks receive the deepest initial tuning.

## Typical deck length
Six to ten slides by default. Users may add, remove, split, merge, shorten, or expand slides conversationally.

## Core workflow
1. New presentation brief
2. Source upload
3. Clarifying questions
4. Outline proposal
5. Outline approval
6. Template selection
7. Draft generation
8. Slide-level and deck-level revisions
9. Final validation
10. Export

## Required screens
### Dashboard
- Recent projects
- Project status
- Last edited date
- Template family
- Export status
- New presentation action

### Brief screen
- What are you trying to accomplish?
- Audience
- Desired outcome
- Meeting or use context
- Optional slide count
- Optional uploads

### Clarifying questions
- Focused questions only
- Explain why each answer matters
- Allow skip with labeled assumptions

### Outline review
- Reorder sections
- Add or remove sections
- Expand one section into multiple slides
- Approve outline

### Template selection
- Four approved template families
- Preview representative slides
- Explain best use case
- Allow later switching

### Presentation editor
- Large selected-slide preview
- Horizontal scrollable slide carousel
- Slide-specific instruction box
- Presentation-wide instruction box
- Revision history
- Add, remove, duplicate, split, and merge slide actions
- Publish/export action

### Admin portal
- User management shell
- Global brand rules
- Image restrictions
- Writing rules
- Template management
- Rule-change preview and approval

## Editing behavior
Natural language is the primary editing interface. No drag-and-drop editor is required for version one.

Examples:
- Make slide seven more visual.
- Reduce text throughout the deck.
- Replace this image with a realistic manufacturing scene.
- Split the third section into two slides.
- Move the chart to the right and emphasize the key metric.

Slide-specific changes must preserve unaffected slides. Deck-wide changes may update all slides but must create a revision checkpoint.

## Exports
- Editable PPTX
- Google Slides-compatible PPTX
- Direct Google Slides creation later
- PDF
- Individual PNG slides

Every export creates a new independent file. No two-way synchronization in version one.

## Retention
- Source uploads: 24 hours
- Temporary render files: 24 hours
- Published exports: 30 days
- Prompts, outlines, structured presentation data, and revision history: retained

## Authentication
Initial prototype may run without authentication. Before confidential pilot use, require Google Workspace login for `@kalpainc.com`.

## Usage
Unlimited during testing. Architecture must support future monthly limits such as ten presentations per user.

## Success criteria
- A user can create a credible six-to-ten-slide sales deck with minimal manual design work.
- Exported slides remain editable in PowerPoint and import cleanly into Google Slides.
- The web preview closely matches the exported deck.
- Users can revise one slide without regenerating the entire presentation.
- Kalpa branding remains consistent across all output.
