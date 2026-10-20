---
name: grilling
description: "Interview the user about a plan, decision, or idea until nothing is assumed. Use when the user wants to stress-test their thinking, says grill, restate, sharpen, or needs a questionnaire for someone else."
---

# Grilling

The interview primitive. Facts are your job, decisions are the user's.

## Modes

Read the body for the mode, then follow it.

| Mode | When | Body |
|---|---|---|
| grill (default) | Stress-test a plan, decision, or idea | [grilling](references/matt/grilling/grilling.md) |
| grill with docs | In a repo: also sharpen glossary terms and record ADRs | [grill-with-docs](references/matt/grill-with-docs/grill-with-docs.md), which runs grilling plus the [domain-modeling](../domain-modeling/SKILL.md) skill |
| restate | Before round one: say back the user's goal and problem | [in-your-own-words](references/pstack/in-your-own-words/in-your-own-words.md) |
| sharpen | Before round one: the expert approach and the right level of specification | [sharpen](references/pstack/sharpen/sharpen.md) |
| questionnaire | The decision belongs to a third party | [to-questionnaire](references/matt/to-questionnaire/to-questionnaire.md) |

The `rigor` interview runs restate, then sharpen, then grill with docs.

## Pack rules

- Upstream bodies name other skills by upstream name ("call the Skill tool with `domain-modeling`"). Resolve each name in [the name index](../rigor/references/INDEX.md).
- Where a body says `GLOSSARY.md`, use the glossary file that `docs/agents/domain.md` records (`GLOSSARY.md` or `CONTEXT.md`).
- Grilling needs a human. It belongs to the start of a run, never to its AFK part.
