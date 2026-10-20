---
name: rigor
description: "The one workflow. Give it any engineering task (an idea, an issue, a spec, a bug, a migration, a review range): it interviews you once, then plans, builds, verifies, and reviews without interrupting you, across as many sessions as the work needs."
argument-hint: "the task, an issue/ticket reference, or 'resume <slug>'"
disable-model-invocation: true
---

# Rigor

You are the conductor. Every task enters here; you decide which bodies run. The human answers questions once, at the start. After the interview the run is AFK: it never asks again.

Paths below are relative to this file's folder. When you hand a file to a child agent, give it the **absolute** path (resolve it from this file's location) plus the brief.

## 0. Preconditions

1. Read `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/agents/workflow.md` (and `triage-labels.md` if present).
2. If any is missing, **stop before the run starts.** Tell the user setup has not run and ask them to invoke the `setup` skill (or offer to run it now). Assume no defaults. Start only after setup has written its answers.
3. Read your harness notes: [harness/pi.md](harness/pi.md), [harness/claude.md](harness/claude.md), or [harness/codex.md](harness/codex.md). They say how to spawn children, wait, loop, and where transcripts live, and what to do when a feature is missing.
4. If the argument is `resume <slug>`, or `.audit/<slug>.brief.md` exists for this task, go to §5 Resume.

## 1. Route

Classify the task, pick a route, and say which one in one line. Orientation: Matt's [ask-matt](references/matt/ask-matt/ask-matt.md) map and pstack's [poteto-mode](references/pstack/poteto-mode/poteto-mode.md) Playbooks list. Read the playbook you pick in full before using it.

| Task shape | Route |
|---|---|
| Idea or feature, fits one session | interview → spec → tickets → build in this session |
| Feature too big for one session (multi-session build) | interview → spec → tickets → build one ticket per fresh session, or as a task graph of children ([implement-spec](references/matt/implement-spec/implement-spec.md)) |
| Huge or foggy effort, the way is not visible | [wayfinder](references/matt/wayfinder/wayfinder.md) map first (interactive, in the interview phase), then the row above |
| Bug, regression, perf, forensics | [diagnosing-bugs](../diagnosing-bugs/SKILL.md) modes, run AFK after a short interview |
| Behaviour-preserving restructure | [refactoring playbook](references/pstack/poteto-mode/playbooks/refactoring.md) |
| Read-only question | [investigation playbook](references/pstack/poteto-mode/playbooks/investigation.md) with the [research](../research/SKILL.md) skill; no build phase |
| Pixel-exact UI match | [visual-parity playbook](references/pstack/poteto-mode/playbooks/visual-parity.md) |
| Agent-behaviour or skill change | [eval](references/pstack/poteto-mode/playbooks/eval.md) / [authoring-a-skill](references/pstack/poteto-mode/playbooks/authoring-a-skill.md) with the [writing](../writing/SKILL.md) skill |
| Codebase upkeep | [improve-codebase-architecture](references/matt/improve-codebase-architecture/improve-codebase-architecture.md); the candidate pick is an interview question |
| Large migration or no playbook fits | [figure-it-out](references/pstack/figure-it-out/figure-it-out.md) |
| Program: many PRs, many days | [orchestrate](references/pstack/poteto-mode/playbooks/orchestrate.md) (store under `.audit/<slug>/`), [autopilot-full](references/pstack/poteto-mode/playbooks/autopilot-full.md) or [autopilot-stack](references/pstack/poteto-mode/playbooks/autopilot-stack.md) |
| Drive one predicate to done | [autonomous-run](references/pstack/poteto-mode/playbooks/autonomous-run.md) |
| A PR to get green / land | [babysit](references/pstack/poteto-mode/playbooks/babysit.md) / [shipping](references/pstack/poteto-mode/playbooks/shipping.md) (merging needs merge authority in the brief) |
| Disk cleanup of worktrees | [worktree-cleanup](references/pstack/poteto-mode/playbooks/worktree-cleanup.md) |
| A review range only | the [code-review](../code-review/SKILL.md) skill with the brief's fixed point |

Upstream bodies name other skills by upstream name ("the **how** skill", `/swarm`). Resolve every such name in [references/INDEX.md](references/INDEX.md).

## 2. Interview (human present)

Run [INTERVIEW.md](INTERVIEW.md). It restates, sharpens, grills, models the domain, closes a fixed checklist, and writes the brief. For spec-and-tickets routes it also runs [to-spec](references/matt/to-spec/to-spec.md) and [to-tickets](references/matt/to-tickets/to-tickets.md), including the ticket quiz, while the human is still here. Keep grill → spec → tickets in one context window ([ask-matt](references/matt/ask-matt/ask-matt.md) §Context hygiene).

The interview ends when the user confirms the brief. From that moment the run is AFK.

## 3. AFK run

[AFK.md](AFK.md) governs everything from here: it maps every interactive line in every body to "answered in the brief" or "decide, log, surface at close", and fixes the outcome for every mid-run situation. Re-read it at each phase boundary.

Standing orders: `.audit/<slug>.preferences.md` (authority from `docs/agents/workflow.md`, plus run-specific lines). Paste them verbatim into every child brief, and use the brief shape from [orchestrate](references/pstack/poteto-mode/playbooks/orchestrate.md) §The brief (GOAL / SCOPE / CONTEXT / ACCEPTANCE / VERIFY / TIMEBOX / FORBIDDEN / REPORT / STANDING), sized to the unit.

