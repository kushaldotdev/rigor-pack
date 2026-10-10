---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

# implement (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/implement/SKILL.md` in full, then work under these overrides:

- Where the upstream skill says "Call the Skill tool with `X`", read and follow `vendors/mattpocock/skills/engineering/X/SKILL.md` instead (pi has no Skill tool; skills load by reading their SKILL.md).
- Where it references subagents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.
- Issue-tracker operations use the repo's configured tracker (see the repo's agent docs for which CLI and workflow).

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
