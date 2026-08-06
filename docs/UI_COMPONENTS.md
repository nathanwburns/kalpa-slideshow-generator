# UI Components and Screen Specification

## Purpose
Define the frontend information architecture, screen behavior, reusable components, responsive rules, states, and accessibility expectations for the Kalpa Slideshow Generator.

## Application shell
- Left navigation rail on desktop; drawer on smaller screens.
- Top bar with project title, status, revision, save state, and account menu.
- Main content area with optional right-side inspector.
- Persistent Kalpa branding using blue, navy, peach, orange, white, and cool neutrals.
- Avoid sterile minimalism: use restrained geometry, connectors, icons, progress cues, and image framing.

Primary navigation:
- Projects
- New presentation
- Templates
- Admin, for administrators

## Reusable UI primitives
Implement accessible, typed components:
- Button
- Icon button
- Input
- Textarea
- Select
- Checkbox
- Radio group
- Tabs
- Badge
- Card
- Dialog
- Sheet
- Tooltip
- Popover
- Dropdown menu
- Progress
- Skeleton
- Empty state
- Alert
- Toast
- Breadcrumb
- Data table

## Presentation-specific components

### ProjectCard
Displays:
- title
- presentation type
- last edited date
- slide count
- template family
- project status
- latest export status
- thumbnail preview

Actions:
- open
- duplicate
- archive
- delete

### BriefComposer
Fields:
- primary goal prompt
- audience
- desired outcome
- meeting context
- slide count preference
- upload drop zone

Behavior:
- autosave locally or through repository abstraction
- show examples without pre-filling misleading claims
- support keyboard submission

### ClarifyingQuestionCard
Displays:
- question
- reason it matters
- input control
- skip option
- fallback assumption preview

### OutlineEditor
Capabilities:
- display ordered outline cards
- add slide
- remove slide
- split item
- merge adjacent items
- edit purpose, headline, and key message
- reorder through accessible buttons; drag-and-drop may be optional later
- show assumptions and evidence links

### TemplateFamilyCard
Displays:
- family name
- best use cases
- visual characteristics
- representative slide previews
- selected state
- compatibility note

### SlideCanvas
Renders one slide from structured data.
- preserve 16:9 ratio
- scale normalized coordinates
- use semantic design tokens
- show selection outlines only in editor mode
- never alter persisted geometry during rendering

### SlideThumbnail
Displays slide number, headline snippet, status, and preview.
States:
- selected
- changed in current revision
- warning
- processing
- approved

### SlideCarousel
- horizontal scrolling
- keyboard arrow navigation
- visible selected slide
- add-slide action
- compact on mobile
- virtualize when slide count becomes large

### InstructionComposer
Variants:
- slide-specific
- deck-wide

Features:
- multiline text
- example prompts
- scope indicator
- interpret-only option for high-impact changes
- submit and cancel
- processing state
- recent instructions

### RevisionTimeline
Displays:
- revision number
- timestamp
- reason
- actor
- changed slides
- restore action
- duplicate-project action

### ValidationPanel
Groups:
- blockers
- warnings
- assumptions
- source issues
- export compatibility

### ExportDialog
Options:
- PowerPoint
- Google Slides
- PDF
- PNG bundle

Shows:
- revision being exported
- validation status
- expiration policy
- speaker notes option
- source inclusion option
- export progress

### AdminRuleProposal
Displays:
- original instruction
- normalized rule
- impact summary
- examples of affected behavior
- approve, revise, or cancel actions

## Screens

### Dashboard
Purpose: project history and fast creation.

Sections:
- prominent New presentation action
- recent projects grid or list
- filters and search
- usage summary placeholder
- empty state with example project types

### New presentation
Step layout:
1. Goal and audience
2. Sources
3. Clarifying questions
4. Outline
5. Template

Keep progress visible. Users may return to prior steps without losing work.

### Clarifying questions
- one focused column
- maximum five questions per round
- show assumptions created by skipped questions
- primary action: Continue to outline

### Outline review
- outline editor center
- brief summary side panel
- story quality indicators
- assumptions panel
- primary action: Approve outline

### Template selection
- four family cards
- preview gallery
- recommendation explanation
- compare mode for two families
- primary action: Generate draft

### Presentation editor
Desktop layout:
- top project bar
- main slide canvas
- right inspector/instruction panel
- bottom slide carousel

Key actions:
- select slide
- send slide instruction
- send deck-wide instruction
- add, remove, split, merge, duplicate, reorder
- view revisions
- validate
- publish

The editor is conversational, not drag-and-drop. Element selection may be supported for precise instructions, but direct manipulation is not required.

### Project detail
- project metadata
- current presentation status
- recent revisions
- recent exports
- reopen editor
- create similar project

### Admin dashboard
Cards:
- users
- published rules
- templates
- usage
- audit activity

### Admin users
- searchable table
- role and status filters
- block, suspend, restore, promote, and demote actions
- confirmation dialogs

### Admin rules
- categorized rule sets
- current published version
- freeform proposal composer
- AI interpretation preview
- publish confirmation
- immutable version history

## State requirements
Every screen must provide:
- loading state
- empty state
- error state
- permission-denied state when applicable
- disabled state during mutations
- retry behavior for recoverable failures

## Responsive behavior
- Desktop is primary for the editor.
- Tablet supports full workflow with stacked inspector.
- Mobile supports dashboard, brief, questions, outline review, and project status.
- Full slide editing on mobile may be limited but must remain readable and navigable.

## Accessibility
- WCAG-oriented contrast and focus states
- semantic headings
- explicit form labels
- keyboard navigation for carousel, dialogs, and outline controls
- screen-reader labels for icon-only controls
- no color-only statuses
- reduced-motion support

## Sprint 1 requirements
Codex should implement polished mocked versions of all primary screens, reusable components, seeded data, responsive behavior, and keyboard-accessible interactions. No live backend credentials should be required.