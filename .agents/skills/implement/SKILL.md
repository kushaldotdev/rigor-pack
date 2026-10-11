---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---
Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

read and follow .agents/skills/tdd/SKILL.md where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, read and follow .agents/skills/code-review/SKILL.md to review the work.

Commit your work to the current branch.

## pi notes

- Issue-tracker operations use the repo's configured tracker (see the repo's agent docs for which CLI and workflow).
