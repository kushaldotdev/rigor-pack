// Tests for the rigor chain tools: pi-delegation.mjs and mkpacket.mjs.
// Run: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, utimesSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = fileURLToPath(new URL("../.agents/skills/rigor/scripts/", import.meta.url));
const run = (script, args, env = process.env) =>
  spawnSync(process.execPath, [join(scripts, script), ...args], { encoding: "utf8", env });

const tmp = () => mkdtempSync(join(tmpdir(), "rigor-tools-"));

// One jsonl line carrying a subagent tool call with the given arguments.
const call = (args) => JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "toolCall", name: "subagent", arguments: args }] } });

const FIXTURE = [
  call({ agent: "scout", task: "look" }), // both argument shapes
  call({ tasks: [{ agent: "scout", task: "a" }, { agent: "worker", task: "b" }] }),
  JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "toolCall", name: "bash", arguments: { command: "ls" } }] } }),
  "{ this is not json",
  JSON.stringify({ type: "message", message: { content: "not an array" } }),
  call({}),
].join("\n") + "\n";

test("pi-delegation counts subagent calls per agent and ignores junk", () => {
  const dir = tmp();
  const file = join(dir, "s.jsonl");
  writeFileSync(file, FIXTURE);
  const r = run("pi-delegation.mjs", [file]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trimEnd(), `  4 {"scout":2,"worker":1,"unknown":1} ${file}`);
});

test("pi-delegation --for resolves an encoded session folder, newest by default", () => {
  const root = tmp(); // stands in for ~/.pi/agent/sessions
  const cwd = join(root, "work", "some-repo");
  mkdirSync(cwd, { recursive: true });
  // Same encoding pi uses: absolute path, "/" -> "-", "--" both sides.
  const folder = join(root, `--${cwd.replace(/^\/+/, "").split("/").join("-")}--`);
  mkdirSync(folder, { recursive: true });
  const older = join(folder, "2026-01-01T00-00-00-000Z_old.jsonl");
  const newer = join(folder, "2026-02-02T00-00-00-000Z_new.jsonl");
  writeFileSync(older, call({ agent: "old" }) + "\n");
  writeFileSync(newer, call({ agent: "new" }) + "\n");
  utimesSync(older, new Date("2026-01-01"), new Date("2026-01-01"));
  utimesSync(newer, new Date("2026-02-02"), new Date("2026-02-02"));
  const env = { ...process.env, PI_SESSIONS_DIR: root };

  const one = run("pi-delegation.mjs", ["--for", cwd], env);
  assert.equal(one.status, 0, one.stderr);
  assert.equal(one.stdout.trimEnd(), `  1 {"new":1} ${newer}`);

  const all = run("pi-delegation.mjs", ["--for", cwd, "--all"], env);
  assert.equal(all.status, 0, all.stderr);
  assert.deepEqual(all.stdout.trim().split("\n").map((l) => l.split(" ").at(-1)).sort(), [older, newer].sort());
});

test("pi-delegation exits 2 when no session file is found", () => {
  const root = tmp();
  const r = run("pi-delegation.mjs", ["--for", join(root, "absent")], { ...process.env, PI_SESSIONS_DIR: root });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no session folder/);
  assert.equal(run("pi-delegation.mjs", []).status, 2);
});

