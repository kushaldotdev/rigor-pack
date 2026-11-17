# Chain runs

A chain is a recorded list of tickets that the owner hands over with "continue <slug>". You are **L0**: you run the tickets back to back, AFK, until a halt rule stops you or nothing unparked is left. One-off tasks never come here; they take the normal rigor routes.

Every setting (models per role, concurrency caps, attempt counts, context ceilings, push rule, reviewer fallback, check, gate and verify commands, the delegation tool) lives in `docs/agents/workflow.md` → Chain efforts. This file is the method. That section wins on any number or name. If it is missing, stop and ask for `setup` (chain section).

## The chain's files

| File | Holds |
|---|---|
| `.audit/<slug>.brief.md` | Goal, done predicate, scope, doors, gates, and the three §5 Resume answers pre-recorded, so resuming asks nothing |
| `.audit/<slug>.preferences.md` | Standing orders, pasted verbatim into every implementer packet |
| `.audit/<slug>.tsv` | Trail: one row per landing, park, architecture pass (`arch`), session start, close, pause and next |
| `.audit/<slug>.gates.md` | Parked questions and plans, each with the default taken; owner answers land here |
| `.audit/<slug>.handoff.md` | Where the last session stopped, open work, owner decisions, process lessons |
| `.audit/<slug>.classes.md` | Class ledger: one line per act-on review class, `- <class> \| <ticket> <task> r<round> \| <the fix shape that closed it>`. L0 appends at each act-on verdict; `mkpacket.mjs` pastes the most frequent classes into every packet |
| `.audit/<slug>/ORDER.md` | Run order. `DECISIONS.md` holds binding owner answers (never re-ask) |
| Tracker map | A parent ticket whose children are the tickets (`docs/agents/issue-tracker.md`). Each ticket carries its tasks and, per task, the fence ("You may change" / "Do not touch"), the ORACLE (The implementer packet), the required test and "Stop and ask L0 if" lines |

**Bookkeeping commits on main, at milestones only.** Worktrees commit freely. The main checkout gets a bookkeeping commit (trail, handoff, gates, ledger) only at a milestone: session start, a task accepted, a ticket landed or closed, an owner question parked, a session pause or close. Trail rows are still written to the file as they happen and ride the next milestone's commit. At a milestone, when this lane's last bookkeeping commit is still main's tip and not on the remote (`git log origin/main..main` lists it), amend it instead of adding one. Landings stay one squash commit per ticket.

**Setting up a new chain:** write the brief and preferences in the rigor interview, file one tracker issue per ticket (`triage`, `writing`) nested under the map, and record the order in `ORDER.md`.

## Session start

