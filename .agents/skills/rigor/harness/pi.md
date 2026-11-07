# pi

Verified against pi 1.3.0 and pi-subagents 0.78.0 (2026-10-20).

- **Skills.** Discovers `.agents/skills/` natively. Invoke with `/skill:<name>`. Skills with `disable-model-invocation: true` are invisible to the model, so reach pack files by path, never by name.
- **Children.** pi core has no subagent tool; the `pi-subagents` extension provides `subagent`. Children start narrow: no project instructions, no skills catalog. Deliver work as an absolute-path packet: the brief, the standing orders, and absolute paths of the files to read. The `skill:` option delivers only advertised skills; hidden ones are silently dropped.
- **Parallel.** One `subagent({ workflow: true })` call with `runs.all([...])` for a wave. Async is the default; `async: false` blocks.
- **Wait / loop.** Background completions notify the parent. For watchers and heartbeats use pi-subagents schedules (`action: "schedule.create"`).
- **Model roles.** `agentOverrides` in pi-subagents settings; read them during setup, never at runtime.
- **Transcripts.** `~/.pi/agent/sessions/--<cwd with / as ->--/*.jsonl`. `scripts/pi-delegation.mjs --for <dir>` reads the newest file there and counts one L1's `subagent` calls per child.
- **Child contract.** A pi child runs to the end of its own turn. A packet that gives it children must say "never end your turn while a child runs", or it reports before its worker or reviewer has spoken.
- **Fallbacks.** No pi-subagents: run units serially in-session and log `degraded: serial`; reviews then run as personas, labeled "single-family".
