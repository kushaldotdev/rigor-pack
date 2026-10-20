---
name: writing
description: "Write prose that lands: documents agents consume (skills, AGENTS.md, CLAUDE.md), PR bodies, technical docs and commit messages, and cutting AI tells from any writing. Use when writing or editing a skill or agent doc, a PR description, a README or RFC, or any prose surface."
---

# Writing

## Modes

| Mode | When | Body |
|---|---|---|
| writing for agents | Skills, AGENTS.md / CLAUDE.md, any doc an agent reaches by pointer | [writing-for-agents](references/matt/writing-for-agents/writing-for-agents.md), with [SKILL-MECHANICS](references/matt/writing-for-agents/SKILL-MECHANICS.md) |
| PR body | Writing a pull request description | The template `docs/agents/workflow.md` records: [pr](references/matt/pr/pr.md) (Summary / Evidence / Merge Danger) or [opening-a-pr](../rigor/references/pstack/poteto-mode/playbooks/opening-a-pr.md) (Why / What changed / Scope / Tradeoffs / Blast Radius / Verification) |
| technical writing | Docs, RFCs, readmes, commit messages | [technical-writing](references/pstack/technical-writing/technical-writing.md) |
| unslop | Every prose surface, the reply to the user included | [unslop](references/pstack/unslop/unslop.md) |

## Precedence

- `unslop` is always on: every prose surface gets it, not only on request (owner decision, matching upstream poteto-mode).
- With no recorded PR template, use `pr`.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
