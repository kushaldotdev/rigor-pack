# AFK contract

Applies from the moment the user confirms the brief until the close report. The referenced bodies stay verbatim; this file says what each of their interactive lines means during an AFK run. `scripts/check-pack.mjs` fails when a body in AFK scope gains an interactive line with no row here.

AFK scope: every body under `rigor`, `tdd`, `code-review`, `diagnosing-bugs`, `codebase-design`, `domain-modeling`, `verify`, `research`, `prototype`, `writing`. Out of scope, because a human is present by design: `setup`, `triage`, `teach`, `retro`, `wait-what`, `handoff`, `grilling` (the interview).

## Outcomes

| Situation mid-run | Behaviour |
|---|---|
| Reversible ambiguity | Choose the conservative option. Log `decision` + `why` to the trail. |
| Irreversible step not pre-approved in the brief | Park it in `.audit/<slug>.gates.md` (question, options, the default on no answer) and route around it ([orchestrate](references/pstack/poteto-mode/playbooks/orchestrate.md) §Escalation). If nothing else can proceed, stop cleanly: write state, mark the unit `blocked`, end with the close report. |
| A blocking review finding survives the brief's last round | Unit `blocked`, state written, reported. |
| Verify shows no evidence | Back to build. Never mark the unit verified. |
| Verify impossible (no startable app) | Unit `unverified`; the run continues; the close report leads with it. |
| A step only a human can perform (secrets, dashboards) | Generate a [wizard](../setup/references/matt/wizard/wizard.md) script for it, park the step as a gate, continue around it. |
| A harness feature is missing (subagents, async, loop, second model family) | Take the fallback in your harness notes and log it as `degraded: <what>` in the trail. |

Unit results use only: `verified`, `unverified`, `blocked`, `reverted`, `skipped`. The trail keeps show-me-your-work's columns: unit name in `phase`, result word in `result`.

## Precedence table

Each row: the body (path relative to the skills root), a fragment of the interactive line, and what it means in an AFK run. **brief** = answered in the brief by the interview checklist item named. **log** = decide, log to the trail, surface at close. **interview** = the line runs during the interview, where the human is present. **n/a** = not a question to a human.

