# Deviations from upstream

Policy: `vendors/` is pristine and never edited. **Wrappers are materialized
build output**: the upstream SKILL.md content is inlined into
`.agents/skills/<name>/SKILL.md` by `scripts/build-pack.mjs` with mechanical
transforms applied (conventions below) — `.agents/skills/` is self-contained
and needs no `vendors/` at runtime. Never hand-edit a wrapper; rebuild:
`node scripts/build-pack.mjs`. A **fork** is hand-maintained content ported
from upstream; a **new** skill is ours. Every entry must list its exact
deviation. When upstream is re-vendored, rebuild and re-verify every row below
against the new text.

## Vendors

| Vendor | Pinned ref | Notes |
|---|---|---|
| mattpocock/skills | `49dd158d1076134a641b33efb035946536778336` (v1.3.1) | trimmed verbatim: `skills/engineering/` + `skills/productivity/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff |
| cursor/plugins (pstack) | `d457567332aa6989e753ea289f30ea2bfbc80bc0` (v0.15.28) | trimmed verbatim: `skills/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff | pstack is Cursor-native: multi-model panels, `AskQuestion`, `~/.cursor` transcript paths, team-kit plugin deps |

Port log: 2026-10-19 978ca6e9 (v0.15.17) → d457567 (v0.15.28), 119 commits, skills 52 → 56. Vendored verbatim, not wrapped: the 4 new skills (`create-formal-verification-skill`, `maintain-formal-verification-skill` — a TLA+/model-checking pair no rigor phase calls; `sharpen`, `in-your-own-words` — 4-line prompt shapers that overlap `grilling`, `to-spec`, `wait-what`). Of the 30 changed skills, only the pack's poteto forks got content adoptions, five lines total, all Cursor-free and repo-agnostic: `correct` step-3 test rule; `create-verification-skill` Launch readiness (usable ≠ process answers), seed-data precondition → `Gotchas` and never weaken the journey, stand-in-vs-real-target proof gap; `unslop` description drops "Must always apply.". Accepted upstream changes not taken: the "pick reasoning level per poteto-mode §Subagents" line added to `interrogate` and `show-me-your-work` (dangling ref to a skill this pack does not ship, and the substance is already carried by each fork's own reviewer-tier wording), and `interrogate`'s Cursor model-slug family fallbacks (`cursor-grok-*`, `composer-*` — no pi equivalent; the fork sources model choice from agent definitions). Upstream's cuts to `interrogate/references/lead-judgment.md` ("Why This Step Matters", "Verdict Calibration") are style trims, not corrections — the fork keeps them. Port log: 2026-10-10 d73344b → 978ca6e9 (#538 distill prompts — behavior-neutral compression, ported into unslop/benchmark-checklist/interrogate; #539 adds ketchup — source only, not wrapped). Accepted upstream deletions, not restored: reviewer-prompt "explains WHY something is a problem" clause (covered by the Evidence finding field), rubric "Three lines of duplication beat a premature abstraction" and "Use judgment." sentences (covered by neighboring rules).

## Global pi conventions (applied at build time to every wrapper)

1. Any upstream invocation of another skill via "the Skill tool" (phrasings
   seen upstream: "Call the Skill tool with `X`", "call the Skill tool twice,
   for `X` and `Y`", "calling the Skill tool", "call the Skill tool for
   whichever skills ...") → the hybrid form
   "read and follow the `X` skill (`<skills-root>/X/SKILL.md`)" (pi has no Skill
   tool; skills load by reading their SKILL.md). Upstream quotes the skill name
   with `"..."` in some files and `` `...` `` in others; the transform matches both.
   - **Name first** because pi injects each model-invocable skill's absolute
     location into the prompt (`docs/skills.md`: "Pi tells the model where the
     skill lives so it can resolve those paths"), so the name always resolves.
     Every cross-reference target in this pack is model-invocable, so none of
     them falls outside the catalog. `pi-subagents` takes a skill by bare name
     too (`skill: "<name>"`).
   - **The path is the fallback**: a greppable anchor for `scripts/check-pack.mjs`,
     and what a non-pi harness reads.
   - **`<skills-root>` is NOT a pi token.** pi has no root placeholder - verified
     by grep across pi's docs and source. It is this pack's own hint, defined once
     in `ask-pack`, never a contract: repo `.agents/skills/`, global
     `~/.pi/agent/skills/`, or `~/.agents/skills/`, whichever holds the target.
     A hardcoded `.agents/skills/` path was measurably wrong: it failed 4 of 6
     install layouts, including a real consumer repo's `triage` → `grilling` case, where
     the target is global-only.
2. A materialized wrapper never points at a skill left out of the pack. A
   surviving backticked dropped-skill name fails both the build and
   `scripts/check-pack.mjs`. `teach` and `pr` are excluded from the guard on
   purpose - they are ordinary prose/CLI tokens ("gh pr ...") with no mechanical
   discriminator. When upstream does name a dropped skill, the preferred fix is
   to bring that skill into the pack (see the `writing-for-agents` row below);
   deleting the reference is the fallback, not the default.
3. Cross-skill references to user-invoked skills stay "tell the human to run
   it" (upstream rule, unchanged).
4. `GLOSSARY.md` naming kept as upstream; a consumer repo does the `CONTEXT.md` →
   `GLOSSARY.md` repo rename at install time (tracked as repo work, not a
   skill deviation).
5. Upstream slash commands (`/setup-matt-pocock-skills`, `/triage`, ...) →
   pi's skill command form `/skill:<name>`. "Tell the human to run it"
   posture kept.
6. Whole upstream skill folder is copied (support files: references, formats,
   scripts) so relative links resolve in the installed repo.
7. Wrappers carry NO in-file provenance marker: the wrapper list is the
   `WRAPPERS` map in `scripts/build-pack.mjs` and every row below, and the pin
   is the vendor table above. A skill-specific `## pi notes` section is
   appended only where that skill's own pi behavior differs (the `extra`
   column below); shared pi facts (invocation is `/skill:<name>`, subagent
   ceilings live in `subagent-orchestration-policy`) live in these docs and in
   the parent's child packet, never duplicated into every file.
8. Children run async by default - pi-subagents' own rule is to set
   `async: false` only when the parent must block, and to keep final reviews,
   validation gates, and publication checks async. Upstream `code-review` broke
   that rule: "Issue both sub-agent calls together, in the foreground, and
   aggregate the reports they return." The transform rewrites "together, in the
   foreground, and aggregate" to "together as async children, and aggregate",
   and the wrapper's pi note records that the children launch async.

## Matt skills → materialized wrappers

| Skill | Type | Deviations beyond global conventions |
|---|---|---|
| tdd | wrapper | none (pattern exemplar) |
| code-review | wrapper | two review axes = two parallel read-only reviewer children in one pi `subagent` workflow, parent aggregates; lenses/disposition per subagent-orchestration-policy §6 |
| diagnosing-bugs | wrapper | none |
| domain-modeling | wrapper | none |
| grill-with-docs | wrapper | none |
| implement | wrapper | issue-tracker operations go through the target repo's configured tracker doc |
| improve-codebase-architecture | wrapper | none |
| prototype | wrapper | none |
| research | wrapper | none |
| to-spec | wrapper | none |
| to-tickets | wrapper | none |
| triage | wrapper | none |
| wayfinder | wrapper | parallel research children run as one pi `subagent` workflow, each resolving its ticket via the research skill |
| codebase-design | wrapper | none |
| retro | wrapper | none — upstream text kept intact: step 1's writing-style-guide reference resolves to the pack's own `writing-for-agents`; added in the self-contained rebuild so rigor's close phase points at an installed skill, not a vendored path |
| setup-matt-pocock-skills | wrapper | none |
| grilling | wrapper | none — upstream v1.3.1 already carries the yes-shaped-question line a consumer repo's old local copy lacked; wrapper supersedes that stale copy |
| wait-what | wrapper | none |
| writing-for-agents | wrapper | none — promoted into the pack (2026-10-12) so `retro`'s writing-style-guide step resolves to an installed skill; previously dropped, which left `retro` pointing at a skill the pack did not ship |
| handoff | fork | upstream v1.3.1 writes to the OS temp dir and drops the reply-trailing path; fork keeps the pi-native behaviour: saves to `tmp/<timestamp>-<slug>.md` in the cwd, timestamp + kebab-slug filename rules, untracked + gitignore warning, reply ends with the absolute path in a code block; `call the Skill tool` → scope-agnostic `<skills-root>/<name>/SKILL.md` phrasing |

## poteto skills → forks (hand-maintained)

| Skill | Type | Deviations |
|---|---|---|
| blast-radius | fork | dropped companion refs to unported `how`/`why` (plain-language replacements); step 1 pulls diff via `git diff <base>...HEAD`; step 6 arena/multi-model → two parallel reviewer children with different attack angles |
| interrogate | fork | Task tool + model-panel config (`~/.cursor/rules/pstack-models.mdc`) → pi `subagent` workflow, 4 default adversarial personas (skeptic / bug hunter / contract breaker / simplifier) instead of model diversity; personas run on the reviewer tier configured in agent definitions (`agentOverrides.model`/`thinking`) — model choice is configuration, never a runtime decision; a missing reviewer tier means each reviewer runs on its own configured default, never the root agent's model, and the gap is noted in the verdict; description de-"multi-model"-ed; `references/lead-judgment.md` model-consensus wording → reviewer wording; `references/rubric.md` tool names → pi tools (read, bash, ffgrep, fffind); references/ otherwise verbatim |
| correct | fork | none — verbatim copy, no Cursor-isms found on audit. 2026-10-19 upstream (d457567): step 3 reworded to "any test that still passes when the behavior it checks breaks, or that fails when only the internals change" (was "would still pass if every function it calls returned nothing") |
| benchmark-checklist | fork | verbatim otherwise; `principle-explain-the-number` link and the Opening-a-PR / Perf-issue / Hillclimb playbook refs replaced with plain-language equivalents inlined in the text (self-contained rule) |
| show-me-your-work | fork | transcript audit reads `git log`/`git status` + session evidence instead of Cursor `agent-transcripts/` paths; cross-model review → fresh-context read-only subagent (pi is single-model per session; heading renamed); encode-lessons-in-structure pointer → inlined plain-language principle; output location → repo `tmp/` convention at use sites |
| create-verification-skill | fork | generated skill location `.cursor/skills/verify-<app>/` → `.agents/skills/verify-<app>/`; Drive section: pi has bash not computer use — headless Playwright + curl + DB CLI + screenshot saved to `tmp/` and read back; maintenance pointer → "re-run periodically after meaningful app changes" (vendored `maintain-verification-skill` reference dropped); 2026-10-19 upstream (d457567) adoptions: Launch says ready means usable, not just that a process answers — must reach a usable state from an empty data dir including migrations and seed data; a seed-data precondition a journey needs makes the journey report a failure with the reason in that feature's `Gotchas`, never a weakened journey; §4 proof run against a stand-in for the real target must list every setup step the stand-in did that the target will not |
| unslop | fork | none — verbatim copy, no Cursor-isms found on audit. 2026-10-19 upstream (d457567): description drops "Must always apply." — Cursor always-apply phrasing, dead weight on a `disable-model-invocation` skill |

## Matt skills → fork (hand-maintained)

| Skill | Type | Deviations |
|---|---|---|
| ask-pack | fork | fork of upstream `ask-matt`, renamed: the router is remapped from Matt's 20-skill engineering flow onto this pack's 29 skills — main flow gains a conductor step (`rigor` replaces implement-spec-style whole-spec orchestration; per-ticket `implement` kept for hand-driving), new "Per-task rigor checks" section covers the pstack forks (interrogate, blast-radius, benchmark-checklist, correct, show-me-your-work, create-verification-skill, unslop); upstream skills not in the pack dropped (grill-me, to-questionnaire, wizard, teach, implement-spec, pr); `wait-what`, `handoff`, and `writing-for-agents` are pack members (`handoff` ships in the pack but is installed globally); `writing-for-agents` appears in the "Vocabulary underneath" section (three model-invoked references, not two); phase-boundary section pi-adapted (pi's `/new` and `/compact`; support file PHASE-BOUNDARIES.md carried with the same adaptations); standalone section lists pack contents (grilling, prototype, research, wait-what) |

## New skills (ours)

| Skill | Type | Notes |
|---|---|---|
| rigor | new (renamed from rigor-mode) | conductor: intake router (issue / feature / md-file batch / seam sweep / diagnosing-bugs / improve-codebase-architecture / to-spec routes), merit gate (stop before planning if long-run benefit is questionable), S/M/L size tiers with L = queue of S/M units, phases (intake → ground → plan gate → build → verify → review → close), batch + sweep playbooks, batch failure rule (halt, revert failed item, checkpoint blocked, yield), checkpoint barrier (`tmp/checkpoints/<slug>.tsv`, show-me-your-work format), run budget 3-5 units per workflow, repo-derived one-way doors (from AGENTS.md + universal set; domain examples apply only where they match), tracker-optional, handoff doc at L-run barriers, skill-map table, cold-start child delivery rules (skill: option or packet-inlined SKILL.md + the pi facts restated per packet - no Skill tool (only name/description/path reach the prompt; the child reads the file), /skill:<name> to force, ceilings in subagent-orchestration-policy; recursive: a child that may delegate gets the same rule to pass down; workers/reviewers/research children get working skills, parent keeps planning + single-writer skills); inlines child mechanics (Delegation mechanics section distilled from subagent-orchestration-policy) so rigor never loads it; that skill remains the default for non-rigor delegated work. Rename 2026-10-12: "mode" was redundant — triggers ("rigor this", "rigor on issue 142") unchanged; body self-references, skill-map retro row wording (vendored → wrapper), and openai.yaml display_name updated in the same change | intake router (issue / feature / md-file batch / seam sweep / diagnosing-bugs / improve-codebase-architecture / to-spec routes), merit gate (stop before planning if long-run benefit is questionable), S/M/L size tiers with L = queue of S/M units, phases (intake → ground → plan gate → build → verify → review → close), batch + sweep playbooks, batch failure rule (halt, revert failed item, checkpoint blocked, yield), checkpoint barrier (`tmp/checkpoints/<slug>.tsv`, show-me-your-work format), run budget 3-5 units per workflow, repo-derived one-way doors (from AGENTS.md + universal set; domain examples apply only where they match), tracker-optional, handoff doc at L-run barriers, skill-map table, cold-start child delivery rules (skill: option or packet-inlined SKILL.md + the pi facts restated per packet - no Skill tool (only name/description/path reach the prompt; the child reads the file), /skill:<name> to force, ceilings in subagent-orchestration-policy; recursive: a child that may delegate gets the same rule to pass down; workers/reviewers/research children get working skills, parent keeps planning + single-writer skills); inlines child mechanics (Delegation mechanics section distilled from subagent-orchestration-policy) so rigor never loads it; that skill remains the default for non-rigor delegated work |
| verify-<app> | new (generated) | output of running the create-verification-skill fork against a consumer repo; lives in that repo, not here |

## Build & validation scripts

- `scripts/build-pack.mjs` — materializes the Matt wrappers from
  `vendors/mattpocock/skills/` into `.agents/skills/` (transforms + optional
  `## pi notes` + whole-folder copy). Forks, `ask-pack`, and `rigor` are
  hand-maintained and untouched by the build.
- `scripts/check-pack.mjs` — validates the pack: frontmatter parses (pi's own
  yaml lib), in-pack cross-references resolve (both the repo `.agents/skills/`
  and the scope-agnostic `<skills-root>/` forms), no `vendors/` references,
  no Cursor-isms, relative links resolve, and no reference to a dropped skill.
  Run after any rebuild or re-vendor.

## Upstream defect fixes (2026-10-12)

Defects found auditing the materialized pack; all fixed at the source
(generator / validator / hand-maintained forks), never by hand-editing build
output.

1. **`retro` pointed at a dropped skill.** Vendor `retro` step 1 fetches
   `writing-for-agents` for the writing style guide, but that skill had been
   left out of the pack, so the reference materialized as a dead path (the
   `§Files` bullet named it too). Fixed by **promoting `writing-for-agents` into
   the pack** rather than deleting the references: it is added to the
   `WRAPPERS` map (`productivity` bucket), appears in ask-pack's "Vocabulary
   underneath" section, and `retro` now resolves to it through the normal
   transform. This keeps the upstream `retro` text intact. Files:
   `scripts/build-pack.mjs`, `.agents/skills/writing-for-agents/`,
   `.agents/skills/ask-pack/SKILL.md`, `.agents/skills/retro/SKILL.md`.
2. **`rigor` named a dropped skill in prose.** "integration branch
   (implement-spec shape)" referenced an upstream skill the pack drops; reworded
   to "whole-spec orchestration shape". File: `.agents/skills/rigor/SKILL.md`.
3. **Cross-skill paths were scope-hardcoded.** The transform emitted
   `.agents/skills/<name>/SKILL.md`, which is dead for the skills the pack ships
   global-only (`handoff`, `grilling`, `code-review`) and wrong whenever a
   consumer installs a subset globally - exactly what a consumer repo does. A read-only
   experiment (`tmp/review-root-form.md`, 4 cold-start pi processes per form plus
   a deterministic resolution matrix) measured 4 of 6 layouts failing for the
   hardcoded form, including a real consumer repo's `triage` → `grilling` case; the model
   recovered every time only by burning an extra search call, which a weaker model
   or a read-only child cannot do. The same experiment established that
   `<skills-root>` is not a pi token, so the pack now emits the hybrid form
   (skill name + path) and defines `<skills-root>` once in `ask-pack`. The two
   hand-maintained files that carried the hardcoded form (`rigor`, `handoff`) were
   updated to match. The validator resolves both path forms. Files:
   `scripts/build-pack.mjs`, `scripts/check-pack.mjs`, `.agents/skills/rigor/SKILL.md`,
   `.agents/skills/handoff/SKILL.md`, `.agents/skills/ask-pack/SKILL.md`, and the
   rebuilt wrappers.

Note: this changes the installed pack's skill count (28 → 29) and its
cross-reference form, so any repo that installed an earlier build should
re-copy `.agents/skills/` to pick both up.

## Explicitly not ported

`poteto-mode`, `setup-pstack`, `poteto-help`, `automate-me`, `arena`, `swarm`,
`recall`, `reflect`, `how`, `why`, `architect`, `figure-it-out`,
`no-comments`, `typescript-best-practices`, pstack `tdd`, pstack `teach`,
`grill-me` — Cursor-coupled or duplicate of an installed skill (reasons logged
in the design discussion, 2026-10).
