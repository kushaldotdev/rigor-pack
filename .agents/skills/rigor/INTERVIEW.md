# Interview

The only time a run talks to the human. Everything a body would ask mid-run is asked here instead.

## Steps

1. **Restate.** [in-your-own-words](../grilling/references/pstack/in-your-own-words/in-your-own-words.md): say back the goal and the problem.
2. **Sharpen.** [sharpen](../grilling/references/pstack/sharpen/sharpen.md): the expert approach, what the user is really after, the right level of specification.
3. **Grill.** [grilling](../grilling/references/matt/grilling/grilling.md) in rounds, with [domain-modeling](../domain-modeling/SKILL.md) updating the glossary and ADRs as terms settle (that pair is [grill-with-docs](../grilling/references/matt/grill-with-docs/grill-with-docs.md)). Facts go to child agents, never to the user. Settle runnable questions with the [prototype](../prototype/SKILL.md) skill rather than by asking.
4. **Checklist.** The frontier is empty only when every item below is answered or already answered by the repo or `docs/agents/*`. Skip what is already answered; never re-ask a setup question.
5. **Spec and tickets** (spec-and-tickets routes). Run [to-spec](references/matt/to-spec/to-spec.md), then [to-tickets](references/matt/to-tickets/to-tickets.md) including its quiz, and publish to the tracker. Wayfinder routes run [wayfinder](references/matt/wayfinder/wayfinder.md) here first.
6. **Write the brief.** Show the brief and preferences; the user confirms or edits. Then the run is AFK.

## Checklist

Each item names the upstream mid-flow ask it replaces.

| # | Question | Replaces |
|---|---|---|
| 1 | Done predicate: a checkable statement of done | `autonomous-run.md` step 1; figure-it-out Phase A |
| 2 | Seams to test, each with what it catches and misses | Matt `tdd` "confirm them with the user"; `to-spec` step 2 |
| 3 | Ticket breakdown approved (granularity, blocking edges) | `to-tickets` §4 Quiz the user |
| 4 | Review fixed point (branch, SHA, `main`) and review round limit | `code-review` §1 "ask for it" |
| 5 | Spec location for the review's spec axis | `code-review` §2 "ask the user where the spec is" |
| 6 | One-way doors this work may cross, each with a one-line blast radius, pre-approved or not | poteto-mode Autonomy "Always pause"; `never-block-on-the-human` |
| 7 | Gates: merge, operator review, deploy; merge authority if setup granted none | `autopilot-full.md`; `babysit.md` step 9; `multi-phase-plan.md` review gate |
| 8 | Budget: wall-clock time and number of units | orchestrate Frame; figure-it-out Phase A |
| 9 | Verify surface: which `verify-<app>` flow, or "no startable app" | `prototype`, `bug-fix.md` reproduce step |
| 10 | Architecture work: which candidate to take | `improve-codebase-architecture` "Which of these would you like to explore?" |
| 11 | Explicitly out of scope | (new) |
| 12 | Commands that must never run | (new) |
| 13 | Files, directories, branches, systems that are off limits | (new) |
| 14 | Known dead ends from earlier attempts | (new) |
| 15 | Commit and PR conventions, if different from workflow.md | (new) |
| 16 | Product or preference calls already foreseeable, with the user's default | orchestrate Escalation |

## Brief: `.audit/<slug>.brief.md` (committed)

```
SLUG         <slug>   ROUTE <route from SKILL.md §1>   BRANCH <run branch>
GOAL         one sentence, executable by a stranger with no chat access
DONE         the predicate (checklist 1) and the command or file check that proves it
SCOPE        paths this run may write; paths it may not (checklist 11, 13)
CONTEXT      spec and ticket links, glossary terms, ADRs, prototypes, dead ends (14)
ACCEPTANCE   checkable criteria, one per line
SEAMS        (2)
VERIFY       verify-<app> flow or "no startable app" (9); check command from workflow.md
REVIEW       fixed point, spec location, round limit (4, 5)
DOORS        one-way doors with blast radius: pre-approved | park as gate (6)
GATES        merge / operator review / deploy (7)
TIMEBOX      wall clock and units (8)
FORBIDDEN    commands and actions never to run (12), plus workflow.md "Never" list
DEFAULTS     foreseeable product calls with the user's default (16)
REPORT       close shape: rigor SKILL.md §6
```

`.audit/<slug>.preferences.md`: numbered standing orders, one constraint per line: the authority list from `docs/agents/workflow.md`, commit/PR conventions (15), and any rule the user stated during the interview. Pasted verbatim into every child brief.

Open the trail `.audit/<slug>.tsv` with a `frame` row pointing at the brief's commit.
