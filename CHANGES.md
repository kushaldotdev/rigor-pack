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
| cursor/plugins (pstack) | `d73344bee8cf22e53b9d5f4cf5749d38ba38c174` | trimmed verbatim: `skills/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff | pstack is Cursor-native: multi-model panels, `AskQuestion`, `~/.cursor` transcript paths, team-kit plugin deps |

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
4. Upstream slash commands (`/setup-matt-pocock-skills`, `/triage`, ...) → pi
   has no slash commands; the text tells the user to ask for the skill by
   name. "Tell the human to run it" posture kept.
5. Whole upstream skill folder is copied (support files: references, formats,
   scripts) so relative links resolve in the installed repo.
6. Each wrapper ends with a "pi adaptations" block (pi `subagent` tool +
   orchestration policy, no-slash-commands note, in-pack skill paths) and a
   provenance marker naming the vendored pin.

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
| retro | wrapper | none — added in the self-contained rebuild so rigor-mode's close phase points at an installed skill, not a vendored path |
| setup-matt-pocock-skills | wrapper | none |
| grilling | wrapper | none — upstream v1.3.1 already carries the yes-shaped-question line a consumer repo's old local copy lacked; wrapper supersedes that stale copy |

## poteto skills → forks (hand-maintained)

| Skill | Type | Deviations |
|---|---|---|
| blast-radius | fork | dropped companion refs to unported `how`/`why` (plain-language replacements); step 1 pulls diff via `git diff <base>...HEAD`; step 6 arena/multi-model → two parallel reviewer children with different attack angles |
| interrogate | fork | Task tool + model-panel config (`~/.cursor/rules/pstack-models.mdc`) → pi `subagent` workflow, 4 default adversarial personas (skeptic / bug hunter / contract breaker / simplifier) instead of model diversity; personas run on the strongest reasoning model, one model per persona when 2+ strong models are available (per-child `model:` option); description de-"multi-model"-ed; `references/lead-judgment.md` model-consensus wording → reviewer wording; `references/rubric.md` tool names → pi tools (read, bash, ffgrep, fffind); references/ otherwise verbatim |
| correct | fork | none — verbatim copy, no Cursor-isms found on audit |
| benchmark-checklist | fork | verbatim otherwise; `principle-explain-the-number` link and the Opening-a-PR / Perf-issue / Hillclimb playbook refs replaced with plain-language equivalents inlined in the text (self-contained rule) |
| show-me-your-work | fork | transcript audit reads `git log`/`git status` + session evidence instead of Cursor `agent-transcripts/` paths; cross-model review → fresh-context read-only subagent (pi is single-model per session; heading renamed); encode-lessons-in-structure pointer → inlined plain-language principle; output location → repo `tmp/` convention at use sites |
| create-verification-skill | fork | generated skill location `.cursor/skills/verify-<app>/` → `.agents/skills/verify-<app>/`; Drive section: pi has bash not computer use — headless Playwright + curl + DB CLI + screenshot saved to `tmp/` and read back; maintenance pointer → "re-run periodically after meaningful app changes" (vendored `maintain-verification-skill` reference dropped) |
| unslop | fork | none — verbatim copy, no Cursor-isms found on audit |

## New skills (ours)

| Skill | Type | Notes |
|---|---|---|
| rigor-mode | new | conductor: intake router (issue / feature / md-file batch / seam sweep / diagnosing-bugs / improve-codebase-architecture / to-spec routes), merit gate (stop before planning if long-run benefit is questionable), S/M/L size tiers with L = queue of S/M units, phases (intake → ground → plan gate → build → verify → review → close), batch + sweep playbooks, batch failure rule (halt, revert failed item, checkpoint blocked, yield), checkpoint barrier (`tmp/checkpoints/<slug>.tsv`, show-me-your-work format), run budget 3-5 units per workflow, repo-derived one-way doors (from AGENTS.md + universal set; domain examples apply only where they match), tracker-optional, handoff doc at L-run barriers, skill-map table, cold-start child delivery rules (skill: option or packet-inlined SKILL.md; workers/reviewers/research children get working skills, parent keeps planning + single-writer skills); delegates child mechanics to subagent-orchestration-policy |
| verify-<app> | new (generated) | output of running the create-verification-skill fork against a consumer repo; lives in that repo, not here |

## Build & validation scripts

- `scripts/build-pack.mjs` — materializes the 17 Matt wrappers from
  `vendors/mattpocock/skills/` into `.agents/skills/` (transforms + adaptations
  block + provenance marker + whole-folder copy). Forks and `rigor-mode` are
  hand-maintained and untouched by the build.
- `scripts/check-pack.mjs` — validates the pack: frontmatter parses (pi's own
  yaml lib), in-pack cross-references resolve, no `vendors/` references outside
  provenance markers, no Cursor-isms, provenance markers correct, relative
  links resolve. Run after any rebuild or re-vendor.

## Explicitly not ported

`poteto-mode`, `setup-pstack`, `poteto-help`, `automate-me`, `arena`, `swarm`,
`recall`, `reflect`, `how`, `why`, `architect`, `figure-it-out`,
`no-comments`, `typescript-best-practices`, pstack `tdd`, pstack `teach`,
`grill-me` — Cursor-coupled or duplicate of an installed skill (reasons logged
in the design discussion, 2026-10).
