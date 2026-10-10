---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

# code-review (wrapper)

Read and follow `vendors/mattpocock/skills/engineering/code-review/SKILL.md` in full, then work under these overrides:

- Where the upstream skill tells the agent to invoke another skill via the Skill tool (any phrasing: "Call the Skill tool with `X`", "call the Skill tool twice, for `X` and `Y`", "call the Skill tool for whichever skills ..."), instead read and follow the vendored copy of each named skill: `vendors/mattpocock/skills/<bucket>/<name>/SKILL.md` - check whether `<name>` lives under `engineering/` or `productivity/`.
- Where it references subagents or background agents, use the pi `subagent` tool under the ceilings in the `subagent-orchestration-policy` skill.
- Upstream may tell the user to run a slash command such as `/setup-matt-pocock-skills`; pi has no slash commands - tell the user to ask for that skill by name instead.
- The two review axes run as two parallel read-only reviewer children in one pi `subagent` workflow; the parent aggregates their reports (see `subagent-orchestration-policy` §6 for lenses and disposition).
Anything not listed here: upstream text is authoritative. Deviations are logged in `CHANGES.md`; add any new one you notice there.
