# Claude Code

Verified against the Claude Code skills and memory docs (2026-10-20).

- **Skills.** Does not read `.agents/skills/`. The installer adds per-skill symlinks `.claude/skills/<name>` → `../../.agents/skills/<name>`. Invoke with `/<name>`. Claude Code ships a built-in `/code-review`; this pack's `code-review` may be shadowed by it, so `rigor` reaches it by path.
- **Instructions.** Reads `CLAUDE.md`; reads `AGENTS.md` only without a `CLAUDE.md`, or when `CLAUDE.md` imports `@AGENTS.md`.
- **Children.** The Agent (Task) tool. A subagent definition's `skills:` field preloads advertised skills only. Always send the absolute-path packet anyway.
- **Parallel.** Several Agent calls in one message; background agents notify on completion.
- **Wait / loop.** `/loop` and scheduled wakeups.
- **Model roles.** `model:` in `.claude/agents/*.md`. Families other than Claude are unverified, so cross-family review is usually unavailable: label reviews "single-family". Never enable fast mode (`/fast`) for a run or a child.
- **Transcripts.** `~/.claude/projects/<cwd-slug>/*.jsonl`.
- **Subagent lifetime.** An Agent-tool subagent has a short prompt cache (about 5 minutes), so only disposable work goes there: a narrow review or a scout, one brief, one result in `tmp/`, never resumed. Long roles (planner, takeover, verify driver) run as full sessions through the delegation adapter, and a session idle for over an hour is handed over from a state file, never resumed.
- **Fallbacks.** No background agents: blocking waves capped at the brief's unit budget.
