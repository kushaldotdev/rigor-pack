---
name: diagnosing-bugs
description: "Diagnose hard bugs, perf regressions, runtime symptoms, and captured traces: a feedback loop that goes red first, then root cause. Use when the user says diagnose or debug, or reports something broken, throwing, failing, slow, leaking, or spinning."
---

# Diagnosing bugs

## Modes

| Mode | When | Body |
|---|---|---|
| diagnose (default) | A hard bug or regression | [diagnosing-bugs](references/matt/diagnosing-bugs/diagnosing-bugs.md), with [hitl-loop.template.sh](references/matt/diagnosing-bugs/scripts/hitl-loop.template.sh) |
| bug fix | A reported defect: reproduce, root-cause, fix with runtime evidence | [bug-fix playbook](../rigor/references/pstack/poteto-mode/playbooks/bug-fix.md) |
| perf issue | A measured slowness against a baseline | [perf-issue playbook](../rigor/references/pstack/poteto-mode/playbooks/perf-issue.md) |
| hillclimb | Sustained improvement of one metric | [hillclimb playbook](../rigor/references/pstack/poteto-mode/playbooks/hillclimb.md) |
| runtime forensics | Diagnose a live symptom from instrumentation; deliverable is a diagnosis | [runtime-forensics playbook](../rigor/references/pstack/poteto-mode/playbooks/runtime-forensics.md) |
| trace forensics | Diagnose a captured profile, trace, or heap snapshot | [trace-forensics playbook](../rigor/references/pstack/poteto-mode/playbooks/trace-forensics.md) |

Principles: [fix-root-causes](references/pstack/principle-fix-root-causes/principle-fix-root-causes.md) when debugging; [attack-the-premise](references/pstack/principle-attack-the-premise/principle-attack-the-premise.md) when two fixes sharing one premise have failed.

## Pack rules

- The playbooks live in `rigor`'s copy of poteto-mode so their internal links keep working. Read them where they are.
- A "control skill" in a playbook is the repo's generated `verify-<app>` skill (see the [verify](../verify/SKILL.md) skill).
- Upstream names resolve through [the name index](../rigor/references/INDEX.md). Inside a `rigor` run, [AFK.md](../rigor/AFK.md) overrides any line that asks the user to reproduce or supply artifacts.
