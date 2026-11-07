# Chain runs

A chain is a recorded list of tickets that the owner hands over with "continue <slug>". You are **L0**: you run the tickets back to back, AFK, until a halt rule stops you or nothing unparked is left. One-off tasks never come here; they take the normal rigor routes.

Every setting (models per role, concurrency caps, attempt counts, context ceilings, push rule, reviewer fallback, check, gate and verify commands, the delegation tool) lives in `docs/agents/workflow.md` → Chain efforts. This file is the method. That section wins on any number or name. If it is missing, stop and ask for `setup` (chain section).

## The chain's files

| File | Holds |
|---|---|
| `.audit/<slug>.brief.md` | Goal, done predicate, scope, doors, gates, and the three §5 Resume answers pre-recorded, so resuming asks nothing |
| `.audit/<slug>.preferences.md` | Standing orders, pasted verbatim into every implementer packet |
| `.audit/<slug>.tsv` | Trail: one row per landing, park, session start, close, pause and next |
| `.audit/<slug>.gates.md` | Parked questions and plans, each with the default taken; owner answers land here |
| `.audit/<slug>.handoff.md` | Where the last session stopped, open work, owner decisions, process lessons |
| `.audit/<slug>/ORDER.md` | Run order. `DECISIONS.md` holds binding owner answers (never re-ask) |
| Tracker map | A parent ticket whose children are the tickets (`docs/agents/issue-tracker.md`). Each ticket carries its tasks and, per task, the fence ("You may change" / "Do not touch"), the required test and "Stop and ask L0 if" lines |

**Setting up a new chain:** write the brief and preferences in the rigor interview, file one tracker issue per ticket (`triage`, `writing`) nested under the map, and record the order in `ORDER.md`.

## Session start

1. If `.audit/<slug>.stop` exists, do nothing; reply with the resume prompt.
2. Read the brief, preferences, handoff, the trail's last rows and `gates.md`. Record the brief's resume answers as the `start` row.
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
2. **Halt check** by band (`docs/agents/difficulty.md`):

   | Band | Rule |
   |---|---|
   | easy | Just do it |
   | medium | Post a short plan comment, then go on |
   | hard | A planner posts the plan; park until it is approved (the approval mode is in workflow.md) |
   | critical | As hard, and L0 reads every line of every commit |

   Parking adds a `gates.md` row and parks every ticket blocked by it or touching its files. Then go back to step 1. When only plan approvals are parked, run `grilling` with the owner, one parked plan at a time, critical first.
3. **Branch:** one worktree per ticket on `fix/<id>`, made the way workflow.md says.
4. **Per task, in order:**
   1. **Brief** L1 with the packet (below) and only its own task block. Mark its size: "small change: you edit" or "delegate".
   2. **Check the report, not the summary.** Rerun red on the task base and green on L1's last commit yourself, with the red/green command from workflow.md. Read the self-review file. Count the L1's child calls when the task said "delegate" (`scripts/pi-delegation.mjs --for <worktree>` for a pi implementer); a delegate task with no worker call goes back. A "pre-existing failure" counts only with a log from main.
   3. **Review**, sized by the table below, on `<task base>..<last commit>`, following [code-review](../code-review/SKILL.md). Reviewer A: standards. Reviewer B: spec and blast radius (other callers, error paths, rollback, what the fix newly lets through). Sort every finding into act on / consider / noted / dismissed, with a reason, after checking it against main. Accept only when "act on" is empty. Record the verdict in the trail.
   4. **Attempts:** the workflow.md count per task (split between getting it right and review findings). Every re-brief says why the last attempt failed. Fix rounds go to **the same implementer** while it is under its context ceiling. Then a takeover.
   5. **Takeover:** the takeover role from workflow.md, briefed with the packet minus delegation lines, every rejected attempt, every review and the failure pattern. Review its commit like any other.
   6. Small leftovers from a review (a one-line doc or comment fix) ride the next packet.
5. **Land:** build the staged squash (Git recipes). Run the full gate on it. Run the verify skill on it for user-visible changes. Then `git merge --squash fix/<id>` and commit with the template. Diff main against the stage before closing.
6. **Close:** resolution comment, tick the boxes, close the ticket, add a line to the map's decisions, all per `docs/agents/issue-tracker.md`. Clean up the ticket's worktree, workspace, agents, branch and stage ref.
7. **Continue.** Hand back only on a halt rule, an owner question, or no unparked work.

**Review depth.** Ask of every diff: can it change behaviour in a risky area (the areas `difficulty.md` scores in its top bands)?

| Change | Review |
|---|---|
| First implementation, easy or medium | L0 reads the diff ("is it off?") plus one reviewer, both axes. Two such tickets with disjoint files may share one |
| First implementation, hard or critical | L0 line-by-line read, then two reviewers in turn: B, then A |
| A fix round | Delta-only re-review of `<previous tip>..<new tip>`: is each finding fixed, and what does the fix newly let through |
| L0's own edit after "land": docs, comments, types, a test name | No re-review; name it in the resolution comment |
| A behaviour change after "land", a delta in a risky area, or a diff over the line count workflow.md sets | Delta-only re-review |

## Delegation discipline

