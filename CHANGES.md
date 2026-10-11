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
| cursor/plugins (pstack) | `978ca6e9c0e012047cd5058b8e829240336e704e` | trimmed verbatim: `skills/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff | pstack is Cursor-native: multi-model panels, `AskQuestion`, `~/.cursor` transcript paths, team-kit plugin deps |

Port log: 2026-10-10 d73344b → 978ca6e9 (#538 distill prompts — behavior-neutral compression, ported into unslop/benchmark-checklist/interrogate; #539 adds ketchup — source only, not wrapped). Accepted upstream deletions, not restored: reviewer-prompt "explains WHY something is a problem" clause (covered by the Evidence finding field), rubric "Three lines of duplication beat a premature abstraction" and "Use judgment." sentences (covered by neighboring rules).

## Global pi conventions (applied at build time to every wrapper)

1. Any upstream invocation of another skill via "the Skill tool" (phrasings
   seen upstream: "Call the Skill tool with `X`", "call the Skill tool twice,
   for `X` and `Y`", "calling the Skill tool", "call the Skill tool for
   whichever skills ...") → "read and follow `.agents/skills/<name>/SKILL.md`"
   (pi has no Skill tool; skills load by reading their SKILL.md).
2. Cross-skill references to user-invoked skills stay "tell the human to run
   it" (upstream rule, unchanged).
3. `GLOSSARY.md` naming kept as upstream; a consumer repo does the `CONTEXT.md` →
   `GLOSSARY.md` repo rename at install time (tracked as repo work, not a
   skill deviation).
4. Upstream slash commands (`/setup-matt-pocock-skills`, `/triage`, ...) →
   pi's skill command form `/skill:<name>`. "Tell the human to run it"
   posture kept.
5. Whole upstream skill folder is copied (support files: references, formats,
   scripts) so relative links resolve in the installed repo.
6. Wrappers carry NO in-file provenance marker: the wrapper list is the
   `WRAPPERS` map in `scripts/build-pack.mjs` and every row below, and the pin
   is the vendor table above. A skill-specific `## pi notes` section is
   appended only where that skill's own pi behavior differs (the `extra`
   column below); shared pi facts (invocation is `/skill:<name>`, subagent
   ceilings live in `subagent-orchestration-policy`) live in these docs and in
   the parent's child packet, never duplicated into every file.

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
| retro | wrapper | none — added in the self-contained rebuild so rigor's close phase points at an installed skill, not a vendored path |
| setup-matt-pocock-skills | wrapper | none |
| grilling | wrapper | none — upstream v1.3.1 already carries the yes-shaped-question line a consumer repo's old local copy lacked; wrapper supersedes that stale copy |
| wait-what | wrapper | none |
| handoff | fork | upstream v1.3.1 writes to the OS temp dir and drops the reply-trailing path; fork keeps the pi-native behaviour: saves to `tmp/<timestamp>-<slug>.md` in the cwd, timestamp + kebab-slug filename rules, untracked + gitignore warning, reply ends with the absolute path in a code block; `call the Skill tool` → in-pack path phrasing |

## poteto skills → forks (hand-maintained)

| Skill | Type | Deviations |
|---|---|---|
| blast-radius | fork | dropped companion refs to unported `how`/`why` (plain-language replacements); step 1 pulls diff via `git diff <base>...HEAD`; step 6 arena/multi-model → two parallel reviewer children with different attack angles |
| interrogate | fork | Task tool + model-panel config (`~/.cursor/rules/pstack-models.mdc`) → pi `subagent` workflow, 4 default adversarial personas (skeptic / bug hunter / contract breaker / simplifier) instead of model diversity; personas run on the reviewer tier configured in agent definitions (`agentOverrides.model`/`thinking`) — model choice is configuration, never a runtime decision; a missing reviewer tier means each reviewer runs on its own configured default, never the root agent's model, and the gap is noted in the verdict; description de-"multi-model"-ed; `references/lead-judgment.md` model-consensus wording → reviewer wording; `references/rubric.md` tool names → pi tools (read, bash, ffgrep, fffind); references/ otherwise verbatim |
| correct | fork | none — verbatim copy, no Cursor-isms found on audit |
| benchmark-checklist | fork | verbatim otherwise; `principle-explain-the-number` link and the Opening-a-PR / Perf-issue / Hillclimb playbook refs replaced with plain-language equivalents inlined in the text (self-contained rule) |
| show-me-your-work | fork | transcript audit reads `git log`/`git status` + session evidence instead of Cursor `agent-transcripts/` paths; cross-model review → fresh-context read-only subagent (pi is single-model per session; heading renamed); encode-lessons-in-structure pointer → inlined plain-language principle; output location → repo `tmp/` convention at use sites |
| create-verification-skill | fork | generated skill location `.cursor/skills/verify-<app>/` → `.agents/skills/verify-<app>/`; Drive section: pi has bash not computer use — headless Playwright + curl + DB CLI + screenshot saved to `tmp/` and read back; maintenance pointer → "re-run periodically after meaningful app changes" (vendored `maintain-verification-skill` reference dropped) |
| unslop | fork | none — verbatim copy, no Cursor-isms found on audit |

## Matt skills → fork (hand-maintained)

| Skill | Type | Deviations |
|---|---|---|
| ask-pack | fork | fork of upstream `ask-matt`, renamed: the router is remapped from Matt's 20-skill engineering flow onto this pack's 28 skills — main flow gains a conductor step (`rigor` replaces implement-spec-style whole-spec orchestration; per-ticket `implement` kept for hand-driving), new "Per-task rigor checks" section covers the pstack forks (interrogate, blast-radius, benchmark-checklist, correct, show-me-your-work, create-verification-skill, unslop); upstream skills not in the pack dropped (grill-me, to-questionnaire, wizard, teach, writing-for-agents, implement-spec, pr); `wait-what` and `handoff` are pack members (handoff ships in the pack but is installed globally); phase-boundary section pi-adapted (pi's `/new` and `/compact`; support file PHASE-BOUNDARIES.md carried with the same adaptations); standalone section lists pack contents (grilling, prototype, research, wait-what) |

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
  yaml lib), in-pack cross-references resolve, no `vendors/` references outside
  the `vendors/` self-contained rule, no Cursor-isms, relative links resolve.
  Run after any rebuild or re-vendor.

## Explicitly not ported

`poteto-mode`, `setup-pstack`, `poteto-help`, `automate-me`, `arena`, `swarm`,
`recall`, `reflect`, `how`, `why`, `architect`, `figure-it-out`,
`no-comments`, `typescript-best-practices`, pstack `tdd`, pstack `teach`,
`grill-me` — Cursor-coupled or duplicate of an installed skill (reasons logged
in the design discussion, 2026-10).
