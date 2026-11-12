# Project rules for implementer packets

Build it into every implementer packet: `scripts/mkpacket.mjs` reads this file unless it is passed `--project-rules <file>`. It binds as much as the pack's own packet rules. Replace every `<...>` and delete any line that doesn't apply.

## Environment and secrets

- Never open, print, grep or source any `.env` file. `<where the real values come from instead>`
- `<how a child gets a working environment: exported vars, a compose project, a throwaway database, a make target>`
- Never touch the shared dev stack: `<what it is, and what a child must start for itself>`

## Tests in isolation

- `<the recipe for a throwaway environment: the script, the container names, the migrate step>`
- `<how a child proves a test is red on the task base without checking out over its own work>`

## Check commands

Run these before every report, in this order:

- `<lint>` · `<format check>` · `<typecheck>`
- Targeted tests: `<how to run one test file>`
- Full gate (the lead runs it on the staged squash): `<command>`
- Cheap gate checks, before every hand-back at every band: `<the gate's fast checks an implementer can run alone, so none of them costs a round at the gate: a new-suppression or lint-baseline check against the task base, import contracts, coverage of the lines the task added>`

## Architecture rules

<!-- mkpacket.mjs inlines this section into the packet body as ARCHITECTURE RULES. The skill files own the architecture text: quote them with INLINE lines, never copy their rules here. An `INLINE: <path>#<Heading>` line becomes that heading's section of the file (path relative to the repo root); a missing file or heading stops the packet build. Other lines are this repo's own bindings. -->

INLINE: .agents/skills/codebase-design/references/matt/codebase-design/codebase-design.md#Principles
INLINE: .agents/skills/codebase-design/references/matt/codebase-design/codebase-design.md#Deep vs shallow

- ADRs: `<where the ADRs live>`; a change that contradicts one stops and asks the lead.
- Contracts: `<the import-contract or lint command whose output the self-review quotes>`

## Subagent policy

- `<path to this harness's subagent policy, or: none; the packet's own size rule decides>`

## Cleanup duties

- `<what a child must remove before reporting: containers, volumes, scratch databases, files it created as another user>`
- `<what must never be deleted: another writer's scratch, other sessions' volumes>`
- List created and removed items in the report.
