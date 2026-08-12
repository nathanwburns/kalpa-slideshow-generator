# Kalpa Style Reference Audit

The five supplied Kalpa exploration decks are design inputs for the renderer, not slide templates to be copied verbatim. Their strongest visual rules map to the available theme directions below.

| Reference direction | Renderer family | Use deliberately |
| --- | --- | --- |
| Blue architectural | `blue-architectural` | Dark technical statements, engineered framing, blue architectural geometry. |
| Warm editorial | `editorial-signal` | Warm paper surfaces, coral emphasis, numbered editorial evidence. |
| Strategic dense | `strategic-frameworks` | Clear executive frameworks and comparisons, with strict short-copy budgets. |
| Human-centered sales | `human-centered-sales` | Image-led sales narratives and calm, warm-white proof surfaces. |
| Dark data executive | `dark-data-executive` | Concise metrics, evidence, and decision-oriented reporting in high contrast. |

## Non-negotiable output rules

- Never reuse a visual asset by default across a deck.
- Use only real image assets or generated editorial images; no fake image placeholders.
- Keep a single dominant message per slide and match copy to the layout budget.
- Do not use UI buttons, pill controls, or generic dashboard widgets inside a slide.
- Prefer a light evidence slide after a dark statement slide unless the selected family is `dark-data-executive`.
- Keep cards shallow and concise. Split or rewrite content before reducing the type size below readable presentation scale.

The strategic and data references contain useful information-density patterns, but they are not permission to crowd a slide. The renderer normalizes content before it is drawn so source copy cannot create overlap in the preview or PPTX export.
