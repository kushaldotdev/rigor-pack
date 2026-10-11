---
name: ask-pack
description: "Ask which skill or flow fits your situation. A router over the skills in this pack."
disable-model-invocation: true
---

# Ask Pack

You don't remember every skill, so ask.

Before stating what a skill does or recommending a step be skipped, read that skill's SKILL.md - the pack may be installed in a repo's `.agents/skills/`, globally in `~/.pi/agent/skills/`, or at `~/.agents/skills/`. A cross-reference is written as the skill's name plus its path: read and follow the `<name>` skill (`<skills-root>/<name>/SKILL.md`), where `<skills-root>` means whichever of those roots holds the target. The bare name normally resolves on its own, since pi lists every installed skill with its absolute path. The summaries here are for orientation only.

One skill sits **above** this whole map: **`rigor`**, the conductor. When you want a unit of work run end to end - ground, plan, build, verify, review, close - through orchestrated subagents, you don't pick the steps yourself; you point `rigor` at the issue, the feature description, a markdown file of work items, or a review range, and it routes. This map is for when you're driving the skills yourself, or choosing what to hand to `rigor`.

A **flow** is a path through the skills. Most paths run along one **main flow**, and three **on-ramps** merge onto it. Everything else is a per-task rigor check, standalone, or a vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`grill-with-docs`** sharpens the idea by interview. Start here whenever you are **working in a working directory**: it's stateful, retaining what it learns in `GLOSSARY.md` and ADRs. It runs the `grilling` interview primitive underneath (see Standalone) and leaves a paper trail.
2. **Branch: can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through **`prototype`**: a small throwaway program that answers the one design question. The answer folds into the real code; the prototype itself is kept as a primary source on a `prototype/<name>` branch, pointed at from the implementation issue. (Bridging a prototype into a fresh session is the `handoff` skill's job.)
3. **Branch: is this a multi-session build?**
   - **Yes** → **`to-spec`** (turn the thread into a spec published to the tracker), then **`to-tickets`** to split it into tracer-bullet tickets with blocking edges. From there, hand the ticket queue to **`rigor`** - its M tier drains ready tickets in parallel worker children onto one integration branch, and its close phase runs the review - or drive **`implement`** per ticket yourself if you want to stay in the loop.
   - **No** → **`implement`** right here, in the same context window, or hand the single task to **`rigor`** (S tier) if you want it run hands-off with verification and review included.

   Either way, the code gets built by driving **`tdd`** (one red-green slice at a time) and closes out with **`code-review`**, a two-axis review (Standards + Spec) of the diff. `implement` runs both; `rigor` runs both as build and review phases. Reach for **`tdd`** on its own when you just want to build a concrete behaviour test-first, and **`code-review`** on its own whenever you want to review a branch or PR against a fixed point.
4. **`retro`** closes the loop. After a build, and especially one that went sideways, it looks back over the session and suggests changes to the agent's **environment**, not the code. Pair it with **`correct`** (below) when the same mistakes keep repeating.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`triage`**. It moves issues through triage roles and produces agent-ready issues, which `implement` or `rigor` later picks up. Triage is only for issues **you didn't create**: tickets `to-tickets` produced are already agent-ready, so don't triage them.
- **Something's broken** → **`diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a tight feedback loop, then fixes with a regression test. Once the fix is in, run **`retro`** in the same session; where the real finding is that there's no good seam to lock it down, that's a job for **`improve-codebase-architecture`**.
- **A huge, foggy effort: a greenfield project or a huge feature build, too big for one session** → **`wayfinder`**, the most cognitively demanding flow here. It charts a shared map of decision tickets on the issue tracker and resolves them one at a time, producing **decisions, not deliverables**, until the fog is pushed back. Where `grill-with-docs` sharpens an idea you can hold in one session, wayfinder is for the idea you can't. When the map clears, it hands off, it doesn't build: merge onto the main flow at `to-spec`.

## Per-task rigor checks

Not flows - targeted checks you bolt onto work that's already moving. These are the pack's pstack forks.

- **`interrogate`**: adversarial review of a change. Four persona reviewers (skeptic, bug hunter, contract breaker, simplifier) attack it; a synthesized verdict comes back. Run it on contested designs and anything that will be hard to unwind.
- **`blast-radius`**: find what a change breaks beyond the diff, and prove the one safety fact by running real code. Run it before any one-way door - schema migration, irreversible delete, external side effect, auth change.
- **`benchmark-checklist`**: seven questions to vet any performance number before you trust or report it. If you're about to say "it's faster", run it first.
- **`show-me-your-work`**: a TSV decision trail for long or unattended runs, auditable against git evidence. `rigor` uses it for its checkpoint barrier; use it solo whenever a run will outlive your attention.
- **`correct`**: mine the repo's repeated agent mistakes and make each one impossible - architecture > types > lint > test. Run it when the same class of error shows up twice.
- **`create-verification-skill`**: generate a repo-local `verify-<app>` skill that drives the real app (Playwright + curl + DB CLI + screenshots read back as images). Run it once per app, then let `rigor`'s verify phase use the result.
- **`unslop`**: strip AI-writing tells from prose surfaces - docs, READMEs, PR bodies, issue text.

## Codebase health

Not feature work, just upkeep.

- **`improve-codebase-architecture`** runs whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces deepening opportunities; picking one generates an idea you can take into the main flow at `grill-with-docs`. It's the survey that finds the candidates; `codebase-design` is the bench you design the chosen one on.

## Vocabulary underneath

Three model-invoked references that run *beneath* the other skills, each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.

- **`domain-modeling`**: sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word, record a hard-to-reverse decision as an ADR. It's the active discipline `grill-with-docs` drives to keep `GLOSSARY.md` a clean glossary.
- **`codebase-design`**: the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `tdd` and `improve-codebase-architecture` both speak it.
- **`writing-for-agents`**: the vocabulary for writing any document an agent consumes - a skill, `AGENTS.md`/`CLAUDE.md`, or a doc reached by a pointer - and the context-pointer wording that decides when the agent reaches it. `retro` drives it when turning a session's findings into steering-file edits.

## Phase boundaries

A **phase** is a chunk of work inside a session: the grilling, the implementation, the QA. At the **boundary** between two of them you have five options, and picking between them is the fuzziest decision in this whole map:

- **Continue**: stay put. Costs nothing, loses nothing.
- **New session**: empty the window and start from nothing, when nothing here matters to what's next.
- **`handoff`** writes a portable markdown file. Narrow: only for a **new harness**, a **new directory**, a **colleague**, or forking a side task **mid-phase**. What it buys is portability.
- **Subagent**: send a tightly-scoped task to its own window and get a report back. In pi this is the `subagent` tool under the ceilings in `~/.pi/agent/skills/subagent-orchestration-policy/SKILL.md`.
- **Compact** (pi's context compression): compresses this context and seeds a fresh session with it. The **default**, at the bottom of the tree rather than the first reach.

Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree: the five questions, the reasoning behind each branch, and why the primary-source cost makes **Continue** the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`grilling`** is the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours. `grill-with-docs` is its stateful wrapper, and `triage`, `wayfinder` and `improve-codebase-architecture` all run it internally. Reach for it directly when you want the interview with no wrapper around it - sharpening a plan, a decision, or a piece of writing with no repo state to keep.
- **`prototype`**: see step 2 of the main flow; reach for it any time a design question is hard to settle on paper.
- **`research`**: delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces feeds the main flow at `grill-with-docs` - research feeds the thinking rather than replacing it.
- **`wait-what`**: the "that didn't land" reset. When a message, plan, or explanation misses you, it re-pitches the same thing in plain language using `GLOSSARY.md` vocabulary instead of repeating itself louder.

## Precondition

**`setup-matt-pocock-skills`**: run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.
