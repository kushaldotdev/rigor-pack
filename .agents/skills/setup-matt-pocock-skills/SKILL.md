---
name: setup-matt-pocock-skills
description: "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills."
---

# setup-matt-pocock-skills (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/setup-matt-pocock-skills/SKILL.md` in full, then work under these overrides:

- Where the upstream skill says "Call the Skill tool with `X`", read and follow `vendors/mattpocock/skills/engineering/X/SKILL.md` instead (pi has no Skill tool; skills load by reading their SKILL.md).
- Where it references subagents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