| Body | Line fragment | AFK meaning |
|---|---|---|
| `code-review/references/matt/code-review/code-review.md` | tell the user to run | interview: rigor §0 stops before the run when setup is missing |
| `code-review/references/matt/code-review/code-review.md` | ask for it | brief: REVIEW fixed point (checklist 4) |
| `code-review/references/matt/code-review/code-review.md` | ask the user where the spec is | brief: REVIEW spec location (checklist 5); none recorded → Spec axis reports "no spec available" |
| `code-review/references/pstack/interrogate/interrogate.md` | ask the user before | brief: GOAL is the intent; still unsure → log the intent you assumed |
| `codebase-design/references/pstack/architect/architect.md` | pause for sign-off | brief: only if the interview asked for a design checkpoint; otherwise no checkpoint |
| `codebase-design/references/pstack/principle-redesign-from-first-principles/principle-redesign-from-first-principles.md` | Ask: "if we were writing | n/a: a question to yourself |
| `diagnosing-bugs/references/matt/diagnosing-bugs/diagnosing-bugs.md` | say so and ask the user | log: record what is missing; park a gate for the artifact; continue on other units |
| `diagnosing-bugs/references/matt/diagnosing-bugs/diagnosing-bugs.md` | Ask the user for | log + gate: list what you tried, park a gate naming the environment or artifact needed; unit `blocked` |
| `prototype/references/matt/prototype/prototype.md` | by asking if the user is around | log: the question comes from the brief or the open decision; the user is not around |
| `rigor/references/matt/implement/implement.md` | ambiguous, ask | log: pick the ticket the brief and tracker frontier point at; log the choice |
| `rigor/references/matt/implement-spec/implement-spec.md` | tell the user to run | interview: rigor §0 |
| `rigor/references/matt/improve-codebase-architecture/improve-codebase-architecture.md` | ask the user: "Which of these | interview: candidate pick (checklist 10) |
| `rigor/references/matt/to-spec/to-spec.md` | tell the user to run | interview: rigor §0 |
| `rigor/references/matt/to-spec/to-spec.md` | Check with the user that these seams | interview: seams (checklist 2) |
| `rigor/references/matt/to-tickets/to-tickets.md` | tell the user to run | interview: rigor §0 |
| `rigor/references/matt/to-tickets/to-tickets.md` | Quiz the user | interview: ticket breakdown (checklist 3) |
| `rigor/references/matt/to-tickets/to-tickets.md` | Ask the user: | interview: checklist 3 |
| `rigor/references/matt/to-tickets/to-tickets.md` | until the user approves | interview: checklist 3; new tickets found mid-run are filed as follow-ups, not quizzed |
| `rigor/references/matt/wayfinder/wayfinder.md` | tell the user to run | interview: rigor §0 |
| `rigor/references/matt/wayfinder/wayfinder.md` | Stop and ask | interview: wayfinder's map is built in the interview phase |
| `rigor/references/pstack/poteto-help/poteto-help.md` | ask whether the user | n/a: help text; model roles come from `docs/agents/workflow.md`, never asked in a run |
| `rigor/references/pstack/poteto-help/poteto-help.md` | unless the user asks to merge | brief: GATES / merge authority (checklist 7) |
| `rigor/references/pstack/poteto-mode/playbooks/autonomous-run.md` | or use a structured multiple-choice question | n/a: already says never ask |
| `rigor/references/pstack/poteto-mode/playbooks/bug-fix.md` | ask the user | log + gate: reproduce yourself; when impossible, park a gate and mark the unit `blocked` |
| `rigor/references/pstack/poteto-mode/playbooks/multi-phase-plan.md` | Ask the operator | brief: DEFAULTS (checklist 16); an unforeseen product call → apply a default, log it, list it at close |
| `rigor/references/pstack/poteto-mode/playbooks/multi-phase-plan.md` | wait for the operator | brief: GATES (checklist 7); a review gate parks in gates.md, work continues around it |
| `rigor/references/pstack/poteto-mode/playbooks/multi-phase-plan.md` | Wait for the operator | brief: GATES; stop at merge-ready, report |
| `rigor/references/pstack/poteto-mode/playbooks/visual-parity.md` | stop and ask | log + gate: never edit the baseline; park a gate, mark the unit `blocked` |
| `rigor/references/pstack/poteto-mode/poteto-mode.md` | About to ask a structured multiple-choice question | log: classify per the line; a genuine preference call gets the brief's default or a logged default, never a question |
| `rigor/references/pstack/poteto-mode/playbooks/babysit.md` | approval is a wait | brief: GATES; owner approval parks in gates.md |
| `rigor/references/pstack/poteto-mode/references/bugbot-triage.md` | Ask the user instead of guessing | log + gate: `ask` items park in gates.md with your recommendation; reversible fixes proceed |
| `tdd/references/matt/tdd/tdd.md` | confirm them with the user | brief: SEAMS (checklist 2); an unlisted seam → highest existing seam, logged |
| `tdd/references/matt/tdd/tdd.md` | Ask: "What's the public interface | brief: SEAMS |
| `verify/references/pstack/create-formal-verification-skill/create-formal-verification-skill.md` | ask the user only what you cannot observe | interview: generation runs during setup; mid-run, log the assumption |
| `verify/references/pstack/create-formal-verification-skill/create-formal-verification-skill.md` | do not change product code unless the user asks | brief: SCOPE; a property violation is a finding, reported at close |
| `verify/references/pstack/create-verification-skill/create-verification-skill.md` | only ask the user what you cannot observe | interview: generation runs during setup; mid-run, log the assumption |
| `verify/references/pstack/maintain-formal-verification-skill/maintain-formal-verification-skill.md` | unless the user asks | n/a: describes a user request; the brief's SCOPE decides |
