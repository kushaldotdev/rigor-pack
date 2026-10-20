---
name: codebase-design
description: "Design a module's shape before code: deep-module vocabulary, parallel design exploration, design bakeoffs, and the design principles. Use when designing or improving an interface, deciding where a seam goes, sketching types before implementation, or editing TypeScript."
---

# Codebase design

## Modes

| Mode | When | Body |
|---|---|---|
| vocabulary (default) | Module, interface, depth, seam, adapter, leverage, locality | [codebase-design](references/matt/codebase-design/codebase-design.md), with [DEEPENING](references/matt/codebase-design/DEEPENING.md) and [DESIGN-IT-TWICE](references/matt/codebase-design/DESIGN-IT-TWICE.md) |
| architect | Code crosses a function boundary, or jumping to code would lock in the wrong shape | [architect](references/pstack/architect/architect.md) |
| arena | N parallel candidates, pick a base, graft the best of the rest | [arena](references/pstack/arena/arena.md) |
| TypeScript | Reading or editing `.ts` / `.tsx` | [typescript-best-practices](references/pstack/typescript-best-practices/typescript-best-practices.md) |

## Principles

Read the leaf in full before you cite it.

| Principle | Applies when |
|---|---|
| [foundational-thinking](references/pstack/principle-foundational-thinking/principle-foundational-thinking.md) | Before writing logic: core types, scaffold-vs-feature order, shared state |
| [laziness-protocol](references/pstack/principle-laziness-protocol/principle-laziness-protocol.md) | Sizing a diff, tempted to add layers |
| [subtract-before-you-add](references/pstack/principle-subtract-before-you-add/principle-subtract-before-you-add.md) | Sequencing an addition, refactor, or rewrite |
| [minimize-reader-load](references/pstack/principle-minimize-reader-load/principle-minimize-reader-load.md) | Code that is hard to trace |
| [exhaust-the-design-space](references/pstack/principle-exhaust-the-design-space/principle-exhaust-the-design-space.md) | A novel decision with no precedent |
| [redesign-from-first-principles](references/pstack/principle-redesign-from-first-principles/principle-redesign-from-first-principles.md) | A new requirement meets an existing design |
| [boundary-discipline](references/pstack/principle-boundary-discipline/principle-boundary-discipline.md) | Validation, error handling, framework adapters |
| [type-system-discipline](references/pstack/principle-type-system-discipline/principle-type-system-discipline.md) | Designing types or a signature |
| [make-operations-idempotent](references/pstack/principle-make-operations-idempotent/principle-make-operations-idempotent.md) | Steps that run amid crashes and retries |
| [migrate-callers-then-delete-legacy-apis](references/pstack/principle-migrate-callers-then-delete-legacy-apis/principle-migrate-callers-then-delete-legacy-apis.md) | A new internal API while old callers exist |
| [separate-before-serializing-shared-state](references/pstack/principle-separate-before-serializing-shared-state/principle-separate-before-serializing-shared-state.md) | Concurrent writers to one file, branch, or key |

## Pack rules

- Where `architect` or `arena` names model roles, use the roles recorded in `docs/agents/workflow.md`. If the harness has one model family, run personas and label the verdict "single-family" ([harness notes](../rigor/harness/)).
- architect's opt-in checkpoint ("stop and show me") applies only when the human asked for it in the interview.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md). Inside a `rigor` run, [AFK.md](../rigor/AFK.md) overrides any line that waits on the user.
