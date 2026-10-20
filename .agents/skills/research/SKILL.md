---
name: research
description: "Answer questions with evidence: how code works, why it was built that way, primary-source research saved to the repo, and reconstructing recent working context. Use for how does X work, why is Y like this, research this topic, or where did I leave off."
---

# Research

## Modes

| Mode | When | Body |
|---|---|---|
| research (default) | A topic, docs, or API facts; a cited Markdown file in the repo | [research](references/matt/research/research.md) |
| how | How does X work, walkthroughs, where should this live | [how](references/pstack/how/how.md) |
| why | Design rationale, regressions, postmortems, thresholds | [why](references/pstack/why/why.md) |
| recall | Where did I leave off, what was I working on | [recall](references/pstack/recall/recall.md) |

## Pack rules

- `how` and `why` name model roles for explorers and synthesizers; use the roles in `docs/agents/workflow.md`, or the harness fallback in [harness notes](../rigor/harness/).
- `why` discovers whichever evidence sources (MCPs) the session has. Skip a source category that has none and say so.
- `recall` reads transcripts; transcript locations per harness are in [harness notes](../rigor/harness/).
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
