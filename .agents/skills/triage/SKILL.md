---
name: triage
description: "Move incoming issues and external PRs through triage roles: categorise, verify, grill if needed, and write agent-ready briefs."
disable-model-invocation: true
---

# Triage

Read [triage](references/matt/triage/triage.md) and follow it, with [AGENT-BRIEF](references/matt/triage/AGENT-BRIEF.md) and [OUT-OF-SCOPE](references/matt/triage/OUT-OF-SCOPE.md).

Triage is a maintainer session with a human present, not an AFK run. Its questions are expected.

- The tracker and label vocabulary come from `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`. If either is missing, ask the user to run the `setup` skill first.
- An issue triaged `ready-for-agent` is input for the `rigor` skill.
- Tickets that `rigor` produced are already agent-ready. Don't triage them.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
