---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# diagnosing-bugs (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/diagnosing-bugs/SKILL.md` in full, then work under these overrides:

- Where the upstream skill says "Call the Skill tool with `X`", read and follow `vendors/mattpocock/skills/engineering/X/SKILL.md` instead (pi has no Skill tool; skills load by reading their SKILL.md).
- Where it references subagents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
