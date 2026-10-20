---
name: diagnosing-bugs
description: "Diagnose hard bugs, perf regressions, runtime symptoms, and captured traces: a feedback loop that goes red first, then root cause. Use when the user says diagnose or debug, or reports something broken, throwing, failing, slow, leaking, or spinning."
---

# Diagnosing bugs

Every mode runs on the core below. A playbook adds steps on top of it and never replaces it, so read the core even when a playbook fits.

## Core (every mode)

1. **Loop before theory.** Before naming a cause, build one command that drives the real code path and goes red on the user's exact symptom, then run it and keep its output. A theory formed by reading code feels confirmed by the same code that suggested it; the loop is what can prove it wrong. Ways to build one, how to tighten it, and the completion checklist are in Phase 1 of [diagnosing-bugs](references/matt/diagnosing-bugs/diagnosing-bugs.md).
2. **Minimise.** Cut inputs and steps one at a time until every remaining element is needed for the loop to go red.
3. **Rank 3–5 hypotheses before testing any.** Give each a prediction: "if X is the cause, changing Y turns the loop green." With only one hypothesis you anchor on the first plausible idea, even when it later turns out right.
4. **Probe one variable at a time.** Tag debug logs with a unique prefix (`[DEBUG-a4f2]`) and grep them out before finishing.
5. **Regression test at a correct seam, red before the fix, green after**, then rerun the original loop. If no seam reaches the real bug pattern, say so: that is a finding, not a gap to paper over with a shallow test.
6. **Report** the loop command with its red and green output, the hypothesis that survived, and the fix.

For perf, the loop is a baseline measurement, and hypotheses are tested by measuring, not by reading source.

## Modes

The diagnose body is the full method behind the core. The playbooks add what their situation needs.

| Mode | When | Adds |
|---|---|---|
| diagnose (default) | Any bug or regression, standalone | [diagnosing-bugs](references/matt/diagnosing-bugs/diagnosing-bugs.md), with [hitl-loop.template.sh](references/matt/diagnosing-bugs/scripts/hitl-loop.template.sh) when a human must drive the repro |
| bug fix | The fix ships as staged commits and a PR, usually inside an orchestrated or `rigor` run | [bug-fix playbook](../rigor/references/pstack/poteto-mode/playbooks/bug-fix.md): delegation, failing-repro-first commits, Opening a PR |
| perf issue | A measured slowness against a baseline | [perf-issue playbook](../rigor/references/pstack/poteto-mode/playbooks/perf-issue.md): the performance mantras, vetted numbers |
| hillclimb | Sustained improvement of one metric | [hillclimb playbook](../rigor/references/pstack/poteto-mode/playbooks/hillclimb.md) |
| runtime forensics | Diagnose a live symptom from instrumentation; deliverable is a diagnosis | [runtime-forensics playbook](../rigor/references/pstack/poteto-mode/playbooks/runtime-forensics.md) |
| trace forensics | Diagnose a captured profile, trace, or heap snapshot | [trace-forensics playbook](../rigor/references/pstack/poteto-mode/playbooks/trace-forensics.md) |

Principles: [fix-root-causes](references/pstack/principle-fix-root-causes/principle-fix-root-causes.md) when debugging; [attack-the-premise](references/pstack/principle-attack-the-premise/principle-attack-the-premise.md) when two fixes sharing one premise have failed.

## Pack rules

- The playbooks live in `rigor`'s copy of poteto-mode so their internal links keep working. Read them where they are.
- Playbook steps that delegate to subagents or open a PR apply when the harness has child agents and the user wants that cadence. Otherwise do the step yourself or skip it, and say which in the report.
- A "control skill" in a playbook is the repo's generated `verify-<app>` skill (see the [verify](../verify/SKILL.md) skill).
- Upstream names resolve through [the name index](../rigor/references/INDEX.md). Inside a `rigor` run, [AFK.md](../rigor/AFK.md) overrides any line that asks the user to reproduce or supply artifacts.
