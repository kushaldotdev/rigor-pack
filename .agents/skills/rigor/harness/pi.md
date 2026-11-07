# pi

Verified against pi 1.3.0 and pi-subagents 0.78.0 (2026-10-20).

- **Skills.** Discovers `.agents/skills/` natively. Invoke with `/skill:<name>`. Skills with `disable-model-invocation: true` are invisible to the model, so reach pack files by path, never by name.
- **Children.** pi core has no subagent tool; the `pi-subagents` extension provides `subagent`. Children start narrow: no project instructions, no skills catalog. Deliver work as an absolute-path packet: the brief, the standing orders, and absolute paths of the files to read. The `skill:` option delivers only advertised skills; hidden ones are silently dropped.
- **Parallel.** One `subagent({ workflow: true })` call with `runs.all([...])` for a wave. Async is the default; `async: false` blocks.
- **Wait / loop.** When the user has a pi subagent policy skill, its async rule governs and the repo's PROJECT RULES (`docs/agents/packet-rules.md`) name its path; this note matches it. An interactive parent lets async children wake it: no `bg_wait()`, no `status` polling. A run-to-completion parent (a chain L1, any L2 that launches children, any headless or Paseo-driven pi agent) waits in a loop of `bg_wait({ timeoutMs: 600000 })`: 10 minutes or less, never a `bg_wait` without `timeoutMs`. On each timeout it checks each running child's progress once, nudges or interrupts a stalled one, and appends a progress-log line. Schedules are not heartbeats for children; L0's 15-minute watch runs in L0's harness.
- **Model roles.** `agentOverrides` in pi-subagents settings; read them during setup, never at runtime.
- **Transcripts.** `~/.pi/agent/sessions/--<cwd with / as ->--/*.jsonl`. `scripts/pi-delegation.mjs --for <dir>` reads the newest file there and counts one L1's `subagent` calls per child.
- **Child contract.** A pi child runs to the end of its own turn. A packet that gives it children must say "never end your turn while a child runs" and give the bounded wait above, or it reports before its worker or reviewer has spoken.
- **Fallbacks.** No pi-subagents: run units serially in-session and log `degraded: serial`; reviews then run as personas, labeled "single-family".
