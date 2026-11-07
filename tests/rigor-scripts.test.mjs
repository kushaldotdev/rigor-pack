// Tests for the rigor chain tools: pi-delegation.mjs and mkpacket.mjs.
// Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, utimesSync } from "node:fs";
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
  const left = [...text.matchAll(/\{(wt|base|branch|slug|ref|ticket|task|commit_subject|commit_trailer)\}/g)];
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
