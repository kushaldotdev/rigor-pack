# Delegation adapters

[CHAIN.md](../CHAIN.md) delegates through the adapter this repo's `docs/agents/workflow.md` → Chain efforts names. An adapter is one file in this folder, named after its tool ([paseo.md](paseo.md)), that maps each operation below to that tool's calls or CLI commands. The method never names a tool: only the adapter and workflow.md do.

## The operations

| Operation | Meaning | Expected result |
|---|---|---|
| create or reuse a workspace for a worktree | A named home for one ticket's agents, rooted at that ticket's worktree | A workspace id to reuse for every task of the ticket |
| spawn an agent | Start one implementer: provider/model, thinking level, title, labels (`effort` and `ticket`), cwd | An agent id, and a finish notification when its turn ends |
| send a follow-up | A re-brief or a fix round to the same agent, keeping its context | The same agent working again, with its history |
| get status, activity and context usage | Is it running, what did it last do, how full is its context | Running or finished; its recent steps; a context size to compare with workflow.md's ceiling |
| recover a lost finish notification | Find out how an agent ended when the notification never arrived | The agent's last activity and its final message |
| archive an agent | Retire a finished implementer | The agent off the running list, its transcript kept |
| archive a workspace and its leftovers | Retire a ticket's workspace, plus anything the tool registered for it | Nothing of that ticket left running or listed |
| create and delete a recurring heartbeat to self | The watch loop: a prompt back to L0 on a cron cadence | A heartbeat that pings L0; deleted at session end |
| start a top-level successor session with labels | The self-continuing handover: a new session that is not a child of this one | A session id to record in the trail's `next` row |
| list running sessions by label | Is another session of this chain alive | The matching sessions, or none |
| count running agents against the caps | How many implementers and workspaces exist right now | Counts to compare with the caps in workflow.md |

## When the tool is missing

No adapter for the tool this repo names, the tool not installed, or an operation the tool lacks: do that work in-session, serially, and log `degraded: no delegation tool` in the trail. The chain still runs; it is slower and its reviews come from the session's own children, labeled single-family.

## Adding an adapter for another tool

Copy [paseo.md](paseo.md) to `<tool>.md` and fill each row of its table for the new tool: the call or command per operation, and the id each one returns. Keep the operations table's wording as the rows, so L0 reads the same shape whatever the tool. Add that tool's own gotchas as a final section: anything about parentage, leftover projects, notification delivery, reviving after a restart, or how context usage is read. Then name the file in `docs/agents/workflow.md` → Chain efforts → delegation tool.
