// Tests for mkbrief.mjs (architecture-pass briefs) and arch-check.mjs (the pass file's shape).
// Run: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = fileURLToPath(new URL("../.agents/skills/rigor/scripts/", import.meta.url));
const root = fileURLToPath(new URL("../", import.meta.url));
const run = (script, args) => spawnSync(process.execPath, [join(scripts, script), ...args], { encoding: "utf8", cwd: root });
const tmp = () => mkdtempSync(join(tmpdir(), "rigor-arch-"));

const brief = (dir, body = "Planner for #{N} ({H}) of {slug}.\n") => { const f = join(dir, "b.txt"); writeFileSync(f, body); return f; };

test("mkbrief planner: step 1 quotes both skills in full before the project brief", () => {
  const d = tmp();
  const r = run("mkbrief.mjs", ["--role", "planner", "--ticket", "385", "--arch-out", join(d, "a.md"), "--out", join(d, "o.txt"), "--brief", brief(d), "--set", "N=385", "--set", "H=7", "--set", "slug=s"]);
  assert.equal(r.status, 0, r.stderr);
  const o = readFileSync(join(d, "o.txt"), "utf8");
  const cd = o.indexOf("codebase-design.md → Codebase Design");
  const ica = o.indexOf("improve-codebase-architecture.md → Improve Codebase Architecture");
  const step2 = o.indexOf("STEP 2 OF 2");
  assert.ok(o.startsWith("STEP 1 OF 2"));
  assert.ok(cd > 0 && ica > cd && step2 > ica, "skills come before step 2");
  assert.match(o, /deletion test/i); // from the quoted skill text
  assert.match(o, /Rejected framings/); // the last section of codebase-design: the whole file is quoted
  assert.ok(o.includes("Planner for #385 (7) of s."));
  assert.ok(o.includes(`Write ${join(d, "a.md")} BEFORE any other output file`));
  assert.ok(!o.includes("INLINE:"), "every INLINE line expanded");
  assert.ok(!o.includes("[[plan-review]]") && !o.includes("## Plan comparison"), "only the planner part");
});

test("mkbrief: plan-review forms its view before opening the plan; landing names the diff", () => {
  const d = tmp();
  const pr = run("mkbrief.mjs", ["--role", "plan-review", "--ticket", "7", "--arch-out", "a.md", "--out", join(d, "p.txt"), "--plan", "plan-7.md"]);
  assert.equal(pr.status, 0, pr.stderr);
  const p = readFileSync(join(d, "p.txt"), "utf8");
  assert.ok(p.startsWith("STEP 1 OF 1"));
  assert.match(p, /without opening the plan \(plan-7\.md\)/);
  assert.match(p, /## Plan comparison/);
  const ld = run("mkbrief.mjs", ["--role", "landing", "--ticket", "7", "--arch-out", "a.md", "--out", join(d, "l.txt"), "--diff", "main..stage1"]);
  assert.equal(ld.status, 0, ld.stderr);
  const l = readFileSync(join(d, "l.txt"), "utf8");
  assert.match(l, /Scope: the files main\.\.stage1 changes/);
  assert.match(l, /should-fix/);
});

test("mkbrief: misuse and leftover placeholders exit 2", () => {
  const d = tmp();
  const base = ["--ticket", "1", "--arch-out", "a.md", "--out", join(d, "o.txt")];
  assert.equal(run("mkbrief.mjs", ["--role", "planner", ...base]).status, 2, "planner needs --brief");
  assert.equal(run("mkbrief.mjs", ["--role", "plan-review", ...base]).status, 2, "needs --plan");
  assert.equal(run("mkbrief.mjs", ["--role", "landing", ...base]).status, 2, "needs --diff");
  assert.equal(run("mkbrief.mjs", ["--role", "boss", ...base]).status, 2);
  const left = run("mkbrief.mjs", ["--role", "planner", ...base, "--brief", brief(d), "--set", "N=1"]);
  assert.equal(left.status, 2);
  assert.match(left.stderr, /\{H\}, \{slug\}/);
  const bad = run("mkbrief.mjs", ["--role", "planner", ...base, "--brief", brief(d, "INLINE: no/such.md#X\n")]);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /INLINE: no file no\/such\.md/);
});

const GOOD = `## Scope
backend/x at abc; sub-agent "walk"
## Friction
- x.py:f leaks
## Deletion test
| module | result | why |
|---|---|---|
| x | concentrates | one owner |
## Owners
- status key -> Coordinator
## Seams
- none added
## Candidates
- Strong: fold y into x
## Principles applied
- deletion test: kept x
`;

test("arch-check planner: ok when complete and the plan cites the file and comes after it", () => {
  const d = tmp();
  const a = join(d, "arch-385.md"), p = join(d, "plan.md");
  writeFileSync(a, GOOD);
  writeFileSync(p, "ARCHITECTURE: see arch-385.md\n");
  utimesSync(a, new Date(1000), new Date(1000));
  const r = run("arch-check.mjs", ["--role", "planner", "--arch", a, "--plan", p]);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /arch-check: ok/);
});

test("arch-check: missing file, empty or missing headings, no table row, no owner arrow fail", () => {
  const d = tmp();
  assert.equal(run("arch-check.mjs", ["--role", "planner", "--arch", join(d, "none.md")]).status, 1);
  const a = join(d, "a.md");
  writeFileSync(a, GOOD.replace("- x.py:f leaks\n", "").replace("| x | concentrates | one owner |\n", "").replace("status key -> Coordinator", "status key").replace(/## Candidates\n.*\n/, ""));
  const r = run("arch-check.mjs", ["--role", "planner", "--arch", a]);
  assert.equal(r.status, 1);
  for (const m of [/empty section "## Friction"/, /no module row/, /no "<rule> -> <owner>"/, /missing heading "## Candidates"/]) assert.match(r.stdout, m);
});

test("arch-check: plan not citing the file, or older than it, fails the planner", () => {
  const d = tmp();
  const a = join(d, "arch-1.md"), p = join(d, "plan.md");
  writeFileSync(p, "no citation\n");
  utimesSync(p, new Date(1000), new Date(1000));
  writeFileSync(a, GOOD);
  const r = run("arch-check.mjs", ["--role", "planner", "--arch", a, "--plan", p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /does not cite arch-1\.md/);
  assert.match(r.stdout, /before the architecture pass file/);
});

test("arch-check reviews: need a verdict, and plan-review a comparison", () => {
  const d = tmp();
  const a = join(d, "a.md");
  writeFileSync(a, GOOD);
  const r = run("arch-check.mjs", ["--role", "plan-review", "--arch", a]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /missing heading "## Plan comparison"/);
  assert.match(r.stdout, /missing heading "## Verdict"/);
  writeFileSync(a, GOOD + "## Verdict\nMAYBE\n");
  assert.match(run("arch-check.mjs", ["--role", "landing", "--arch", a]).stdout, /not SOUND/);
  writeFileSync(a, GOOD + "## Verdict\n**SOUND WITH FOLLOW-UPS**\n- one\n");
  assert.equal(run("arch-check.mjs", ["--role", "landing", "--arch", a]).status, 0);
  assert.equal(run("arch-check.mjs", ["--role", "x", "--arch", a]).status, 2);
});
