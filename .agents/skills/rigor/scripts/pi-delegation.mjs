#!/usr/bin/env node
// Count a pi session's `subagent` tool calls per child agent name.
//   node pi-delegation.mjs <session.jsonl>...
//   node pi-delegation.mjs --for <dir> [--all]
// --for resolves ~/.pi/agent/sessions/<encoded>/ (PI_SESSIONS_DIR overrides the root),
// where <encoded> is the absolute dir with "/" -> "-" and "--" on both sides, and
// reads the newest .jsonl there (or every file with --all).
// One line per file: "<total> {json of {agent: count}} <path>".
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const sessionsRoot = () => process.env.PI_SESSIONS_DIR || join(homedir(), ".pi", "agent", "sessions");
const encode = (dir) => `--${resolve(dir).replace(/^\/+/, "").split("/").join("-")}--`;
const die = (m) => { console.error(`pi-delegation: ${m}`); process.exit(2); };

function countAgents(path) {
  const counts = Object.create(null);
  for (const line of readFileSync(path, "utf8").split("\n")) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const parts = o?.message?.content;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      if (p?.type !== "toolCall" || p.name !== "subagent") continue;
      const a = p.arguments ?? {};
      for (const t of a.tasks?.length ? a.tasks : [a]) {
        const name = String((typeof t === "object" && t !== null ? t.agent : t) ?? "unknown");
        counts[name] = (counts[name] ?? 0) + 1;
      }
    }
  }
  return counts;
}

function fromFor(dir, all) {
  const folder = join(sessionsRoot(), encode(dir));
  if (!existsSync(folder)) die(`no session folder for ${resolve(dir)} (looked in ${folder})`);
  const files = readdirSync(folder).filter((f) => f.endsWith(".jsonl")).map((f) => join(folder, f))
    .sort((x, y) => statSync(y).mtimeMs - statSync(x).mtimeMs || y.localeCompare(x));
  if (!files.length) die(`no .jsonl session file in ${folder}`);
  return all ? files : files.slice(0, 1);
}

const argv = process.argv.slice(2);
const forAt = argv.indexOf("--for");
let paths;
if (forAt >= 0) {
  const dir = argv[forAt + 1];
  if (!dir) die("--for needs a directory");
  paths = fromFor(dir, argv.includes("--all"));
} else {
  paths = argv.filter((a) => !a.startsWith("--"));
  if (!paths.length) die("usage: pi-delegation.mjs <session.jsonl>... | --for <dir> [--all]");
}
for (const p of paths) {
  if (!existsSync(p)) die(`no such session file: ${p}`);
  const counts = countAgents(p);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`${String(total).padStart(3)} ${JSON.stringify(counts)} ${p}`);
}
