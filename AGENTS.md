# rigor-pack: agent rules

Read [README.md](README.md) → "Repo rules" first. In short:

- `vendors/` is never edited by hand. Only replace it wholesale with the latest upstream at a new pin.
- Never edit `.agents/skills/*/references/{matt,pstack}/`. Run `node scripts/build-pack.mjs` and `node scripts/check-pack.mjs`; both must pass before any commit.
- Behaviour changes go in hand-written files (CHANGES.md rule 7) or in `scripts/harness-neutral.mjs`.
- Name no private project in the pack. A delegation tool appears only in `rigor/delegation/<tool>.md`.
- Never use fast-mode models. Commit locally; push only when the owner asks.
- Before handing back, consolidate the unpushed commits: fold commits that change the same thing into one, keep unrelated changes in their own commits, and lose no change or body bullet. Never rewrite a commit already on GitHub (owner, 2026-11-07).
