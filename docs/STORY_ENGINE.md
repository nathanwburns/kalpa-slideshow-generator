# Story Engine

## Purpose
The Story Engine turns a user brief and source material into a persuasive presentation narrative before any slide design is selected. Its job is not to summarize inputs. Its job is to determine what the audience must understand, believe, remember, and do.

## Core principle
Users do not primarily want slides. They want an outcome: persuade, sell, align, explain, recommend, or secure a decision. The Story Engine must optimize for that outcome.

## Inputs
- user prompt
- presentation type
- audience
- desired outcome
- meeting context
- available source material
- known constraints
- target slide count
- selected template family, when already chosen
- prior deck or project context

## Required outputs
- normalized brief
- audience profile
- presentation objective
- central thesis
- supporting claims
- likely objections
- evidence inventory
- assumptions
- missing-information questions
- narrative arc
- slide-by-slide outline
- transition logic
- recommended template family
- confidence and risk notes

## Brief normalization
The engine should convert freeform input into:
- `situation`
- `audience`
- `decisionOrAction`
- `desiredBelief`
- `keyEvidence`
- `constraints`
- `tone`
- `deadlineOrEvent`

Example:

Input:
"I have a meeting with a manufacturing prospect next week and want them to understand how Kalpa can reduce downtime."

Normalized brief:
- Situation: first or early-stage sales meeting
- Audience: manufacturing operations leadership
- Decision or action: agree to a follow-up discovery or pilot
- Desired belief: Kalpa understands the operational causes and cost of downtime
- Key evidence needed: operational credibility, practical approach, measurable outcomes
- Tone: confident, credible, consultative

## Clarifying-question strategy
Ask questions only when the answers could materially change the narrative, evidence, or recommendation.

Priority order:
1. Audience and decision maker
2. Desired action after the presentation
3. Current problem or opportunity
4. Available evidence or proof
5. Constraints, sensitivities, or prohibited claims
6. Timing, budget, and implementation context

Question rules:
- Ask no more than five questions in one round.
- Explain why a question matters when not obvious.
- Allow the user to skip.
- Convert skipped critical information into labeled assumptions.
- Do not ask for information already present in uploaded sources.

## Narrative arcs

### Sales deck
Recommended arc:
1. Shared context
2. Cost or consequence of the problem
3. Insight or reframing
4. Kalpa approach
5. How it works
6. Proof or credibility
7. Expected outcomes
8. Recommended next step

### Proposal
Recommended arc:
1. Understanding of the need
2. Objectives and success criteria
3. Proposed solution
4. Scope and approach
5. Timeline
6. Team or capabilities
7. Commercial or implementation considerations
8. Decision and next step

### Internal strategy
Recommended arc:
1. Current state
2. Why change is needed
3. Strategic choice
4. Key initiatives
5. Operating model
6. Roadmap
7. Risks and mitigations
8. Decisions required

### Project update
Recommended arc:
1. Objective and status
2. Progress since last update
3. Key results
4. Risks or blockers
5. Decisions needed
6. Next milestones

## Slide-purpose taxonomy
Each slide must have exactly one primary purpose:
- orient
- establish-problem
- quantify-impact
- introduce-insight
- explain-solution
- demonstrate-process
- compare-options
- provide-proof
- show-case-study
- establish-capability
- present-roadmap
- address-risk
- recommend-action
- close

Secondary purposes may be recorded, but one purpose must dominate.

## Outline rules
- Default length: six to ten slides.
- One primary idea per slide.
- Each slide must advance the argument.
- Avoid agenda slides unless they materially help orientation.
- Avoid repetition disguised as recap.
- Use section dividers only for longer decks or meaningful shifts.
- The first three slides must establish relevance and momentum.
- The final slide must make the next action explicit.

## Headline rules
Slide headlines should communicate the takeaway, not merely name the topic.

Weak:
- Market Overview
- Our Process
- Benefits

Strong:
- Unplanned downtime is eroding output and margin
- Kalpa targets the operational causes before prescribing technology
- A focused pilot can prove value in weeks, not quarters

## Evidence handling
Every factual claim should be classified as:
- supplied by user
- extracted from source
- generated assumption
- public external fact
- recommendation or inference

The system must not present assumptions as verified facts. Assumptions must remain traceable to the project record and visible during review.

## Objection handling
For persuasive decks, identify likely objections such as:
- cost
- implementation risk
- integration complexity
- credibility
- timeline
- internal capacity
- proof of value

Do not create a dedicated objection slide by default. Address objections where they naturally arise unless the user requests explicit objection handling.

## Narrative transitions
Each slide should include a short transition note indicating why the next slide follows. This supports:
- coherent generation
- speaker notes
- revision stability
- reordering validation

## Editing behavior
When a user revises the outline:
- recompute slide numbering
- update transitions
- detect broken narrative dependencies
- preserve approved claims and evidence
- flag when a requested change weakens the story
- allow the change while explaining the tradeoff

## Quality review
The Story Engine should score:
- objective clarity
- audience relevance
- logical progression
- strength of evidence
- redundancy
- unresolved assumptions
- quality of opening
- quality of closing
- actionability

Any score below the configured threshold should trigger a revision pass before visual generation.

## Implementation boundary
The Story Engine returns structured data only. It must not produce final slide coordinates, colors, or typography. Those belong to the Slide Planner and Template Engine.