Trail: one TSV per run at `.audit/<slug>.tsv` via [show-me-your-work](references/pstack/show-me-your-work/show-me-your-work.md) and its `scripts/log.sh`. Unit name in `phase`, result word in `result`. Every phase transition writes a row.

Working style for all phases: [poteto-mode](references/pstack/poteto-mode/poteto-mode.md) Non-negotiables, Principles, Writing the reply and Comments, with these substitutions. Cursor `Task` → your harness's child primitive. `poteto-agent` → a plain child with the brief. `cursor-team-kit` control skills → the repo's `verify-<app>` skill. `/deslop` → the [writing](../writing/SKILL.md) skill's unslop mode. Model names → the roles in `docs/agents/workflow.md`. `AskQuestion` → never; see AFK.md. Principles not under this skill live in the hosts listed in INDEX.md.

### Phases and gates

A gate that cannot fail is documentation. Each phase names what enforces it.

| Phase | Do | Gate (enforced by) |
|---|---|---|
| intake | §0 | `docs/agents/*` exist; brief has a done predicate (file check) |
| ground | `how` over the affected area; merit and premise check | trail row recording the merit verdict |
| design | [codebase-design](../codebase-design/SKILL.md) (architect / arena for one-way doors, contested shapes) | every one-way door the plan crosses is listed as pre-approved in the brief (brief vs plan) |
| build | per unit: [tdd](../tdd/SKILL.md) at the brief's seams ([implement](references/matt/implement/implement.md) per ticket, or [implement-spec](references/matt/implement-spec/implement-spec.md) for a graph); throughput checkpoint from the [feature playbook](references/pstack/poteto-mode/playbooks/feature.md) step 3 | checkpoint = commit + the check command from workflow.md exits 0 + trail row |
| verify | [verify](../verify/SKILL.md): `verify-<app>` on the matching surface | evidence exists at the path the trail row names (path check) |
| review | [code-review](../code-review/SKILL.md) lenses: standards + spec always; interrogate for contested design; blast-radius for risky small diffs; no-comments | blocking findings = 0, or the brief's round limit reached (structured verdict block) |
| close | done predicate re-checked; PR per workflow.md template via [writing](../writing/SKILL.md); unslop on every prose surface | predicate command or file check |

Fix rounds after review go to a fresh child with consolidated scope (poteto-mode §Subagents). Sequence units per [principle-sequence-verifiable-units](references/pstack/principle-sequence-verifiable-units/principle-sequence-verifiable-units.md): verify each before starting the next.

### Precedence where bodies disagree

- **tdd.** Matt `tdd` defines a good test; seams were agreed in the interview. pstack `tdd` decides whether a bug fix gets a new test. Prefer no test over a bad test, never over missing proof.
- **review.** `code-review` axes and `interrogate` are separate lenses in separate sections; neither ranks the other. `interrogate` keeps model diversity first; personas are the labeled single-family fallback.
- **verify vs benchmark.** `verify-<app>` says how to drive the app; `benchmark-checklist` says what counts as a measured number. Both must pass for `verified` on a perf claim.
- **worktrees.** One worktree per writer ([implement-spec](references/matt/implement-spec/implement-spec.md), separate-before-serializing-shared-state), when workflow.md allows worktrees; otherwise disjoint file sets with a serial step for shared files.
- **tickets vs parallel build.** A ticket built in parallel must name the files it owns.
- **unslop.** Always on for prose surfaces.
- **merge.** Babysit and shipping stop at merge-ready unless the brief grants merge authority.
- **glossary.** Bodies say `GLOSSARY.md`; use the filename `docs/agents/domain.md` records.

## 4. Sessions

Planning and building share one session by default: Continue is the first branch to rule out ([PHASE-BOUNDARIES](references/matt/ask-matt/PHASE-BOUNDARIES.md)). Start a fresh session when the context budget is short, per ticket on multi-session routes ([to-tickets](references/matt/to-tickets/to-tickets.md): one ticket fits one fresh window), or for a wayfinder effort.

State lives only in: tracker tickets, `.audit/<slug>.brief.md`, `.audit/<slug>.preferences.md`, `.audit/<slug>.tsv`, `.audit/<slug>.gates.md`, and the git branch. Never in chat history. Before ending a session mid-run, commit `.audit/` and write the next ready unit as the trail's last row. A fresh session reaches full working state from repo and tracker alone.

## 5. Resume

Read the brief, the preferences, the trail's last rows, `gates.md`, `git log` on the run branch, and the tracker's open tickets. Then ask exactly three questions, in one message, with a recommended answer each:

1. Has the premise changed since the brief?
2. Any new one-way doors or approvals (including answers to open gates)?
3. Continue the recorded plan, or re-plan from current state?

Record the answers as a `start` row (show-me-your-work's rule) and in the brief, then continue AFK at the next ready unit.

## 6. Close

Reply in the [ketchup](../wait-what/references/pstack/ketchup/ketchup.md) shape and per poteto-mode §Writing the reply: what changed for the user, what was verified and how (lead with any `unverified` unit), unit results (`verified` / `unverified` / `blocked` / `reverted` / `skipped`), open gates from `gates.md` (the only asks), the next ready unit, the trail path, and PR links. End with show-me-your-work's "Attention" section from a reviewer child (a different model family when the harness has one; say "single-family" when not).
