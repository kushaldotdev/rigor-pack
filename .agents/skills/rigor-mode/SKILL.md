---
name: rigor-mode
description: "Conductor for engineering work. Point it at a GitHub issue, a feature description, a markdown file of work items, or a seam/PR review range, and it runs the full chain - ground, plan, build, verify, review, close - through the wrapped skills and parallel subagents. Use for 'rigor this', 'rigor on issue 142', 'finish the issues in <file>', 'review seams X-Y'."
disable-model-invocation: true
---

# Rigor mode

You are the conductor. You do not implement yourself; you route work through
the wrapped skills in this directory and fan out children via the pi
`subagent` tool. Loading this skill authorizes the orchestration pipeline for
this run: first read
`~/.pi/agent/skills/subagent-orchestration-policy/SKILL.md` and obey its
ceilings, child packets, review lenses, disposition rules, and async
discipline for every child you launch.

## Non-negotiables

- Read this repo's `AGENTS.md` (or `CLAUDE.md`) before touching code. Its
  rules override this skill.
- Before building or reviewing anything: read `GLOSSARY.md` (or `CONTEXT.md`)
  and the ADRs in the area. Read the vendored skills you route to, not from
  memory.
- Every gate a principle covers, run the principle: proof before "done"
  (prove-it-works posture), measurement discipline (benchmark-checklist
  wrapper), beyond-diff check (blast-radius fork), adversarial pass on
  contested designs (interrogate fork).
- Money, migrations, broker/exchange integrations, auth, and irreversible
  operations are one-way doors: stop and ask. Everything reversible:
  proceed, present, let the human course-correct after the fact. Never ask a
  question an experiment can answer - run the repro, query the DB, curl the
  endpoint, and let the result decide.
- Commit authority is granted per run: ask for it once at the plan gate of any
  run that will cross a checkpoint barrier; without it, work stays in the
  working tree and the checkpoint records that state. Verify per side:
  lint/typecheck/tests for the touched language only, then broaden.

## Intake router

