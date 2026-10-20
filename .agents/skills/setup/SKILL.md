---
name: setup
description: "Configure this repo for the pack, once: issue tracker, triage labels, domain docs, instruction file, run state, PR template, authority, verify skill, and model roles. Every later skill reads the answers from docs/agents/."
disable-model-invocation: true
---

# Setup

The only place repo-level questions are asked. Answers land in `docs/agents/*.md`. No later skill asks them again. Re-running setup edits those files in place.

## 1. Explore first

Never ask what you can observe. Check:

- `git remote -v`: GitHub, GitLab, other, or none.
- `AGENTS.md`, `CLAUDE.md`, `AGENTS.override.md`, and any `## Agent skills` block in them.
- Glossary: `GLOSSARY.md`, `CONTEXT.md`, `GLOSSARY-MAP.md`; `docs/adr/`, `src/*/docs/adr/`.
- `docs/agents/`: prior answers. Treat every answer found there as settled; offer to change it, don't re-ask it.
- `.scratch/`, monorepo signals (`pnpm-workspace.yaml`, `workspaces` in `package.json`, `packages/*/src`).
- Tools on PATH: `gh`, `glab`, `bun`, `node`.
- An existing `verify-*` skill under `.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`.
- `.agents/harness-targets.json` (written by the installer): which harnesses this repo targets.
- Harness model config already present: pi `agentOverrides` in pi-subagents settings, Claude `.claude/agents/*.md` `model:` fields, Codex `.codex/agents/*.toml` or `~/.codex/agents/*.toml` `model =` lines.

## 2. Ask, one section at a time

Lead each section with the recommended answer so the user can accept it in a word. Skip a section the exploration settled.

1. **Issue tracker.** Matt's Section A, verbatim rules: read [setup-matt-pocock-skills](references/matt/setup-matt-pocock-skills/setup-matt-pocock-skills.md) §2 Section A. Local tickets live in `.scratch/<feature>/` per [issue-tracker-local](references/matt/setup-matt-pocock-skills/issue-tracker-local.md).
2. **Triage labels.** Matt's Section B (`triage` ships in this pack, so it always runs).
3. **Domain docs.** Matt's Section C, plus: record the glossary filename the repo already uses (`GLOSSARY.md` or `CONTEXT.md`). Never rename it. A repo with neither gets `GLOSSARY.md`.
4. **Instruction file.** Recommended: `AGENTS.md` holds the `## Agent skills` block, plus a `CLAUDE.md` whose first line is `@AGENTS.md`. pi reads both; Codex reads only `AGENTS.md`; Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md`. This replaces Matt's "edit whichever exists" rule (§4 of his body) when the repo targets Codex or Claude. If `CLAUDE.md` already holds content, keep it and add the `@AGENTS.md` line at the top.
5. **Run state.** Default: committed `.audit/` (brief, preferences, trail, gates, handoff per run), large evidence in gitignored `tmp/`. Add `tmp/` to `.gitignore` if missing.
6. **PR body template.** `pr` (Summary / Evidence / Merge Danger) or `opening-a-pr` (Why / What changed / Scope / Tradeoffs / Blast Radius / Verification). Recommend `pr` for small repos, `opening-a-pr` where reviewers want scope and tradeoffs spelled out.
7. **Default authority.** Commit (yes), push the branch (yes), open a PR (yes if a forge exists), merge (no: runs stop at merge-ready unless granted here), worktrees allowed (yes). These become standing orders in every run.
8. **Verify skill.** If no `verify-*` skill exists, offer once to generate one now with [create-verification-skill](../verify/references/pstack/create-verification-skill/create-verification-skill.md) (it interviews the repo, so it needs the human). Then offer once a formal verification skill ([create-formal-verification-skill](../verify/references/pstack/create-formal-verification-skill/create-formal-verification-skill.md)). Write generated skills under `.agents/skills/`.
9. **Model roles.** Record what is configured, never pick. List the roles from [setup-pstack](references/pstack/setup-pstack/setup-pstack.md) §5 (judgment and prose, code, reviewers, explorers, verifier) and write the model each harness already maps to it, or `parent` where nothing is configured. Never ask about models during a run.

Human-only provisioning found along the way (secrets, dashboards, a cutover) gets a [wizard](references/matt/wizard/wizard.md) script, not an agent attempt.

## 3. Confirm, then write

Show drafts of every file, let the user edit, then write:

- `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md` from Matt's templates in [references/matt/setup-matt-pocock-skills/](references/matt/setup-matt-pocock-skills/). In `domain.md`, replace `GLOSSARY.md` with the recorded filename if it differs.
- `docs/agents/workflow.md` from [templates/workflow.md](templates/workflow.md): sections 4-9 above.
- The `## Agent skills` block in the canonical instruction file: Matt's block plus one line `### Workflow` → `Start work with the rigor skill. See docs/agents/workflow.md.`
- Labels on GitHub/GitLab as Matt's §4 describes.

## 4. Done

Tell the user setup is complete: start work with `rigor`. They can edit `docs/agents/*.md` by hand later.

Upstream names in the bodies above resolve through [the name index](../rigor/references/INDEX.md). The pstack setup body writes a Cursor rule file; this pack does not. Its §7-§8 offers are section 8 here.
