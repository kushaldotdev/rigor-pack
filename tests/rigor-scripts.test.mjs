// Tests for the rigor chain tools: pi-delegation.mjs and mkpacket.mjs.
// Run: node --test tests/
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
const WT = "/home/u/wt/repo/u22";
const BASE = "abc1234";

function repo(prefs = "prefs body: scratch in {wt}/tmp, no .env\n", project = null) {
  const dir = tmp();
  mkdirSync(join(dir, ".audit"), { recursive: true });
  if (prefs !== null) writeFileSync(join(dir, ".audit", `${SLUG}.preferences.md`), prefs);
  writeFileSync(join(dir, "task.md"), "TASK: fix it in {wt} on {branch} (base {base}).\n");
  if (project !== null) {
    mkdirSync(join(dir, "docs", "agents"), { recursive: true });
    writeFileSync(join(dir, "docs", "agents", "packet-rules.md"), project);
  }
  return dir;
}

function packet(dir, extra = []) {
  const out = join(dir, "packet.md");
  const r = run("mkpacket.mjs", ["--slug", SLUG, "--wt", WT, "--base", BASE, "--branch", "u22-fix", "--task", join(dir, "task.md"), "--out", out, "--repo", dir, ...extra]);
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
  assert.match(text, /TASK: fix it in \/home\/u\/wt\/repo\/u22 on u22-fix \(base abc1234\)\./);
  assert.match(text, /prefs body: scratch in \/home\/u\/wt\/repo\/u22\/tmp/);
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
  const m = text.match(/with these lenses: ([\s\S]*?)\. Use fresh/);
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
    const strip = (t) => t.replace(/; interrogate \([^)]*\)/, "").replace(/ interrogate \([^)]*\);?/, "").split("\n").filter((l) => !/Lens: interrogate\./.test(l)).join("\n");
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

test("mkpacket: the packet carries one filled reviewer-child brief per required lens, naming its body path", () => {
  const dir = withWorkflow();
  for (const [band, kind] of [["easy", "code"], ["medium", "code"], ["hard", "code"], ["easy", "assessment"], ["medium", "assessment"]]) {
    const { r, text } = packet(dir, ["--ref", "364", "--band", band, "--kind", kind]);
    assert.equal(r.status, 0, r.stderr);
    const lenses = lensesIn(text);
    const briefs = briefsIn(text);
    assert.equal(briefs.length, lenses.length, `${band}/${kind}`);
    lenses.forEach((lens, i) => {
      assert.equal(briefs[i], `Lens: ${lens}. Read ${WT}/.agents/skills/${BODIES[lens]} in full first, then review ${BASE}..HEAD in ${WT} and every deliverable the task names: <deliverable paths, or none>. Read-only: edit nothing, run nothing that writes.`);
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
  assert.match(text, /behavioural claim and every worked number[\s\S]*?command and its output in the self-review file/);
  assert.match(text, /fix round's reviewer re-reads every changed deliverable whole[\s\S]*?claim the rewrite newly makes/);
});
