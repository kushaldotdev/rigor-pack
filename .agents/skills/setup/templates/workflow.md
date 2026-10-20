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
| judgment and prose | parent | parent | parent |
| code | parent | parent | parent |
| reviewers (interrogate, arena judge, trail review) | parent | parent | parent |
| verifier (≠ author family when possible) | parent | parent | parent |

`parent` = no override configured; the child runs on the parent's model. One family everywhere means reviews are "single-family".
