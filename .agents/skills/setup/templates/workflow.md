# Workflow

Read by the `rigor` skill at the start of every run. Written by `setup`; edit by hand or re-run `setup`.

## Instruction file

Canonical: `AGENTS.md`. `CLAUDE.md` imports it with `@AGENTS.md`.

## Run state

- Brief, preferences, trail, gates, handoff: `.audit/<slug>.{brief.md,preferences.md,tsv,gates.md,handoff.md}` (committed).
- Large evidence (screenshots, traces, videos): `tmp/` (gitignored). Trail rows point at it.

## PR body template

`pr` <!-- or: opening-a-pr -->

## Authority (standing orders for every run)

1. Commit to the run branch: yes
2. Push the run branch: yes
3. Open a PR: yes
4. Merge: no (stop at merge-ready and park the merge in gates.md)
5. Worktrees, one per writer: allowed
6. Never: force-push shared branches, deploy, delete data, message customers

## Chain efforts

<!-- delete this whole section if you don't run chains: "continue <slug>", rigor/CHAIN.md -->

Where a chain run differs from `## Authority` above. Every number here is a setting. Leave one out and CHAIN.md's method still holds.

- Delegation tool: `paseo` <!-- adapter: .agents/skills/rigor/delegation/paseo.md. Delete the line to run chains degraded, in-session and serially -->
- Landing: one squash commit per ticket on `main`
- Push: only when the owner asks in that session <!-- or: push each landing -->
- PRs: none <!-- or: one per ticket -->
- Plan approval: owner <!-- or: L0 for the owner (delegated), listed at every close for overturning -->
- Concurrency caps: `<n>` implementers, `<n>` ticket worktrees, `<n>` reviewer sessions at once
- Context ceilings: implementer `<n>k`, long session `<n>k`
- Attempts per task: `<n>` (`<n>` to get it right, `<n>` for review findings), then a takeover
- Hard tickets: `<n>` implementer fix round, then a takeover
- Solo band: `hard` <!-- or: critical, or none. A ticket at or above it runs alone in its own session -->
- Review depth: a post-land delta over `<n>` lines is re-reviewed
- L0 heartbeat: every 15 minutes <!-- default -->; a progress line older than `<n>` minutes, or the same step on `<n>` lines in a row, is stuck
- L1/L2 wait slice: 10 minutes max <!-- default; never an unbounded wait -->
- Reviewer fallback: none <!-- or: a named model when the first is out of quota -->
- Red/green: `<command that runs one test path, red on the base and green on the tip>`
- Mutation check: `<command>` <!-- or: none -->
- Full gate: `<command, run on the staged squash>`
- Verify skill: `.agents/skills/verify-<app>/SKILL.md`<!-- or: none -->
- Packet project rules: `docs/agents/packet-rules.md`
- Cleanup at landing: `<worktree, workspace, agents, branch, stage ref>`

### Models per role

| Role | Model | Thinking |
|---|---|---|
| L1 implementer, L2 worker | `<provider/model>` | `<level>` |
| L2 scout | `<provider/model>` | `<level>` |
| L2 reviewer | `<provider/model>` | `<level>` |
| L0 reviewers | `<provider/model>` | `<level>` |
| reviewer fallback | none | |
| planner | `<provider/model>` | `<level>` |
| takeover | `<provider/model>` | `<level>` |
| verify driver | `<provider/model>` | `<level>` |

### Self-continuing sessions

<!-- off by default. Delete this section unless sessions should start the next one -->

State: off <!-- or: on -->

Successor start, as the last action of a session:

`<the delegation adapter's successor-start call: provider/model, mode, cwd = the main checkout, title "<slug> S<n+1>: <tickets>", labels effort=<slug> and session=<n+1>, prompt = the briefing from rigor/CHAIN.md>`

The exact command for this repo's tool, with the rest of its gotchas, is in `.agents/skills/rigor/delegation/<tool>.md`.

## Verification

- App verify skill: `.agents/skills/verify-<app>/SKILL.md` <!-- or: none -->
- Formal verification skill: none
- Check command (run at every checkpoint): `<e.g. npm test && npm run typecheck>`

## Model roles

| Role | pi | Claude Code | Codex |
|---|---|---|---|
| judgment and prose | inherit-parent | inherit-parent | inherit-parent |
| code | inherit-parent | inherit-parent | inherit-parent |
| reviewers (interrogate, arena judge, trail review) | inherit-parent | inherit-parent | inherit-parent |
| verifier (≠ author family when possible) | inherit-parent | inherit-parent | inherit-parent |

`inherit-parent` = no override configured; the child runs on the parent's model (omit the child's `model`). One family everywhere means reviews are "single-family".

Fast mode and `-fast` model variants are never used, for any role, even when a job is urgent.
