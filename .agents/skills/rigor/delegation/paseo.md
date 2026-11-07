# Paseo adapter

Maps each operation in [README.md](README.md) to Paseo's MCP tools or the `paseo` CLI. Paseo is the delegation tool when `docs/agents/workflow.md` → Chain efforts names it, and the file named there. Model ids and thinking levels are settings: take them from that section, never from here. The ids below are examples only.

| Operation | Call | Result |
|---|---|---|
| create or reuse a workspace for a worktree | `create_workspace` with `{ isolation: "local", path: <worktree> }`; CLI `paseo workspace create --isolation local --path <worktree>` | A `workspaceId`. Reuse it for every task of that ticket |
| spawn an agent | `create_agent` with `{ workspaceId, provider: "<family>/<model id>", settings: { thinkingOptionId: "<level>" }, title: "<id> T<n> <task>", labels: { effort: "<slug>", ticket: "<id>" }, initialPrompt: <the packet>, notifyOnFinish: true }`. Example provider: `pi/some-model-id` at `max`; example reviewer: `codex/some-model-id` at `high` | `{ agentId, workspaceId }`. A finish notification arrives when its turn ends |
| send a follow-up | `send_agent_prompt` with `{ agentId, prompt: <the re-brief>, notifyOnFinish: true }`; CLI `paseo send <agent-id> "<prompt>"` | The same agent works again, with its history |
| get status, activity and context usage | `get_agent_status` for running or finished plus `lastUsage` (the context size); `get_agent_activity` for its recent steps | Status, last activity, context size to compare with workflow.md's ceiling |
| recover a lost finish notification | `get_agent_activity` on the `agentId` | Its last steps and final message |
| archive an agent | `archive_agent` with `{ agentId }` | Off the running list; transcript kept |
| archive a workspace and its leftovers | `archive_workspace` with `{ workspaceId }`, then `paseo project ls` and `paseo project delete <project-id>` for that worktree's project (see Gotchas) | Nothing of that ticket listed |
| create a recurring heartbeat to self | `create_heartbeat` with `{ cron: "<interval from workflow.md>", prompt: <the watch prompt>, name: "<slug> watch" }` | A heartbeat that prompts L0 on that cadence |
| delete the heartbeat | `delete_heartbeat` with `{ name }` or its id. There is no update tool: delete and recreate | No more pings |
| start a top-level successor session with labels | `env -u PASEO_AGENT_ID paseo run --no-wait --provider <family>/<model id> --mode bypassPermissions --cwd "$PASEO_AGENT_CWD" --title "<slug> S<n+1>: <tickets>" --label effort=<slug> --label session=<n+1> "<briefing>"`, then `paseo workspace rename <workspace-id> "<slug> S<n+1>: <tickets>"` | A new top-level session; record the returned agent id in the trail's `next` row |
| list running sessions by label | `paseo ls --label effort=<slug>`; MCP `list_agents` with `{ cwd, statuses, includeBackground: true }` | The chain's live sessions, or none |
| count running agents against the caps | `list_agents` (running only) and `list_workspaces` with `includeBackground: true` | Running agents and open worktrees, to compare with the caps in workflow.md |
| model choice with no id given | `list_profiles` first, read every profile's `notes`, then materialize the matching one into `create_agent` (`provider` = `family/model`, plus its `settings`) | A provider and settings for any launch |

## Gotchas

- **A worktree workspace leaves a project behind.** `create_workspace` on a worktree path also registers a Paseo project, and `archive_workspace` leaves that project in place. At landing, archive the workspace **and** run `paseo project delete <id>` for that worktree's project, after checking `paseo project ls` shows the worktree path.
- **Never delete the main checkout's project.** `create_workspace` on the main path returns the main project id, and deleting it once killed the lead session. At session start and close, list workspaces and projects with `includeBackground: true` and clean only the ones whose ticket already landed.
- **The successor must be top-level.** `env -u PASEO_AGENT_ID` before `paseo run` keeps the new session out of the closing session's parentage, so it survives that session being archived. `--no-wait` returns at once. `paseo run` names the new workspace after the branch, so rename it immediately.
- **`notifyOnFinish` means do not poll.** Finish your turn and wait for the notification. Poll only when a notification is already lost, and recover it from `get_agent_activity`.
- **`send_agent_prompt` revives agents after a reboot.** The agent keeps its history; rerun any background suite that died with the host.
- **Context size comes from `get_agent_status` → `lastUsage`.** Compare it with the ceiling workflow.md sets, and start a fresh agent past it.
- **Heartbeats have no update.** `create_heartbeat` and `delete_heartbeat` only; change the cadence by deleting and recreating.
- **`list_profiles` first.** When no model is named, read the profiles' notes before choosing a provider and thinking level.
