---
name: handoff
description: "Pause, hand off, or pick up in-flight work: write a portable handoff doc, suspend work so it can resume, or take over a prior agent's work."
argument-hint: "hand off | pause | pickup, plus what the next session is for"
disable-model-invocation: true
---

# Handoff

## Modes

| Mode | When | Body |
|---|---|---|
| hand off (default) | New harness, new directory, a colleague, or forking a side task mid-phase | [handoff](references/matt/handoff/handoff.md) |
| pause | Suspend in-flight work cleanly: going offline, restart, imminent compaction | [pause-safely playbook](../rigor/references/pstack/poteto-mode/playbooks/pause-safely.md) |
| pickup | Resume or take over a prior agent's work from a transcript, branch, or handoff doc | [session-pickup playbook](../rigor/references/pstack/poteto-mode/playbooks/session-pickup.md) |

## Pack rules

- Inside a repo with a `rigor` run in flight, the handoff doc goes to `.audit/<slug>.handoff.md` (committed) instead of the OS temp directory, so any clone can resume. Elsewhere follow the body.
- Resuming a `rigor` run is the `rigor` skill's resume path (three questions, then AFK). Pickup is for work that has no `.audit/` brief.
- "Suggested skills" in the doc names pack skills (`rigor`, `code-review`, …), not upstream names.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