const SLUG = "u22-fix";
// A real worktree: main holds BASE, branch u22-fix adds TIP on top, branch side forks from BASE
// with SIDE, which is no ancestor of u22-fix.
const git = (cwd, ...a) => {
  const r = spawnSync("git", ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...a], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
const WT = tmp();
git(WT, "init", "-q", "-b", "main");
git(WT, "commit", "-q", "--allow-empty", "-m", "base");
const BASE = git(WT, "rev-parse", "--short", "HEAD");
git(WT, "checkout", "-q", "-b", "side");
git(WT, "commit", "-q", "--allow-empty", "-m", "side");
const SIDE = git(WT, "rev-parse", "HEAD");
git(WT, "checkout", "-q", "-b", "u22-fix", BASE);
git(WT, "commit", "-q", "--allow-empty", "-m", "tip");
const TIP = git(WT, "rev-parse", "HEAD");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function repo(prefs = "prefs body: scratch in {wt}/tmp, no .env\n", project = null) {
  const dir = tmp();
  mkdirSync(join(dir, ".audit"), { recursive: true });
  if (prefs !== null) writeFileSync(join(dir, ".audit", `${SLUG}.preferences.md`), prefs);
  writeFileSync(join(dir, "task.md"), "TASK: fix it in {wt} on {branch} (base {base}).\nORACLE: none (fixture)\nARCHITECTURE: none (fixture)\n");
  if (project !== null) {
    mkdirSync(join(dir, "docs", "agents"), { recursive: true });
    writeFileSync(join(dir, "docs", "agents", "packet-rules.md"), project);
  }
  return dir;
}

function packet(dir, extra = [], { wt = WT, base = BASE } = {}) {
  const out = join(dir, "packet.md");
  const r = run("mkpacket.mjs", ["--slug", SLUG, "--wt", wt, "--base", base, "--branch", "u22-fix", "--task", join(dir, "task.md"), "--out", out, "--repo", dir, ...extra]);
  return { r, out, text: r.status === 0 ? readFileSync(out, "utf8") : "" };
}

test("mkpacket: digits ref is a tracker ticket", () => {
  const dir = repo();
  const { r, text, out } = packet(dir, ["--ref", "364"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(text, /`<type>\(<scope>\): <imperative> #364`/);
  assert.match(text, /`Refs #364`/);
  assert.match(text, /tmp\/cr-364-t1\.md/);
  assert.match(r.stdout, new RegExp(`${out}: \\d+ task chars, \\d+ total chars`));
});

test("mkpacket: unit ref is a chain unit, no issue number", () => {
  const dir = repo();
  const { text } = packet(dir, ["--ref", "U2"]);
  assert.match(text, /`<type>\(<scope>\): <imperative> \(u22-fix U2\)`/);
  assert.match(text, /`Refs u22-fix U2`/);
  assert.match(text, /cr-u2-t1\.md/);
  assert.doesNotMatch(text, /#\d/);
});

test("mkpacket: no ref falls back to the slug and no trailer", () => {
  const dir = repo();
  const { text } = packet(dir);
  assert.match(text, /`<type>\(<scope>\): <imperative>`/);
  assert.match(text, /and no trailer\./);
  assert.match(text, /tmp\/cr-u22-fix-t1\.md/);
});

test("mkpacket: --task-id gives each task of a ticket its own self-review file", () => {
  const dir = repo();
  const { text } = packet(dir, ["--ref", "364", "--task-id", "T2"]);
  assert.match(text, /tmp\/cr-364-t2\.md/);
  assert.doesNotMatch(text, /cr-364-t1\.md/);
  const bad = packet(dir, ["--ref", "364", "--task-id", "../x"]);
  assert.equal(bad.r.status, 2);
  assert.match(bad.r.stderr, /--task-id must be/);
});

test("mkpacket: substitutes placeholders in task, prefs and rules; none survive", () => {
  const dir = repo();
  const { text } = packet(dir, ["--ref", "U2"]);
  assert.match(text, new RegExp(`TASK: fix it in ${esc(WT)} on u22-fix \\(base ${BASE}\\)\\.`));
  assert.match(text, new RegExp(`prefs body: scratch in ${esc(WT)}/tmp`));
  assert.match(text, /7\. COMMITS on u22-fix only/);
  assert.match(text, /l1-progress\.log/); // pack rules reached the packet
  const left = [...text.matchAll(/\{(wt|base|branch|slug|ref|ticket|task|commit_subject|commit_trailer|lenses)\}/g)];
  assert.deepEqual(left, []);
  assert.ok(text.indexOf("STANDING ORDERS (binding):") < text.indexOf("\nRULES:\n"));
  assert.ok(text.indexOf("\nRULES:\n") < text.indexOf("\nPROJECT RULES:\n"));
});

test("mkpacket: project rules come from docs/agents, an override, or the text none", () => {
  const fromDefault = packet(repo(undefined, "default project rules here\n"));
  assert.match(fromDefault.text, /PROJECT RULES:\ndefault project rules here\n$/);

  const dir = repo(undefined, "default project rules here\n");
  writeFileSync(join(dir, "alt.md"), "override rules for {slug}\n");
  const overridden = packet(dir, ["--project-rules", join(dir, "alt.md")]);
  assert.match(overridden.text, /PROJECT RULES:\noverride rules for u22-fix\n$/);
  assert.doesNotMatch(overridden.text, /default project rules here/);

  assert.match(packet(repo()).text, /PROJECT RULES:\nnone$/);
});

test("mkpacket: a missing preferences file fails with exit 2", () => {
  const dir = repo(null);
  const { r } = packet(dir);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no preferences at .*\.audit/);
});

const LENS_LINE = "- Self-review lenses: `standards+spec always; blast-radius at medium; interrogate at hard and critical` <!-- comment -->\n";
const withWorkflow = (line = LENS_LINE) => {
  const dir = repo();
  mkdirSync(join(dir, "docs", "agents"), { recursive: true });
  writeFileSync(join(dir, "docs", "agents", "workflow.md"), `# Workflow\n\n## Chain efforts\n\n- Solo band: \`hard\`\n${line}`);
  return dir;
};
// The lens list packet rule 6 names, by short name.
const lensesIn = (text) => {
  const m = text.match(/with these\s+lenses: ([\s\S]*?)\. Each loop starts/);
  assert.ok(m, "rule 6 lens list not found");
  return [...m[1].matchAll(/(standards \+ spec|blast radius|interrogate) \(/g)].map((x) => x[1]);
};

test("mkpacket: --band fills rule 6 with that band's lenses from workflow.md", () => {
  const dir = withWorkflow();
  const want = { easy: ["standards + spec"], medium: ["standards + spec", "blast radius"], hard: ["standards + spec", "interrogate"], critical: ["standards + spec", "interrogate"] };
  for (const [band, lenses] of Object.entries(want)) {
    const { r, text } = packet(dir, ["--ref", "364", "--band", band]);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(lensesIn(text), lenses, band);
    assert.match(text, /tmp\/cr-364-t1\.md, one section per lens/);
    assert.doesNotMatch(text, /\{lenses\}/);
  }
  assert.match(packet(dir, ["--band", "hard"]).text, /Findings and Dropped lists/);
});

test("mkpacket: without --band, or without the setting, self-review is standards+spec only", () => {
  assert.deepEqual(lensesIn(packet(withWorkflow()).text), ["standards + spec"]);
  const noLine = packet(withWorkflow(""), ["--band", "critical"]);
  assert.equal(noLine.r.status, 0, noLine.r.stderr);
  assert.deepEqual(lensesIn(noLine.text), ["standards + spec"]);
  assert.match(noLine.r.stderr, /no "Self-review lenses" line/);
  assert.deepEqual(lensesIn(packet(repo(), ["--band", "hard"]).text), ["standards + spec"]); // no workflow.md
});

test("mkpacket: the setting's first backticked value wins over a trailing note", () => {
  const dir = withWorkflow("- Self-review lenses: `standards+spec always; blast-radius at medium; interrogate at hard and critical` (owner, 2026-11-07). The cheap self-review runs first; `not, a value`\n");
  const { r, text } = packet(dir, ["--band", "critical"]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(lensesIn(text), ["standards + spec", "interrogate"]);
  assert.deepEqual(lensesIn(packet(withWorkflow("- Self-review lenses: blast-radius at easy <!-- note -->\n"), ["--band", "easy"]).text), ["standards + spec", "blast radius"]); // no backticks
});

test("mkpacket: a bad band, lens or clause exits 2", () => {
  const bad = packet(withWorkflow(), ["--band", "extreme"]);
  assert.equal(bad.r.status, 2);
  assert.match(bad.r.stderr, /--band must be one of easy, medium, hard, critical: extreme/);
  const lens = packet(withWorkflow("- Self-review lenses: fuzzing at hard\n"), ["--band", "hard"]);
  assert.equal(lens.r.status, 2);
  assert.match(lens.r.stderr, /unknown lens .*: fuzzing/);
  const bandIn = packet(withWorkflow("- Self-review lenses: interrogate at hardest\n"), ["--band", "hard"]);
  assert.equal(bandIn.r.status, 2);
  assert.match(bandIn.r.stderr, /unknown band .*: hardest/);
  const clause = packet(withWorkflow("- Self-review lenses: interrogate\n"), ["--band", "hard"]);
  assert.equal(clause.r.status, 2);
  assert.match(clause.r.stderr, /bad clause .*: interrogate/);
});

test("mkpacket: --kind assessment adds interrogate whatever the band, and changes nothing else", () => {
  const dir = withWorkflow();
  const want = { easy: ["standards + spec", "interrogate"], medium: ["standards + spec", "blast radius", "interrogate"], hard: ["standards + spec", "interrogate"], critical: ["standards + spec", "interrogate"] };
  for (const [band, lenses] of Object.entries(want)) {
    const a = packet(dir, ["--ref", "364", "--band", band, "--kind", "assessment"]);
    assert.equal(a.r.status, 0, a.r.stderr);
    assert.deepEqual(lensesIn(a.text), lenses, band);
    // Apart from the interrogate lens and its brief, the packet is the code packet of the same band.
    const c = packet(dir, ["--ref", "364", "--band", band, "--kind", "code"]);
    const strip = (t) => t.replace(/; interrogate \([^)]*\)/, "").replace(/ interrogate \([^)]*\);?/, "").split("\n").filter((l) => !/Lens: interrogate\.|^\s*Probe: none/.test(l)).join("\n");
    assert.equal(strip(a.text), strip(c.text), band);
  }
  assert.deepEqual(lensesIn(packet(repo(), ["--kind", "assessment"]).text), ["standards + spec", "interrogate"]); // no band, no workflow.md
  assert.deepEqual(lensesIn(packet(dir, ["--band", "easy"]).text), ["standards + spec"]); // default kind is code
});

test("mkpacket: a bad --kind exits 2", () => {
  const { r } = packet(repo(), ["--kind", "essay"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--kind must be one of code, assessment: essay/);
});

const BODIES = {
  "standards + spec": "code-review/references/matt/code-review/code-review.md",
  "blast radius": "code-review/references/pstack/blast-radius/blast-radius.md",
  "interrogate": "code-review/references/pstack/interrogate/interrogate.md",
};
const briefsIn = (text) => [...text.matchAll(/^\s*- (Lens: .*)$/gm)].map((m) => m[1]);
const probeIn = (text) => text.match(/^\s*- Probe, final loop, once\. (.*)$/m)?.[1] ?? null;

test("mkpacket: the packet carries one filled reviewer-child brief per required lens, naming its body path", () => {
  const dir = withWorkflow();
  for (const [band, kind] of [["easy", "code"], ["medium", "code"], ["hard", "code"], ["easy", "assessment"], ["medium", "assessment"]]) {
    const { r, text } = packet(dir, ["--ref", "364", "--band", band, "--kind", kind]);
    assert.equal(r.status, 0, r.stderr);
    const lenses = lensesIn(text);
    const briefs = briefsIn(text);
    assert.equal(briefs.length, lenses.length, `${band}/${kind}`);
    lenses.forEach((lens, i) => {
      assert.equal(briefs[i], `Lens: ${lens}. Read ${WT}/.agents/skills/${BODIES[lens]} in full first, then review ${BASE}..HEAD in ${WT} and every deliverable the task names: none. Read-only: edit nothing, run nothing that writes.`);
    });
  }
});

test("mkpacket: every lens body a brief names exists in the pack", () => {
  const skills = fileURLToPath(new URL("../.agents/skills/", import.meta.url));
  for (const rel of Object.values(BODIES)) assert.ok(existsSync(join(skills, rel)), rel);
});

test("mkpacket: rule 6 puts named deliverables in scope and asks for runs behind claims", () => {
  const text = packet(repo()).text;
  assert.match(text, /base\.\.last commit AND every deliverable file the task names, committed or not/);
  assert.match(text, /by the method in\s+\S+\/\.agents\/skills\/rigor\/templates\/self-review\.txt/);
  const method = readFileSync(fileURLToPath(new URL("../.agents/skills/rigor/templates/self-review.txt", import.meta.url)), "utf8");
  assert.match(method, /claim of changed behaviour and every worked number[\s\S]*?command and its output in the self-review\s+file/);
  assert.match(method, /re-reads every changed deliverable whole[\s\S]*?claim the rewrite newly makes/);
  assert.match(method, /probe child[\s\S]*?never the child that wrote this task's code/);
});

test("mkpacket: --deliverables fills every lens brief with the task's deliverable files", () => {
  const { r, text } = packet(withWorkflow(), ["--band", "medium", "--deliverables", "tmp/outcome.md, docs/plan.md"]);
  assert.equal(r.status, 0, r.stderr);
  const briefs = briefsIn(text);
  assert.equal(briefs.length, 2);
  for (const b of briefs) assert.match(b, /every deliverable the task names: tmp\/outcome\.md, docs\/plan\.md\. /);
});

test("mkpacket: a task with no ORACLE section exits 2; a heading or a bare line both count", () => {
  const dir = repo();
  writeFileSync(join(dir, "task.md"), "TASK: fix it in {wt}.\nThe oracle is implied.\n");
  const none = packet(dir);
  assert.equal(none.r.status, 2);
  assert.match(none.r.stderr, /no ORACLE section in .*task\.md/);
  assert.ok(!existsSync(none.out), "no packet is written without an oracle");
  for (const line of ["ORACLE: none (docs only)", "## ORACLE", "  ORACLE (today's behaviour):", "**ORACLE**"]) {
    writeFileSync(join(dir, "task.md"), `TASK: fix it in {wt}.\n${line}\n| input | main |\n`);
    assert.equal(packet(dir).r.status, 0, line);
  }
});

test("packet rules: a fix round fixes the class, and the full suite waits for a settled commit", () => {
  const text = packet(repo()).text;
  assert.match(text, /12\. FIX ROUND[\s\S]*?name the class, list every site or input shape[\s\S]*?one test that walks\s+the list/);
  assert.match(text, /once, on a commit whose self-review act-on list is\s+empty/);
  assert.match(text, /3\. TEST FIRST, FROM THE ORACLE/);
});

test("mkpacket: --base must be an ancestor of, or equal to, --branch's tip in --wt", () => {
  const dir = repo();
  for (const base of [BASE, TIP]) assert.equal(packet(dir, [], { base }).r.status, 0, base);
  const stale = packet(repo(), [], { base: SIDE });
  assert.equal(stale.r.status, 2);
  assert.match(stale.r.stderr, new RegExp(`--base ${SIDE} is not an ancestor of u22-fix's tip in ${esc(WT)}`));
  assert.ok(!existsSync(stale.out), "no packet is written for a stale base");
  const unknown = packet(dir, [], { base: "0123abc" });
  assert.equal(unknown.r.status, 2);
  assert.match(unknown.r.stderr, /cannot check --base 0123abc against u22-fix/);
  const notGit = packet(dir, [], { wt: tmp() });
  assert.equal(notGit.r.status, 2);
  assert.match(notGit.r.stderr, /cannot check --base/);
});

test("mkpacket: only a hard or critical task that changes behaviour gets a probe, once, on the final loop", () => {
  const all = "- Self-review lenses: `standards+spec always; blast-radius at medium, hard and critical; interrogate at medium, hard and critical`\n";
  const dir = withWorkflow(all);
  for (const band of ["hard", "critical"]) {
    const { r, text } = packet(dir, ["--band", band]);
    assert.equal(r.status, 0, r.stderr);
    const probe = probeIn(text);
    assert.ok(probe, band);
    assert.match(probe, /^Lens: blast radius\. Lens: interrogate\. Read \S+blast-radius\.md and \S+interrogate\.md in full first/);
    for (const limit of [/15 minutes of attacks/, /at most 5 attacks, picked from the ORACLE rows by risk/, /mutant table only if the ORACLE asks/, /never the whole suite or a runner call without a test path/, /no `sleep` polling/, /one container pair, removed before you report/, /25 minutes wall time/, /Never ask to be resumed/])
      assert.match(probe, limit, `${band}: ${limit}`);
    assert.match(text, /Probe: one probe child, once, on the final loop only/);
    assert.equal(briefsIn(text).filter((b) => /Read-only: edit nothing/.test(b)).length, 3, "every loop's lenses stay read-only");
  }
  for (const [extra, why] of [[["--band", "medium"], /Probe: none: a medium task keeps read-only lenses/], [["--band", "easy"], /Probe: none: no lens this task requires/], [["--band", "hard", "--change", "refactor"], /Probe: none: a refactor that keeps behaviour/], [[], /Probe: none: no lens/]]) {
    const { r, text } = packet(dir, extra);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(probeIn(text), null, extra.join(" "));
    assert.match(text, why, extra.join(" "));
  }
  const bad = packet(dir, ["--change", "rewrite"]);
  assert.equal(bad.r.status, 2);
  assert.match(bad.r.stderr, /--change must be one of behaviour, refactor: rewrite/);
});

test("mkpacket: a hard or critical task needs an ARCHITECTURE section naming modules and the deletion test", () => {
  const dir = withWorkflow();
  const withTask = (t) => { writeFileSync(join(dir, "task.md"), `TASK: fix it.\nORACLE: none (fixture)\n${t}`); };
  withTask("");
  for (const band of ["hard", "critical"]) {
    const none = packet(dir, ["--band", band]);
    assert.equal(none.r.status, 2, band);
    assert.match(none.r.stderr, new RegExp(`no ARCHITECTURE section in .*task\\.md \\(band ${band}\\)`));
    assert.ok(!existsSync(none.out));
  }
  for (const band of ["easy", "medium"]) assert.equal(packet(dir, ["--band", band]).r.status, 0, band);
  for (const t of ["ARCHITECTURE\n- deletion test: passes\n", "ARCHITECTURE: `fees.resolve` changes.\nORACLE note: the deletion test is elsewhere\n", "## ARCHITECTURE\nWe keep it deep.\n", "ARCHITECTURE: none\n"]) {
    withTask(t);
    const r = packet(dir, ["--band", "hard"]).r;
    assert.equal(r.status, 2, t);
    assert.match(r.stderr, /names no module .* or no deletion-test result/, t);
  }
  for (const t of ["ARCHITECTURE: none (docs only)\n", "## ARCHITECTURE\n- `fees.resolve`: deletion test passes (three callers would each re-parse)\n", "**ARCHITECTURE** backend/app/fees.py: deletion-test fails today, so it merges into resolve\n"]) {
    withTask(t);
    const r = packet(dir, ["--band", "hard"]).r;
    assert.equal(r.status, 0, `${t}: ${r.stderr}`);
  }
});

test("mkpacket: the project's Architecture rules are inlined after the task and lifted out of PROJECT RULES", () => {
  const dir = repo(undefined, "## Check commands\n\n- lint\n\n## Architecture rules\n\nRead {wt}/x.md for background.\n\n- **Deep, not shallow:** deletion test.\n\n## Cleanup duties\n\n- rm scratch\n");
  const { r, text } = packet(dir);
  assert.equal(r.status, 0, r.stderr);
  const arch = text.indexOf("ARCHITECTURE RULES (binding): the project's checklist, inlined");
  assert.ok(arch > 0 && arch < text.indexOf("STANDING ORDERS"), "inlined between the task and the standing orders");
  assert.match(text, new RegExp(`Read ${esc(WT)}/x\\.md for background\\.\\n\\n- \\*\\*Deep, not shallow:\\*\\* deletion test\\.\\n\\nSTANDING ORDERS`));
  const proj = text.slice(text.indexOf("PROJECT RULES:"));
  assert.match(proj, /## Architecture rules\n\nInlined above as ARCHITECTURE RULES\.\n\n## Cleanup duties\n\n- rm scratch/);
  assert.doesNotMatch(proj, /Deep, not shallow/);
  const last = packet(repo(undefined, "## Check commands\n\n- lint\n\n## Architecture rules\n\n- one owner\n")).text; // last section
  assert.match(last, /inlined here[^\n]*\n- one owner\n\nSTANDING ORDERS/);
  assert.match(packet(repo()).text, /ARCHITECTURE RULES \(binding\): none in the project rules/);
});

test("packet rules: the standards lens ends with the fixed ARCHITECTURE block", () => {
  const text = packet(repo()).text;
  const block = text.match(/\n {5}ARCHITECTURE\n((?: {5}- .*\n)+)/);
  assert.ok(block, "ARCHITECTURE block not found in rule 6");
  assert.deepEqual([...block[1].matchAll(/- ([^:]+):/g)].map((m) => m[1]), ["Deletion test", "Duplicated owners", "Shims left", "Single-implementation seams", "ADRs", "Lint/contract output"]);
  assert.match(text, /L0 checks\s+that file has every lens above and the ARCHITECTURE block/);
});

const ARCH_OK = "ARCHITECTURE\n- Deletion test: `fees.resolve`: passes, three callers would re-parse\n- Duplicated owners: none\n- Shims left: none\n- Single-implementation seams: none\n- ADRs: ADR-0007 kept\n- Lint/contract output: `lint-imports` -> Contracts: 9 kept, 0 broken\n";
function reviewCheck(packetArgs, review) {
  const dir = withWorkflow("- Self-review lenses: `standards+spec always; blast-radius at medium, hard and critical; interrogate at hard and critical`\n");
  const { r, out } = packet(dir, packetArgs);
  assert.equal(r.status, 0, r.stderr);
  const cr = join(dir, "cr.md");
  writeFileSync(cr, review);
  return run("review-file.mjs", ["--packet", out, cr]);
}

test("review-file: passes a file with every lens, the probe and a filled ARCHITECTURE block", () => {
  const ok = reviewCheck(["--band", "hard"], `# Self-review\n\n## Standards + spec\n- finding\n\n${ARCH_OK}\n## Blast radius\n- x\n\n## Interrogate\n- y\n\n## Probe (final loop)\n- ran\n`);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.equal(ok.stdout, "lens standards + spec section:yes\nlens blast radius section:yes\nlens interrogate section:yes\nprobe required:yes section:yes\narchitecture block:yes missing:none\n");
  const medium = reviewCheck(["--band", "medium"], `## standards+spec\n### ARCHITECTURE\n${ARCH_OK.split("\n").slice(1).join("\n")}\n## blast-radius\n`);
  assert.equal(medium.status, 0, medium.stdout);
  assert.match(medium.stdout, /probe required:no section:n\/a/);
});

test("review-file: fails a missing lens, a missing probe, and a missing, unfilled or misplaced ARCHITECTURE block", () => {
  const noProbe = reviewCheck(["--band", "hard"], `## Standards + spec\n${ARCH_OK}\n## Blast radius\n## Interrogate\n`);
  assert.equal(noProbe.status, 1);
  assert.match(noProbe.stdout, /probe required:yes section:no/);
  const noLens = reviewCheck(["--band", "medium"], `## Standards + spec\n${ARCH_OK}`);
  assert.equal(noLens.status, 1);
  assert.match(noLens.stdout, /lens blast radius section:no/);
  const noBlock = reviewCheck(["--band", "easy"], "## Standards + spec\n- all good\n");
  assert.equal(noBlock.status, 1);
  assert.match(noBlock.stdout, /architecture block:no missing:Deletion test, Duplicated owners, Shims left, Single-implementation seams, ADRs, Lint\/contract output/);
  const unfilled = reviewCheck(["--band", "easy"], `## Standards + spec\n${ARCH_OK.replace("- ADRs: ADR-0007 kept", "- ADRs: <each ADR>").replace("- Shims left: none\n", "")}`);
  assert.equal(unfilled.status, 1);
  assert.match(unfilled.stdout, /missing:Shims left, ADRs$/m);
  const misplaced = reviewCheck(["--band", "medium"], `## Standards + spec\n- ok\n## Blast radius\n${ARCH_OK}`);
  assert.equal(misplaced.status, 1, "a block under another lens does not count");
  assert.equal(run("review-file.mjs", ["cr.md"]).status, 2);
});

// A project rules file whose Architecture section quotes skill text with INLINE lines.
function inlineRepo(archLines, files = {}) {
  const dir = repo(undefined, `## Check commands\n\n- lint\n\n## Architecture rules\n\n${archLines}\n\n## Cleanup duties\n\n- rm scratch\n`);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}
const DOC = "# Doc\n\nintro\n\n## Rules\n\nrule one\n\n### Nested\n\nnested text\n\n```\n# not a heading\n## nor this\n```\n\nafter fence\n\n## Next\n\nnext text\n";

test("mkpacket: INLINE lines expand into the named section, other lines stay as the project's bindings", () => {
  const dir = inlineRepo("- own binding: ADRs bind\nINLINE: docs/d.md#Rules\nINLINE: docs/d.md#Nested", { "docs/d.md": DOC });
  const { r, text } = packet(dir);
  assert.equal(r.status, 0, r.stderr);
  const arch = text.slice(text.indexOf("ARCHITECTURE RULES"), text.indexOf("STANDING ORDERS"));
  assert.match(arch, /- own binding: ADRs bind\nFrom docs\/d\.md → Rules \(source of truth; read the file for more\):\nrule one\n\n### Nested\n\nnested text\n\n```\n# not a heading\n## nor this\n```\n\nafter fence\nFrom docs\/d\.md → Nested/);
  // Nested heading boundary: Rules runs past its ### child and stops at the next ##; Nested stops at the next ## too.
  assert.doesNotMatch(arch, /next text/);
  assert.match(arch, /From docs\/d\.md → Nested \(source of truth; read the file for more\):\nnested text\n\n```[\s\S]*after fence\n\n$/);
  assert.doesNotMatch(arch, /INLINE:/);
});

test("mkpacket: INLINE resolves the pack's own skill files from the install root", () => {
  const dir = inlineRepo("INLINE: .agents/skills/codebase-design/references/matt/codebase-design/codebase-design.md#Principles");
  const { r, text } = packet(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(text, /From \.agents\/skills\/codebase-design\/\S+ → Principles \(source of truth[^\n]*\n- \*\*Depth is a property[\s\S]*The deletion test/);
});

test("mkpacket: an INLINE line with a missing file or heading exits 2 naming both, and writes no packet", () => {
  const noFile = packet(inlineRepo("INLINE: docs/absent.md#Rules"));
  assert.equal(noFile.r.status, 2);
  assert.match(noFile.r.stderr, /INLINE: no file docs\/absent\.md \(heading "Rules"\)/);
  assert.ok(!existsSync(noFile.out));
  const noHead = packet(inlineRepo("INLINE: docs/d.md#not a heading", { "docs/d.md": DOC })); // only inside a fence
  assert.equal(noHead.r.status, 2);
  assert.match(noHead.r.stderr, /INLINE: no heading "not a heading" in docs\/d\.md/);
  assert.ok(!existsSync(noHead.out));
});

test("setup template: the Architecture rules section quotes skill files that exist, by heading", () => {
  const tpl = readFileSync(fileURLToPath(new URL("../.agents/skills/setup/templates/packet-rules.md", import.meta.url)), "utf8");
  const lines = [...tpl.matchAll(/^INLINE: .*$/gm)].map((m) => m[0]);
  assert.ok(lines.length >= 1);
  const { r, text } = packet(inlineRepo(lines.join("\n")));
  assert.equal(r.status, 0, r.stderr);
  assert.equal((text.match(/\(source of truth; read the file for more\):/g) ?? []).length, lines.length);
});

// A trail with the chain's columns, plus an arch report file, in a throwaway repo.
function trail(rows, { report = true } = {}) {
  const dir = tmp();
  mkdirSync(join(dir, ".audit"), { recursive: true });
  mkdirSync(join(dir, "tmp"), { recursive: true });
  if (report) writeFileSync(join(dir, "tmp", "arch-375.md"), "report\n");
  const file = join(dir, ".audit", "s.tsv");
  writeFileSync(file, ["ts\tphase\tdecision\twhy\tevidence\tresult", ...rows.map((r) => ["2026-11-12T00:00:00Z", ...r].join("\t"))].join("\n") + "\n");
  return { dir, file };
}
const landCheck = ({ dir, file }, ticket, band, extra = []) => run("land-check.mjs", ["--trail", file, "--ticket", ticket, "--band", band, "--repo", dir, ...extra]);

test("land-check: easy lands with no pass; medium and up need a passing arch row with a report", () => {
  const empty = trail([]);
  assert.equal(landCheck(empty, "375", "easy").status, 0);
  for (const band of ["medium", "hard", "critical"]) {
    const r = landCheck(empty, "375", band);
    assert.equal(r.status, 1, band);
    assert.match(r.stdout, /blocked: no `arch` trail row for #375/);
  }
  for (const v of ["SOUND", "SOUND WITH FOLLOW-UPS", "sound with follow-ups: two filed"]) {
    const r = landCheck(trail([["arch", `#375 ${v}`, "pass on stage1", "tmp/arch-375.md", "ok"]]), "375", "hard");
    assert.equal(r.status, 0, `${v}: ${r.stdout}`);
    assert.match(r.stdout, /^land-check: ok: #375 SOUND/);
  }
  const unit = trail([["arch", "U2 SOUND", "", "tmp/arch-375.md", "ok"]]);
  assert.equal(landCheck(unit, "u2", "medium").status, 0, "unit ids match, case-blind");
});

test("land-check: blocks REGRESSED, a missing verdict, a missing report, and another ticket's row", () => {
  const cases = [
    [[["arch", "#375 REGRESSED", "", "tmp/arch-375.md", "ok"]], {}, /says REGRESSED/],
    [[["arch", "#375 looks fine", "", "tmp/arch-375.md", "ok"]], {}, /has no verdict/],
    [[["arch", "#375 SOUNDISH", "", "tmp/arch-375.md", "ok"]], {}, /has no verdict/],
    [[["arch", "#375 SOUND", "", "", "ok"]], {}, /names no report path/],
    [[["arch", "#375 SOUND", "", "tmp/arch-375.md", "ok"]], { report: false }, /report for #375 does not exist/],
    [[["arch", "#375 plan SOUND", "plan review", "tmp/arch-375.md", "ok"]], {}, /no `arch` trail row for #375/], // a plan review is not the stage pass
    [[["arch", "#3750 SOUND", "", "tmp/arch-375.md", "ok"], ["land", "#375 SOUND", "", "tmp/arch-375.md", "ok"]], {}, /no `arch` trail row for #375/],
    [[["arch", "#375 SOUND", "", "tmp/arch-375.md", "ok"], ["arch", "#375 REGRESSED", "re-run", "tmp/arch-375.md", "ok"]], {}, /says REGRESSED/], // last row wins
  ];
  for (const [rows, opts, why] of cases) {
    const r = landCheck(trail(rows, opts), "#375", "critical");
    assert.equal(r.status, 1, JSON.stringify(rows));
    assert.match(r.stdout, why, JSON.stringify(rows));
  }
  const fixed = trail([["arch", "#375 REGRESSED", "", "tmp/arch-375.md", "ok"], ["arch", "#375 SOUND", "after fix", "tmp/arch-375.md", "ok"]]);
  assert.equal(landCheck(fixed, "375", "hard").status, 0, "a re-run after a fix replaces the first verdict");
});

test("land-check: misuse exits 2", () => {
  const t = trail([]);
  assert.equal(run("land-check.mjs", ["--trail", t.file, "--band", "hard"]).status, 2);
  assert.equal(landCheck(t, "375", "extreme").status, 2);
  assert.equal(landCheck({ dir: t.dir, file: join(t.dir, "absent.tsv") }, "375", "hard").status, 2);
  writeFileSync(t.file, "a\tb\n");
  assert.match(landCheck(t, "375", "hard").stderr, /header row has no "phase" column/);
});
