# Deviations from upstream

Policy: `vendors/` is pristine and never edited. A **wrapper** overrides only
harness mechanics (how skills invoke each other, tool names); a **fork** edits
upstream content; a **new** skill is ours. Every entry must list its exact
deviation. When upstream is re-vendored, re-verify every row below against the
new text.

## Vendors

| Vendor | Pinned ref | Notes |
|---|---|---|
| mattpocock/skills | `49dd158d1076134a641b33efb035946536778336` (v1.3.1) | trimmed verbatim: `skills/engineering/` + `skills/productivity/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff |
| cursor/plugins (pstack) | `d73344bee8cf22e53b9d5f4cf5749d38ba38c174` | trimmed verbatim: `skills/` + `LICENSE` only; `.git` stripped — upgrade = re-clone at pin, copy subset, diff | pstack is Cursor-native: multi-model panels, `AskQuestion`, `~/.cursor` transcript paths, team-kit plugin deps |

## Global pi-only conventions (apply to every wrapper)

1. "Call the Skill tool with `X`" → "read and follow `vendors/mattpocock/skills/skills/<bucket>/X/SKILL.md`" (pi loads skills by reading their SKILL.md; no Skill tool).
2. Cross-skill references to user-invoked skills stay "tell the human to run it" (upstream rule, unchanged).
3. `GLOSSARY.md` naming kept as upstream; a consumer repo does the `CONTEXT.md` → `GLOSSARY.md` repo rename at install time (tracked as repo work, not a skill deviation).

## Matt skills → wrappers (all built)

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
| wayfinder | wrapper | parallel research children run as one pi `subagent` workflow, each resolving its ticket via the research wrapper |
| codebase-design | wrapper | none |
| setup-matt-pocock-skills | wrapper | none |
| grilling | wrapper | none — upstream v1.3.1 already carries the yes-shaped-question line a consumer repo's old local copy lacked; wrapper supersedes that stale copy |

## poteto skills → forks (all built)

| Skill | Type | Deviations |
|---|---|---|
| blast-radius | fork | dropped companion refs to unported `how`/`why` (plain-language replacements); step 1 pulls diff via `git diff <base>...HEAD`; step 6 arena/multi-model → two parallel reviewer children with different attack angles |
| interrogate | fork | Task tool + model-panel config (`~/.cursor/rules/pstack-models.mdc`) → pi `subagent` workflow, 4 default adversarial personas (skeptic / bug hunter / contract breaker / simplifier) instead of model diversity; synthesis wording models → personas; references/ kept verbatim |
| correct | fork | none — verbatim copy, no Cursor-isms found on audit |
| benchmark-checklist | fork | none — verbatim copy, no Cursor-isms found on audit |
| show-me-your-work | fork | transcript audit reads `git log`/`git status` + session evidence instead of Cursor `agent-transcripts/` paths; cross-model review → fresh-context read-only subagent (pi is single-model per session); output location → repo `tmp/` convention at use sites |
| create-verification-skill | fork | generated skill location `.cursor/skills/verify-<app>/` → `.agents/skills/verify-<app>/`; Drive section: pi has bash not computer use — headless Playwright + curl + DB CLI + screenshot saved to `tmp/` and read back; maintenance pointer → vendored `maintain-verification-skill` (reference only) |
| unslop | fork | none — verbatim copy, no Cursor-isms found on audit |

## New skills (ours)

| Skill | Type | Notes |
|---|---|---|
| rigor-mode | new (built, 157 lines) | conductor: intake router (issue / feature / md-file batch / seam sweep), S/M/L size tiers with L = queue of S/M units, phases (intake → ground → plan gate → build → verify → review → close), batch + sweep playbooks, checkpoint barrier (`tmp/checkpoints/<slug>.tsv`, show-me-your-work format), run budget 3-5 units per workflow, one-way-door autonomy gates, tracker-optional; delegates child mechanics to subagent-orchestration-policy |
| verify-<app> | new (generated) | output of running the create-verification-skill fork against a consumer repo; lives in that repo, not here |

## Explicitly not ported

`poteto-mode`, `setup-pstack`, `poteto-help`, `automate-me`, `arena`, `swarm`,
`recall`, `reflect`, `how`, `why`, `architect`, `figure-it-out`,
`no-comments`, `typescript-best-practices`, pstack `tdd`, pstack `teach`,
`grill-me` — Cursor-coupled or duplicate of an installed skill (reasons logged
in the design discussion, 2026-10).
