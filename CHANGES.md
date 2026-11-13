# CHANGES: provenance

Every vendor skill, where its copy lives in the pack, and what was done to it. The machine-checked version of this table is `.agents/skills/manifest.json` (sha256 of every vendor file, its pre-rewrite body and its copy; each skip pattern with its reason and how many vendor files it matches; the number of dropped skills). `node scripts/check-pack.mjs` fails if a copy, a vendor file or the plan drifts from it.

## Rules

1. `vendors/` is never edited. The build reads it and writes copies under `.agents/skills/<host>/references/<vendor>/<name>/`.
2. A copied `SKILL.md` becomes `<name>.md` in the same folder, with its YAML frontmatter stripped, so no harness lists it as a second skill. The trigger phrases from the stripped `description` reappear in the host's Modes table.
3. Bodies change in three ways only. **Relink**: a relative markdown link or inline-code path that pointed at another vendor file is rewritten to that file's new relative location. **Alias resolution** (rule 4). **Harness-neutral rewrites**: exact `[old, new]` pairs listed in `scripts/harness-neutral.mjs`, each of which must match exactly once or the build fails. Links that were already dangling upstream (pstack's unvendored `docs/`, illustrative example paths) are left as they are and listed in the manifest as `danglingUpstream`. Non-markdown copies are byte-identical, except that the same rules may drop a field naming a file the pack does not ship (a copied script's `test` script); a rewritten `.json` must still parse.
4. A vendor skill whose whole body is one line, `Call the Skill tool with "<name>"`, is an **alias**, not a skill: nothing is copied for it, no row appears here, and its name is rewritten to `<name>` wherever a copied body mentions it. `vendors/` keeps the alias folder. One alias resolves this way today (into `grilling`).
5. Vendor `agents/openai.yaml` files are not copied. Each host gets a generated one from its own frontmatter.
6. Each host carries the `LICENSE` of every vendor it copies from (`references/<vendor>/LICENSE`).
7. Anything that differs from upstream behaviour is said once, in a hand-written file: the host `SKILL.md` (modes, precedence), `rigor/AFK.md` (what each interactive line means in an AFK run), `rigor/INTERVIEW.md`, `rigor/CHAIN.md` (chain runs), `rigor/delegation/*.md` (one adapter per delegation tool), `rigor/harness/*.md`, `setup/templates/*.md`. Pack-owned tools are hand-written too: `rigor/scripts/*.mjs` and `rigor/templates/*.txt`. Those files are the complete list of new prose.

## Upstream pins

| Vendor | Ref |
|---|---|
| mattpocock/skills | `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (v1.3.2), `engineering/` + `productivity/` |
| cursor/plugins pstack | `6b0300214a09fd6029cfb7077043125758cd1fd2` (v0.15.36), `skills/` |

## Skill bodies (81 copied, 3 dropped, 1 alias resolved)

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
| pstack | `interrogate` | `code-review` | `code-review/references/pstack/interrogate/interrogate.md` | 0 | strip frontmatter, rename |
| pstack | `ketchup` | `wait-what` | `wait-what/references/pstack/ketchup/ketchup.md` | 0 | strip frontmatter, rename, relink (1 file) |
| pstack | `maintain-formal-verification-skill` | `verify` | `verify/references/pstack/maintain-formal-verification-skill/maintain-formal-verification-skill.md` | 0 | strip frontmatter, rename |
| pstack | `maintain-verification-skill` | `verify` | `verify/references/pstack/maintain-verification-skill/maintain-verification-skill.md` | 0 | strip frontmatter, rename |
| pstack | `no-comments` | `code-review` | `code-review/references/pstack/no-comments/no-comments.md` | 0 | strip frontmatter, rename |
| pstack | `poteto-mode` | `rigor` | `rigor/references/pstack/poteto-mode/poteto-mode.md` | 37 | strip frontmatter, rename |
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
| pstack | `statechart` | `verify` | `verify/references/pstack/statechart/statechart.md` | 30 | strip frontmatter, rename |
| pstack | `swarm` | `rigor` | `rigor/references/pstack/swarm/swarm.md` | 0 | strip frontmatter, rename |
| pstack | `tdd` | `tdd` | `tdd/references/pstack/tdd/tdd.md` | 0 | strip frontmatter, rename |
| pstack | `teach` | `teach` | `teach/references/pstack/teach/teach.md` | 0 | strip frontmatter, rename |
| pstack | `technical-writing` | `writing` | `writing/references/pstack/technical-writing/technical-writing.md` | 0 | strip frontmatter, rename |
| pstack | `typescript-best-practices` | `codebase-design` | `codebase-design/references/pstack/typescript-best-practices/typescript-best-practices.md` | 1 | strip frontmatter, rename |
| pstack | `unslop` | `writing` | `writing/references/pstack/unslop/unslop.md` | 0 | strip frontmatter, rename |
| pstack | `why` | `research` | `research/references/pstack/why/why.md` | 12 | strip frontmatter, rename |
| pstack | `make-bot-ui` | dropped | none | none | Depends on a routine runtime (`update_state`, `SendToUser`) that pi, Codex and Claude Code lack. |
| pstack | `poteto-help` | dropped | none | none | pstack's own product help (installing and running pstack in its original editor); no route in this pack uses it. |
| pstack | `ketchup-video` | dropped | none | none | Renders a slide video with no named renderer or encoder; `ketchup` (in `wait-what`) already covers the catch-up for AFK runs. |

## Skipped files (381 vendor files, not copied, still in `vendors/`)

The build copies only what a run can use. `scripts/pack-layout.mjs` → `SKIPPED` holds three patterns for the vendor files it leaves behind, and the manifest records each pattern with its reason and how many files it matches (`skipped`); `check-pack` recomputes both and fails if a count or a reason drifts from the plan, or if a vendor file is neither copied nor skipped.

| Pattern | Why | Count |
|---|---|---|
| `scripts/test/` inside a copied skill | upstream's own test suite: cases, fixtures and their helpers (`statechart`) | 376 |
| `*.test.ts` | upstream's unit tests; no copied script imports them, so there is nothing to run | 4 |
| `*.test-helper.ts` | fake harness used by the tests above | 1 |

They stay in `vendors/` for the next upgrade. Nothing in an installed pack runs them, and nothing in an installed pack names them either: the two copied `package.json` files whose `test` script named those files (`poteto-mode/scripts`, `statechart/scripts`) lose that script through a `scripts/harness-neutral.mjs` rule, and the build fails if the rewrite leaves invalid JSON.

## Behaviour that differs from upstream, and where it is said

| Upstream behaviour | In this pack | Said in |
|---|---|---|
| Two routers (`ask-matt`, `poteto-mode`; `poteto-help` dropped) | One entry, `rigor`; the routers are read as orientation | `rigor/SKILL.md` §1 |
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
| `orchestrate` keeps program state in the Project tracker and the Project store | State lives in the tracker and `.audit/<slug>/` | `rigor/SKILL.md` §1-§4, `rigor/AFK.md` |
| `handoff` writes to the OS temp dir | Inside a rigor run, `.audit/<slug>.handoff.md` | `handoff/SKILL.md` |
| `no-comments` spawns Cursor's Comment Sicko | Apply its rules directly | `code-review/SKILL.md` |
| `improve-codebase-architecture` writes an HTML report, asks which candidate to explore and grills the user | Run unattended by planners and architecture reviewers: step 1 as upstream, the candidates as a markdown pass file with fixed headings, every open point decided and logged, no HTML and no grilling | `rigor/templates/arch-pass.txt`, `rigor/CHAIN.md` |
| No chain method in either vendor | `rigor/CHAIN.md` is the method; every setting lives in `workflow.md` → Chain efforts; the delegation tool sits behind an adapter | `rigor/CHAIN.md`, `rigor/delegation/README.md`, `setup/SKILL.md` §2.10 |
| poteto-mode playbooks split across concerns | Kept whole under `rigor/references/pstack/poteto-mode/` so their internal links work; other hosts link into it | host Modes tables |

## Chain runs

`rigor/CHAIN.md` comes from no vendor: it is a method worked out over real ticket chains in 2026-10 and 2026-11, with every project setting lifted out. Every number, model id and command lives in the target repo's `docs/agents/workflow.md` → Chain efforts, written by `setup`. The delegation tool sits behind an adapter in `rigor/delegation/`, so the method names no tool.

2026-11-12, after a chain session where self-review grew to 50-85% of each implementer's wall time (probe children ran mutant tables, the whole suite and `sleep` polls, and hit the harness's 30-minute run cut) while the architecture rules sat in a file almost no one opened:

- `templates/self-review.txt`, packet rule 6, `mkpacket.mjs`: every self-review loop runs each lens as a read-only child, in parallel. Only a hard or critical task that changes behaviour (`--change behaviour`, the default; `--change refactor` opts out) gets one probe child, once, on the final loop, limited to 15 minutes, 5 attacks from the ORACLE, targeted test files, foreground runs and one container pair. A refactor's claim may stand on cited lines plus named existing tests.
- `harness/pi.md`: a probe child gets a 25-minute budget and reports partial results instead of being resumed.
- `mkpacket.mjs`: a hard or critical task file needs an `ARCHITECTURE` section naming its modules and their deletion-test result (or `ARCHITECTURE: none` with a reason). The project rules' `## Architecture rules` section is inlined into the packet body, and rule 6 makes the standards lens end with a fixed ARCHITECTURE block.
- `mkpacket.mjs`: an `INLINE: <path>#<Heading>` line in the project's Architecture rules expands into that section of the named file, so the skill files stay the one owner of the architecture text; a missing file or heading stops the build. The setup packet-rules template quotes `codebase-design` this way instead of restating it.
- `scripts/review-file.mjs` (new): checks a self-review file against its packet: a section per lens, the probe when due, and the ARCHITECTURE block filled.
- `CHAIN.md` and `scripts/land-check.mjs` (new): every ticket of band medium and above gets an unprompted improve-codebase-architecture pass on its staged squash (hard and critical also on the plan), recorded as an `arch` trail row; `land-check.mjs` blocks landing without a passing row and an existing report. The setup workflow template names the pass and the gate.
- `CHAIN.md`: two L0 reviewers only for a task of hardness 4+, one reviewer both axes otherwise and for every delta; about 4-5 tasks per ticket, parallel tasks marked by the planner; one full suite per ticket, on the staged squash; an escalation ladder (fresh implementer with a structural brief, then a `second implementer` model, then the takeover role); an `improve-codebase-architecture` pass at plan and at the staged squash for hard and critical tickets.

2026-11-13, after a chain planner read neither architecture skill until L0 steered it, and had already decided where a moved rule should live by then. The planner brief listed the skills only inside the description of the plan's ARCHITECTURE section, after its read list and its task, so it read the code, decided, and left the skills for last; the earlier fix (`INLINE` in packets) reached implementers but not planners or architecture reviewers, and nothing checked that the method ran.

- `scripts/mkbrief.mjs` (new) and `templates/arch-pass.txt` (new): planner, plan-review and landing architecture briefs open with the architecture pass as step 1, quoting `codebase-design` and `improve-codebase-architecture` in full through `INLINE` lines, with an unattended mode for the skill's steps 2 and 3 (a markdown pass file with fixed headings instead of an HTML report and a grilling loop). The project's planner brief follows as step 2, its `{KEY}` placeholders filled by `--set`.
- `scripts/arch-check.mjs` (new): checks the pass file's headings, its deletion-test rows and owner lines, a review's verdict and plan comparison, and that a plan cites the file and was written after it.
- `scripts/inline.mjs` (new): the `INLINE` expansion, shared by `mkpacket.mjs` and `mkbrief.mjs`.
- `CHAIN.md`: the planner and both architecture reviewers are briefed with `mkbrief.mjs`, and L0 runs `arch-check.mjs` on their pass files before reading a plan or a verdict; the plan reviewer writes its own pass before it opens the plan.

2026-11-13, to cut agents per ticket: a hard ticket ran a planner, a strong plan reviewer, each with an explorer sub-agent, and a separate landing reviewer beside the final review.

- `scripts/land-check.mjs`: from band medium up, the last non-plan `arch` row's pass file must also pass `arch-check.mjs --role landing`, or landing blocks.
- `templates/arch-pass.txt`: no explorer sub-agent in any role (the agent is the fresh context and walks the scope itself); quotes only the `### 1. Explore` step of `improve-codebase-architecture` plus `codebase-design` in full, keeping the unattended rules (no HTML, no questions, decide yourself).
- `CHAIN.md`: critical plans get a planner and a plan reviewer, both on the planner (strongest) role, no sub-agents; a hard plan review runs on the cheap plan-review role and goes again on the planner role only on `REGRESSED` or disagreement on an owner or seam; the landing pass rides the final axis-A review of the staged squash instead of a separate agent; pass files go where the project's workflow settings say (default `.audit/<slug>/arch/<id>[-plan].md`), not `tmp/`. The setup workflow template mirrors this with a `plan reviewer` role.

2026-11-13, from one chain's ledgers: implementers ran past their context four times, six self-review files came back on form, two finding classes repeated across rounds, a mock leak showed only with three test files run together, and probe files needed a permission prompt to remove.

- `CHAIN.md`: before every fix round L0 reads the implementer's context; at the implementer ceiling (default ~180k tokens) the round goes to a fresh implementer briefed from a state file (diff, done, left), not a ladder rung. Planners size each task to fit that budget (also in `templates/arch-pass.txt`'s planner part). The guard ORACLE row points at packet rule 13.
- `templates/packet-rules.txt`: rule 6 has the implementer read each lens body itself, and keeps any lens- or probe-named heading out of the standards section before its ARCHITECTURE block; rule 7 keeps probes and copies under `tmp/` and mounts dependency dirs instead of symlinking them; new rule 13 states a guard's reach once, in its docstring, tied to its constants.
- `templates/self-review.txt`: every loop the implementer greps for each deleted name in code, comments and docs, and runs the touched test files together in one call as well as one by one.
- `scripts/review-file.mjs`: a failing ARCHITECTURE check names the heading (or end of file) that ended the standards section and any label left past it; the lens list parses both rule 6 wordings.
- `harness/pi.md`: a removal prompt may not take "Allow once" through a delegation tool; L0 removes the file and denies.

## Lost on purpose

- Direct slash entry to `/architect`, `/interrogate`, `/blast-radius`, `/how`, `/why`, `/swarm`, `/arena`, `/figure-it-out`, `/correct`, `/benchmark-checklist`, `/statechart`. Reach them through their host skill's mode or a `rigor` route.
- Each principle leaf's own description, and with it independent model-triggering of principles.
- Cursor cloud agents and Bugbot, with no replacement.
