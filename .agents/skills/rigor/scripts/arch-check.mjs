#!/usr/bin/env node
// Check an architecture pass file written from a mkbrief.mjs brief (templates/arch-pass.txt).
//   node arch-check.mjs --role planner|plan-review|landing --arch <file> [--plan <file>]
// Fails (exit 1, one line per problem) when the file is missing, a required heading is missing or
// empty, the deletion-test table has no row, Owners has no "->" line, a review role has no verdict,
// or (planner, with --plan) the plan does not cite the file by path or was written before it.
// Exit 0 prints "arch-check: ok". Misuse exits 2.
import { readFileSync, existsSync, statSync } from "node:fs";
import { basename } from "node:path";
import { sectionOf } from "./inline.mjs";

const die = (m) => { console.error(`arch-check: ${m}`); process.exit(2); };
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const a = argv[i], v = argv[i + 1];
  if (!a?.startsWith("--") || v === undefined || v.startsWith("--")) die(`bad argument ${a}`);
  args[a.slice(2)] = v;
}
const ROLES = ["planner", "plan-review", "landing"];
if (!ROLES.includes(args.role)) die(`--role must be one of ${ROLES.join(", ")}`);
if (!args.arch) die("--arch is required");

const problems = [];
if (!existsSync(args.arch)) {
  console.log(`arch-check: FAIL\n- no architecture pass file ${args.arch}`);
  process.exit(1);
}
const text = readFileSync(args.arch, "utf8");
const HEADINGS = ["Scope", "Friction", "Deletion test", "Owners", "Seams", "Candidates", "Principles applied"];
if (args.role === "plan-review") HEADINGS.push("Plan comparison");
if (args.role !== "planner") HEADINGS.push("Verdict");
for (const h of HEADINGS) {
  const s = sectionOf(text, h);
  if (s === null) problems.push(`missing heading "## ${h}"`);
  else if (!s.trim()) problems.push(`empty section "## ${h}"`);
}
const del = sectionOf(text, "Deletion test") ?? "";
const rows = del.split("\n").filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s:|-]+\|\s*$/.test(l));
if (sectionOf(text, "Deletion test") && rows.length < 2) problems.push("deletion-test table has no module row");
const own = sectionOf(text, "Owners") ?? "";
if (sectionOf(text, "Owners") && !/->|→/.test(own)) problems.push('Owners has no "<rule> -> <owner>" line');
if (HEADINGS.includes("Verdict")) {
  const v = (sectionOf(text, "Verdict") ?? "").split("\n")[0].trim().replace(/[*`]/g, "");
  if (sectionOf(text, "Verdict") !== null && !/^(SOUND WITH FOLLOW-UPS|SOUND|REGRESSED)\b/.test(v)) problems.push(`Verdict's first line is not SOUND, SOUND WITH FOLLOW-UPS or REGRESSED: "${v}"`);
}
if (args.plan) {
  if (!existsSync(args.plan)) problems.push(`no plan file ${args.plan}`);
  else {
    const plan = readFileSync(args.plan, "utf8");
    if (!plan.includes(basename(args.arch))) problems.push(`plan ${args.plan} does not cite ${basename(args.arch)}`);
    if (args.role === "planner" && statSync(args.plan).mtimeMs < statSync(args.arch).mtimeMs) problems.push("plan was last written before the architecture pass file (pass must come first)");
  }
}
if (problems.length) { console.log(`arch-check: FAIL\n${problems.map((p) => `- ${p}`).join("\n")}`); process.exit(1); }
console.log("arch-check: ok");
