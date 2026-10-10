---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

# research (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/research/SKILL.md` in full, then work under these overrides:

- Where the upstream skill tells the agent to invoke another skill via the Skill tool (any phrasing: "Call the Skill tool with `X`", "call the Skill tool twice, for `X` and `Y`", "call the Skill tool for whichever skills ..."), instead read and follow the vendored copy of each named skill: `vendors/mattpocock/skills/<bucket>/<name>/SKILL.md` - check whether `<name>` lives under `engineering/` or `productivity/`.
- Where it references subagents or background agents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.
- Upstream may tell the user to run a slash command such as `/setup-matt-pocock-skills`; pi has no slash commands - tell the user to ask for that skill by name instead.

Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
