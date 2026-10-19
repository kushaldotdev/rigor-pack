# skills-harness

Testbed for a vendored, materialized agent-skills pack on pi: Matt Pocock's
[mattpocock/skills](https://github.com/mattpocock/skills) (engineering
lifecycle) combined with poteto's
[pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) (per-task
rigor), orchestrated by the `rigor` conductor skill and routed by the
`ask-pack` finder.

## Design rule: self-contained pack

- **`.agents/skills/` is the deliverable and is self-contained.** Installing
  into a repo = copying `.agents/skills/` and nothing else. No `vendors/`
  needed at runtime; every skill works from the copied folder alone.
- `vendors/` holds **pristine upstream copies, trimmed to the skill buckets we
  use** (Matt: `engineering` + `productivity`; pstack: `skills/`). Never edit
  anything in `vendors/`. It exists for upgrade diffs only. Upgrading =
  re-clone upstream at the pin, copy the same subset, then diff (the `.git`
  dirs were stripped, so upgrades re-clone rather than pull).
- `.agents/skills/` holds **materialized wrappers**, **forks**, and **new**
  skills:
  - **Materialized wrapper** (the Matt skills): build output of
    `scripts/build-pack.mjs` — the upstream SKILL.md content is inlined with
    mechanical transforms (Skill-tool phrasings → in-pack skill paths, slash
    commands → `/skill:<name>`), the whole upstream folder
    (support files) is copied, plus a short "pi notes" section only where
    that skill needs one.
    Never hand-edit a wrapper — rebuild instead.
  - **Fork** (poteto ports that assume Cursor): hand-maintained content
    genuinely edited for pi. Every deviation logged in `CHANGES.md`.
  - **New** (ours): `rigor` conductor, generated verification skills.
- Every deviation from upstream — transform or fork edit — is logged in
  [`CHANGES.md`](./CHANGES.md). If it isn't logged, it doesn't exist.
- Skill delivery to subagents: pi-subagents children are cold-start and load
  no skills on their own; the parent delivers each child's skill via the
  `skill:` option or by packet-inlining the operative SKILL.md path + rules,
  plus the pi facts (no `Skill` tool - the child reads the SKILL.md file,
  the user forces one with `/skill:<name>`; ceilings in
  `subagent-orchestration-policy`) since skills carry no shared adaptations
  block. A child that may delegate further gets the same delivery rule to pass
  down. Workers/reviewers/research children get working skills; the parent
  keeps planning and single-writer skills.

## The pack (29 skills)

All live in `.agents/skills/`; every one traces to a vendor row in `CHANGES.md`.

### New — ours