1. If `.audit/<slug>.stop` (or this lane's stop file, Lanes) exists, do nothing; reply with the resume prompt.
2. Read the brief, preferences, handoff, the trail's last rows and `gates.md`. Record the brief's resume answers as the `start` row. A successor's briefing names its scope; when that scope is a solo ticket, it is that ticket alone.
3. List the map's open children (per `docs/agents/issue-tracker.md`) and check each against `ORDER.md`. A ticket missing from the order is still work.
4. Clean up leftovers from tickets that already landed (worktrees, workspaces, agents).
5. Start the watch heartbeat before the first delegation (The delegation adapter).
6. First reply: one sentence on what is done so far and what is next.

## Roles

| Level | Does | Never |
|---|---|---|
| L0, the lead session | Picks, briefs, reruns proof, reviews, decides, lands one squash commit per ticket, does every tracker action | Implements, investigates or hands its own decision to someone else |
| L1, one implementer agent per task | Owns one task: does it or delegates to L2, self-reviews, commits on the ticket branch, reports the range | Push, touch the main branch or the tracker, leave the fence |
| L2, the implementer's children (when its harness has them) | worker: red test, then fix. scout: read-only, only for unclear scope. reviewer: read-only, every round | Same as L1 |

## The loop for one ticket

1. **Pick** the first open, unblocked, unparked ticket in order; an approved hard or critical ticket goes first. Finish every opened ticket before starting a new one. Keep one hard or critical ticket in flight at a time. Before briefing, re-check the ticket's premise and scope against main.

   A ticket at or above the solo band (`docs/agents/workflow.md` → Chain efforts, default hard) runs alone, in a fresh session. If this session has already landed or opened work, it does not start the solo ticket: it finishes what is in flight, runs Session end, and hands over to a successor whose scope is that ticket alone. With self-continuing off, it pauses with the resume prompt naming that ticket. A session that runs a solo ticket closes and hands over right after landing it, and picks nothing else. A solo ticket parked on plan approval blocks nothing: the rule covers implementing the ticket, so while it is parked easy and medium work still runs. Easy and medium tickets still share sessions.
2. **Halt check** by band (`docs/agents/difficulty.md`):

   | Band | Rule |
   |---|---|
   | easy | Just do it |
   | medium | Post a short plan comment, then go on |
   | hard | A planner posts the plan; park until it is approved (the approval mode is in workflow.md) |
   | critical | As hard, and L0 reads every line of every commit |

   Parking adds a `gates.md` row and parks every ticket blocked by it or touching its files. Then go back to step 1. When only plan approvals are parked, run `grilling` with the owner, one parked plan at a time, critical first.
3. **Branch:** one worktree per ticket on `fix/<id>`, made the way workflow.md says.
4. **Per task, parallel by default.** The plan gives each task a `Depends on` list and a fence. Start every task whose dependencies are merged and whose fence is disjoint from every running task's, within the caps, each in its own worktree on `fix/<id>-<task>` branched from the ticket branch's tip (its task base). Merge accepted task branches into `fix/<id>` in plan order. Share a worktree only when the caps leave no choice (Delegation discipline 6).
   1. **Brief** L1 with the packet (below) and only its own task block. Mark its size: "small change: you edit" or "delegate". The block carries its ORACLE, and an "Earlier reviews found" line: the class of every act-on finding this ticket's earlier tasks drew, so the same finding is not paid for twice. Send a new class to sibling tasks that are still running, too. The chain's most frequent classes across tickets come from the class ledger, which `mkpacket.mjs` pastes in itself.
   2. **Check the report, not the summary.** Rerun red on the task base and green on L1's last commit yourself, with the red/green command from workflow.md. Read the self-review file and run `scripts/review-file.mjs` on it; send the report back if it exits 1 (a lens section, the probe or the ARCHITECTURE block missing). Run the project's lens check too (workflow.md → Lens check, when it names one); a failing row sends the report back. The implementer ran both before reporting (packet rule 6), so a failure here is a skipped step, not a format slip. Count the L1's child calls when the task said "delegate" (`scripts/pi-delegation.mjs --for <worktree>` for a pi implementer); a delegate task with no worker call goes back. A "pre-existing failure" counts only with a log from main.
   3. **Review**, sized by the table below. Before every review launch, not once per session, read the project's reviewer-availability record (workflow.md → reviewer fallback): while it holds a refill time still ahead, launch on the fallback. Then review on `<task base>..<last commit>`, following [code-review](../code-review/SKILL.md). Size the first review by the task's own band (scored alone): reviewers A and B for a hard or critical task, for a task in a high-risk area (one `difficulty.md` scores in its top bands, such as an order or money path) at any band, and for a medium task that changes behaviour; reviewer A alone, covering both axes, for a medium refactor or docs task and for an easy task. While the availability record shows a reviewer's quota tight or a refill time ahead, a medium task gets A alone. Every delta review is one reviewer, both axes. Reviewer A covers standards; reviewer B, spec and blast radius (other callers, error paths, rollback, what the fix newly lets through). Give each reviewer the task's ORACLE, and ask it to follow every consumer of a value, default or rule the task moves, in whatever module it lives: a blocker hides in the shared module no task owns. Sort every finding into act on / consider / noted / dismissed, with a reason, after checking it against main, and name each act-on finding's class. Accept only when "act on" is empty. Record the verdict in the trail: the round number, the counts, each act-on finding's class, and `repeat` beside a class an earlier round of this task already drew. Append one line per act-on class to the class ledger (The chain's files); fill its fix shape once a round closes it.
   4. **Attempts,** by band, from workflow.md → Attempts per band (these are the defaults). A round is the build or one fix round, each ending in L0's review (step 4.3):

      | Band | Implementer rounds | Takeover rounds | Most L0 reviews | Then |
      |---|---|---|---|---|
      | easy, medium | 4: build, fix 1, fix 2, a fresh implementer | 2 | 6 | park the task for the owner in `gates.md` |
      | hard, critical, or any task in a high-risk area | 3: build, fix 1, a fresh implementer | 2 | 5 | park the task |

      Every re-brief says why the last attempt failed. Fix rounds go to **the same implementer** while it is under its fix-round context ceiling. A parked task waits for the owner with the conservative default recorded; work it does not block goes on. Critical keeps L0's every-line read (step 2).
      - **Context budget.** workflow.md sets two implementer ceilings: one for the implementation (the first build and its self-review; the planner sizes tasks to it) and one for review fix rounds, which may be higher. Before every fix round, read the implementer's context size through the adapter. At or past the fix-round ceiling, send the round to a fresh implementer on the same model, not a ladder rung: L0 writes `<wt>/tmp/state-<ticket>-<task>.md` (task base..tip diff stat, what is done, the open findings with their classes, the review file paths) and briefs it with the packet plus that file.
      - **Open at cap.** A self-review that reached the loop cap lists its unfixed findings under `## Open at cap`. L0's review (step 4.3) rules each one: a nit waits (handoff), a should-fix or blocking item is an act-on finding of that round, fixed by the normal fix round and counted against the attempts; its class returning after that round is a repeat (the ladder). An open item that is a behaviour bug in a high-risk area goes to the takeover role at once.
      - **A fix round's self-review is one loop, aimed at the finding's class.** The implementer fixes the class and sweeps the whole task range for it, fixed everywhere and not only where the reviewer pointed, then runs the checks and tests; no lens runs again in full (packet rule 12, `templates/self-review.txt` → A fix round after a review). The first build keeps the full self-review. L0's delta review (step 4.3) follows as before.
      - **Fix the class, not the case.** A re-brief names the class each finding belongs to and asks for every site or input shape of it, all fixed, pinned by one test over the whole list (packet rule 12). The delta reviewer checks the list is complete before it looks for anything new.
      - **On the first repeat** (an act-on finding in a class an earlier round of this task fixed), stop plain fix rounds, whatever the round count says. Before the next round L0 writes (a) a **scope ruling**: which shapes of the class are in scope, and which unbounded ones (a guard on an arbitrary predicate) are nits; and (b) the ORACLE restated as input shapes × caller configurations, crossed in full; and (c) a **mutant table**: one deliberate mutant per condition or branch of the guard or rule in scope, each turned red by a test or ruled equivalent with the reason. Together they are the structural brief, and the next round is rung 1. A later finding the ruling calls a nit is recorded as one, not as a repeat.
      - **A test-only repeat is a nit.** When the repeating class is test-only and the reviewer states there is no production defect, L0 rules it a nit and files a follow-up ticket; it does not climb the ladder. A test gap over behaviour in a high-risk area still climbs.
      - **Escalation ladder,** cheapest first: plain fix rounds to the same implementer; then (1) a **fresh** implementer on the same model with the structural brief (the scope ruling, the crossed ORACLE, the mutant table, the property to hold over it and the test that proves it); then (2) the takeover role, for at most its takeover rounds; then park. Early moves, whatever the count says: a class that returns goes to rung 1 at once; rung 1's round drawing the class again, or the implementer rounds used up, goes to the takeover; an implementer at its context ceiling in a high-risk task goes to the takeover at once.
      - **State the failing case and the constraint; never prescribe the design.** A re-brief that dictates the fix makes L0 the author, and its design skips the implementer's own review. If only one design can work, that is a plan change: record it in the ticket and say so.
   5. **Takeover** (the ladder's last rung, or `context ceiling`, `beyond the model`, `owner`): record its reason in the trail in one word or two (`same class twice`, `attempts used`, …) and the rungs already climbed. Then the takeover role from workflow.md, briefed with a `mkpacket.mjs --role takeover` packet (no delegation, the in-turn wait kept), every rejected attempt, every review and the failure pattern. Review its commit like any other.
   6. Small leftovers from a review (a one-line doc or comment fix) ride the next packet.
5. **Land:** once every task's review verdict is accepted and no fix round is open, run the out-of-fence pre-run: for each public symbol the ticket changes, grep the tests outside its fence that name it, and run those test files through the project's chain runner (workflow.md → Out-of-fence pre-run). A failure is a finding of the task that changed the symbol, fixed before staging. Then build the staged squash (Git recipes). Run the full gate on it, the ticket's one full-suite run; never start a gate on a tip a review may still change. Run the verify skill on it for user-visible changes.
   - **Architecture pass** (medium and above, unprompted): no separate agent. It rides the final axis-A review of the staged squash: that reviewer's brief gets the `scripts/mkbrief.mjs --role landing --diff main..<stage>` text appended, which quotes [codebase-design](../codebase-design/references/matt/codebase-design/codebase-design.md) and the Explore step of [improve-codebase-architecture](references/matt/improve-codebase-architecture/improve-codebase-architecture.md); never point at the skill files instead. The reviewer writes the pass file (see Pass files) beside its review; `scripts/arch-check.mjs --role landing` must exit 0 on it before L0 reads the verdict (exit 1 sends it back to the same reviewer). Record an `arch` trail row: phase `arch`, decision `#<id> <verdict>` with the verdict `SOUND`, `SOUND WITH FOLLOW-UPS` or `REGRESSED`, evidence the pass file path. A finding this ticket caused is should-fix before landing: fix it (a new stage), re-run the review with the pass, add a new row. A finding that predates the ticket is filed as a ticket of its own.
   - **Gate:** `node .agents/skills/rigor/scripts/land-check.mjs --trail .audit/<slug>.tsv --ticket <id> --band <band>`. It also runs `arch-check.mjs --role landing` on the row's pass file. Never land past exit 1.

   Then `git merge --squash fix/<id>` and commit with the template. Land only the tree the gate ran on: any fold after the gate means a new stage, and at least the check commands (lint, format, types) again on it; a fold that can change behaviour means the full gate again. Diff main against the stage before closing.
6. **Close:** resolution comment, tick the boxes, close the ticket, add a line to the map's decisions, all per `docs/agents/issue-tracker.md`. Clean up the ticket's worktree, workspace, agents, branch and stage ref.
7. **Continue.** Hand back only on a halt rule, an owner question, or no unparked work.

**Review depth.** Ask of every diff: can it change behaviour in a risky area (the areas `difficulty.md` scores in its top bands)?

| Change | Review |
|---|---|
| First implementation, easy or medium ticket | L0 reads the diff ("is it off?"); reviewers sized by step 4.3. Two easy tickets with disjoint files may share one reviewer |
| First implementation, hard or critical ticket | L0 line-by-line read; reviewers sized by step 4.3. A and B review the same tip, at the same time when workflow.md's caps allow two, one after the other when they do not; the fix round waits for both verdicts and takes both lists, so one round and one delta review answer both |
| A fix round | Delta-only re-review of `<previous tip>..<new tip>` by one reviewer, both axes: is each finding fixed, and what does the fix newly let through |
| L0's own edit after "land": docs, comments, types, a test name | No re-review; name it in the resolution comment |
| A behaviour change after "land", a delta in a risky area, or a diff over the line count workflow.md sets | Delta-only re-review |

## Delegation discipline

1. **Proof, not summary.** A report points at its proof and is never the proof (step 4.2).
2. **One task per implementer.** A short packet with its own fence.
3. **The implementer delegates by size; L0 checks it did.** Waste-sized work (one or two files, or shorter than a child's brief) the L1 does itself. Everything else goes to a worker plus a fresh reviewer per round, within the review->fix loop cap in packet rule 5 (`templates/packet-rules.txt`). That cap bounds one round inside the L1; the rounds per band (step 4.4) bound L0's re-briefs.
4. **The implementer reviews its own work first** (packet rule 6), into `<wt>/tmp/cr-<ticket>-<task>.md`, act-on findings fixed. L0 rejects a report without that file.
5. **The full suite runs once per ticket, on the staged squash** (the gate), at every band. Implementers and their children run targeted tests and the cheap gate checks only, unless a task line asks for it, and then only on a commit whose self-review act-on list is empty: a suite on a superseded commit holds the host while the real one waits. The cheap gate checks (`docs/agents/packet-rules.md` → Check commands) run before hand-back at every band.
6. **Shared-worktree writers keep to their own paths:** lint, format and fix commands on their own files only, commits with `git commit -- <paths>`. Never amend or rewrite history. Delete only your own scratch. L0 names the other writer in both packets.
7. **L0 orchestrates; implementers work.** Investigation, code, tests and prose go to an implementer or scout.

## The delegation adapter

Every delegation operation goes through the adapter this repo names: `delegation/<tool>.md`, where workflow.md → Chain efforts names the tool. [delegation/README.md](delegation/README.md) lists the operations; the adapter maps each to that tool's calls. Never shell out to another harness's CLI.

- Create or reuse one workspace per ticket worktree, so the agent starts in its worktree.
- Spawn every implementer through the adapter, with the provider, model and thinking level workflow.md gives its role, a title naming the ticket and task, labels (`effort`, `ticket`) and the packet as its first prompt.
- Send every re-brief and fix round through the adapter to the same agent id, so it keeps its history.
- Check running implementers and open worktrees against the caps before every new agent **and** every follow-up prompt.
- While any agent of this lane runs, a heartbeat to self, at the L0 heartbeat interval workflow.md sets (default 15 minutes), covers every one of them: implementers, reviewers, planners, plan reviewers, takeovers, verify drivers. It reads each `<wt>/tmp/l1-progress.log` and posts one line per agent: step, next, OK or stuck. Stuck means the newest line is past workflow.md's staleness window, or the same step repeats the number of times it names. An agent with no activity for 15 minutes or more (an agent with no progress log is judged by its activity alone) gets its activity read through the adapter, and then:
  - **A quota or usage error:** archive it, record the reviewer's unavailability and its refill time by the project's rule (workflow.md → reviewer fallback), and relaunch the same brief on the fallback now. A role with no fallback is ⏸ blocked: quota (below).
  - **Silent, no error:** one nudge, a follow-up through the adapter. Still no activity at the next tick: relaunch the same brief, on the fallback when the primary is suspected out of quota.
  Never wait out a silent agent past two ticks. Delete the heartbeat at session end.
- An L1, and any L2 that has children of its own, never ends its turn while a child runs. It waits in bounded slices of at most the L1/L2 wait slice workflow.md sets (default 10 minutes), by the loop in packet rule 5; the harness notes name the wait call.
- A lost finish notification is recovered from the agent's activity, through the adapter. After a reboot or a harness restart, do not wait to be told: list every agent and in-session child this session started, judge each by its transcript's last write (the harness notes say where), re-prompt the live agents through the adapter, relaunch a dead child from its brief, and rerun any suite that died. Log the restart in the trail.
- Start a fresh implementer past its context ceiling (step 4.4), after a wrong premise, or for an unrelated ticket. Archive each agent through the adapter once its task is accepted, and archive the ticket's workspace and its leftovers at landing.
- Short-lived reviewers are disposable. Each gets a narrow brief and writes its result to `tmp/` (a pass file goes where Pass files says). A delta review is a fresh reviewer briefed with the previous review file. Long work (planner, takeover, verify driver) runs as a full agent session through the adapter, never a short-cache subagent; see the harness notes. An author never reviews its own code. Every brief repeats "never read any .env file".
- **Planner** (hard, critical): one background, read-only agent on the planner role, with no sub-agents. It re-checks each premise against main by symbol, writes per task the approach, the files, the first red test, the risks, the ORACLE and the ARCHITECTURE section (below), and asks only questions that change product behaviour. It keeps a ticket to about 4-5 tasks (more means split the ticket), sizes each task to fit one implementer's context budget (step 4.4), scores each task's own hardness, gives each task its `Depends on` list and fence (step 4), and writes the ORACLE of a contract as input shapes × caller configurations from the start. Its brief is built with `scripts/mkbrief.mjs --role planner` from the project's planner brief: step 1 quotes the architecture method and has the planner run the pass, unattended, into a pass file before it reads code for the plan; the plan's ARCHITECTURE section cites that file. A brief that only points at the skill files is not a planner brief. When the planner reports, L0 runs `scripts/arch-check.mjs --role planner --arch <pass file> --plan <plan file>`; exit 1 sends the plan back. It posts the plan as a ticket comment headed `## Plan (awaiting approval)` and replies with the URL only.
- **Plan review** (hard, critical), before approval: one read-only agent briefed with `mkbrief.mjs --role plan-review`. It writes its own pass from the code before it opens the plan, then compares, so it judges the plan instead of confirming it; `arch-check.mjs --role plan-review` must pass on its file. Critical: on the planner role. Hard: on the plan-review role workflow.md names (default the L1 implementer model); when its verdict is `REGRESSED` or its Plan comparison disagrees with the plan on an owner or a seam, run the review again on the planner role, and that verdict stands. L0 records each review as an `arch` row with decision `#<id> plan <verdict>`; the landing gate ignores plan rows.
- **Pass files** go where workflow.md → Chain efforts says (default `.audit/<slug>/arch/<id>[-plan].md`: `<id>.md` for the landing pass, `<id>-plan.md` for the planner's, `<id>-plan-review.md` for its review). They are committed with the trail, never left in `tmp/`.
- **Quota.** A model out of quota stops its work; never finish it on another model. Mark it ⏸ blocked: quota, record it in the handoff, resume on the same model. workflow.md may name a reviewer fallback; no other role has one. A reviewer out of quota goes to that fallback at once (the heartbeat above), and its refill time goes into the project's availability record, which every lane reads before every review launch (step 4.3).
- **No adapter.** With no delegation tool for this repo, do the work in-session, serially, and log `degraded: no delegation tool` in the trail.

## Talking to the owner

- Ask only what changes behaviour for users or operators versus today, in the grilling format, worded so "yes" accepts. Order, sequencing and implementation are L0's.
- Unattended: never ask in chat. Add a `gates.md` row with the conservative default taken and keep going.
- Every ticket table shows each ticket's band. Close every session with the progress table: closed so far, touched this session, the next three.
- Close every session with three counts per task, taken from the trail, so the chain's own rules can be judged: review rounds until accepted, classes that repeated, and the takeover reason if there was one. A project that keeps an effort ledger puts them there.

## Session end

Autosquash fixups, rewrite the handoff, add the trail row, commit both on main, run the cleanup workflow.md lists, delete the heartbeat, clear root `tmp/` (with lanes, only this lane's scratch), archive every implementer workspace. Then self-continue or pause.

## Self-continuing sessions

Only when workflow.md enables it. The closing session starts a successor as a **new top-level session** through the adapter (the start call is in workflow.md) only if all of these hold:
1. Session-end steps are done.
2. No stop is recorded: no `.audit/<slug>.stop`, no owner "stop" this session, no hold in the handoff.
3. The next session has runnable work: approved plans for its hard tickets, or unblocked easy and medium work. When its session plan row is a solo ticket, that row holds only that ticket.
4. The done predicate is still false.
5. No other session of this chain is running: list the running sessions by label through the adapter and find none but this one.
6. No model the chain needs is out of quota (a reviewer with a named fallback excepted).

Run check 2 again as the last step before the start call: a stop that arrives during Session end still counts. If any check fails, pause: write the reason as the handoff's first line and a `pause` trail row, list waiting plans with their questions, and end with the resume prompt. Record the successor's id in a `next` trail row. A stop that arrives after the successor started is passed on at once: create the stop file and tell the successor through the adapter; it stops at Session start step 1, or finishes its in-flight ticket and pauses.

The successor's briefing is self-contained: start session <n+1> of <slug> with rigor by CHAIN.md, read order (handoff, brief, preferences, gates, trail tail, session plan row), scope with bands and approvals (and its lane, with lanes), "unattended: never ask in chat, park in gates.md", and "at the end, continue or pause by these checks".

The owner stops it by saying "stop" (finish in-flight tickets, then pause) or by creating `.audit/<slug>.stop`.

## Lanes

Opt-in: `Lanes: <n>` in workflow.md → Chain efforts (default 1: this section does not apply).

- **A lane** is its own top-level L0 session line on a disjoint set of session-plan rows, each marked with its lane, whose areas and files do not overlap. The owner may pre-assign rows to a lane in the session plan; only that lane takes them. A row marked for the next free lane goes to the first lane with none left, after two guards:
  1. **Overlap check.** Compare the row's expected files with every open worktree of the other lane (`git diff --name-only <base>...<branch>`) and with the files of the row it has claimed. On any overlap, take the next free row or wait for that ticket to land.
  2. **Claim commit.** Claim the row by committing its lane mark in the session plan, under the main-checkout lock, before starting it. The claim is the last guard: a row another lane's commit already marks is not yours.
- **Own files.** Each lane writes only `.audit/<slug>.lane-<x>.{handoff.md,tsv,gates.md}` and its own effort ledger; the files from before the split stay as history every lane reads. One trail per lane, not one TSV with a lane column: the lanes share the main checkout, so a by-path commit of a shared file would sweep in the other lane's uncommitted row. The class ledger is the one file every lane writes: append to it under the main-checkout lock (below), never rewrite another lane's lines. A lane never edits another lane's files, worktrees or agents.
- **Main checkout.** Every write there (a landing, a trail or handoff commit, a row claim) runs under `flock "$(git rev-parse --git-common-dir)/<slug>-main.lock"` and commits by path. No session-end autosquash while another lane runs: it rewrites main under that lane.
- **Shared limits.** The caps count every lane's agents (list them by the `effort` label). Full gates queue through the project's suite lock. Lanes spread agents across the providers workflow.md lists for a role.
- **Landing second.** If main moved since a lane's gate started, that lane rebuilds its stage on the new main and runs the gate again.
- **Start and stop.** The owner starts each lane's first session; after that each lane's closing session starts its own successor (labels `effort`, `session`, `lane`; check 5 looks only for a running session of that lane). Closing a session closes only its own lane: its heartbeat, worktrees, agents and scratch. `.audit/<slug>.stop` stops every lane, `.audit/<slug>.lane-<x>.stop` one. A lane with no rows left closes without a successor.

## Git recipes

- **Staged squash:** `stage=$(git commit-tree $(git merge-tree --write-tree main fix/<id>) -p main -m stage)`, then `git update-ref refs/l0/stage<n> $stage`. `git diff --stat main $stage` must show only the ticket's files.
- **Stacked stage:** `git merge-tree --write-tree <stage1> <branch2>` with the automatic merge base. Never `--merge-base main`: it reverts main's newest commit inside the stage.
- **Two tickets with disjoint files:** squash one, `git checkout <branch> -- <files>` for the other, verify the combined tree, then commit each ticket's files on its own. Diff each commit against its stage.
- **Fixups on main:** commit with explicit paths, never `git commit -a`. At session end, autosquash on a scratch branch with `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash -X ours <first>^`. Keep a `pre-autosquash` ref, diff against main, then move main.

## Templates

Squash commit (match `git log --grep='#<id>'`):

```text
<type>(<scope>): <imperative summary of the whole ticket> #<id>

- <Verb> <what changed and why, task 1>
- Pin <the behaviour> with `<test name>`.
- Record <the invariant / doc fix> in `<doc>`.

Refs #<id>
```

Resolution comment (posted before closing):

```markdown
## Fixed
- <task id>: <what changed>, test `<test name>` (red before, green after)
## Verification
- Checks: <commands> pass
- App: <verify evidence path, or "not user-visible">
## Commits
- <the squash subject> (on main)
## Notes
- <takeover, L0 folds, follow-ups filed, or "none">
```

## The implementer packet

Build one packet per task with `scripts/mkpacket.mjs`, passing `--task-id <task id>` (`T1`, `T2`, …; default `T1`) so each task gets its own self-review file, and `--band <ticket band>` so packet rule 6 names the self-review lenses that band requires (`Self-review lenses` in workflow.md → Chain efforts; without `--band`, standards and spec only). Pass `--kind assessment` for a task whose product is an outcome, a report or a doc of claims rather than code: it adds the interrogate lens whatever the band and changes nothing else the band drives (default `--kind code`). Pass `--deliverables <a,b>` with the files such a task names (its outcome file): rule 6 puts each in the self-review, committed or not, and each lens brief names them. Rule 6 carries one filled child brief per required lens, naming its body path, and the commands that keep the self-review's form right by construction: `scripts/lens-brief.mjs` writes each child's brief file from the packet (a delta brief for later loops and fix rounds, each still naming the body), `scripts/review-file.mjs --init` writes the self-review file's headings and ARCHITECTURE block, the project's lens check (workflow.md → Lens check, filled in by `mkpacket.mjs`) runs right after the loop-1 children launch, and `review-file.mjs` runs before the report, which goes out only on exit 0. The method is `templates/self-review.txt`. Loop 1 runs every lens as a read-only reviewer over the whole range, in parallel (standards + spec may start once the code is committed); each later loop reviews only the fix commits since the previous one, with standards + spec plus each lens whose finding they fix, sent to the same lens child while it is under the lens-child ceiling workflow.md sets. A hard or critical task that changes behaviour also gets one probe, once, on the final loop: a child that can run commands, did not write the task's code, and runs blast radius and interrogate attacks in a throwaway copy, within the limits in `templates/self-review.txt` (15 minutes, 5 attacks from the ORACLE, targeted tests only). Pass `--change refactor` for a task that keeps behaviour: it gets no probe. `mkpacket.mjs` exits 2 when `--base` is not the branch tip or an ancestor of it in `--wt`, so take the base from the branch tip right before building the packet. The self-review comes first: L0's reviewers (step 4.3) see the diff only after its act-on list is empty. The packet holds the task block, then the preferences, then the pack's generic rules (`templates/packet-rules.txt`), then the project rules file `docs/agents/packet-rules.md`. The implementer starts with no project instructions, so the packet carries everything, with absolute paths.

**The ORACLE.** Every task block has a section starting `ORACLE`: what right looks like, written so a test can check it. `mkpacket.mjs` exits 2 without one. By kind of work:

| Work | The ORACLE holds |
|---|---|
| Behaviour-preserving move, a new source for an old value, a parser or resolver replaced | A "today's behaviour" table: one row per input shape (missing, null, empty, wrong type, string-for-number, out of range, the normal case), each with what main does today as its writer reads the code. The implementer's red test is differential: it records every row from a run on the base, and reports a row whose run disagrees with the table instead of picking one |
| A contract: what commits, what a guard holds, who owns a value | Input shapes × caller configurations, crossed in full, one row per pair, and the unbounded shapes that are out of scope |
| A guard, scan or validator | The class it must stop, then every input form of that class you can list, and the forms it must let through. Its reach is stated in its own docstring only (packet rule 13) |
| New behaviour | One observable scenario with concrete values: the seed, the call, the expected result |
| An assessment or a doc of claims | The claims to settle, each with the run that would settle it |
| Docs, comments, renames | `ORACLE: none`, with the reason |

**The ARCHITECTURE section.** A hard or critical task block also has a section starting `ARCHITECTURE`: each module the task adds or changes, named, with its deletion-test result, or `ARCHITECTURE: none` with the reason; `mkpacket.mjs` exits 2 without it. The packet inlines the project's `## Architecture rules` section from `docs/agents/packet-rules.md` as ARCHITECTURE RULES, expanding each `INLINE: <path>#<Heading>` line into that section of the skill file that owns it ([codebase-design](../codebase-design/references/matt/codebase-design/codebase-design.md), [improve-codebase-architecture](references/matt/improve-codebase-architecture/improve-codebase-architecture.md)), so the checklist has one owner and no one has to open another file for it, and rule 6 makes the standards lens end with a fixed ARCHITECTURE block. `scripts/review-file.mjs --packet <packet> <self-review file>` checks the self-review file has every lens, the probe when one was due, and that block, filled (step 4.2).

The ORACLE is text in the task block, not an agent. The planner role writes it with the plan; for easy and medium tickets L0 writes it while re-checking the premise. The implementer turns it into tests, and reviewers judge the work against it.

The packet names the ticket, the worktree, the branch and the task base, marks the task's size ("small change: you edit" or "delegate"), and repeats the fence, red-first, commit and report rules. A `delegate` task whose session shows no worker call goes back to the same implementer (step 4.2).

## Gotchas

- Never trust a report. Implementers call failures "pre-existing" without proof, assert behaviour they never read, and end their turn while a child still runs.
- Watch implementer permission prompts. Block `git checkout <base> -- file` or `git restore` over uncommitted work, and any copy of the worktree that carries secrets.
- Answer a fence question precisely: widen by exactly the file, and state the rule.
- Implementers go quiet while debugging; the progress log is the cure.
- Two full suites at once collide. Run L0 reruns one at a time.
- `cmd | tail -1 && git commit` commits through a failure, because the pipe's status is `tail`'s. Use `set -o pipefail`.
- `cmd && nohup … &` backgrounds the whole chain. Build and start in separate calls. A background timeout caps the whole run.
- Check every scripted code edit with a diff.
- A red rerun that errors at collection hides the other reds.
- When editing a table row by string replace, match the row key.
- A fix that removes a silent failure exposes the path behind it. Always re-review a fix round's delta.
- A fix written to satisfy a metric (a coverage floor, a lint count) can bless the bug: read what the new test asserts, not only that the number moved.
- Run a multi-task ticket's reviews in parallel with the next task's implementation.
