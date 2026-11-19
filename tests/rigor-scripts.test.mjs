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

test("mkpacket: the class ledger's most frequent classes ride every packet, after the standing orders", () => {
  const dir = repo();
  assert.doesNotMatch(packet(dir).text, /REVIEW CLASSES/, "no ledger, no section");
  writeFileSync(join(dir, ".audit", `${SLUG}.classes.md`), [
    "# ledger", "", "## Lane A",
    "- docs overstate a rule's reach | #1 T1 r1 | 3 sites narrowed",
    "- frozen clock | #2 T2 r1 | real_asyncio at 12 sites",
    "- docs overstate a rule's reach (repeat: parity) | #3 T3 r2 | ?",
    "- frozen clock (repeat 2) | #6 T2 r3 | fail-closed guard",
    "- docs overstate a rule's reach | #4 T1 r1 | ? (doc wording fix)",
    "- a | #5 T1 r1 | fa", "- b | #5 T1 r1 | fb", "- c | #5 T1 r1 | fc", "- d | #5 T1 r1 | fd",
    "not a ledger line | x | y", "",
  ].join("\n"));
  const { r, text } = packet(dir);
  assert.equal(r.status, 0, r.stderr);
  const block = text.match(/REVIEW CLASSES \([^\n]*\n((?:- [^\n]*\n?)+)/);
  assert.ok(block, "a REVIEW CLASSES section");
  assert.deepEqual(block[1].trim().split("\n"), [
    "- docs overstate a rule's reach (3x): last closed by 3 sites narrowed",
    "- frozen clock (2x): last closed by fail-closed guard",
    "- d (1x): last closed by fd",
    "- c (1x): last closed by fc",
    "- b (1x): last closed by fb",
  ], "top 5 by count, repeat notes folded, '?' fix shapes skipped, ties newest first, a class counted once per ticket");

  // Normalisation and alias folding happen before counting, so one class spelled three ways is one row.
  writeFileSync(join(dir, ".audit", `${SLUG}.classes.md`), [
    "- Docs over-claim | #1 T1 r1 | ?",
    "- docs  overclaim. | #2 T1 r1 | grep each universal word",
    "- docs overclaim | #3 T1 r1 | ? ruling: out of scope",
    "- Frozen clock | #4 T1 r1 | real_asyncio",
  ].join("\n"));
  writeFileSync(join(dir, ".audit", `${SLUG}.class-aliases`), "# aliases\nfrozen clock => time source faked\ndocs overclaim => docs over-claim\n");
  const norm = packet(dir).text.match(/REVIEW CLASSES \([^\n]*\n((?:- [^\n]*\n?)+)/)[1].trim().split("\n");
  assert.deepEqual(norm, [
    "- docs over-claim (3x): last closed by grep each universal word",
    "- time source faked (1x): last closed by real_asyncio",
  ], "case, spacing and punctuation folded, the alias file applied, a ruling never the last fix");
  assert.ok(text.indexOf("STANDING ORDERS") < text.indexOf("REVIEW CLASSES") && text.indexOf("REVIEW CLASSES") < text.indexOf("\n\nRULES:"));
  writeFileSync(join(dir, ".audit", `${SLUG}.classes.md`), "# empty ledger\n");
  assert.doesNotMatch(packet(dir).text, /REVIEW CLASSES/, "a ledger with no line adds nothing");
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
  const m = text.match(/with these\s+lenses: ([\s\S]*?)\.\s+Before the first loop/);
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
    assert.match(text, /--init \S+\/tmp\/cr-364-t1\.md\n\s+It writes one section per lens/);
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
  assert.equal(ok.stdout, "lens standards + spec section:yes\nlens blast radius section:yes\nlens interrogate section:yes\nprobe required:yes section:yes\narchitecture block:yes missing:none\nmutants required:no table:n/a rows:0\ndocs-claim required:no output:n/a\n");
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
  assert.match(unfilled.stdout, /missing:Shims left, ADRs cut by:end of file$/m);
  const misplaced = reviewCheck(["--band", "medium"], `## Standards + spec\n- ok\n## Blast radius\n${ARCH_OK}`);
  assert.equal(misplaced.status, 1, "a block under another lens does not count");
  assert.match(misplaced.stdout, /missing:Deletion test, .*Lint\/contract output cut by:"## Blast radius" \(line 3\); ARCHITECTURE at line 4 falls outside$/m);
  assert.equal(run("review-file.mjs", ["cr.md"]).status, 2);
});

test("review-file: names the heading that cut the standards section, e.g. a sub-heading naming the probe", () => {
  const r = reviewCheck(["--band", "easy"], `## Standards + spec\n- ok\n### Notes for the probe\n- later\n${ARCH_OK}`);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^architecture block:no missing:Deletion test, Duplicated owners, Shims left, Single-implementation seams, ADRs, Lint\/contract output cut by:"### Notes for the probe" \(line 3\); ARCHITECTURE at line 5 falls outside$/m);
  const none = reviewCheck(["--band", "easy"], "## Standards + spec\n- ok\n## Probe\n- n/a\n");
  assert.match(none.stdout, /cut by:"## Probe" \(line 3\)$/m, "no label after the cut: only the heading is named");
});

test("review-file: still reads the lens list of a packet built before rule 6 named the lens-body read", () => {
  const dir = tmp();
  writeFileSync(join(dir, "p.md"), "6. SELF-REVIEW ... with these\n   lenses: standards + spec (x.md). Each loop starts one fresh child.\n");
  writeFileSync(join(dir, "cr.md"), `## Standards + spec\n${ARCH_OK}`);
  const r = run("review-file.mjs", ["--packet", join(dir, "p.md"), join(dir, "cr.md")]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^lens standards \+ spec section:yes$/m);
});

test("packet rules: the implementer reads each lens body itself, and a guard's reach has one owner", () => {
  const text = packet(repo()).text;
  assert.match(text, /you yourself read each lens body in full: a child's\s+read is not yours/);
  assert.match(text, /No heading between that section's\s+heading and the block may name a lens or the probe/);
  assert.match(text, /13\. GUARD REACH:[\s\S]*?once, in its own\s+docstring, generated from its constants or pinned by a test against them[\s\S]*?never restate or widen its reach/);
});

test("self-review method: the implementer greps for deleted names and runs the touched tests together", () => {
  const method = readFileSync(fileURLToPath(new URL("../.agents/skills/rigor/templates/self-review.txt", import.meta.url)), "utf8");
  assert.match(method, /YOUR OWN RUNS, EVERY LOOP/);
  assert.match(method, /Deletions: for each symbol[\s\S]*?grep its name across\s+code, comments and docs/);
  assert.match(method, /Tests together: run every test file the range adds or touches in ONE test-runner call/);
});

test("mkpacket: --role takeover drops delegation and keeps the in-turn wait; a bad role exits 2", () => {
  const imp = packet(repo()).text;
  assert.match(imp, /5\. DELEGATE by size\./);
  const tk = packet(repo(), ["--role", "takeover"]);
  assert.equal(tk.r.status, 0, tk.r.stderr);
  assert.match(tk.text, /5\. TAKEOVER: earlier attempts at this task failed/);
  assert.ok(!tk.text.includes("DELEGATE by size") && !tk.text.includes("a worker writes the red"), "no delegation lines");
  for (const text of [imp, tk.text]) {
    assert.match(text, /NEVER end your turn while a child runs \(a worker, a\s+lens reviewer, the probe\): ending it is your report\./);
    assert.match(text, /Report only when every child has\s+finished\./);
  }
  const bad = packet(repo(), ["--role", "boss"]);
  assert.equal(bad.r.status, 2);
  assert.match(bad.r.stderr, /--role must be one of implementer, takeover, rung1: boss/);
});

test("packet rules: a shared-worktree writer lints, formats and commits only its own paths", () => {
  const text = packet(repo()).text;
  assert.match(text, /11\. HISTORY: never `--amend`/);
  assert.match(text, /run lint, format and fix commands on\s+your own paths only, never repo-wide, and commit with `git commit -m \.\.\. -- <your paths>`/);
});

test("CHAIN.md: parallel tasks, the first-repeat scope ruling and lanes; no landing overlap", () => {
  const chain = readFileSync(fileURLToPath(new URL("../.agents/skills/rigor/CHAIN.md", import.meta.url)), "utf8");
  assert.match(chain, /\*\*Per task, parallel by default\.\*\*[\s\S]*?own worktree on `fix\/<id>-<task>`[\s\S]*?in plan order/);
  assert.match(chain, /\*\*On the first repeat\*\*[\s\S]*?\*\*scope ruling\*\*[\s\S]*?input shapes × caller configurations, crossed in full[\s\S]*?the next round is rung 1/);
  assert.ok(!/\*\*Overlap\.\*\*|landing overlap/.test(chain), "no landing overlap (dropped by the owner)");
  assert.match(chain, /`mkpacket\.mjs --role takeover`/);
  assert.match(chain, /## Lanes[\s\S]*?`\.audit\/<slug>\.lane-<x>\.\{handoff\.md,tsv,gates\.md\}`[\s\S]*?Closing a session closes only its own lane/);
  assert.ok(!chain.includes("A second act-on finding in a class already fixed once"), "old ladder trigger gone");
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
const PASS = "## Scope\nx\n## Friction\n- a.py:f\n## Deletion test\n| module | result | why |\n|---|---|---|\n| a | pass | ok |\n## Owners\n- k -> A\n## Seams\n- none\n## Candidates\n- Speculative: none\n## Principles applied\n- deletion test\n## Verdict\nSOUND\n";
function trail(rows, { report = true, body = PASS } = {}) {
  const dir = tmp();
  mkdirSync(join(dir, ".audit"), { recursive: true });
  mkdirSync(join(dir, "tmp"), { recursive: true });
  if (report) writeFileSync(join(dir, "tmp", "arch-375.md"), body);
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

test("land-check: a report that fails arch-check --role landing blocks", () => {
  const row = [["arch", "#375 SOUND", "", "tmp/arch-375.md", "ok"]];
  for (const [body, why] of [["report\n", /missing heading "## Scope"/], [PASS.replace("## Verdict\nSOUND\n", ""), /missing heading "## Verdict"/], [PASS.replace("- k -> A", "- k"), /no "<rule> -> <owner>"/]]) {
    const r = landCheck(trail(row, { body }), "375", "medium");
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /blocked: the `arch` report for #375 fails arch-check --role landing/);
    assert.match(r.stdout, why);
  }
  assert.equal(landCheck(trail(row, { body: "report\n" }), "375", "easy").status, 0, "easy never reads the report");
});

test("land-check: misuse exits 2", () => {
  const t = trail([]);
  assert.equal(run("land-check.mjs", ["--trail", t.file, "--band", "hard"]).status, 2);
  assert.equal(landCheck(t, "375", "extreme").status, 2);
  assert.equal(landCheck({ dir: t.dir, file: join(t.dir, "absent.tsv") }, "375", "hard").status, 2);
  writeFileSync(t.file, "a\tb\n");
  assert.match(landCheck(t, "375", "hard").stderr, /header row has no "phase" column/);
});

// ---- 2026-11-16: incremental self-review loops, form by construction, heartbeat and reviewer availability.
const ALL_LENSES = "- Self-review lenses: `standards+spec always; blast-radius at medium, hard and critical; interrogate at hard and critical`\n";
function lensRepo(extraWorkflow = "") {
  const dir = withWorkflow(ALL_LENSES + extraWorkflow);
  writeFileSync(join(dir, "docs", "agents", "packet-rules.md"), "## Check commands\n\n- lint\n\n## Tests in isolation\n\n- start a throwaway db with ./tdb.sh\n\n## Architecture rules\n\n- one owner per default\n\n## Cleanup duties\n\n- rm scratch\n");
  writeFileSync(join(dir, "task.md"), "TASK: fix it in {wt}.\nORACLE: today's behaviour\n| input | main |\n| null | 0 |\nARCHITECTURE: none (fixture)\nStop and ask L0 if: x\n");
  return dir;
}
const brief = (dir, args) => run("lens-brief.mjs", ["--out-dir", join(dir, "briefs"), ...args]);
const readOut = (r) => r.stdout.trim().split("\n").filter(Boolean).map((f) => [f.split("/").at(-1), readFileSync(f, "utf8")]);

test("review-file --init writes the headings and the packet's ARCHITECTURE block, which fail until filled", () => {
  const dir = lensRepo();
  const { r, out } = packet(dir, ["--ref", "364", "--band", "hard"]);
  assert.equal(r.status, 0, r.stderr);
  const cr = join(dir, "cr.md");
  const init = run("review-file.mjs", ["--packet", out, "--init", cr]);
  assert.equal(init.status, 0, init.stderr);
  assert.equal(init.stdout.trim(), cr);
  const text = readFileSync(cr, "utf8");
  assert.deepEqual([...text.matchAll(/^## (.*)$/gm)].map((m) => m[1]), ["Loops", "Own runs", "Mutants", "Standards + spec", "Blast radius", "Interrogate", "Probe (final loop)"]);
  assert.match(text, /## Standards \+ spec\n\n.*\n\nARCHITECTURE\n- Deletion test: <each new or changed module>: <passes \/ fails, and why>\n- Duplicated owners: /);
  const check = run("review-file.mjs", ["--packet", out, cr]);
  assert.equal(check.status, 1, "placeholders fail the check");
  assert.match(check.stdout, /lens standards \+ spec section:yes\nlens blast radius section:yes\nlens interrogate section:yes\nprobe required:yes section:yes\narchitecture block:no missing:Deletion test, Duplicated owners, Shims left, Single-implementation seams, ADRs, Lint\/contract output/);
  writeFileSync(cr, text.replace(/ARCHITECTURE\n(- .*\n)+/, ARCH_OK));
  assert.equal(run("review-file.mjs", ["--packet", out, cr]).status, 0, "filled in place, it passes");
  const again = run("review-file.mjs", ["--packet", out, "--init", cr]);
  assert.equal(again.status, 2);
  assert.match(again.stderr, /exists; --init never overwrites/);
  const medium = packet(dir, ["--band", "medium"]);
  const cr2 = join(dir, "cr2.md");
  assert.equal(run("review-file.mjs", ["--packet", medium.out, "--init", cr2]).status, 0);
  assert.deepEqual([...readFileSync(cr2, "utf8").matchAll(/^## (.*)$/gm)].map((m) => m[1]), ["Loops", "Own runs", "Mutants", "Standards + spec", "Blast radius"], "no probe heading without a probe");
  assert.equal(run("review-file.mjs", ["--packet", medium.out, "--bogus", cr2]).status, 2);
});

test("review-file --init takes the block from rule 6, not from a task's own bare ARCHITECTURE section", () => {
  const dir = lensRepo();
  writeFileSync(join(dir, "task.md"), "TASK: fix it.\nORACLE: none (fixture)\nARCHITECTURE\n- `fees.resolve`: deletion test passes\n");
  const { r, out } = packet(dir, ["--band", "hard"]);
  assert.equal(r.status, 0, r.stderr);
  const cr = join(dir, "cr.md");
  assert.equal(run("review-file.mjs", ["--packet", out, "--init", cr]).status, 0);
  const text = readFileSync(cr, "utf8");
  assert.doesNotMatch(text, /fees\.resolve/);
  assert.match(text, /- Lint\/contract output: <the import-contract or lint command and its result line>/);
});

test("lens-brief: loop 1 writes each lens's packet brief verbatim, with the ORACLE, and ARCHITECTURE RULES for standards", () => {
  const dir = lensRepo();
  const { r, out, text } = packet(dir, ["--ref", "364", "--band", "hard"]);
  assert.equal(r.status, 0, r.stderr);
  const b = brief(dir, ["--packet", out]);
  assert.equal(b.status, 0, b.stderr);
  const files = readOut(b);
  assert.deepEqual(files.map(([f]) => f), ["loop1-standards-spec.txt", "loop1-blast-radius.txt", "loop1-interrogate.txt"]);
  const packetBriefs = briefsIn(text);
  files.forEach(([, body], i) => {
    assert.ok(body.startsWith(packetBriefs[i] + "\n\nNever read any .env file.\n\nThe task's ORACLE section, verbatim from the packet:\nORACLE: today's behaviour\n| input | main |\n| null | 0 |\n"), files[i][0]);
    assert.doesNotMatch(body, /ARCHITECTURE: none \(fixture\)|Stop and ask/, "the ORACLE section ends at the next label");
  });
  assert.match(files[0][1], /ARCHITECTURE RULES \(binding\): the project's checklist[\s\S]*one owner per default/);
  for (const [, body] of files.slice(1)) assert.doesNotMatch(body, /ARCHITECTURE RULES/);
  assert.equal(brief(dir, ["--packet", out, "--loop", "1"]).status, 0, "--loop 1 is the default made explicit");
});

test("lens-brief: a later loop reviews only the delta, standards + spec plus the named lenses, each naming its body", () => {
  const dir = lensRepo();
  const { out } = packet(dir, ["--ref", "364", "--band", "hard"]);
  const b = brief(dir, ["--packet", out, "--loop", "2", "--since", "abc123", "--lenses", "interrogate"]);
  assert.equal(b.status, 0, b.stderr);
  const files = readOut(b);
  assert.deepEqual(files.map(([f]) => f), ["loop2-standards-spec.txt", "loop2-interrogate.txt"]);
  for (const [f, body] of files) {
    const lens = f.includes("standards") ? "standards + spec" : "interrogate";
    assert.match(body, new RegExp(`^Lens: ${esc(lens)}\\. Loop 2, delta review\\. Read ${esc(WT)}/\\.agents/skills/${esc(BODIES[lens])} in full first`), f);
    assert.match(body, new RegExp(`review only abc123\\.\\.HEAD in ${esc(WT)}: the fix commits since the previous loop\\.`), f);
    assert.match(body, /tmp\/cr-364-t1\.md/, f);
    assert.match(body, /Read-only: edit nothing, run nothing that writes\./, f);
    assert.match(body, /ORACLE: today's behaviour/, f);
  }
  const only = readOut(brief(dir, ["--packet", out, "--loop", "3", "--since", "def456"]));
  assert.deepEqual(only.map(([f]) => f), ["loop3-standards-spec.txt"], "standards + spec always runs");
  for (const [args, why] of [
    [["--loop", "2"], /--loop 2 needs --since/],
    [["--loop", "2", "--since", "x", "--lenses", "fuzzing"], /unknown lens in --lenses: fuzzing/],
    [["--since", "x"], /--since goes with/],
    [["--loop", "0"], /--loop must be a whole number from 1/],
    [["--loop", "2", "--since", "x", "--probe"], /exclusive/],
  ]) {
    const r = brief(dir, ["--packet", out, ...args]);
    assert.equal(r.status, 2, args.join(" "));
    assert.match(r.stderr, why, args.join(" "));
  }
  const medium = packet(dir, ["--band", "medium"]);
  const notRequired = brief(dir, ["--packet", medium.out, "--loop", "2", "--since", "x", "--lenses", "interrogate"]);
  assert.equal(notRequired.status, 2);
  assert.match(notRequired.stderr, /--lenses names interrogate, which this packet does not require/);
});

test("lens-brief: a fix round is one loop aimed at the class: standards + spec on its delta over the task range, plus one probe when the task gets a probe", () => {
  const dir = lensRepo();
  const hard = packet(dir, ["--ref", "364", "--band", "hard"]);
  const noClass = brief(dir, ["--packet", hard.out, "--fix-round", "--since", "t1"]);
  assert.equal(noClass.status, 2);
  assert.match(noClass.stderr, /needs --class/);
  const b = brief(dir, ["--packet", hard.out, "--fix-round", "--since", "t1", "--class", "unvalidated sort key", "--class", "mock leak"]);
  assert.equal(b.status, 0, b.stderr);
  const files = readOut(b);
  assert.deepEqual(files.map(([f]) => f), ["fix-round-standards-spec.txt", "fix-round-probe.txt"]);
  assert.match(files[0][1], /^Lens: standards \+ spec\. Fix round after a review, the round's one loop, delta review\. Read \S+code-review\.md in full first[\s\S]*review only t1\.\.HEAD/);
  assert.match(files[0][1], /Aimed at the finding class\(es\) "unvalidated sort key", "mock leak": grep \S+\.\.HEAD in \S+ for every site or input shape of each/, "the class sweep covers the task range");
  assert.doesNotMatch(files[0][1], /grep t1\.\.HEAD/, "the sweep starts at the task base, not the reviewed tip");
  const probe = files[1][1];
  assert.match(probe, /^Probe, fix round, once, targeted\. Lens: blast radius\. Lens: interrogate\. Read \S+blast-radius\.md and \S+interrogate\.md in full first, then attack only the finding class\(es\) "unvalidated sort key", "mock leak" at HEAD: the fix range t1\.\.HEAD/);
  for (const limit of [/15 minutes of attacks/, /at most 5 attacks/, /25 minutes wall time/]) assert.match(probe, limit);
  assert.match(probe, /tests in isolation, verbatim:\n## Tests in isolation\n\n- start a throwaway db with \.\/tdb\.sh/);
  const medium = packet(dir, ["--band", "medium"]);
  const mediumNoClass = brief(dir, ["--packet", medium.out, "--fix-round", "--since", "t1"]);
  assert.equal(mediumNoClass.status, 2, "every fix round is aimed at a class, probe or not");
  assert.match(mediumNoClass.stderr, /needs --class/);
  const aimed = readOut(brief(dir, ["--packet", medium.out, "--fix-round", "--since", "t1", "--class", "x"]));
  assert.deepEqual(aimed.map(([f]) => f), ["fix-round-standards-spec.txt"], "no probe on a medium task");
  assert.match(aimed[0][1], /Aimed at the finding class\(es\) "x"/);
  const noProbe = brief(dir, ["--packet", medium.out, "--probe"]);
  assert.equal(noProbe.status, 2);
  assert.match(noProbe.stderr, /this task gets no probe/);
  const again = packet(dir, ["--ref", "364", "--band", "hard"]); // packet() reuses one path: rebuild the hard packet
  const final = readOut(brief(dir, ["--packet", again.out, "--probe"]));
  assert.deepEqual(final.map(([f]) => f), ["probe-probe.txt"]);
  assert.ok(final[0][1].startsWith(`Probe, final loop, once. ${probeIn(again.text)}\n`), "the packet's probe brief, verbatim");
  assert.match(final[0][1], /ARCHITECTURE RULES[\s\S]*Tests in isolation/);
});

test("lens-brief: misuse and a packet with no lens list or no ORACLE exit 2", () => {
  const dir = tmp();
  writeFileSync(join(dir, "p.md"), "not a packet\n");
  assert.equal(brief(dir, ["--packet", join(dir, "p.md")]).status, 2);
  assert.equal(brief(dir, ["--packet", join(dir, "absent.md")]).status, 2);
  assert.equal(brief(dir, []).status, 2);
  const l = lensRepo();
  const { out, text } = packet(l, ["--band", "easy"]);
  writeFileSync(join(dir, "noracle.md"), text.replace(/^ORACLE: .*$/m, "No oracle here."));
  const r = brief(dir, ["--packet", join(dir, "noracle.md")]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no ORACLE section/);
  assert.equal(brief(dir, ["--packet", out, "--wat", "1"]).status, 2);
});

test("mkpacket: rule 6 names the brief, scaffold and check commands, and fills the project's lens check", () => {
  const dir = lensRepo("- Lens check: `node {repo}/scripts/lens-check.mjs --band {band} --kind {kind} --for {wt}` <!-- note -->\n");
  const { r, out, text } = packet(dir, ["--ref", "364", "--band", "medium", "--task-id", "T2"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(text, new RegExp(`lens-brief\\.mjs --packet ${esc(out)} --out-dir ${esc(WT)}/tmp/lens-briefs-364-t2\\n`));
  assert.match(text, new RegExp(`review-file\\.mjs --packet ${esc(out)} --init ${esc(WT)}/tmp/cr-364-t2\\.md\\n`));
  assert.match(text, new RegExp(`\`node \\S+/\\.agents/skills/rigor/scripts/review-file\\.mjs --packet ${esc(out)} ${esc(WT)}/tmp/cr-364-t2\\.md\` and report\\s+only when it exits 0`));
  assert.match(text, new RegExp(`Lens check: right after the loop-1 lens children are launched, run \`node ${esc(dir)}/scripts/lens-check\\.mjs --band medium --kind code --for ${esc(WT)}\`\\.`));
  const rigorDir = fileURLToPath(new URL("../.agents/skills/rigor", import.meta.url));
  assert.match(text, new RegExp(`by the method in\\s+${esc(rigorDir)}/templates/self-review\\.txt`), "the building rigor skill, not the worktree's copy");
  assert.doesNotMatch(text, new RegExp(`${esc(WT)}/\\.agents/skills/rigor/`));
  assert.match(text, /Loop 1 runs every lens over the\s+whole range; each later loop reviews only the fix commits since the previous loop/);
  assert.match(text, /standards \+ spec child may start as soon as the code is\s+committed/);
  assert.match(packet(withWorkflow(), ["--band", "easy"]).text, /run none \(this project names no lens check\)\./);
  assert.match(packet(lensRepo("- Lens check: `x --band {band}`\n")).text, /run none \(packet built without --band\)\./);
  assert.match(text, /12\. FIX ROUND[\s\S]*?one loop aimed at the finding's class, not the whole of rule 6 again:\s+standards \+ spec on the round's delta[\s\S]*?no other lens runs again/);
});

test("self-review method: incremental loops, the coverage invariant, carried lens children and the fix-round delta", () => {
  const method = readFileSync(fileURLToPath(new URL("../.agents/skills/rigor/templates/self-review.txt", import.meta.url)), "utf8");
  assert.match(method, /Loop 1: every lens the packet names, each over the whole range/);
  assert.match(method, /Loop 2 and later: only the fix commits since the previous loop[\s\S]*?standards \+ spec plus each lens that raised a finding those commits fix/);
  assert.match(method, /Coverage invariant: every line of the range is seen by every required lens once, and every line\s+changed afterwards is seen again/);
  assert.match(method, /The same child across loops:[\s\S]*?lens-child ceiling the project's workflow settings set\s+\(default ~150k tokens\)[\s\S]*?never the child that wrote the task's code/);
  assert.match(method, /A FIX ROUND AFTER A REVIEW[\s\S]*?One loop, aimed at the finding's class, not the whole method again[\s\S]*?everywhere in the task range[\s\S]*?No other lens runs again[\s\S]*?That is the round's only loop/);
  assert.match(method, /Docs claims: every docs or docstring sentence the range adds or changes that states a rule's\s+reach, order or owner cites the code line or test that proves it[\s\S]*?Grep the repo for the claim's key wording/);
  assert.match(method, /Right after the loop-1 lens children are launched, run the project's lens check/);
  assert.match(method, /Report only on exit 0/);
  assert.match(method, /PROBE LIMITS/, "the probe limits stay");
});

test("CHAIN.md: the two heartbeats, reviewer availability is read before every launch, no hang wait", () => {
  const chain = readFileSync(fileURLToPath(new URL("../.agents/skills/rigor/CHAIN.md", import.meta.url)), "utf8");
  assert.match(chain, /\*\*Two heartbeats, neither of them a status report to L0\.\*\* L0's tick covers every agent of the lane by status alone, and L1's tick is the watch on its builder, read by L1 itself, never by a script/);
  assert.match(chain, /no progress for 15 minutes or more[\s\S]*?\*\*A quota or usage error:\*\* archive it, record the reviewer's unavailability[\s\S]*?relaunch the same brief on the fallback now/);
  assert.match(chain, /\*\*Silent, no error:\*\* one nudge[\s\S]*?Still no activity at the next tick: relaunch/);
  assert.ok(!/written nothing for one wait slice is hung/.test(chain), "the old hang wait is gone");
  assert.match(chain, /Before every review launch, not once per session, read the project's reviewer-availability record/);
  assert.match(chain, /fix-round context ceiling/);
  assert.ok(!/~180k/.test(chain), "no pack default for the implementer ceiling: the project sets it");
  assert.match(chain, /L0's reviewers \(step 4\.3\) see the diff only after its act-on list is empty/, "external reviewers still wait for the self-review");
});

// ---- 2026-11-19: gate on acceptance, mutants, rung 1, the sweep over readers, silent fix rounds,
// the heartbeat watch command, L0's own 429, the combined fallback reviewer, pre-run v2, docs claims,
// the plan review's shape run, ledger hygiene, the pi recipe card and the L1-to-L0 question channel.
test("reset-at: the reset is the 429's own timestamp plus its value, never now", () => {
  const at = (args, env = process.env) => run("reset-at.mjs", args, env);
  const r = at(["reset after 45m42s", "--from", "2026-11-23T04:00:00Z", "--tz", "UTC"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trimEnd(), "UTC 2026-11-23T04:45:42Z\nlocal 2026-11-23T04:45:42 (UTC)\nepoch 1795409142000");
  // Units add up across a compact value, a spaced one, and the long forms.
  assert.match(at(["resets in 1h30m", "--from", "2026-11-23T04:00:00Z", "--tz", "UTC"]).stdout, /^UTC 2026-11-23T05:30:00Z$/m);
  assert.match(at(["reset after 2 days and 3 hours", "--from", "2026-11-23T04:00:00Z", "--tz", "UTC"]).stdout, /^UTC 2026-11-25T07:00:00Z$/m);
  // A bare number is seconds; epoch millis are a timestamp.
  assert.match(at(["retry after 90", "--from", "1795406400000", "--tz", "UTC"]).stdout, /^UTC 2026-11-23T04:01:30Z$/m);
  // An absolute time in the value is printed as it stands, whatever --from says.
  assert.match(at(["reset after 2026-11-23T09:54:00Z", "--from", "2026-11-23T04:00:00Z", "--tz", "UTC"]).stdout, /^UTC 2026-11-23T09:54:00Z$/m);
  // TZ sets the local zone when --tz does not.
  const sind = at(["reset after 1h", "--from", "2026-11-23T04:00:00Z"], { ...process.env, TZ: "Asia/Kolkata" });
  assert.match(sind.stdout, /^local 2026-11-23T10:30:00/m);
  assert.match(sind.stdout, /\(Asia\/Kolkata\)$/m);
  for (const [args, why] of [
    [["reset after 45m"], /--from .* is required/],
    [["nothing here", "--from", "2026-11-23T04:00:00Z"], /no duration or time/],
    [["reset after 1m", "--from", "nonsense"], /cannot read --from/],
    [["reset after 1m", "--from", "2026-11-23T04:00:00Z", "--tz", "Nowhere/Bad"], /unknown zone/],
    [[], /usage:/],
  ]) {
    const bad = at(args);
    assert.equal(bad.status, 2, args.join(" "));
    assert.match(bad.stderr, why, args.join(" "));
  }
});

const packFile = (rel) => readFileSync(fileURLToPath(new URL(`../.agents/skills/${rel}`, import.meta.url)), "utf8");
const TPL_SELF = packFile("rigor/templates/self-review.txt");
const TPL = (rel) => readFileSync(fileURLToPath(new URL(`../.agents/skills/setup/templates/${rel}`, import.meta.url)), "utf8");

test("CHAIN.md: a ticket is gated on acceptance, and a gate stands only while main leaves its files alone", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*Gate on acceptance, not on a pair\.\*\*[\s\S]*?as soon as its last task is accepted and the host's suite lock is free[\s\S]*?never hold an accepted ticket for one still building/);
  assert.match(chain, /A gate still stands after main moves when main's new commits touch no staged file and no file the pre-run selected; otherwise re-gate/);
  assert.match(chain, /The next ticket starts here, at landing: post-land verify runs beside it, and a verify failure becomes a new ticket or a revert/);
});

test("CHAIN.md: the first build's self-review stops at the band's loop cap, and the mutant table rides every band", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(TPL_SELF, /Loop cap: at most the loop cap the project's workflow settings set per band \(pack default: easy and\s+medium 1 loop, hard and critical 3\) per attempt, loop 1 included\. External review is the second\s+pass, not another lens loop/);
  assert.match(TPL_SELF, /External review is the second\s+pass, not another lens loop/);
  // The mutant rule lives in the self-review method (one owner); CHAIN.md points at it.
  assert.match(chain, /\*\*Fix rounds follow packet rule 12\*\*[\s\S]*?which owns the class, the sweep over every reader, the mutant table and the loop cap/, "CHAIN.md points at the owner");
  assert.match(TPL_SELF, /Mutants, at every band: one deliberate mutant per rule the task moves or adds and per ORACLE\s+row \(a refactor task: one per moved guard\)/);
  assert.match(TPL_SELF, /`review-file\.mjs` fails the file without the table, and fails a survivor with no reason/);
  assert.match(TPL("workflow.md"), /- Self-review loop cap: easy and medium `1` loop, hard and critical `3`/);
});

test("CHAIN.md: rung 1 is a class-aimed round, not a full build packet", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /then \(1\) \*\*rung 1\*\*,[\s\S]*?`mkpacket\.mjs --role rung1`: the structural brief the task file carries, its mutant table, one self-review loop aimed at the repeated class over the task range, not a full build packet/);
  assert.match(chain, /`--role rung1` builds the structural brief the task file carries, requires its mutant table/);
});

test("CHAIN.md: the class sweep reaches consumers, and packet statements are claims to check", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*Fix rounds follow packet rule 12\*\* \(`templates\/self-review\.txt` → A fix round after a review\), which owns the class, the sweep over every reader, the mutant table and the loop cap\. L0's own half: the re-brief names the class, planners grep their fence the same way, and the delta reviewer checks the list is complete first/);
  // The claims rule keeps its owner: packet rule 14.
  assert.match(packFile("rigor/templates/packet-rules.txt"), /14\. PROOF, NOT CONFIDENCE:[\s\S]*?is a claim to check, never a fact/);
  const method = packFile("rigor/templates/self-review.txt");
  assert.match(method, /That grep covers every reader of the value, type,\s+default or rule the finding moves, in whatever module it lives \(callers, field readers, UI\s+consumers, serializers\), each hit pinned by a test or ruled out in one line/);
});

test("CHAIN.md: a silent fix round with its commit in and a passing self-review is accepted at the first tick", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*A fix round that is silent, with its commit in and `review-file\.mjs` at exit 0:\*\* accepted at the first silent tick\. Archive it and launch its one delta reviewer at once/);
  assert.match(chain, /A fix round is never accepted without that delta reviewer, and a silent build round is not accepted this way/);
});

test("CHAIN.md: the builder watches its worker's tail, probe children are timeboxed, easy and medium have no worker layer", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*The builder reads its worker's transcript tail in every wait block\*\*[\s\S]*?on the same failure seen twice it takes the work over or re-briefs/);
  assert.match(chain, /Probe and lens children get a ~25 minute timebox in their brief and stop themselves with partial findings/);
  assert.match(chain, /At easy and medium the builder writes the code itself: no worker layer/);
});

test("CHAIN.md: a relayed rule change binds in-flight work, and L0's own 429 resets from its own timestamp", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*A rule change reaches running work at once\.\*\*[\s\S]*?steer, with the rule text or its path\. It binds that agent's next report, not its next task[\s\S]*?A relay never says "leave in-flight work as it is"/);
  assert.match(chain, /\*\*L0's own 429\.\*\*[\s\S]*?on resume L0 first reads every notification and report that arrived during the stall[\s\S]*?computes each reset time from the 429's own timestamp plus its "reset after" value \(`scripts\/reset-at\.mjs`\), never from now/);
  assert.ok(!/leave in-flight work as it is(?!")/.test(chain), "no relay tells an agent to leave in-flight work alone");
});

test("CHAIN.md: the heartbeat runs the project's watch command first and judges liveness by three signals", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /When workflow\.md names a `Watch command`, the tick runs it first[\s\S]*?when it prints nothing the tick replies one line and reads no activity at all/);
  assert.match(chain, /L0 judges every agent with no L1 \(reviewer, planner, plan reviewer, takeover, verify driver\) by status and its worktree's last commit only, never a transcript/);
  assert.match(TPL("workflow.md"), /- Watch command: none <!-- or: the L0 heartbeat's script/);
});

test("CHAIN.md: milestone bookkeeping amends only a tip no open ticket branch is based on", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /no open ticket branch is based on it \(`git branch --contains HEAD` lists only main\), amend it instead of adding one; when a branch is based on it, add a new commit\. A session start or close commit is never amended/);
});

test("CHAIN.md: the fallback reviewer may combine A and B only at the bands the project names", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*On the fallback reviewer\*\* \(a single slot\) the project's `Combine A and B on the fallback` setting names the bands where A and B become one reviewer[\s\S]*?with no such setting, and always for a hard, critical or high-risk task, they stay two/);
  assert.match(TPL("workflow.md"), /- Combine A and B on the fallback: none <!-- or: easy, medium/);
});

test("CHAIN.md and the packet rules: the pre-run covers mocked modules, the builder runs it, L0 re-runs it", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /the tests outside its fence that name a changed public symbol \*\*and\*\* those that mock or patch a changed module, whether or not they name a changed symbol[\s\S]*?workflow\.md → Pre-run command[\s\S]*?The builder ran it before its report; the stage re-runs it/);
  const rules = packFile("rigor/templates/packet-rules.txt");
  assert.match(rules, /8\. CHECKS:[\s\S]*?run the out-of-fence pre-run over the tests outside your fence: every\s+one that names a changed public symbol, and every one that mocks or patches a module you\s+changed[\s\S]*?`vi\.mock\("<module>"\)` or\s+`patch\("app\.<module>"\)`/);
  assert.match(TPL("workflow.md"), /- Pre-run command: `<command that takes a worktree and a fence/);
});

test("packet rules and the method: universal words need their grep, and the docs-claim command is checked", () => {
  const rules = packFile("rigor/templates/packet-rules.txt");
  assert.match(rules, /13\. GUARD REACH:[\s\S]*?A universal word in a docs,\s+docstring or comment line you add or change \(every, only, always, never, one place, sole\) is a\s+claim about the whole repo: paste the grep behind it\. Docs-claim command: \{docs_claim\}/);
  assert.match(rules, /14\. PROOF, NOT CONFIDENCE:[\s\S]*?is a claim to check, never a fact/);
  const method = packFile("rigor/templates/self-review.txt");
  assert.match(method, /When the packet names a Docs-claim command, run it and paste\s+its output with exit 0: `review-file\.mjs` checks that it is there/);
});

test("CHAIN.md: the plan review runs the proposed shape once, not only reads it", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*It also checks once that the proposed module shape would import or run\*\*: a cheap static or scratch check, not a reading[\s\S]*?A shape that cannot import is an act-on finding/);
});

test("CHAIN.md: the class ledger's fix cell names a fix, never a ruling", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /its fix-shape cell names the fix, never a ruling \(a ruling is a scope decision, not a fix\)\. `mkpacket\.mjs` normalises the names before counting[\s\S]*?class-aliases[\s\S]*?counts a ticket and class once/);
});

test("harness/pi.md: the recipe card names the compress shape, single async launches, agent names and the rest", () => {
  const pi = packFile("rigor/harness/pi.md");
  assert.match(pi, /\*\*`compress`\*\* takes `content: \[\{ startId, endId, summary \}\]`/);
  assert.match(pi, /Start children as single async `subagent` calls[\s\S]*?never `tools\.subagent` inside code mode/);
  assert.match(pi, /Pass agent names, never model ids/);
  assert.match(pi, /The `reviewer` agent has no exec tool/);
  assert.match(pi, /Shell variables and exports do not persist between `bash` calls/);
  assert.match(pi, /When the `read` tool misbehaves[\s\S]*?Never retry the same read twice/);
  assert.match(pi, /Ask L1 through the delegation adapter's question call[\s\S]*?never `contact_supervisor`[\s\S]*?The report and the question use the same call/);
});

test("delegation/paseo.md: a builder reports to its L1, an L1 reports to L0, and a relay is a steer", () => {
  const paseo = packFile("rigor/delegation/paseo.md");
  assert.match(paseo, /\| the builder's report to its L1 \(the packet's standing order\) \| `paseo send --no-wait <L1 agent id> "done\|question\|blocked: <report path or question>"`/);
  assert.match(paseo, /\| report, block or question from an L1 to L0 \| `paseo send --no-wait <L0 agent id>/);
  assert.match(paseo, /`contact_supervisor` is not this channel/);
  assert.match(paseo, /\| start an L1 coordinator \(no finish notice\) \|[\s\S]*?`notifyOnFinish: false`, `initialPrompt` = the L1 brief/);
  assert.match(paseo, /Every launch takes it but an L1's: an L1 ends its turn right after launching its builder[\s\S]*?answer it in that turn/);
  assert.match(paseo, /A rule change is a steer, not a new task\./);
});

test("mkpacket: rules 5 and 10 carry L1's agent id, and say so when there is none", () => {
  const dir = repo();
  const withId = packet(dir, ["--l1-id", "0e3414d4-00c2-430e-91dc-84fc6ced6d43"]);
  assert.equal(withId.r.status, 0, withId.r.stderr);
  assert.match(withId.text, /5\. DELEGATE by size\.[\s\S]*?Ask your L1 rather than guess: the ADAPTER question call in this packet's PROJECT RULES\s+hands a question to L1's agent \(0e3414d4-00c2-430e-91dc-84fc6ced6d43\)/);
  assert.match(withId.text, /10\. REPORT:[\s\S]*?one message to L1, through the ADAPTER report call[\s\S]*?`done\|question\|blocked: <report path or question>`[\s\S]*?last action of every turn/);
  assert.match(withId.text, /Decide anything your brief already allows; ask only about\s+what it leaves open/);
  // No environment fallback: the packet is built by L0 or by the builder, never by L1.
  const env = packet(dir);
  const fromEnv = run("mkpacket.mjs", ["--slug", SLUG, "--wt", WT, "--base", BASE, "--branch", "u22-fix", "--task", join(dir, "task.md"), "--out", env.out, "--repo", dir], { ...process.env, PASEO_AGENT_ID: "abc-123" });
  assert.equal(fromEnv.status, 0, fromEnv.stderr);
  assert.match(readFileSync(env.out, "utf8"), /hands a question to L1's agent \(none: this packet was built without L1's agent id, so ask at the report\)/);
  const badId = run("mkpacket.mjs", ["--slug", SLUG, "--wt", WT, "--base", BASE, "--branch", "u22-fix", "--task", join(dir, "task.md"), "--out", join(dir, "p3.md"), "--repo", dir, "--l1-id", "not an id"]);
  assert.equal(badId.status, 2);
  assert.match(badId.stderr, /--l1-id must be an agent id: not an id/);
});

test("mkpacket: --role rung1 builds one class-aimed loop and requires the structural brief's mutant table", () => {
  const dir = lensRepo();
  writeFileSync(join(dir, "task.md"), "TASK: fix the class.\nORACLE: today's behaviour\n| input | main |\n| null | 0 |\nARCHITECTURE: none (fixture)\n## Mutants\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n| row 1 | drop the null guard | test_null | yes |\n");
  const { r, text } = packet(dir, ["--ref", "364", "--band", "hard", "--role", "rung1"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(text, /5\. RUNG 1: this task's class came back after an earlier round fixed it/);
  assert.deepEqual(lensesIn(text), ["standards + spec"], "one class-aimed loop, not the band's full lens set");
  assert.match(text, /Loop 1 is this packet's one loop: standards \+ spec over the whole task range, aimed at the repeated class/);
  assert.match(text, /Mutants: one per row of the mutant table in the TASK block's structural brief; a survivor is a finding of this round/);
  assert.match(text, /Probe: one probe child on this round's delta, targeted on the repeated class/);
  assert.doesNotMatch(text, /Probe: none/);
  // A structural brief without its mutant table is not a rung-1 task.
  writeFileSync(join(dir, "task.md"), "TASK: fix the class.\nORACLE: today's behaviour\n| input | main |\n| null | 0 |\nARCHITECTURE: none (fixture)\n");
  const noTable = packet(dir, ["--band", "hard", "--role", "rung1"]);
  assert.equal(noTable.r.status, 2);
  assert.match(noTable.r.stderr, /a rung-1 packet needs the structural brief's mutant table/);
});

test("mkpacket: rule 6 asks for the mutant table at every band, and for none where the ORACLE is none", () => {
  const dir = lensRepo();
  for (const band of ["easy", "medium", "hard"]) {
    const { r, text } = packet(dir, ["--band", band]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(text, /Mutants: required, one per moved or new rule and one per ORACLE row \(a behaviour task, at every band\)/, band);
  }
  assert.match(packet(dir, ["--band", "hard", "--change", "refactor"]).text, /Mutants: required, one per moved guard \(a refactor task\)/);
  assert.match(packet(repo()).text, /Mutants: none \(the task's ORACLE is none/);
});

test("review-file: the mutant table is required for a behaviour task and a survivor needs its reason", () => {
  const dir = lensRepo();
  const { out } = packet(dir, ["--band", "medium"]);
  const base = `## Standards + spec\n${ARCH_OK}\n## Blast radius\n- none\n`;
  const cr = join(dir, "cr.md");
  const check = (text) => { writeFileSync(cr, text); return run("review-file.mjs", ["--packet", out, cr]); };
  const none = check(base);
  assert.equal(none.status, 1);
  assert.match(none.stdout, /^mutants required:yes table:no rows:0$/m);
  const empty = check(`${base}\n## Mutants\n\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n`);
  assert.equal(empty.status, 1, "the header row is not a row");
  assert.match(empty.stdout, /^mutants required:yes table:no rows:0 table:empty$/m);
  const ok = check(`${base}\n## Mutants\n\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n| null guard | drop the early return | test_null | yes |\n`);
  assert.equal(ok.status, 0, ok.stdout);
  assert.match(ok.stdout, /^mutants required:yes table:yes rows:1$/m);
  const survivor = check(`${base}\n## Mutants\n\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n| null guard | drop the early return | none | no |\n`);
  assert.equal(survivor.status, 1, "a survivor with no reason fails");
  assert.match(survivor.stdout, /survivors:1 survivor-with-no-reason:1/);
  const reasoned = check(`${base}\n## Mutants\n\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n| null guard | drop the early return | none | no: the guard is unreachable behind the parser's own check, ruled equivalent |\n`);
  assert.equal(reasoned.status, 0, reasoned.stdout);
  assert.match(reasoned.stdout, /survivors:1$/m);
});

test("review-file: a docs-claim command's output is required with exit 0 when the packet names one", () => {
  const dir = lensRepo();
  writeFileSync(join(dir, "docs", "agents", "workflow.md"), `${ALL_LENSES}- Docs-claim command: \`node scripts/docs-claims.mjs\`\n`);
  const { out } = packet(dir, ["--band", "medium"]);
  assert.match(readFileSync(out, "utf8"), /Docs-claim command: `node scripts\/docs-claims\.mjs`/);
  const base = `## Standards + spec\n${ARCH_OK}\n## Blast radius\n- none\n\n## Mutants\n\n| rule/row | mutant | test that killed it | killed? |\n|---|---|---|---|\n| r | m | t | yes |\n`;
  const cr = join(dir, "cr.md");
  const check = (text) => { writeFileSync(cr, text); return run("review-file.mjs", ["--packet", out, cr]); };
  const missing = check(base);
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /^docs-claim required:yes output:no$/m);
  const failing = check(`${base}\n## Docs claim\n\n$ node scripts/docs-claims.mjs\nsrc/a.ts:12: "every caller" has no proof\nexit 1\n`);
  assert.equal(failing.status, 1, "exit 1 is not a pass");
  assert.match(failing.stdout, /^docs-claim required:yes output:no$/m);
  const passing = check(`${base}\n## Docs claim\n\n$ node scripts/docs-claims.mjs\nok: 12 universal words, all with a pasted grep\n$ echo "exit 0"\nexit 0\n`);
  assert.equal(passing.status, 0, passing.stdout);
  assert.match(passing.stdout, /^docs-claim required:yes output:yes$/m);
});

test("review-file --init scaffolds the mutants table and the docs-claim run when the packet asks for them", () => {
  const dir = lensRepo();
  writeFileSync(join(dir, "docs", "agents", "workflow.md"), `${ALL_LENSES}- Docs-claim command: \`node scripts/docs-claims.mjs\`\n`);
  const { out } = packet(dir, ["--band", "medium"]);
  const cr = join(dir, "cr.md");
  assert.equal(run("review-file.mjs", ["--packet", out, "--init", cr]).status, 0);
  const text = readFileSync(cr, "utf8");
  assert.deepEqual([...text.matchAll(/^## (.*)$/gm)].map((m) => m[1]), ["Loops", "Own runs", "Docs claim", "Mutants", "Standards + spec", "Blast radius"]);
  assert.match(text, /## Mutants\n\n\| rule\/row \| mutant \| test that killed it \| killed\? \|/);
  assert.match(text, /## Docs claim\n\n`node scripts\/docs-claims\.mjs` and its output, exit 0/);
  // A packet whose ORACLE is none scaffolds no mutants table.
  writeFileSync(join(dir, "task.md"), "TASK: docs only.\nORACLE: none (docs)\nARCHITECTURE: none (fixture)\n");
  const docs = packet(dir, ["--band", "medium"]);
  const cr2 = join(dir, "cr2.md");
  assert.equal(run("review-file.mjs", ["--packet", docs.out, "--init", cr2]).status, 0);
  assert.doesNotMatch(readFileSync(cr2, "utf8"), /## Mutants/);
});

test("mkpacket: the pre-run and docs-claim commands come from workflow.md, and say so when absent", () => {
  const dir = lensRepo("- Pre-run command: `node scripts/pre-run.mjs --wt {wt}`\n- Docs-claim command: `node scripts/docs-claims.mjs`\n");
  const { r, text } = packet(dir, ["--band", "medium"]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(text.includes("The command is `node scripts/pre-run.mjs --wt " + WT + "` (workflow.md → Pre-run command); paste its output and each failing file"), "the pre-run command, filled with this worktree");
  assert.match(text, /Docs-claim command: `node scripts\/docs-claims\.mjs`\./);
  const bare = packet(repo());
  assert.match(bare.text, /The command is none \(workflow\.md names no Pre-run command\)/);
  assert.match(bare.text, /Docs-claim command: none \(workflow\.md names no Docs-claim command\)\./);
});

// ---- 2026-11-20: L1 as a coordinator over one builder per task, the builder's report
// as the last action of every turn, the two heartbeats, the L1 handover.
test("CHAIN.md: L1 coordinates one builder per task and touches no code and no self-review", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\| L1, one coordinator per task \| Starts that task's one builder with the packet and a finish notice, answers its questions, runs the diff check when it reports, hands L0 one report; spends as few tokens as it can \| Write production code, run the self-review itself, start children of its own harness that spend its tokens, poll \|/);
  assert.match(chain, /\*\*Brief\*\* L1 \(its brief first; the packet, built with L1's returned agent id, follows as the first message\) with the packet \(below\) and only its own task block[\s\S]*?L1 starts the task's one builder with that packet verbatim, in the task worktree, and a finish notice, and starts nothing else; the packet carries L1's agent id \(`--l1-id`\) so the builder's questions and reports reach it/);
  assert.match(chain, /\| L2, one builder per task \| Owns one task: does it or delegates to L3, self-reviews, commits on the ticket branch, reports the range/);
  assert.match(chain, /\*\*The full suite runs once per ticket, on the staged squash\*\* \(the gate\), at every band\. Builders and their children run targeted tests/);
});

test("CHAIN.md: L1's diff check is skill-free, sends the builder back once, and reports either way", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /When the builder reports, L1 reads its `git diff --stat`, then the changed hunks, and compares them with the packet's ORACLE and acceptance list, loading no skills: a problem goes back to the builder once, and L1 reports to L0 either way with its findings listed/);
});

test("CHAIN.md: no polling, no finish notice on an L1 launch, and an L1 reports to L0 by message", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*A finish notice only where no message will arrive\.\*\* L0 starts an L1 without one and L1 starts its builder with one: an L1 reports to L0 by message only, a report, a block or a question, and that message wakes L0\. Reviewer, planner, takeover and verify driver are all started with a notice too\. No agent polls: it ends its turn and the notice wakes it/);
  assert.match(chain, /so the builder's questions and reports reach it[\s\S]*?\*\*L1's brief\*\* carries the task block, the packet, the builder's title, L0's agent id, and one line naming its duties[\s\S]*?A fence question it passes to L0, which answers it precisely; a change to the task's scope is L0's too/);
  assert.match(chain, /L1 spawns the task's builder through the adapter with the role's provider, model and thinking level from workflow\.md[\s\S]*?L0 checks the lane's running builders and coordinators and its open worktrees against the caps/);
});

test("CHAIN.md and the packet rules: the last action of every turn is the builder's report message to L1", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*The standing order in every packet\.\*\* The last action of every turn is the builder's message to L1, `done\|question\|blocked: <report path or question>`, through the adapter's report call \(packet rule 10\)/);
  const rules = packFile("rigor/templates/packet-rules.txt");
  assert.match(rules, /The report is one message to L1, through the ADAPTER report call\s+in this packet's PROJECT RULES, shaped `done\|question\|blocked: <report path or question>`: it is\s+the last action of every turn, so L1 hears even when the finish notice fails/);
  assert.match(rules, /5\. \{delegate\} Ask your L1 rather than guess[\s\S]*?hands a question to L1's agent \(\{l1\}\)/);
});

test("CHAIN.md: two heartbeats, the L0 one a status-only safety net over every agent and the L1 one reading its builder's log", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*L0's tick\*\* \(workflow\.md → `L0 heartbeat`, default 30 minutes, under the cache lifetime\) covers the builders, reviewers, planners, plan reviewers, takeovers and verify drivers of the lane, so none of them stalls unwatched/);
  assert.match(chain, /It reads status, never a transcript: stuck means an agent's newest status is past the staleness window, or the same step repeats on the number of reads it names/);
  assert.match(TPL("workflow.md"), /Covers every agent of the lane by status alone \(builders, reviewers, planners, plan reviewers, takeovers, verify drivers\)/);
  assert.match(chain, /\*\*L1's tick\*\* \(workflow\.md → `L1 heartbeat`, default 30 minutes\)\. Per tick, per builder: \(1\) its status: idle or in error, act now, in that turn — an idle builder may be asking a question, and that answer belongs to the turn, not to the next tick\. \(2\) The tail of its log, 20 lines, against the previous tick: no new tool calls, the same failing command or error, or the same step on 2 ticks steers it with the exact fix, or interrupts and re-briefs it; progressing gets one line: step, next, `OK`\. A tick that acted \(steer, interrupt, re-brief, answer\) sends L0 one line; otherwise none/);
  assert.match(chain, /Neither sends a periodic status report to L0|neither of them a status report to L0/);
  assert.match(TPL("workflow.md"), /- L0 heartbeat: every 30 minutes <!-- default/);
  assert.match(TPL("workflow.md"), /- L1 heartbeat: every 30 minutes <!-- default[\s\S]*?Read by L1 itself, never by a script/);
  assert.match(TPL("workflow.md"), /\| L1 coordinator \| `<provider\/model>` \| `<level>` \|/);
});

test("CHAIN.md: an L1 handover happens at a fix-round boundary over the soft limit and adopts the running builder", () => {
  const chain = packFile("rigor/CHAIN.md");
  assert.match(chain, /\*\*L1 handover\.\*\* Each task has its own L1\. A handover happens only at a fix-round boundary, and only when L1's context is past its soft limit \(workflow\.md → Context ceilings: ~150k, hard ceiling ~200k\): L0 archives it and starts a fresh L1 for the same task, briefed from the task's state file, which names the running builder's agent id, so it adopts that builder\. A handover never starts a new builder/);
  assert.match(TPL("workflow.md"), /coordinator `<n>k` soft and `<n>k` hard/);
});

test("the method files name no model id, and only the adapter names the delegation tool's calls", () => {
  for (const f of ["rigor/CHAIN.md", "rigor/AFK.md", "rigor/SKILL.md", "rigor/templates/packet-rules.txt", "rigor/templates/self-review.txt", "rigor/templates/arch-pass.txt"]) {
    const text = packFile(f);
    assert.doesNotMatch(text, /\b(gpt|deepseek|sonnet|opus|glm|claude-\d|codex-cli|fast mode)\b/i, f);
  }
  assert.doesNotMatch(packFile("rigor/CHAIN.md"), /paseo/i, "the tool's name lives in the adapter and workflow.md only");
  assert.match(packFile("rigor/delegation/paseo.md"), /`paseo send --no-wait <L1 agent id>/);
});

test("the renamed roles reach the adapter README, the Claude note, the settings and the packet builder", () => {
  const readme = packFile("rigor/delegation/README.md");
  assert.match(readme, /\| start a coordinator \| Start one L1 with its task block, its model and level, and no finish notice \|/);
  assert.match(readme, /\| report or ask a question \| A message to the agent that launched the sender/);
  assert.match(packFile("rigor/harness/claude.md"), /A coordinator asked to run one task never uses it: it starts that task's builder through the delegation adapter, ends its turn and is woken by the builder's message/);
  assert.match(TPL("workflow.md"), /- L2\/L3 wait slice: 10 minutes max/);
  assert.match(packFile("setup/SKILL.md"), /models per role with the L1 coordinator row[\s\S]*?the two heartbeat intervals/);
  assert.match(packFile("rigor/templates/arch-pass.txt"), /one builder finishes the first build and its self-review/);
  // Rules 5 and 10 name L1 now, never L0.
  const rules = packFile("rigor/templates/packet-rules.txt").slice(packFile("rigor/templates/packet-rules.txt").indexOf("5. {delegate}"), packFile("rigor/templates/packet-rules.txt").indexOf("6. SELF-REVIEW"));
  assert.doesNotMatch(rules, /L0/);
  assert.doesNotMatch(packFile("rigor/templates/packet-rules.txt").split("10. REPORT:")[1].split("11. HISTORY")[0], /Ask L0|L0's agent/);
});