| Skill | Purpose |
|---|---|
| `rigor` | The conductor. Point it at a GitHub issue, a feature description, a markdown file of work items, or a seam/PR review range; it routes through the skills below, fans out pi `subagent` children, enforces size tiers (S/M/L), a merit gate (stop before planning if the work's long-run benefit is questionable), checkpoint barriers, batch failure stop-and-yield, and repo-derived one-way-door autonomy gates. Tracker-optional. Phase diagram at the top of its SKILL.md. |
| `ask-pack` | "Which skill fits?" router over the pack: main flow, on-ramps, per-task rigor checks, standalone skills. Fork of Matt's `ask-matt`, remapped to this pack. |

### Materialized wrappers — Matt Pocock skills, inlined + adapted

| Skill | Purpose |
|---|---|
| `tdd` | Test-driven red-green-refactor loop; seam questions before code. |
| `code-review` | Review a diff on two axes (standards + spec) via two parallel read-only reviewer children. |
| `diagnosing-bugs` | Diagnosis loop for hard bugs and perf regressions: reproduce, isolate, root-cause, prove the fix. |
| `domain-modeling` | Build and sharpen `GLOSSARY.md` and ADRs as the domain model crystallizes. |
| `grill-with-docs` | Relentless interview to sharpen a plan, writing ADRs/glossary as it goes. |
| `implement` | Implement a spec or ticket set end to end (tdd at seams, code-review at close). |
| `improve-codebase-architecture` | Scan for deep-module opportunities, present as visual report, grill the pick. |
| `prototype` | Throwaway prototype to answer a design question before committing. |
| `research` | Investigate a question against primary sources, capture findings as a repo doc. |
| `to-spec` | Synthesize the current conversation into a spec published to the tracker. |
| `to-tickets` | Break a plan/spec into tracer-bullet tickets with blocking edges on the tracker. |
| `triage` | Move issues/PRs through triage roles; verify, grill, write agent-ready briefs. |
| `wayfinder` | Plan multi-session work as a map of decision tickets; resolve the frontier one at a time. |
| `codebase-design` | Deep-module vocabulary: interfaces, seams, deletion tests. |
| `retro` | Structured retrospective on a completed unit of work. |
| `setup-matt-pocock-skills` | One-time repo config: tracker, triage labels, domain doc layout. |
| `grilling` | Stress-test a plan or decision with rounds of yes-shaped questions. |
| `wait-what` | "That last message didn't land" reset: re-pitch it in plain language using `GLOSSARY.md` vocabulary. |
| `writing-for-agents` | Reference for writing any document an agent consumes - a skill, `AGENTS.md`/`CLAUDE.md`, or a pointed-at doc - and the context-pointer wording that decides when the agent reaches it. |

### Forks — upstream skills edited for pi

| Skill | Purpose |
|---|---|
| `interrogate` | Adversarial review: 4 persona reviewers (skeptic, bug hunter, contract breaker, simplifier) attack the change; synthesized verdict; reviewers run on the reviewer tier configured in agent definitions (missing tier = child's own default, never the root model). |
| `blast-radius` | Find what a change breaks beyond the diff; prove the one safety fact by running real code. |
| `correct` | Mine the repo's repeated agent mistakes and make each one impossible (architecture > types > lint > test). |
| `benchmark-checklist` | 7-question vetting before trusting any perf number you measured. |
| `show-me-your-work` | TSV decision trail for long/unattended runs; audit against git evidence; fresh-context reviewer flags. |
| `create-verification-skill` | Generate a repo-local `verify-<app>` skill that drives the real app: Playwright + curl + DB CLI + screenshots read back as images. |
| `unslop` | Strip AI-writing tells from prose surfaces. |
| `handoff` (Matt: productivity) | Compact the conversation into a `tmp/<timestamp>-<slug>.md` handoff doc for the next agent; ships in the pack but is always installed globally, never into a repo. |
| `ask-pack` (Matt: engineering) | Router over the whole pack: main flow, on-ramps, per-task checks, standalone skills. |

## Layout

```
skills-harness/
├── README.md                  ← this file
├── CHANGES.md                 ← exact deviations from upstream, per skill
├── scripts/
│   ├── build-pack.mjs         ← materializes wrappers from vendors/ into .agents/skills/
│   └── check-pack.mjs         ← validates the pack (frontmatter, refs, self-contained, Cursor-isms)
├── vendors/                   ← pristine upstream, NEVER edit; upgrade diffs only
│   ├── mattpocock/skills/     ← engineering/ + productivity/ only @ 49dd158 (v1.3.1)
│   └── poteto/pstack/         ← skills/ only @ d457567 (56 skills)
├── .agents/skills/            ← the deliverable; pi auto-loads these when cwd = this folder
│   ├── rigor/                 ← NEW: conductor (phases, batch/sweep playbooks,
│   │                             merit gate, autonomy gates, checkpoint barriers)
│   ├── ask-pack/              ← FORK of ask-matt: pack-wide skill router
│   ├── <matt-name>/           ← MATERIALIZED WRAPPERS: tdd, code-review, retro, ...
│   └── <poteto-name>/         ← FORKS: blast-radius, interrogate, correct, ...
└── tmp/                       ← scratch, never committed
```

## Build & validate

```bash
node scripts/build-pack.mjs   # rebuild wrappers from vendors/ (never hand-edit them)
node scripts/check-pack.mjs   # must pass before any commit: 29/29 skills
```

## Testing

```bash
cd ~/projects/skills-harness
pi          # skills in .agents/skills/ auto-load for this cwd
```

## Installing into a repo (e.g. my-app)

### Placement — which skills live where

One rule first: **a skill lives in exactly one place.** The same skill name
in repo `.agents/skills/` and global `~/.pi/agent/skills/` double-advertises
to the agent — install-time deletions below are part of the install, not
optional cleanup.

| Location | Skills | Why |
|---|---|---|
| Repo `.agents/skills/` | **the whole pack, as-is** | skills resolve in-pack cross-references (`.agents/skills/<name>/SKILL.md`) and act on that repo's surfaces; self-contained means nothing else is needed |
| Global `~/.pi/agent/skills/` | `handoff` (pack member), `subagent-orchestration-policy` | harness-level, repo-agnostic; `handoff` ships in the pack but is always installed globally, never into a repo |
| Global, optional (pack-less repos only) | `grilling`, `unslop`, `code-review`, `diagnosing-bugs` | standalone, universal skills that work with no repo pack; if a repo with the full pack also sees the global copy, delete one side |
| Repo-specific, stays in the target repo | `codebase-memory`, `postgres-query`, `redis-inspect`, generated `verify-<app>` | written against that repo, not part of this pack |

### Install steps

```bash
# 1. delete the target repo's stale skills this pack supersedes
#    (No-Legacy: replace = delete — a consumer repo's old tdd/code-review/domain-modeling
#    copies must go, not merge)
rm -rf <repo>/.agents/skills/<stale-names>
# 2. copy the pack — this is the entire install
rsync -a --delete .agents/skills/ <repo>/.agents/skills/
# 3. delete any global copy of a skill the repo pack now carries (double-advertise)
rm -rf ~/.pi/agent/skills/{grilling,unslop,code-review,diagnosing-bugs}
# 4. rename the domain doc the pack's skills speak
(cd <repo> && git mv CONTEXT.md GLOSSARY.md)   # if the repo still has CONTEXT.md
# 5. expose the same skills to other harnesses
bash scripts/link-harnesses.sh repo
```

### Harness symlinks (OpenAI / Claude / Cursor / others)

Canonical stores stay where they are — other harnesses get a symlink, never a
copy, so there is one source of truth to upgrade:

```bash
bash scripts/link-harnesses.sh repo    # .claude/skills .codex/skills .cursor/skills -> .agents/skills
bash scripts/link-harnesses.sh global  # ~/.claude/skills ~/.codex/skills ~/.cursor/skills -> ~/.pi/agent/skills
bash scripts/link-harnesses.sh all     # both
```

The script is idempotent (`ln -sfn`), and refuses to replace an existing
**real** directory (prints SKIP) — resolve that manually, keeping the
single-owner rule. Verify with `ls -la <target>` (readlink should show the
canonical store). If a harness does not follow symlinked skill dirs, fall
back to per-skill links:

```bash
for d in .agents/skills/*/; do ln -sfn "$PWD/$d" ".claude/skills/$(basename "$d")"; done
```

Global-vs-repo duplicates then apply inside those harnesses exactly as for pi:
when a repo carries the full pack, the global symlink's shared names are
shadowed by convention — keep global to `handoff` + `subagent-orchestration-policy`
(plus the optional four for pack-less repos) unless you accept the duplicate.

## Upgrading upstream

```bash
# refresh a vendor (no .git kept, so re-clone and diff)
git clone --depth 1 https://github.com/mattpocock/skills /tmp/mp-fresh
diff -r /tmp/mp-fresh/skills/engineering vendors/mattpocock/skills/engineering
# then: copy the new subset in, node scripts/build-pack.mjs,
# node scripts/check-pack.mjs, and re-verify every CHANGES.md row against
# the new upstream text.
```

## Vendor contents

Verbatim skill copies, trimmed to used buckets; `.git` stripped, upstream
`LICENSE` kept for attribution, bucket READMEs kept:

| Vendor | Kept | Dropped |
|---|---|---|
| mattpocock/skills | `skills/engineering/` (20 skills), `skills/productivity/` (7 skills), bucket READMEs, `LICENSE` | `deprecated/`, `in-progress/`, `misc/`, docs, scripts, CI, plugin manifests |
| poteto/pstack | `skills/` (56), `LICENSE` | `README.md`, docs, `.gitignore` |

| Vendor | Ref | Date |
|---|---|---|
| mattpocock/skills | `49dd158d1076134a641b33efb035946536778336` (v1.3.1) | 2026-10-09 |
| cursor/plugins (pstack) | `d457567332aa6989e753ea289f30ea2bfbc80bc0` (v0.15.28) | 2026-10-19 |