1. **Proof, not summary.** A report points at its proof and is never the proof (step 4.2).
2. **One task per implementer.** A short packet with its own fence. Bundles overflow context.
3. **The implementer delegates by size; L0 checks it did.** Waste-sized work (one or two files, or shorter than a child's brief) the L1 does itself. Everything else goes to a worker plus a fresh reviewer per round.
4. **The implementer reviews its own work first.** Every task ends with `code-review` (both axes, fresh read-only children) over its range, written to `<wt>/tmp/cr-<ticket>-<task>.md`, act-on findings fixed. L0 rejects a report without that file.
5. **Green full suite before hand-back in the top bands.** Below them, the gate on the staged squash is the first full run. L0 runs the gate before landing at every band.
6. **Shared-worktree writers keep to their own paths.** Commit with `git commit -- <paths>`. Never amend or rewrite history. Delete only your own scratch. L0 names the other writer in both packets.
7. **L0 orchestrates; implementers work.** Investigation, code, tests and prose go to an implementer or scout.
8. **Review depth by band** (table above).

## The delegation adapter

Every delegation operation goes through the adapter this repo names: `delegation/<tool>.md`, where workflow.md → Chain efforts names the tool. [delegation/README.md](delegation/README.md) lists the operations; the adapter maps each to that tool's calls. Never shell out to another harness's CLI.

- Create or reuse one workspace per ticket worktree, so the agent starts in its worktree.
- Spawn every implementer through the adapter, with the provider, model and thinking level workflow.md gives its role, a title naming the ticket and task, labels (`effort`, `ticket`) and the packet as its first prompt.
- Send every re-brief and fix round through the adapter to the same agent id, so it keeps its history.
- Check running implementers and open worktrees against the caps before every new agent **and** every follow-up prompt.
- While any L1 runs, a heartbeat to self, at the interval workflow.md sets, reads each `<wt>/tmp/l1-progress.log` and posts one line per agent: step, next, OK or stuck. Stuck means the newest line is past workflow.md's staleness window, or the same step repeats the number of times it names. Delete the heartbeat at session end.
- A lost finish notification is recovered from the agent's activity, through the adapter. After a reboot, re-prompt agents through the adapter to revive them, and rerun any suite that died.
- Start a fresh implementer past its context ceiling, after a wrong premise, or for an unrelated ticket. Archive each agent through the adapter once its task is accepted, and archive the ticket's workspace and its leftovers at landing.
- Short-lived reviewers are disposable. Each gets a narrow brief and writes its result to `tmp/`. A delta review is a fresh reviewer briefed with the previous review file. Long work (planner, takeover, verify driver) runs as a full agent session through the adapter, never a short-cache subagent; see the harness notes. An author never reviews its own code. Every brief repeats "never read any .env file".
- **Planner** (hard, critical): background, read-only. It re-checks each premise against main by symbol, writes per task the approach, the files, the first red test and the risks, and asks only questions that change product behaviour. It posts the plan as a ticket comment headed `## Plan (awaiting approval)` and replies with the URL only.
- **Quota.** A model out of quota stops its work; never finish it on another model. Mark it ⏸ blocked: quota, record it in the handoff, resume on the same model. workflow.md may name a reviewer fallback; no other role has one.
- **No adapter.** With no delegation tool for this repo, do the work in-session, serially, and log `degraded: no delegation tool` in the trail.

## Talking to the owner

- Ask only what changes behaviour for users or operators versus today, in the grilling format, worded so "yes" accepts. Order, sequencing and implementation are L0's.
- Unattended: never ask in chat. Add a `gates.md` row with the conservative default taken and keep going.
- Every ticket table shows each ticket's band. Close every session with the progress table: closed so far, touched this session, the next three.

## Session end

Autosquash fixups, rewrite the handoff, add the trail row, commit both on main, run the cleanup workflow.md lists, delete the heartbeat, clear root `tmp/`, archive every implementer workspace. Then self-continue or pause.

## Self-continuing sessions

Only when workflow.md enables it. The closing session starts a successor as a **new top-level session** through the adapter (the start call is in workflow.md) only if all of these hold:
1. Session-end steps are done.
2. No stop is recorded: no `.audit/<slug>.stop`, no owner "stop" this session, no hold in the handoff.
3. The next session has runnable work: approved plans for its hard tickets, or unblocked easy and medium work.
4. The done predicate is still false.
5. No other session of this chain is running: list the running sessions by label through the adapter and find none but this one.
6. No model the chain needs is out of quota (a reviewer with a named fallback excepted).

If any check fails, pause: write the reason as the handoff's first line and a `pause` trail row, list waiting plans with their questions, and end with the resume prompt. Record the successor's id in a `next` trail row.

The successor's briefing is self-contained: start session <n+1> of <slug> with rigor by CHAIN.md, read order (handoff, brief, preferences, gates, trail tail, session plan row), scope with bands and approvals, "unattended: never ask in chat, park in gates.md", and "at the end, continue or pause by these checks".

The owner stops it by saying "stop" (finish in-flight tickets, then pause) or by creating `.audit/<slug>.stop`.

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

Build it with `scripts/mkpacket.mjs`: the task block, then the preferences, then the pack's generic rules (`templates/packet-rules.txt`), then the project rules file `docs/agents/packet-rules.md`. The implementer starts with no project instructions, so the packet carries everything, with absolute paths.

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
- Run a multi-task ticket's reviews in parallel with the next task's implementation.
