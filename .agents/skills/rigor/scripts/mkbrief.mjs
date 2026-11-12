#!/usr/bin/env node
// Build the brief for an agent that must run the architecture pass: the planner of a hard or
// critical ticket, the reviewer of that plan, and the landing architecture pass (CHAIN.md).
//   node mkbrief.mjs --role planner|plan-review|landing --ticket <id> --arch-out <file> --out <file>
//     [--repo <root>] [--brief <project brief file>] [--plan <plan file>] [--diff <range>]
//     [--scope <text>] [--set KEY=VALUE ...]
// The brief opens with templates/arch-pass.txt (the common part and the role's part) as STEP 1,
// with both architecture skills quoted in full through INLINE lines (inline.mjs), so the method is
// in the prompt and cannot be skipped or read after the decisions. The project's own brief (--brief,
// required for planner) follows as STEP 2. Every "{KEY}" in the project brief must be filled by a
// --set KEY=VALUE; a placeholder left over exits 2. plan-review needs --plan, landing needs --diff.
// Exits 2 on misuse, a missing file or an INLINE that does not resolve.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expandInline } from "./inline.mjs";

const die = (m) => { console.error(`mkbrief: ${m}`); process.exit(2); };
const args = {};
const sets = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) die(`unexpected argument ${a}`);
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) die(`${a} needs a value`);
  if (a === "--set") {
    const m = v.match(/^([A-Za-z_][A-Za-z0-9_]*)=([\s\S]*)$/);
    if (!m) die(`--set needs KEY=VALUE, got ${v}`);
    sets[m[1]] = m[2];
  } else args[a.slice(2)] = v;
  i++;
}
const ROLES = ["planner", "plan-review", "landing"];
for (const k of ["role", "ticket", "arch-out", "out"]) if (!args[k]) die(`--${k} is required`);
if (!ROLES.includes(args.role)) die(`--role must be one of ${ROLES.join(", ")}`);
if (args.role === "planner" && !args.brief) die("--brief is required for --role planner");
if (args.role === "plan-review" && !args.plan) die("--plan is required for --role plan-review");
if (args.role === "landing" && !args.diff) die("--diff is required for --role landing");

const repo = resolve(args.repo ?? process.cwd());
const script = dirname(fileURLToPath(import.meta.url));
const packRoot = resolve(script, "..", "..", "..", "..");
const read = (p, what) => { try { return readFileSync(p, "utf8"); } catch (e) { die(`cannot read ${what} ${p}: ${e.code ?? e.message}`); } };

const tpl = read(join(script, "..", "templates", "arch-pass.txt"), "arch-pass template");
const parts = {};
let cur = null;
for (const l of tpl.split("\n")) {
  const m = l.match(/^\[\[([a-z-]+)\]\]$/);
  if (m) { cur = m[1]; parts[cur] = []; continue; }
  if (cur) parts[cur].push(l);
}
for (const p of ["common", ...ROLES]) if (!parts[p]) die(`arch-pass template has no [[${p}]] part`);

const scope = args.scope ?? (args.role === "landing"
  ? `the files ${args.diff} changes and the seams they touch`
  : `the area ticket ${args.ticket} names, and the modules its fix would add or change`);
const vars = { role: args.role, ticket: args.ticket, arch_out: args["arch-out"], scope, plan: args.plan ?? "", diff: args.diff ?? "" };
const fill = (t) => t.replace(/\{(role|ticket|arch_out|scope|plan|diff)\}/g, (_, k) => vars[k]);
const step1 = expandInline(fill([...parts.common, ...parts[args.role]].join("\n")), [repo, packRoot], die).trim();

let step2 = "";
if (args.brief) {
  let b = read(args.brief, "project brief");
  b = b.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (all, k) => (k in sets ? sets[k] : all));
  const left = [...new Set([...b.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]))];
  if (left.length) die(`unfilled placeholder(s) in ${args.brief}: ${left.map((k) => `{${k}}`).join(", ")} (pass --set KEY=VALUE)`);
  step2 = expandInline(b, [repo, packRoot], die).trim();
}
const out = [
  `STEP 1 OF ${step2 ? 2 : 1}`,
  step1,
  ...(step2 ? ["", `STEP 2 OF 2 (only after ${args["arch-out"]} is written)`, step2] : []),
  "",
].join("\n");
if (!existsSync(dirname(resolve(args.out)))) die(`no directory for --out ${args.out}`);
writeFileSync(args.out, out);
console.log(args.out);
