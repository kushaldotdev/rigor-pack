---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---
Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.


<!-- materialized from vendors/mattpocock/skills@49dd158; do not hand-edit - rebuild: node scripts/build-pack.mjs; deviations: CHANGES.md -->

## pi adaptations

- Subagent or background-agent work: use the pi `subagent` tool under the ceilings in `~/.pi/agent/skills/subagent-orchestration-policy/SKILL.md`.
- Upstream slash commands (e.g. `/setup-matt-pocock-skills`): pi has none - the user asks for the skill by name.
- Skills referenced above live in this repo's `.agents/skills/<name>/SKILL.md`.
