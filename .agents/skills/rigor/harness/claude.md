# Claude Code

Verified against the Claude Code skills and memory docs (2026-10-20).

- **Skills.** Does not read `.agents/skills/`; the installer adds per-skill symlinks `.claude/skills/<name>` → `../../.agents/skills/<name>`. Invoke with `/<name>`. The built-in `/code-review` may shadow this pack's, so `rigor` reaches it by path.
- **Instructions.** Reads `CLAUDE.md`; reads `AGENTS.md` only without a `CLAUDE.md`, or when `CLAUDE.md` imports `@AGENTS.md`.
- **Children.** The Agent (Task) tool. A definition's `skills:` field preloads advertised skills only; send the absolute-path packet anyway.
- **Parallel.** Several Agent calls in one message; background agents notify on completion.
- **Wait / loop.** `/loop` and scheduled wakeups. A run-to-completion session (a takeover or verify driver a delegation tool drives) never ends its turn while a child runs: ending it is its finish notification. It starts children in the foreground (several Agent calls in one message run at once) or waits in 10-minute slices.
- **Model roles.** `model:` in `.claude/agents/*.md`. Non-Claude families are unverified, so cross-family review is usually unavailable: label reviews "single-family". Never enable fast mode (`/fast`) for a run or a child.
- **Transcripts.** `~/.claude/projects/<cwd-slug>/*.jsonl`.
- **Subagent lifetime.** An Agent-tool subagent keeps a short prompt cache (~5 minutes), so only disposable work goes there: a narrow review or a scout, one brief, one result in `tmp/`, never resumed, with one exception: a self-review lens child takes its next-loop delta brief through SendMessage to its agent id, which keeps its context (`templates/self-review.txt`), its size visible in its transcript. A child that stops answering gets a fresh launch with its loop-1 brief and the delta brief. Long roles (planner, takeover, verify driver) run as full sessions through the adapter; a session idle over an hour is handed over from a state file, never resumed.
- **After a restart.** An Agent-tool subagent does not survive a host or Claude Code restart, and its row may spin with no end record. Judge it by its transcript's last write under `~/.claude/projects/<cwd-slug>/<session>/subagents/`, relaunch it from its brief, and say once that the dead row cannot be removed.
- **Fallbacks.** No background agents: blocking waves capped at the brief's unit budget.
