---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
---

# to-tickets (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/to-tickets/SKILL.md` in full, then work under these overrides:

- Where the upstream skill says "Call the Skill tool with `X`", read and follow `vendors/mattpocock/skills/engineering/X/SKILL.md` instead (pi has no Skill tool; skills load by reading their SKILL.md).
- Where it references subagents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
