---
name: domain-modeling
description: "Build and sharpen a project's domain model: glossary terms, ADRs, and the data structure that encodes the domain. Use when discussing codebase terminology, editing the glossary, recording an ADR, or writing stateful or heavily branching logic."
---

# Domain modeling

## Modes

| Mode | When | Body |
|---|---|---|
| glossary and ADRs (default) | Challenge a fuzzy term, resolve an overloaded word, record a hard-to-reverse decision | [domain-modeling](references/matt/domain-modeling/domain-modeling.md), with [ADR-FORMAT](references/matt/domain-modeling/ADR-FORMAT.md) and [GLOSSARY-FORMAT](references/matt/domain-modeling/GLOSSARY-FORMAT.md) |
| model the domain in code | Stateful logic, or code that branches a lot or repeats a shape assumption across files | [principle-model-the-domain](references/pstack/principle-model-the-domain/principle-model-the-domain.md) |

## Pack rules

- Where a body says `GLOSSARY.md`, use the glossary file that `docs/agents/domain.md` records. Never rename a repo's existing glossary file.
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
- Inside a `rigor` run, [AFK.md](../rigor/AFK.md) overrides any line that waits on the user.
