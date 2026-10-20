---
name: code-review
description: "Review changes since a fixed point: standards and spec axes, adversarial multi-model interrogation, blast radius beyond the diff, comment hygiene, and bot-review triage. Use when reviewing a branch, PR, or diff, or asked to challenge, interrogate, or find what a change could break."
---

# Code review

## Lenses

Each lens reports in its own section. No lens ranks or filters another (the same rule as the two-axis section of the base body).

| Lens | When | Body |
|---|---|---|
| standards + spec (default) | Every review | [code-review](references/matt/code-review/code-review.md) |
| interrogate | Contested design, or before shipping a nontrivial change | [interrogate](references/pstack/interrogate/interrogate.md) and its references |
| blast radius | A small diff you don't trust; what breaks beyond it | [blast-radius](references/pstack/blast-radius/blast-radius.md) |
| comments | Before review: keep only non-obvious *why* comments | [no-comments](references/pstack/no-comments/no-comments.md) |
| bot review triage | Bugbot or an automated reviewer commented | [bugbot-triage](../rigor/references/pstack/poteto-mode/references/bugbot-triage.md) |

## Precedence

- `interrogate` keeps its upstream premise: model diversity first. Personas are the single-family fallback, labeled "single-family" in the verdict.
- `no-comments` spawns a Cursor-only "Comment Sicko" agent. Elsewhere, apply its rules yourself or in a plain reviewer child. The rule it enforces is the Comments section of [poteto-mode](../rigor/references/pstack/poteto-mode/poteto-mode.md).
- "In the foreground" in the base body means: wait for both reviewers before aggregating. Running them as background children and waiting is equivalent.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md). Inside a `rigor` run, [AFK.md](../rigor/AFK.md) supplies the fixed point and the spec and overrides every "ask the user" line.