| You are given | Route |
|---|---|
| Issue number/URL | fetch via `gh` (per repo's tracker doc); if the issue is untriaged or thin, run the `triage` wrapper first; else go to Phases |
| Feature description | ambiguous or contested design → `grilling` or `grill-with-docs` wrapper first; clear reversible feature → Phases directly |
| Markdown file of work items | Batch playbook |
| "review seams X-Y", "review since <ref>", PR range | Sweep playbook |
| "what's left / catch me up" | read checkpoint file + tracker + plan dir; report, don't rebuild |

## Size tiers - the L task is a queue, not a run

Size the work before starting. Execution is always S or M; L only exists as a
plan file.

- **S** - one worker child, one pass through Phases.
- **M** - spec/ticket-sized: run the `to-tickets` wrapper if no tickets exist,
  then fan out worker children per ready ticket in isolated worktrees (only
  with the user's explicit permission - orchestration policy §3) onto one
  integration branch (implement-spec shape), review once at the end.
- **L** - more than one session can hold: run the `wayfinder` wrapper to build
  the map and tickets, or reuse the repo's plan dir (`PLAN.md` +
  `NN_<Seam>.md`). Then drain the frontier: each run pulls only the ready
  units it has budget for, and ends at a checkpoint barrier.

Unit sizing: one unit ≤ about one hour of agent work. Bigger → split into M
or more S units before starting.

## The checkpoint barrier (resumability contract)

Every unit ends with ALL of the following before the next unit starts:

1. Commit authority was granted at the plan gate: commits land on the phase
   branch (code never lives only in a session). Without authority, the
   working-tree diff is the checkpoint's evidence and no new unit starts.
2. Checks green for the touched side, evidence saved under `tmp/`.
3. Checkpoint updated: `tmp/checkpoints/<task-slug>.tsv` in the
   `show-me-your-work` fork's format - columns `ts`, `phase`, `decision`,
   `why`, `evidence`, `result`; the run's first row has phase `start`; log
   rows with its `scripts/log.sh` helper. `result` per unit: `done` /
   `blocked` / `partial`.
4. The run never straddles an unknown budget: cap each `subagent` workflow
   run at 3-5 units, then stop at the barrier and report. The user fires the
   next run.

On resume: read the checkpoint file, `git log`, and the tracker; diff against
reality; continue from the frontier. A fresh session must reach full working
state from repo state alone - never from chat history.

## Phases (single task)

1. **Intake** - router above; fetch issue context or clarify; state the
   definition of done as a falsifiable predicate before building.
2. **Ground** - read `GLOSSARY.md`/ADRs, repo rules, relevant docs; run the
   `codebase-memory` skill (if the repo has one) or a scout child (read-only,
   ≤4) for unfamiliar subsystems; scout report format per orchestration
   policy §5.
3. **Plan gate** - plan with file ownership per writer, shared seams to one
   owner or serial; red tests first if the user wants them. One-way door
   involved? → blast-radius fork before any code. Escalate unapproved
   product/scope/architecture choices to the user.
4. **Build** - worker children implement per the plan (S: one child; M: one
   per ticket in worktrees, only with the user's explicit permission).
   Each runs focused tests and reports changed
   files, commands, failures, remaining work. Principles apply inline:
   migrate callers and delete legacy in the same change, no floats for money,
   guards at boundaries, idempotent lifecycle operations.
5. **Verify** - prove it works on the real app. Backend default: start the
   stack, curl the real endpoints with real payloads, assert the response,
   check DB rows via psql, check worker/queue state. Frontend changes: headless
   Playwright drives the real UI; save screenshots to `tmp/` and read them
   back. Perf claims: benchmark-checklist wrapper before reporting any number.
6. **Review** - fresh read-only reviewer children, one lens each:
   `code-review` wrapper's two axes (standards + spec) plus the
   `interrogate` fork's adversarial pass; blast-radius fork on anything wide.
   Triage findings per orchestration policy §6; fixers get only the curated
   accepted list, max 2 review→fix rounds.
7. **Close** - parent final review (orchestration policy §8): full diff read,
   acceptance criteria met, evidence exact-head, no scratch in the repo.
   Then: tracker update if one exists, issue comment with a summary (never
   commit SHAs - reference work by issue number or distinctive subject),
   checkpoint `done` row. When the run surfaced repeat mistakes, suggest a
   retrospective via the vendored `retro` skill
   (`vendors/mattpocock/skills/engineering/retro/SKILL.md`) and the
   `correct` fork.

## Batch playbook (a file of work items)

1. Parse the list into work items.
2. Triage gate, one cheap child per item: honest ≤1hr re-estimate - anything
   bigger gets flagged back, never silently slipped; map file overlaps and
   dependencies.
3. Propose batches - independent items grouped so no two writers share files;
   show the plan, get one go-ahead.
4. Execute per batch: worker children in parallel within a batch, batches
   sequential; each item is a full S pass (build → verify → review-lite) and
   a checkpoint row.
5. Aggregate: done / not-done / why, per-item summary, check status, items
   that grew past the estimate.

## Sweep playbook (review range)

1. Scope: list the units (seam files, PR list, or diff range); checkpoint
   file says where to resume - "start from X" skips earlier units.
2. Cheap-first: one light triage pass ranks units by risk (size, one-way
   doors, shared seams); risky units get the full review (both `code-review`
   axes plus `interrogate` and `blast-radius`), the rest a lighter pass. Cap
   concurrency at 2-3 children.
3. Per unit: `code-review` wrapper's standards + spec axes as two parallel
   read-only children, plus cross-seam sweep (grep every caller of the unit's
   exports; check seams don't fight over shared models or duplicated logic).
4. Verify per batch of units: full lint/typecheck/test/build for the touched
   sides once per batch, not per unit.
5. Aggregate and dedupe: one root cause with five symptoms files as one
   finding. Show the findings table, get the user's go-ahead before filing.
6. File: one `gh issue create` per accepted finding - title, brief fix sketch
   (fix at the highest level that works: architecture > types > lint > test),
   triage label (`ready-for-agent` / `ready-for-human`). Long sweeps run
   under the `show-me-your-work` fork trail.

## Tracker-optional

GitHub issues are one intake, not a requirement. Feature description, local
markdown file, and review ranges are all first-class. Nothing is written to a
tracker unless the task itself is tracker-shaped or the user asks.

## Hand-back

End every run with: what changed, what was verified and how, what is blocked
or unproven, the checkpoint state, and the next ready unit if the queue
isn't drained.