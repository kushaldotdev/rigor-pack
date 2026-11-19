# Chain runs

A chain is a recorded list of tickets the owner hands over with "continue <slug>". You are **L0**: you run them back to back, AFK, until a halt rule stops you or no unparked work is left. One-off tasks never come here; they take the normal rigor routes.

Every setting (models per role, caps, attempts, context ceilings, push rule, reviewer fallback, check, gate and verify commands, the delegation tool) lives in `docs/agents/workflow.md` → Chain efforts. This file is the method; that section wins on any number or name. Missing, stop and ask for `setup` (chain section).

## The chain's files

| File | Holds |
|---|---|
| `.audit/<slug>.brief.md` | Goal, done predicate, scope, doors, gates, and the three §5 Resume answers, pre-recorded so a resume asks nothing |
| `.audit/<slug>.preferences.md` | Standing orders, pasted verbatim into every implementer packet |
| `.audit/<slug>.tsv` | Trail: one row per landing, park, architecture pass (`arch`), session start, close, pause and next |
| `.audit/<slug>.gates.md` | Parked questions and plans with the default taken; owner answers land here |
| `.audit/<slug>.handoff.md` | Where the last session stopped, open work, owner decisions, process lessons |
| `.audit/<slug>.classes.md` | Class ledger: one line per act-on review class, `- <class> \| <ticket> <task> r<round> \| <the fix shape that closed it>`, appended by L0 at each act-on verdict; its fix-shape cell names the fix, never a ruling (a ruling is a scope decision, not a fix). `mkpacket.mjs` normalises the names before counting (case, spacing, punctuation; plus `.audit/<slug>.class-aliases`, one `alias => canonical` line per alias), counts a ticket and class once, and pastes the most frequent classes into every packet |
| `.audit/<slug>/ORDER.md` | Run order. `DECISIONS.md` holds binding owner answers (never re-ask) |
| Tracker map | A parent ticket whose children are the tickets (`docs/agents/issue-tracker.md`). Per task: the fence ("You may change" / "Do not touch"), the ORACLE (The implementer packet), the required test, the "Stop and ask L0 if" lines |

**Bookkeeping commits on main, at milestones only.** Worktrees commit freely; main gets a bookkeeping commit (trail, handoff, gates, ledger) only at a milestone: session start, a task accepted, a ticket landed or closed, an owner question parked, a pause, a close. Trail rows are still written to the file as they happen and ride the next milestone's commit. At a milestone, when this lane's last bookkeeping commit is still main's tip, not on the remote (`git log origin/main..main` lists it), and no open ticket branch is based on it (`git branch --contains HEAD` lists only main), amend it instead of adding one; when a branch is based on it, add a new commit. A session start or close commit is never amended. A landing is one squash commit per ticket.

**Setting up a new chain:** write the brief and preferences in the rigor interview, file one tracker issue per ticket (`triage`, `writing`) under the map, and record the order in `ORDER.md`.

## Session start

