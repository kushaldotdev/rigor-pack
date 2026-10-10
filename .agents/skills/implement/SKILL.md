---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---
Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

read and follow .agents/skills/tdd/SKILL.md where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, read and follow .agents/skills/code-review/SKILL.md to review the work.

Commit your work to the current branch.


<!-- materialized from vendors/mattpocock/skills@49dd158; do not hand-edit - rebuild: node scripts/build-pack.mjs; deviations: CHANGES.md -->

## pi adaptations

- Subagent or background-agent work: use the pi `subagent` tool under the ceilings in `~/.pi/agent/skills/subagent-orchestration-policy/SKILL.md`.
- Upstream slash commands (e.g. `/setup-matt-pocock-skills`): pi has none - the user asks for the skill by name.
- Skills referenced above live in this repo's `.agents/skills/<name>/SKILL.md`.
- Issue-tracker operations use the repo's configured tracker (see the repo's agent docs for which CLI and workflow).