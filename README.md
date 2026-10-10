# skills-harness

Testbed for a vendored + wrapped agent-skills pack on pi: Matt Pocock's
[mattpocock/skills](https://github.com/mattpocock/skills) (engineering
lifecycle) combined with poteto's
[pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) (per-task
rigor), orchestrated by a new `rigor-mode` conductor skill.

## Design rule: minimum changes to upstream

- `vendors/` holds **pristine upstream copies, trimmed to the skill buckets we
  use** (Matt: `engineering` + `productivity`; pstack: `skills/`). Never edit
  anything in `vendors/`. Upgrading = re-clone upstream at the pin, copy the
  same subset, then diff (the `.git` dirs were stripped, so upgrades re-clone
  rather than pull).
- `.agents/skills/` holds **wrappers** and **forks**:
  - **Wrapper** (most Matt skills): a thin SKILL.md that says "read and follow
    the vendored upstream SKILL.md", plus a short list of pi-only overrides
    (e.g. translate Cursor's "Call the Skill tool with X" into "read
    `vendors/.../X/SKILL.md`"). No upstream content is rewritten.
  - **Fork** (poteto ports that assume Cursor): content copied and genuinely
    edited for pi. Every deviation logged in `CHANGES.md`.
  - **New** (ours): `rigor-mode` conductor, generated verification skills.
- Every deviation from upstream — override or fork edit — is logged in
  [`CHANGES.md`](./CHANGES.md). If it isn't logged, it doesn't exist.

## Layout

```
skills-harness/
├── README.md                  ← this file
├── CHANGES.md                 ← exact deviations from upstream, per skill
├── vendors/                   ← pristine upstream, NEVER edit
│   ├── mattpocock/skills/     ← engineering/ + productivity/ only @ 49dd158 (v1.3.1)
│   └── poteto/pstack/         ← skills/ only @ d73344b (51 skills)
├── .agents/skills/            ← pi auto-loads these when cwd = this folder
│   ├── rigor-mode/            ← NEW: conductor (phases, batch/sweep playbooks,
│   │                             autonomy gates, checkpoint barriers)
│   ├── <matt-name>/           ← WRAPPERS: tdd, code-review, diagnosing-bugs, ...
│   └── <poteto-name>/         ← FORKS: blast-radius, interrogate, correct, ...
└── tmp/                       ← scratch, never committed
```

## Testing

```bash
cd ~/projects/skills-harness
pi          # skills in .agents/skills/ auto-load for this cwd
```

## Installing into a repo (e.g. my-app)

Copy what the target repo needs from `.agents/skills/` into the repo's
`.agents/skills/`, and harness-generic skills into `~/.pi/agent/skills/`
(global). The split decided so far:

| Destination | Skills |
|---|---|
| Repo `.agents/skills/` | rigor-mode, all wrappers, forks that touch repo surfaces |
| Global `~/.pi/agent/skills/` | grilling, handoff (existing fork), subagent-orchestration-policy, plus generic wrappers if shared across projects |
| Repo-only, project-specific | codebase-memory, postgres-query, redis-inspect (stay in the consumer repo, not here) |

## Upgrading upstream

```bash
# refresh a vendor to latest
git -C vendors/mattpocock/skills pull --ff-only
# then: diff vendors against CHANGES.md — verify each logged override still
# applies to the new upstream text; wrappers make this a small check.
```

## Vendor contents

Verbatim skill copies, trimmed to used buckets; `.git` stripped, upstream
`LICENSE` kept for attribution, bucket READMEs kept:

| Vendor | Kept | Dropped |
|---|---|---|
| mattpocock/skills | `skills/engineering/` (21), `skills/productivity/` (8), `LICENSE` | `deprecated/`, `in-progress/`, `misc/`, docs, scripts, CI, plugin manifests |
| poteto/pstack | `skills/` (51), `LICENSE` | `README.md`, docs, `.gitignore` |

| Vendor | Ref | Date |
|---|---|---|
| mattpocock/skills | `49dd158d1076134a641b33efb035946536778336` (v1.3.1) | 2026-10-09 |
| cursor/plugins (pstack) | `d73344bee8cf22e53b9d5f4cf5749d38ba38c174` | 2026-10-09 |