1. `.audit/<slug>.stop` exists (or this lane's stop file, Lanes): do nothing; reply with the resume prompt.
2. Read the brief, preferences, handoff, the trail's last rows and `gates.md`. Record the brief's resume answers as the `start` row. A successor's briefing names its scope; a solo ticket's scope is that ticket alone.
3. List the map's open children (`docs/agents/issue-tracker.md`) and check each against `ORDER.md`. A ticket missing from the order is still work.
4. Clean up leftovers from landed tickets (worktrees, workspaces, agents).
5. Start the watch heartbeat before the first delegation (The delegation adapter).
6. First reply: one sentence on what is done and what is next.

## Roles

| Level | Does | Never |
|---|---|---|
| L0, the lead session | Picks, briefs, reruns proof, reviews, decides, lands one squash commit per ticket, does every tracker action | Implements, investigates, or hands its own decision to someone else |
| L1, one implementer agent per task | Owns one task: does it or delegates to L2, self-reviews, commits on the ticket branch, reports the range | Push, touch the main branch or the tracker, leave the fence |
| L2, the implementer's children (when its harness has them) | worker: red test, then fix. scout: read-only, unclear scope only. reviewer: read-only, every round | Same as L1 |

## The loop for one ticket

1. **Pick** the first open, unblocked, unparked ticket in order; an approved hard or critical one goes first. Finish every opened ticket before starting another, and keep one hard or critical ticket in flight. Re-check its premise and scope against main before briefing it.

   At or above the solo band (workflow.md → Chain efforts, default hard) a ticket runs alone, in a fresh session. A session with work landed or opened finishes what is in flight, runs Session end, and hands over to a successor scoped to that ticket alone, or pauses with the resume prompt naming that ticket when self-continuing is off. A solo ticket's session closes right after landing it and picks nothing else. A solo ticket parked on plan approval blocks nothing: while it parks, easy and medium work still runs. Easy and medium tickets share sessions.
2. **Halt check** by band (`docs/agents/difficulty.md`):

   | Band | Rule |
   |---|---|
   | easy | Just do it |
   | medium | Post a short plan comment, then go on |
   | hard | A planner posts the plan; park until it is approved (approval mode: workflow.md) |
   | critical | As hard, and L0 reads every line of every commit |

   Parking adds a `gates.md` row and parks every ticket blocked by it or touching its files; then back to step 1. With only plan approvals parked, run `grilling` with the owner, one parked plan at a time, critical first.
3. **Branch:** one worktree per ticket on `fix/<id>`, made the way workflow.md says.
4. **Per task, parallel by default.** The plan gives each task a `Depends on` list and a fence. Start every task whose dependencies are merged and whose fence is disjoint from every running task's, within the caps, each in its own worktree on `fix/<id>-<task>` from the ticket branch's tip (its task base). Merge accepted task branches into `fix/<id>` in plan order. Share a worktree only when the caps leave no choice (Delegation discipline 6).
   1. **Brief** L1 with the packet (below) and only its own task block, marked "small change: you edit" or "delegate". The block carries its ORACLE and an "Earlier reviews found" line: the class of every act-on finding this ticket's earlier tasks drew, so none is paid for twice, and a new class goes to sibling tasks still running. `mkpacket.mjs` pastes in the most frequent classes from the ledger.
   2. **Check the report, not the summary.** Rerun red on the task base and green on L1's last commit, with workflow.md's red/green command. Read the self-review file, rerun `scripts/review-file.mjs` on it and the project's lens check (workflow.md → Lens check, filled in by `mkpacket.mjs`); a failure sends the report back, since both ran before it (packet rule 6). Count the L1's child calls for a "delegate" task (`scripts/pi-delegation.mjs --for <worktree>` for a pi implementer); none goes back. A "pre-existing failure" needs a log from main.
   3. **Review** on `<task base>..<last commit>`, per [code-review](../code-review/SKILL.md). Ask of every diff whether it can change behaviour in a risky area (a `difficulty.md` top band). First review by the task's own band, scored alone:

      | Case | Review |
      |---|---|
      | hard, critical | A and B |
      | any band in a high-risk area (a top band, such as an order or money path) | A and B |
      | medium, changes behaviour | A and B |
      | medium refactor or docs, easy | A alone, both axes |
      | a staged squash on the fallback reviewer, at a band `Combine A and B on the fallback` names | one reviewer, both axes; never at hard, critical or high risk |
      | a fix round | delta-only, `<previous tip>..<new tip>`, one reviewer, both axes: is each finding fixed, and what does the fix newly let through |
      | L0's own edit after "land" (docs, comments, types, a test name) | none; name it in the resolution comment |
      | a behaviour change after "land", a risky-area delta, or a diff over workflow.md's line count | delta-only re-review |

      A covers standards; B covers spec and blast radius (other callers, error paths, rollback, what the fix newly lets through). On an easy or medium first implementation L0 reads the diff ("is it off?"); on a hard or critical one it reads every line, and A and B review the same tip, at the same time when workflow.md's caps allow two, one after the other when they do not. The fix round takes both lists, so one round and one delta review answer both. Two easy tickets with disjoint files may share one reviewer.

      Before every review launch, not once per session, read the project's reviewer-availability record (workflow.md → reviewer fallback): while a reviewer's quota is tight or a refill time is ahead, a medium task gets A alone and reviews run on the fallback. **On the fallback reviewer** (a single slot) the project's `Combine A and B on the fallback` setting names the bands where A and B become one reviewer covering both axes; with no such setting, and always for a hard, critical or high-risk task, they stay two.

      Give each reviewer the ORACLE and ask it to follow every consumer of what the task moves, anywhere in the repo. Sort each finding into act on / consider / noted / dismissed with a reason checked against main, and name each act-on class. Accept only on an empty act-on list. The trail verdict records the round, the counts, the act-on classes, and `repeat` on a class an earlier round of this task drew. Append one line per act-on class to the class ledger; fill its fix shape when a round closes it.
   4. **Attempts,** by band, from workflow.md → Attempts per band (defaults here). A round is the build or one fix round, each ending in L0's review (4.3):

      | Band | Implementer rounds | Takeover rounds | Most L0 reviews | Then |
      |---|---|---|---|---|
      | easy, medium | 4: build, fix 1, fix 2, a fresh implementer | 2 | 6 | park the task for the owner in `gates.md` |
      | hard, critical, or any task in a high-risk area | 3: build, fix 1, a fresh implementer | 2 | 5 | park the task |

      Every re-brief says why the last attempt failed. **Fix rounds follow packet rule 12** (`templates/self-review.txt` → A fix round after a review), which owns the class, the sweep over every reader, the mutant table and the loop cap. L0's own half: the re-brief names the class, planners grep their fence the same way, and the delta reviewer checks the list is complete first.
      - **Context budget.** workflow.md sets two implementer ceilings: the implementation (first build and self-review; the planner sizes tasks to it) and review fix rounds, which may be higher. Fix rounds go to **the same implementer** while it is under its fix-round context ceiling, read through the adapter before every round; at or past it, to a fresh implementer on the same model, not a ladder rung, with the packet plus the `<wt>/tmp/state-<ticket>-<task>.md` L0 writes (task base..tip diff stat, what is done, open findings and classes, review file paths). A parked task waits for the owner with the conservative default recorded; work it does not block goes on.
      - **Open at cap.** A self-review item under `## Open at cap` is a nit (waits, handoff) or a should-fix or blocking item: an act-on finding of that round, counted against the attempts, its class returning afterwards a repeat. A behaviour bug in a high-risk area goes to the takeover at once.
      - **On the first repeat** (an act-on finding in a class an earlier round of this task fixed) stop plain fix rounds, whatever the count says. Before the next round L0 writes (a) a **scope ruling**: which shapes of the class are in scope, which unbounded ones (a guard on an arbitrary predicate) are nits; (b) the ORACLE restated as input shapes × caller configurations, crossed in full; (c) a **mutant table**: one mutant per condition or branch of the guard or rule in scope, each turned red by a test or ruled equivalent with the reason. Those three are the structural brief; the next round is rung 1. A finding the ruling calls a nit is recorded as one, not as a repeat.
      - **A test-only repeat is a nit**, filed as a follow-up ticket, when the reviewer states there is no production defect; it does not climb the ladder. A test gap over behaviour in a high-risk area still climbs.
      - **Escalation ladder,** cheapest first: plain fix rounds to the same implementer; then (1) **rung 1**, a **fresh** implementer on the same model with a rung-1 packet (`mkpacket.mjs --role rung1`: the structural brief the task file carries, its mutant table, one self-review loop aimed at the repeated class over the task range, not a full build packet); then (2) the takeover role, for at most its takeover rounds; then park. Early moves: a returned class goes to rung 1 at once; rung 1 drawing it again, or the implementer rounds used up, goes to the takeover; an implementer at its context ceiling in a high-risk task goes straight there.
      - **State the failing case and the constraint; never prescribe the design.** A re-brief that dictates the fix makes L0 the author and skips the implementer's own review. If only one design can work, that is a plan change: record it in the ticket and say so.
   5. **Takeover** (the ladder's last rung, or `context ceiling`, `beyond the model`, `owner`): record its reason in the trail in one word or two (`same class twice`, `attempts used`) and the rungs already climbed. Then the takeover role from workflow.md, briefed with a `mkpacket.mjs --role takeover` packet (no delegation, the in-turn wait kept), every rejected attempt, every review and the failure pattern. Review its commit like any other.
   6. Small leftovers from a review (a one-line doc or comment fix) ride the next packet.
5. **Land:** once a task's review verdict is accepted, run its out-of-fence pre-run again: the tests outside its fence that name a changed public symbol **and** those that mock or patch a changed module, whether or not they name a changed symbol (a `vi.mock("<module>")` or `patch("app.<module>")` names only the module), through the project's pre-run command (workflow.md → Pre-run command). The implementer ran it before its report; the stage re-runs it. A failure is a finding of the task that changed the symbol, fixed before staging. Build the staged squash (Git recipes), run the full gate on it (the ticket's one full-suite run; never gate a tip a review may still change), and run the verify skill on user-visible changes.
   - **Gate on acceptance, not on a pair.** Gate a ticket as soon as its last task is accepted and the host's suite lock is free. Two tickets share one gate only when both are accepted and both waiting then; never hold an accepted ticket for one still building, and never couple two tickets' gates for any other reason. A gate still stands after main moves when main's new commits touch no staged file and no file the pre-run selected; otherwise re-gate on the new main (Lanes → Landing second).
   - **Architecture pass** (medium and above, unprompted): no separate agent. It rides the final axis-A review of the staged squash, whose brief gets the `scripts/mkbrief.mjs --role landing --diff main..<stage>` text appended, quoting [codebase-design](../codebase-design/references/matt/codebase-design/codebase-design.md) and the Explore step of [improve-codebase-architecture](references/matt/improve-codebase-architecture/improve-codebase-architecture.md), never a pointer at the skill files. The reviewer writes the pass file (see Pass files) beside its review; `scripts/arch-check.mjs --role landing` must exit 0 on it before L0 reads the verdict (exit 1 sends it back to the same reviewer). Record an `arch` trail row: decision `#<id> <verdict>` (`SOUND`, `SOUND WITH FOLLOW-UPS`, `REGRESSED`), evidence the pass file path. A finding this ticket caused is should-fix before landing: fix it (a new stage), re-run the review with the pass, add a row; one that predates the ticket is filed as its own ticket.
   - **Gate:** `node .agents/skills/rigor/scripts/land-check.mjs --trail .audit/<slug>.tsv --ticket <id> --band <band>`, which also runs `arch-check.mjs --role landing` on the row's pass file. Never land past exit 1.

   Then `git merge --squash fix/<id>` and commit with the template. Land only the tree the gate ran on: a fold after it means a new stage and at least the check commands (lint, format, types) again, a behaviour-changing fold the full gate again. Diff main against the stage before closing.
6. **Close:** resolution comment, tick the boxes, close the ticket, add a line to the map's decisions, per `docs/agents/issue-tracker.md`. Clean up the ticket's worktree, workspace, agents, branch and stage ref. The next ticket starts here, at landing: post-land verify runs beside it, and a verify failure becomes a new ticket or a revert, never a hold on the next ticket.
7. **Continue.** Hand back only on a halt rule, an owner question, or no unparked work.

## Delegation discipline

1. **Proof, not summary.** A report points at its proof and is never the proof (step 4.2).
2. **One task per implementer.** A short packet with its own fence.
3. **The implementer delegates by size; L0 checks it did.** Waste-sized work (one or two files, or shorter than a child's brief) the L1 does itself. The rest goes to a worker plus a fresh reviewer per round, within packet rule 5's review->fix loop cap (`templates/packet-rules.txt`); that cap bounds one round inside the L1, and the rounds per band (step 4.4) bound L0's re-briefs.
4. **The implementer reviews its own work first** (packet rule 6), into `<wt>/tmp/cr-<ticket>-<task>.md`, act-on findings fixed. L0 rejects a report without that file.
5. **The full suite runs once per ticket, on the staged squash** (the gate), at every band. Implementers and their children run targeted tests and the cheap gate checks only, unless a task line asks for it, and then only on a commit whose self-review act-on list is empty. The cheap checks (`docs/agents/packet-rules.md` → Check commands) run before hand-back at every band.
6. **Shared-worktree writers keep to their own paths:** lint, format and fix commands on their own files only, commits with `git commit -- <paths>`. Never amend or rewrite history. Delete only your own scratch. L0 names the other writer in both packets.
7. **L0 orchestrates; implementers work.** Investigation, code, tests and prose go to an implementer or scout.

## The delegation adapter

Every delegation operation goes through the adapter this repo names: `delegation/<tool>.md`, where workflow.md → Chain efforts names the tool. [delegation/README.md](delegation/README.md) lists the operations; the adapter maps each to that tool's calls. Never shell out to another harness's CLI.

- One workspace per ticket worktree, created or reused. Spawn every implementer through the adapter with the role's provider, model and thinking level from workflow.md, a title naming ticket and task, labels (`effort`, `ticket`), and the packet as its first prompt; re-briefs and fix rounds go to the same agent id, so it keeps its history. Check running implementers and open worktrees against the caps before every new agent **and** every follow-up prompt.
- **Heartbeat.** While any agent of this lane runs, a heartbeat to self at workflow.md's L0 heartbeat interval (default 15 minutes) covers implementers, reviewers, planners, plan reviewers, takeovers and verify drivers. **When workflow.md names a `Watch command`, the tick runs it first**, and when it prints nothing the tick replies one line and reads no activity at all. Judged by hand, an agent's **liveness is the newest of its transcript, its worktree's last commit and its progress log**, never the progress log alone. Post one line per agent: step, next, OK or stuck; stuck means that newest signal is past the staleness window, or the same step repeats the number of times it names. An agent with no activity for 15 minutes or more (an agent with no progress log is judged by its activity alone) gets its activity read through the adapter, and then:
  - **A quota or usage error:** archive it, record the reviewer's unavailability and refill time by the project's rule (workflow.md → reviewer fallback), relaunch the same brief on the fallback now. A role with no fallback is ⏸ blocked: quota.
  - **Silent, no error:** one nudge through the adapter. Still no activity at the next tick: relaunch the same brief now, on the fallback when the primary is suspected out of quota.
  - **A fix round that is silent, with its commit in and `review-file.mjs` at exit 0:** accepted at the first silent tick. Archive it and launch its one delta reviewer at once. A fix round is never accepted without that delta reviewer, and a silent build round is not accepted this way.
  Never wait out a silent agent past two ticks. Delete the heartbeat at session end.
- An L1, and any L2 with children, never ends its turn while a child runs: bounded slices of at most the L1/L2 wait slice workflow.md sets (default 10 minutes), by the loop in packet rule 5. **The L1 reads its worker's transcript tail in every wait block**, and on the same failure seen twice it takes the work over or re-briefs with what it found. Probe and lens children get a ~25 minute timebox in their brief and stop themselves with partial findings, listing the rest as not run. At easy and medium the L1 writes the code itself: no worker layer.
- **L0's own 429.** The heartbeat is L0's wake-up: on resume L0 first reads every notification and report that arrived during the stall, then computes each reset time from the 429's own timestamp plus its "reset after" value (`scripts/reset-at.mjs`), never from now.
- A lost finish notification is recovered from the agent's activity, through the adapter.
- After a reboot or a harness restart: list every agent and in-session child this session started, judge each by its transcript's last write (the harness notes say where), re-prompt the live ones, relaunch a dead child from its brief, rerun any suite that died, log the restart in the trail.
- Start a fresh implementer past its context ceiling (step 4.4), after a wrong premise, or for an unrelated ticket; archive each agent once its task is accepted, and the ticket's workspace and leftovers at landing.
- Reviewers are disposable: a narrow brief, a result in `tmp/` (pass files go where Pass files says); a delta review is a fresh reviewer with the previous review file. Planner, takeover and verify driver run as full agent sessions, never short-cache subagents; an author never reviews its own code, and every brief repeats "never read any .env file".
- **Planner** (hard, critical): one background, read-only agent on the planner role, no sub-agents. Its brief is built with `scripts/mkbrief.mjs --role planner` from the project's planner brief, whose step 1 quotes the architecture method and has the planner run the pass, unattended, into a pass file before it reads code for the plan, and the plan's ARCHITECTURE section cites that file; a brief that only points at the skill files is not a planner brief. Per task it writes the approach, files, first red test, risks, ORACLE and ARCHITECTURE section, keeping a ticket to about 4-5 tasks (more means split it), sizing each to one implementer's context budget (step 4.4), scoring each task's hardness and giving it its `Depends on` list and fence (step 4). It re-checks every premise against main by symbol, writes a contract's ORACLE as input shapes × caller configurations, and asks only questions that change product behaviour. L0 then runs `scripts/arch-check.mjs --role planner --arch <pass file> --plan <plan file>`; exit 1 sends the plan back. It posts the plan as a ticket comment headed `## Plan (awaiting approval)` and replies with the URL only.
- **Plan review** (hard, critical), before approval: one read-only agent briefed with `mkbrief.mjs --role plan-review`. It writes its own pass from the code before opening the plan, then compares, so it judges the plan instead of confirming it; `arch-check.mjs --role plan-review` must pass on its file. **It also checks once that the proposed module shape would import or run**: a cheap static or scratch check, not a reading (compile the skeleton, run the import, build the proposed module graph through its entry point; where it cannot, say so and name what was read instead). A shape that cannot import is an act-on finding whatever the plan says. Critical: on the planner role. Hard: on the plan-review role workflow.md names (default the L1 implementer model); a `REGRESSED` verdict, or a Plan comparison that disagrees on an owner or a seam, re-runs the review on the planner role, and that verdict stands. L0 records each review as an `arch` row with decision `#<id> plan <verdict>`; the landing gate ignores plan rows. **Pass files** go where workflow.md → Chain efforts says (default `.audit/<slug>/arch/<id>[-plan].md`: `<id>.md` landing, `<id>-plan.md` planner, `<id>-plan-review.md` its review), committed with the trail, never in `tmp/`.
- **Quota.** A model out of quota stops its work; never finish it on another model. Mark it ⏸ blocked: quota, record it in the handoff, resume on the same model. Only a reviewer has a fallback, when workflow.md names one; it goes there at once, its refill time into the availability record every lane reads before every review launch (step 4.3).
- **No adapter:** do the work in-session, serially, and log `degraded: no delegation tool` in the trail.

## Talking to the owner

- **A rule change reaches running work at once.** When the owner changes a rule that binds L0, an implementer or a reviewer, L0 sends it at once to every running agent it affects, through the adapter: steer, with the rule text or its path. It binds that agent's next report, not its next task: a report that breaches a rule it was steered is sent back. A relay never says "leave in-flight work as it is": in-flight work is the work the rule is for. Every later packet is rebuilt with the new text (the packet is built per task), and every later report held to it.
- Ask only what changes behaviour for users or operators versus today, in the grilling format, worded so "yes" accepts. Order, sequencing and implementation are L0's.
- Unattended: never ask in chat. Add a `gates.md` row with the conservative default taken and keep going.
- Every ticket table shows each ticket's band. Close every session with the progress table: closed so far, touched this session, the next three.
- Close every session with three counts per task, from the trail, so the chain's own rules can be judged: review rounds until accepted, classes that repeated, and the takeover reason if there was one. A project that keeps an effort ledger puts them there.

## Session end

Autosquash fixups, rewrite the handoff, add the trail row, commit both on main, run the cleanup workflow.md lists, delete the heartbeat, clear root `tmp/` (with lanes, only this lane's scratch), archive every implementer workspace. Then self-continue or pause.

## Self-continuing sessions

Only when workflow.md enables it. The closing session starts a successor as a **new top-level session** through the adapter (the start call is in workflow.md) only if all of these hold:
1. Session-end steps are done.
2. No stop is recorded: no `.audit/<slug>.stop`, no owner "stop" this session, no hold in the handoff.
3. The next session has runnable work: approved plans for its hard tickets, or unblocked easy and medium work. A solo ticket's session plan row holds only that ticket.
4. The done predicate is still false.
5. No other session of this chain is running: list the running sessions by label through the adapter and find none but this one.
6. No model the chain needs is out of quota (a reviewer with a named fallback excepted).

Run check 2 again as the last step before the start call: a stop that arrives during Session end still counts. If any check fails, pause: write the reason as the handoff's first line and a `pause` trail row, list waiting plans with their questions, and end with the resume prompt. Record the successor's id in a `next` trail row. A stop that arrives after the successor started is passed on at once: create the stop file and tell the successor through the adapter; it stops at Session start step 1, or finishes its in-flight ticket and pauses.

The successor's briefing is self-contained: start session <n+1> of <slug> with rigor by CHAIN.md, read order (handoff, brief, preferences, gates, trail tail, session plan row), scope with bands and approvals (and its lane, with lanes), "unattended: never ask in chat, park in gates.md", and "at the end, continue or pause by these checks".

The owner stops it by saying "stop" (finish in-flight tickets, then pause) or by creating `.audit/<slug>.stop`.

## Lanes

Opt-in: `Lanes: <n>` in workflow.md → Chain efforts (default 1: this section does not apply).

- **A lane** is its own top-level L0 session line on a disjoint set of session-plan rows, each marked with its lane, whose areas and files do not overlap. The owner may pre-assign rows to a lane, and only that lane takes them. A row marked for the next free lane goes to the first lane with none left, after two guards:
  1. **Overlap check.** Compare the row's expected files with every open worktree of the other lane (`git diff --name-only <base>...<branch>`) and with the files of the row it has claimed. On any overlap, take the next free row or wait for that ticket to land.
  2. **Claim commit.** Claim the row by committing its lane mark in the session plan, under the main-checkout lock, before starting it. The claim is the last guard: a row another lane's commit already marks is not yours.
- **Own files.** Each lane writes only `.audit/<slug>.lane-<x>.{handoff.md,tsv,gates.md}` and its own effort ledger; the files from before the split stay as history every lane reads. One trail per lane, not one TSV with a lane column: the lanes share the main checkout, so a by-path commit of a shared file would sweep in the other lane's uncommitted row. The class ledger is the one file every lane writes: append under the main-checkout lock, never rewrite another lane's lines. A lane never edits another lane's files, worktrees or agents.
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

Build one packet per task with `scripts/mkpacket.mjs`: `--task-id <task id>` gives each task its own self-review file, `--band <ticket band>` names the lenses that band requires (`Self-review lenses` in workflow.md → Chain efforts; without `--band`, standards and spec only), `--kind assessment` adds the interrogate lens for a task whose product is a report or a doc of claims rather than code (nothing else the band drives changes; `--kind code` is the default), `--deliverables <a,b>` names the files such a task produces, `--change refactor` marks a task that keeps behaviour (no probe), and `--role rung1` builds the structural brief the task file carries, requires its mutant table, and makes the self-review one standards + spec loop aimed at the repeated class. Always pass `--l0-id <L0's agent id>` (or export `PASEO_AGENT_ID`): rule 5 then carries the adapter's question call to that id, and without one the implementer asks at the report. `mkpacket.mjs` exits 2 when `--base` is not the branch tip or an ancestor of it in `--wt`, so take the base from the branch tip right before building.

Packet rule 6 carries the self-review loops, the lens briefs and the commands that keep the file right by construction; its method is `templates/self-review.txt`, which also owns the probe limits and the mutant table. The self-review comes first: L0's reviewers (step 4.3) see the diff only after its act-on list is empty. The packet holds the task block, then the preferences, then the pack's generic rules (`templates/packet-rules.txt`), then the project rules file `docs/agents/packet-rules.md`: the implementer starts with no project instructions, so the packet carries everything, with absolute paths. It names the ticket, the worktree, the branch and the task base, marks the task's size ("small change: you edit" or "delegate"), and repeats the fence, red-first, commit and report rules; a `delegate` task with no worker call in its session goes back to the same implementer (step 4.2).

**The ORACLE.** Every task block has a section starting `ORACLE`: what right looks like, written so a test can check it. `mkpacket.mjs` exits 2 without one. The ORACLE is text in the task block, not an agent. The planner role writes it with the plan; for easy and medium tickets L0 writes it while re-checking the premise. By kind of work:

| Work | The ORACLE holds |
|---|---|
| Behaviour-preserving move, a new source for an old value, a parser or resolver replaced | A "today's behaviour" table, one row per input shape (missing, null, empty, wrong type, string-for-number, out of range, the normal case), each with what main does today. The red test is differential: every row recorded from a run on the base, and a row whose run disagrees with the table is reported, not picked |
| A contract: what commits, what a guard holds, who owns a value | Input shapes × caller configurations, crossed in full, one row per pair, and the unbounded shapes out of scope |
| A guard, scan or validator | The class it must stop, every input form of it you can list, and the forms it must let through. Its reach is stated in its own docstring only (packet rule 13) |
| New behaviour | One observable scenario with concrete values: the seed, the call, the expected result |
| An assessment or a doc of claims | The claims to settle, each with the run that would settle it |
| Docs, comments, renames | `ORACLE: none`, with the reason |

**The ARCHITECTURE section.** A hard or critical task block also has one, starting `ARCHITECTURE`: each module the task adds or changes, named, with its deletion-test result, or `ARCHITECTURE: none` with the reason; `mkpacket.mjs` exits 2 without it. The packet inlines the project's `## Architecture rules` from `docs/agents/packet-rules.md` as ARCHITECTURE RULES, expanding each `INLINE: <path>#<Heading>` line into that section of the owning skill file ([codebase-design](../codebase-design/references/matt/codebase-design/codebase-design.md), [improve-codebase-architecture](references/matt/improve-codebase-architecture/improve-codebase-architecture.md)), so the checklist has one owner. Rule 6 ends the standards lens with the fixed ARCHITECTURE block, which `review-file.mjs` checks filled, with every lens and the probe when one was due (step 4.2). Reviewers judge the work against the ORACLE, which the implementer turns into tests.

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
