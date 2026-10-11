---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

Save it in the current working directory as `tmp/<timestamp>-<what-we-did>.md`:

- Write to `tmp/`, creating it if it does not exist. If that directory is not writable, fall back to the OS temporary directory (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) and say which one you used.
- Timestamp is local time in `YYYYMMDD-HHMM` format.
- `<what-we-did>` is a short lowercase kebab-case slug of the work this handoff covers, 3–6 words, derived from the conversation and from any passed arguments — e.g. `tmp/20261001-0130-fix-subagent-skill-drift.md`.
- Leave the file untracked. If `tmp/` is not covered by `.gitignore`, say so in your reply rather than editing `.gitignore` unasked.

End your reply with the handoff file's absolute path on its own line, in a plain code block, so the user can copy-paste it straight into the next session:

```
/absolute/path/to/handoff.md
```

Include a "suggested skills" section in the document, naming which skills the next agent should read and follow - by skill name, with each one's file under `<skills-root>/<name>/SKILL.md`.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
