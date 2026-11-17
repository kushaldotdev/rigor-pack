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
- Context ceilings: implementation `<n>k` (the first build plus its self-review; planners size tasks to it), review fix rounds `<n>k` (the same implementer keeps fixing review findings under it; past it, a fresh implementer), lens child `<n>k` (default ~150k; a self-review lens child gets later loops' deltas as follow-ups under it), long session `<n>k`
- Attempts per band: easy and medium `4` implementer rounds (build, fix 1, fix 2, a fresh implementer) and `2` takeover rounds, at most `6` L0 reviews; hard, critical or a high-risk area `3` (build, fix 1, a fresh implementer) and `2`, at most `5`; then park the task in gates <!-- pack defaults: rigor/CHAIN.md step 4.4 -->
- Parallel tasks: each in its own worktree, `<command>` from the ticket branch <!-- rigor/CHAIN.md step 4; a shared worktree only when the caps leave no choice -->
- Lanes: `1` <!-- or n: each lane its own L0 session on disjoint session-plan rows marked with its lane (rigor/CHAIN.md → Lanes) -->
- Solo band: `hard` <!-- or: critical, or none. A ticket at or above it runs alone in its own session -->
- Lens check: `<command that checks, from the implementer's session, that each lens child got its lens body; {band}, {kind}, {wt} and {repo} are filled by mkpacket.mjs>` <!-- or: none. The packet has the implementer run it right after launching the loop-1 lens children; L0 runs it again at the report -->
- Self-review lenses: `standards+spec always; blast-radius at medium; interrogate at hard and critical` <!-- the implementer's own review, run before L0's reviewers see the diff. mkpacket.mjs --band reads this line. standards+spec always runs. Each other lens is "<lens> at <band>[, <band>][ and <band>]", or "<lens> always". Lenses: blast-radius, interrogate. interrogate is the expensive one: each adversary works in its own worktree and proves its findings with real runs. Cheaper: interrogate at critical only; blast-radius at medium and hard. Drop a clause to skip that lens. Loop 1 runs every lens read-only over the whole range; later loops review only the fix delta, with standards+spec plus the lenses whose findings it fixes; only a hard or critical task that changes behaviour adds one probe child (blast radius and interrogate with real runs, time-boxed) on the final loop -->
- Review depth: a post-land delta over `<n>` lines is re-reviewed
- Architecture pass: every ticket of band medium and above, on its staged squash, inside the final axis-A review (and, for hard and critical, on the plan before approval); `arch` trail row; pass files `.audit/<slug>/arch/<id>[-plan].md`; landing gate `node .agents/skills/rigor/scripts/land-check.mjs --trail .audit/<slug>.tsv --ticket <id> --band <band>` (it runs arch-check on the pass file); planner and pass briefs `node .agents/skills/rigor/scripts/mkbrief.mjs --role planner|plan-review|landing ...` (planner: `--brief <project planner brief>`; landing: appended to the final axis-A reviewer's brief), pass files checked with `node .agents/skills/rigor/scripts/arch-check.mjs` <!-- pack default (rigor/CHAIN.md → Land, Planner, Plan review); keep it unless the owner drops it -->
- L0 heartbeat: every 15 minutes <!-- default -->, over every running agent of the lane (implementers, reviewers, planners); a progress line older than `<n>` minutes, or the same step on `<n>` lines in a row, is stuck; an agent silent 15+ minutes gets its activity read (rigor/CHAIN.md → The delegation adapter)
- L1/L2 wait slice: 10 minutes max <!-- default; never an unbounded wait -->
- Reviewer fallback: none <!-- or: a named model when the first is out of quota, and the availability record (a file every lane reads before every review launch) where a quota error's refill time is written -->
- Red/green: `<command that runs one test path, red on the base and green on the tip>`
- Mutation check: `<command>` <!-- or: none -->
- Full gate: `<command, run on the staged squash>`
- Out-of-fence pre-run: `<command that greps tests outside the fence for a changed public symbol and runs them>` <!-- rigor/CHAIN.md step 5, before staging -->
- Verify skill: `.agents/skills/verify-<app>/SKILL.md`<!-- or: none -->
- Packet project rules: `docs/agents/packet-rules.md` <!-- mkpacket.mjs reads this path; for another file, pass it as --project-rules -->
- Cleanup at landing: `<worktree, workspace, agents, branch, stage ref>`

### Models per role

| Role | Model | Thinking |
|---|---|---|
| L1 implementer, L2 worker | `<provider/model>` | `<level>` |
| L2 scout | `<provider/model>` | `<level>` |
| L2 reviewer | `<provider/model>` | `<level>` |
| L0 reviewers | `<provider/model>` | `<level>` |
| reviewer fallback | none | |
| planner | `<provider/model>` | `<level>` <!-- the strongest model: every planner, and the critical plan review --> |
| plan reviewer | `<provider/model>` | `<level>` <!-- hard tickets: the L1 implementer model; on REGRESSED, or disagreement with the plan on an owner or a seam, the review runs again on the planner role --> |
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

Each skill body looks up its role here by the exact name in the first column (for example `interrogate` reads `interrogate reviewers`), in its own harness's column. Keep the names as they are: a renamed or merged row is never found, and that body falls back to its default. A comma-separated value is a list; the body says how it uses it (one runner per entry, or a judge pool tried in order).

| Role | pi | Claude Code | Codex |
|---|---|---|---|
| feature, refactoring | inherit-parent | inherit-parent | inherit-parent |
| bug-fix | inherit-parent | inherit-parent | inherit-parent |
| perf-issue | inherit-parent | inherit-parent | inherit-parent |
| hillclimb | inherit-parent | inherit-parent | inherit-parent |
| judgment and prose | inherit-parent | inherit-parent | inherit-parent |
| hardest tasks | inherit-parent | inherit-parent | inherit-parent |
| how explorer | inherit-parent | inherit-parent | inherit-parent |
| how explainer | inherit-parent | inherit-parent | inherit-parent |
| why investigators | inherit-parent | inherit-parent | inherit-parent |
| why synthesizer | inherit-parent | inherit-parent | inherit-parent |
| reflect tooling | inherit-parent | inherit-parent | inherit-parent |
| reflect judgment, divergent, synthesizer | inherit-parent | inherit-parent | inherit-parent |
| arena runners | inherit-parent, inherit-parent | inherit-parent, inherit-parent | inherit-parent, inherit-parent |
| arena cross-judge pool | inherit-parent, inherit-parent | inherit-parent, inherit-parent | inherit-parent, inherit-parent |
| swarm workers | inherit-parent | inherit-parent | inherit-parent |
| architect runners | inherit-parent, inherit-parent | inherit-parent, inherit-parent | inherit-parent, inherit-parent |
| interrogate reviewers | inherit-parent, inherit-parent | inherit-parent, inherit-parent | inherit-parent, inherit-parent |

`inherit-parent` = no override configured; the child runs on the parent's model (omit the child's `model`). One family everywhere means reviews are "single-family".

Fast mode and `-fast` model variants are never used, for any role, even when a job is urgent.
