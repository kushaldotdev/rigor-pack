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
