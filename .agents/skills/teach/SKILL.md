---
name: teach
description: "Teach the user a concept over several sessions in a stateful workspace, or explain a body of code plainly in one go."
argument-hint: "What would you like to learn about?"
disable-model-invocation: true
---

# Teach

## Modes

| Mode | When | Body |
|---|---|---|
| explain (default) | "Explain this change or subsystem to me", one sitting | [teach (pstack)](references/pstack/teach/teach.md), which runs `how` and `why` from the [research](../research/SKILL.md) skill |
| workspace | The user asks to learn something over several sessions | [teach (matt)](references/matt/teach/teach.md), with its four `*-FORMAT.md` files |

Use workspace mode only when the user asks to learn over several sessions. Upstream names resolve through [the name index](../rigor/references/INDEX.md).
