---
name: verify
description: "Prove a change works on the real artifact: generate or maintain a repo verify-<app> skill, formal verification, and vetting measured numbers. Use before declaring done, when a project has no scripted way to drive its app, or before reporting a speedup or regression."
---

# Verify

## Modes

| Mode | When | Body |
|---|---|---|
| prove it works (default) | Before declaring any unit done | [principle-prove-it-works](references/pstack/principle-prove-it-works/principle-prove-it-works.md), then the repo's `verify-<app>` skill if one exists |
| create verify skill | No scripted way to drive the app the way a user does | [create-verification-skill](references/pstack/create-verification-skill/create-verification-skill.md) |
| maintain verify skill | Keep the verify skill and its feature map honest | [maintain-verification-skill](references/pstack/maintain-verification-skill/maintain-verification-skill.md) |
| create formal verification | Concurrency, retries, state machines, parsers need more than tests | [create-formal-verification-skill](references/pstack/create-formal-verification-skill/create-formal-verification-skill.md) |
| maintain formal verification | Verified code changed since it was last checked | [maintain-formal-verification-skill](references/pstack/maintain-formal-verification-skill/maintain-formal-verification-skill.md) |
| vet a number | You measured a perf number or eval result | [benchmark-checklist](references/pstack/benchmark-checklist/benchmark-checklist.md) and [principle-explain-the-number](references/pstack/principle-explain-the-number/principle-explain-the-number.md) |

## Pack rules

- The generators write `.cursor/skills/verify-<app>/`. In this pack write it to `.agents/skills/verify-<app>/` (plus a Claude Code symlink if `.agents/harness-targets.json` lists `claude`), and record its path in `docs/agents/workflow.md`.
- `verify-<app>` defines how to drive the app; `benchmark-checklist` defines what counts as a measured number. A perf claim is `verified` only when both pass.
- No startable app means the unit result is `unverified`, never `verified`.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md). Inside a `rigor` run, [AFK.md](../rigor/AFK.md) overrides lines that ask the user.
