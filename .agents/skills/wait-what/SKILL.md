---
name: wait-what
description: "That last message did not land: re-pitch it in plain words, or catch the user up on what changed and what waits on them."
disable-model-invocation: true
---

# Wait, what?

## Modes

| Mode | When | Body |
|---|---|---|
| re-pitch (default) | The last message didn't land | [wait-what](references/matt/wait-what/wait-what.md); for a simpler restate with no glossary, [bro](references/pstack/bro/bro.md) |
| catch up | What changed since the user's last message, and every item waiting on them | [ketchup](references/pstack/ketchup/ketchup.md) |

Where `wait-what` says `GLOSSARY.md`, use the glossary file `docs/agents/domain.md` records. The `rigor` close report uses the catch-up shape.
