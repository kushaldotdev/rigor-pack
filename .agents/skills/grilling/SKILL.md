---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

# grilling (wrapper)

Read and follow `vendors/mattpocock/skills/productivity/grilling/SKILL.md` in full, then work under these overrides:

- Where the upstream skill says "Call the Skill tool with `X`", read and follow `vendors/mattpocock/skills/productivity/X/SKILL.md` instead (pi has no Skill tool; skills load by reading their SKILL.md).
- Where it references subagents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
