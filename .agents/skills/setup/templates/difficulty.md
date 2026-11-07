# Difficulty scale

Every ticket and every task that an agent or a human picks up gets a **hardness from 1 to 10**. The score sets its **band**, and the band's halt rule binds whoever does the work. Use it for all work in this repo, not only for one effort.

## Bands and halt rules

| Band | Halt rule |
|---|---|
| easy | Just do it |
| medium | Post a short plan as a ticket comment, then go on without waiting |
| hard | Post the plan and **don't start it until the owner replies "approved"** (or gives changes). Work that doesn't depend on it and doesn't share its files may go on meanwhile |
| critical | Plan and approval, **and** the lead session reviews every line of every commit itself |

If tickets carry band labels, this repo's prefix is `<prefix>` <!-- e.g. difficulty:easy; delete the line if tickets carry no labels -->. The approval mode is in `docs/agents/workflow.md` → Chain efforts: the owner, or L0 for the owner (delegated).

## Scoring

Start from the row that best describes what the change touches, then apply the modifiers. Fill the rows in for this repo's areas; the parenthesised examples are neutral.

| Hardness | What the change touches |
|---|---|
| 1–2 | Docs and copy (a README, a label, an error message); config with no runtime effect |
| 3–4 | One module's logic or one UI behaviour; an existing test seam covers it; no data, money, auth or sessions |
| 5–6 | Crosses a seam or a service boundary; a user-visible flow; new queries but no schema migration; needs a new test at a seam |
| 7–8 | Money or a payment path; auth or sessions; a schema migration; transactions, locking or concurrency; background jobs or a broker adapter |
| 9–10 | Can lose or corrupt data, or leak it across users; a redesign of a transactional flow across several seams |

Add this repo's own 7-and-up areas here, the ones a change must not touch casually: `<area>, <area>`. `CHAIN.md` → Review depth sizes every review by these rows.

Modifiers (cap at 10):
- **+1** when no test seam exists yet, or the bug needs a race, a real database or a vendor SDK to go red.
- **+1** when part of it can't be undone: a migration that drops or rewrites data, or the deletion of a user-visible behaviour.
- **+1** when it touches more than three seams.
- **−1** when a working repro or a red test already exists.

A ticket's hardness is at least its hardest task, plus one when its tasks interact (shared rows, shared locks, ordering between them).

## Who scores, and re-scoring

- Whoever files the ticket scores it. A ticket filed without a score is scored by whoever picks it up, before any code.
- If the work turns out harder or easier than the label, re-score before going on: comment the new score and the reason, and swap the labels. Moving into hard or critical triggers that band's halt rule right away.
- A plan comment for medium and above says: the approach, the files, the test that goes red first, and what could break.
