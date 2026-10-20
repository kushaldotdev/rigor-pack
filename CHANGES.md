# CHANGES: provenance

Every vendor skill, where its copy lives in the pack, and what was done to it. The machine-checked version of this table is `.agents/skills/manifest.json` (sha256 of every vendor file, its pre-rewrite body and its copy). `node scripts/check-pack.mjs` fails if a copy, a vendor file or the plan drifts from it.

## Rules

1. `vendors/` is never edited. The build reads it and writes copies under `.agents/skills/<host>/references/<vendor>/<name>/`.
2. A copied `SKILL.md` becomes `<name>.md` in the same folder, with its YAML frontmatter stripped, so no harness lists it as a second skill. The trigger phrases from the stripped `description` reappear in the host's Modes table.
3. Bodies change in three ways only. **Relink**: a relative markdown link or inline-code path that pointed at another vendor file is rewritten to that file's new relative location. **Alias resolution** (rule 4). **Harness-neutral rewrites**: exact `[old, new]` pairs listed in `scripts/harness-neutral.mjs`, each of which must match exactly once or the build fails. Links that were already dangling upstream (pstack's unvendored `docs/`, illustrative example paths) are left as they are and listed in the manifest as `danglingUpstream`.
4. A vendor skill whose whole body is one line, `Call the Skill tool with "<name>"`, is an **alias**, not a skill: nothing is copied for it, no row appears here, and its name is rewritten to `<name>` wherever a copied body mentions it. `vendors/` keeps the alias folder. One alias resolves this way today (into `grilling`).
5. Vendor `agents/openai.yaml` files are not copied. Each host gets a generated one from its own frontmatter.
6. Each host carries the `LICENSE` of every vendor it copies from (`references/<vendor>/LICENSE`).
7. Anything that differs from upstream behaviour is said once, in a hand-written file: the host `SKILL.md` (modes, precedence), `rigor/AFK.md` (what each interactive line means in an AFK run), `rigor/INTERVIEW.md`, `rigor/harness/*.md`, `setup/templates/workflow.md`. Those files are the complete list of new prose.

## Upstream pins

| Vendor | Ref |
|---|---|
| mattpocock/skills | `49dd158d1076134a641b33efb035946536778336` (v1.3.1), `engineering/` + `productivity/` |
| cursor/plugins pstack | `d457567332aa6989e753ea289f30ea2bfbc80bc0` (v0.15.28), `skills/` |

## Skill bodies (81 copied, 1 dropped, 1 alias resolved)

"Other files" counts the rest of the vendor folder copied with it (references, templates, scripts, playbooks).

| Vendor | Upstream skill | Host | Copy | Other files | Transform |
|---|---|---|---|---|---|
| matt | `engineering/ask-matt` | `rigor` | `rigor/references/matt/ask-matt/ask-matt.md` | 1 | strip frontmatter, rename |
| matt | `engineering/code-review` | `code-review` | `code-review/references/matt/code-review/code-review.md` | 0 | strip frontmatter, rename |
| matt | `engineering/codebase-design` | `codebase-design` | `codebase-design/references/matt/codebase-design/codebase-design.md` | 2 | strip frontmatter, rename, relink (2 files) |
| matt | `engineering/diagnosing-bugs` | `diagnosing-bugs` | `diagnosing-bugs/references/matt/diagnosing-bugs/diagnosing-bugs.md` | 1 | strip frontmatter, rename |
| matt | `engineering/domain-modeling` | `domain-modeling` | `domain-modeling/references/matt/domain-modeling/domain-modeling.md` | 2 | strip frontmatter, rename |
| matt | `engineering/grill-with-docs` | `grilling` | `grilling/references/matt/grill-with-docs/grill-with-docs.md` | 0 | strip frontmatter, rename |
| matt | `engineering/implement-spec` | `rigor` | `rigor/references/matt/implement-spec/implement-spec.md` | 0 | strip frontmatter, rename |
| matt | `engineering/implement` | `rigor` | `rigor/references/matt/implement/implement.md` | 0 | strip frontmatter, rename |
| matt | `engineering/improve-codebase-architecture` | `rigor` | `rigor/references/matt/improve-codebase-architecture/improve-codebase-architecture.md` | 1 | strip frontmatter, rename |
| matt | `engineering/pr` | `writing` | `writing/references/matt/pr/pr.md` | 1 | strip frontmatter, rename |
| matt | `engineering/prototype` | `prototype` | `prototype/references/matt/prototype/prototype.md` | 2 | strip frontmatter, rename, relink (2 files) |
| matt | `engineering/research` | `research` | `research/references/matt/research/research.md` | 0 | strip frontmatter, rename |
| matt | `engineering/retro` | `retro` | `retro/references/matt/retro/retro.md` | 0 | strip frontmatter, rename |
| matt | `engineering/setup-matt-pocock-skills` | `setup` | `setup/references/matt/setup-matt-pocock-skills/setup-matt-pocock-skills.md` | 5 | strip frontmatter, rename |
| matt | `engineering/tdd` | `tdd` | `tdd/references/matt/tdd/tdd.md` | 2 | strip frontmatter, rename |
| matt | `engineering/to-spec` | `rigor` | `rigor/references/matt/to-spec/to-spec.md` | 0 | strip frontmatter, rename |
| matt | `engineering/to-tickets` | `rigor` | `rigor/references/matt/to-tickets/to-tickets.md` | 0 | strip frontmatter, rename |
| matt | `engineering/triage` | `triage` | `triage/references/matt/triage/triage.md` | 2 | strip frontmatter, rename |
| matt | `engineering/wayfinder` | `rigor` | `rigor/references/matt/wayfinder/wayfinder.md` | 0 | strip frontmatter, rename |
| matt | `engineering/wizard` | `setup` | `setup/references/matt/wizard/wizard.md` | 1 | strip frontmatter, rename |
| matt | `productivity/grilling` | `grilling` | `grilling/references/matt/grilling/grilling.md` | 0 | strip frontmatter, rename |
| matt | `productivity/handoff` | `handoff` | `handoff/references/matt/handoff/handoff.md` | 0 | strip frontmatter, rename |
| matt | `productivity/teach` | `teach` | `teach/references/matt/teach/teach.md` | 4 | strip frontmatter, rename, relink (1 file) |
| matt | `productivity/to-questionnaire` | `grilling` | `grilling/references/matt/to-questionnaire/to-questionnaire.md` | 0 | strip frontmatter, rename |
| matt | `productivity/wait-what` | `wait-what` | `wait-what/references/matt/wait-what/wait-what.md` | 0 | strip frontmatter, rename |
| matt | `productivity/writing-for-agents` | `writing` | `writing/references/matt/writing-for-agents/writing-for-agents.md` | 1 | strip frontmatter, rename, relink (1 file) |
| pstack | `architect` | `codebase-design` | `codebase-design/references/pstack/architect/architect.md` | 3 | strip frontmatter, rename, relink (1 file) |
| pstack | `arena` | `codebase-design` | `codebase-design/references/pstack/arena/arena.md` | 0 | strip frontmatter, rename |
| pstack | `automate-me` | `retro` | `retro/references/pstack/automate-me/automate-me.md` | 0 | strip frontmatter, rename |
| pstack | `benchmark-checklist` | `verify` | `verify/references/pstack/benchmark-checklist/benchmark-checklist.md` | 0 | strip frontmatter, rename |
| pstack | `blast-radius` | `code-review` | `code-review/references/pstack/blast-radius/blast-radius.md` | 0 | strip frontmatter, rename |
| pstack | `bro` | `wait-what` | `wait-what/references/pstack/bro/bro.md` | 0 | strip frontmatter, rename |
| pstack | `correct` | `retro` | `retro/references/pstack/correct/correct.md` | 0 | strip frontmatter, rename |
| pstack | `create-formal-verification-skill` | `verify` | `verify/references/pstack/create-formal-verification-skill/create-formal-verification-skill.md` | 0 | strip frontmatter, rename |
| pstack | `create-verification-skill` | `verify` | `verify/references/pstack/create-verification-skill/create-verification-skill.md` | 3 | strip frontmatter, rename |
| pstack | `figure-it-out` | `rigor` | `rigor/references/pstack/figure-it-out/figure-it-out.md` | 0 | strip frontmatter, rename |
| pstack | `how` | `research` | `research/references/pstack/how/how.md` | 2 | strip frontmatter, rename |
| pstack | `in-your-own-words` | `grilling` | `grilling/references/pstack/in-your-own-words/in-your-own-words.md` | 0 | strip frontmatter, rename |
| pstack | `interrogate` | `code-review` | `code-review/references/pstack/interrogate/interrogate.md` | 4 | strip frontmatter, rename |
| pstack | `ketchup` | `wait-what` | `wait-what/references/pstack/ketchup/ketchup.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `maintain-formal-verification-skill` | `verify` | `verify/references/pstack/maintain-formal-verification-skill/maintain-formal-verification-skill.md` | 0 | strip frontmatter, rename |
| pstack | `maintain-verification-skill` | `verify` | `verify/references/pstack/maintain-verification-skill/maintain-verification-skill.md` | 0 | strip frontmatter, rename |
| pstack | `no-comments` | `code-review` | `code-review/references/pstack/no-comments/no-comments.md` | 0 | strip frontmatter, rename |
| pstack | `poteto-help` | `rigor` | `rigor/references/pstack/poteto-help/poteto-help.md` | 2 | strip frontmatter, rename, relink (1 file) |
| pstack | `poteto-mode` | `rigor` | `rigor/references/pstack/poteto-mode/poteto-mode.md` | 45 | strip frontmatter, rename |
| pstack | `principle-attack-the-premise` | `diagnosing-bugs` | `diagnosing-bugs/references/pstack/principle-attack-the-premise/principle-attack-the-premise.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `principle-boundary-discipline` | `codebase-design` | `codebase-design/references/pstack/principle-boundary-discipline/principle-boundary-discipline.md` | 0 | strip frontmatter, rename |
| pstack | `principle-build-the-lever` | `rigor` | `rigor/references/pstack/principle-build-the-lever/principle-build-the-lever.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `principle-encode-lessons-in-structure` | `retro` | `retro/references/pstack/principle-encode-lessons-in-structure/principle-encode-lessons-in-structure.md` | 0 | strip frontmatter, rename |
| pstack | `principle-exhaust-the-design-space` | `codebase-design` | `codebase-design/references/pstack/principle-exhaust-the-design-space/principle-exhaust-the-design-space.md` | 0 | strip frontmatter, rename |
| pstack | `principle-experience-first` | `rigor` | `rigor/references/pstack/principle-experience-first/principle-experience-first.md` | 0 | strip frontmatter, rename |
| pstack | `principle-explain-the-number` | `verify` | `verify/references/pstack/principle-explain-the-number/principle-explain-the-number.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `principle-fix-root-causes` | `diagnosing-bugs` | `diagnosing-bugs/references/pstack/principle-fix-root-causes/principle-fix-root-causes.md` | 0 | strip frontmatter, rename |
| pstack | `principle-foundational-thinking` | `codebase-design` | `codebase-design/references/pstack/principle-foundational-thinking/principle-foundational-thinking.md` | 0 | strip frontmatter, rename |
| pstack | `principle-guard-the-context-window` | `rigor` | `rigor/references/pstack/principle-guard-the-context-window/principle-guard-the-context-window.md` | 0 | strip frontmatter, rename |
| pstack | `principle-laziness-protocol` | `codebase-design` | `codebase-design/references/pstack/principle-laziness-protocol/principle-laziness-protocol.md` | 0 | strip frontmatter, rename |
| pstack | `principle-make-operations-idempotent` | `codebase-design` | `codebase-design/references/pstack/principle-make-operations-idempotent/principle-make-operations-idempotent.md` | 0 | strip frontmatter, rename |
| pstack | `principle-migrate-callers-then-delete-legacy-apis` | `codebase-design` | `codebase-design/references/pstack/principle-migrate-callers-then-delete-legacy-apis/principle-migrate-callers-then-delete-legacy-apis.md` | 0 | strip frontmatter, rename |
| pstack | `principle-minimize-reader-load` | `codebase-design` | `codebase-design/references/pstack/principle-minimize-reader-load/principle-minimize-reader-load.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `principle-model-the-domain` | `domain-modeling` | `domain-modeling/references/pstack/principle-model-the-domain/principle-model-the-domain.md` | 0 | strip frontmatter, rename |
| pstack | `principle-never-block-on-the-human` | `rigor` | `rigor/references/pstack/principle-never-block-on-the-human/principle-never-block-on-the-human.md` | 0 | strip frontmatter, rename |
| pstack | `principle-outcome-oriented-execution` | `rigor` | `rigor/references/pstack/principle-outcome-oriented-execution/principle-outcome-oriented-execution.md` | 0 | strip frontmatter, rename |
| pstack | `principle-prove-it-works` | `verify` | `verify/references/pstack/principle-prove-it-works/principle-prove-it-works.md` | 0 | strip frontmatter, rename |
| pstack | `principle-redesign-from-first-principles` | `codebase-design` | `codebase-design/references/pstack/principle-redesign-from-first-principles/principle-redesign-from-first-principles.md` | 0 | strip frontmatter, rename |
| pstack | `principle-separate-before-serializing-shared-state` | `codebase-design` | `codebase-design/references/pstack/principle-separate-before-serializing-shared-state/principle-separate-before-serializing-shared-state.md` | 0 | strip frontmatter, rename |
| pstack | `principle-sequence-verifiable-units` | `rigor` | `rigor/references/pstack/principle-sequence-verifiable-units/principle-sequence-verifiable-units.md` | 0 | strip frontmatter, rename |
| pstack | `principle-subtract-before-you-add` | `codebase-design` | `codebase-design/references/pstack/principle-subtract-before-you-add/principle-subtract-before-you-add.md` | 0 | strip frontmatter, rename |
| pstack | `principle-test-behavior-not-implementation` | `tdd` | `tdd/references/pstack/principle-test-behavior-not-implementation/principle-test-behavior-not-implementation.md` | 0 | strip frontmatter, rename |
| pstack | `principle-type-system-discipline` | `codebase-design` | `codebase-design/references/pstack/principle-type-system-discipline/principle-type-system-discipline.md` | 0 | strip frontmatter, rename |
| pstack | `recall` | `research` | `research/references/pstack/recall/recall.md` | 0 | strip frontmatter, rename |
| pstack | `reflect` | `retro` | `retro/references/pstack/reflect/reflect.md` | 4 | strip frontmatter, rename |
| pstack | `setup-pstack` | `setup` | `setup/references/pstack/setup-pstack/setup-pstack.md` | 0 | strip frontmatter, rename |
| pstack | `sharpen` | `grilling` | `grilling/references/pstack/sharpen/sharpen.md` | 0 | strip frontmatter, rename |
| pstack | `show-me-your-work` | `rigor` | `rigor/references/pstack/show-me-your-work/show-me-your-work.md` | 2 | strip frontmatter, rename |
| pstack | `swarm` | `rigor` | `rigor/references/pstack/swarm/swarm.md` | 0 | strip frontmatter, rename |
| pstack | `tdd` | `tdd` | `tdd/references/pstack/tdd/tdd.md` | 0 | strip frontmatter, rename |
| pstack | `teach` | `teach` | `teach/references/pstack/teach/teach.md` | 0 | strip frontmatter, rename |
| pstack | `technical-writing` | `writing` | `writing/references/pstack/technical-writing/technical-writing.md` | 0 | strip frontmatter, rename |
| pstack | `typescript-best-practices` | `codebase-design` | `codebase-design/references/pstack/typescript-best-practices/typescript-best-practices.md` | 1 | strip frontmatter, rename |
| pstack | `unslop` | `writing` | `writing/references/pstack/unslop/unslop.md` | 0 | strip frontmatter, rename |
| pstack | `why` | `research` | `research/references/pstack/why/why.md` | 12 | strip frontmatter, rename |
| pstack | `make-bot-ui` | dropped | none | none | Depends on Cursor routines, `update_state` and `SendToUser`; no equivalent on pi, Codex or Claude Code. |

Also copied: Matt's bucket READMEs as `rigor/references/matt/{engineering,productivity}-README.md` (relinked).

## Behaviour that differs from upstream, and where it is said

| Upstream behaviour | In this pack | Said in |
|---|---|---|
| Two routers (`ask-matt`, `poteto-mode` / `poteto-help`) | One entry, `rigor`; both routers are read as orientation | `rigor/SKILL.md` §1 |
| Mid-flow questions (`tdd` seams, `to-tickets` quiz, `code-review` fixed point, `improve-codebase-architecture` pick, …) | Asked once in the opening interview; mid-run they read the brief or decide-and-log | `rigor/INTERVIEW.md`, `rigor/AFK.md` |
| `setup-matt-pocock-skills` edits whichever of `CLAUDE.md` / `AGENTS.md` exists | `AGENTS.md` canonical plus `CLAUDE.md` importing `@AGENTS.md`, so Codex and Claude both read it | `setup/SKILL.md` §2.4 |
| `setup-pstack` picks models and writes a Cursor rule | Records the roles each harness already configures; never picks | `setup/SKILL.md` §2.9 |
| Glossary is `GLOSSARY.md` | The filename the repo already has (`GLOSSARY.md` or `CONTEXT.md`), recorded in `docs/agents/domain.md`; never renamed | `setup/SKILL.md` §2.3, host pack rules |
| PR body: Matt `pr` vs pstack `opening-a-pr` | `setup` asks per repo | `setup/SKILL.md` §2.6, `writing/SKILL.md` |
| Merge authority | Merge-ready by default; `setup` can grant merge per repo | `setup/templates/workflow.md` |
| `unslop` | Always on for prose (as upstream poteto-mode) | `writing/SKILL.md` |
| Cursor `Task`, `poteto-agent`, cloud agents, `/loop`, `cursor-team-kit`, `agent-transcripts/` | Per-harness primitive and fallback | `rigor/harness/*.md`, `rigor/SKILL.md` §3 |
| `create-verification-skill` writes `.cursor/skills/verify-<app>/` | Writes `.agents/skills/verify-<app>/` | `verify/SKILL.md` |
| `show-me-your-work` trail local by default | Committed under `.audit/` so a run resumes from any clone | `rigor/SKILL.md` §3-§4 |
| `handoff` writes to the OS temp dir | Inside a rigor run, `.audit/<slug>.handoff.md` | `handoff/SKILL.md` |
| `no-comments` spawns Cursor's Comment Sicko | Apply its rules directly | `code-review/SKILL.md` |
| poteto-mode playbooks split across concerns | Kept whole under `rigor/references/pstack/poteto-mode/` so their internal links work; other hosts link into it | host Modes tables |

## Lost on purpose

- Direct slash entry to `/architect`, `/interrogate`, `/blast-radius`, `/how`, `/why`, `/swarm`, `/arena`, `/figure-it-out`, `/correct`, `/benchmark-checklist`. Reach them through their host skill's mode or a `rigor` route.
- Each principle leaf's own description, and with it independent model-triggering of principles.
- Cursor cloud agents and Bugbot, with no replacement.
