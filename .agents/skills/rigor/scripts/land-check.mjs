#!/usr/bin/env node
// Landing gate: has the ticket's architecture pass run, and did it pass?
//   node land-check.mjs --trail <.audit/slug.tsv> --ticket <n> --band <easy|medium|hard|critical> [--repo DIR]
// An easy ticket passes with no pass. From medium up, the trail must hold an `arch` row for the
// ticket (CHAIN.md -> The loop for one ticket, step 5): phase `arch`, decision "#<ticket> <verdict>"
// (the "#" optional, so a unit id like U2 works too), evidence the report path, relative to --repo
// (default cwd) or absolute. A plan-review row ("#<ticket> plan <verdict>") never counts. The last such row wins, so a pass re-run after a fix replaces the first.
// Verdicts: SOUND, SOUND WITH FOLLOW-UPS, REGRESSED. The trail's header row names the columns
// (phase, decision, evidence); a trail without them is misuse.
// Prints one line, "land-check: ok ..." or "land-check: blocked: <reason>". Exits 0 when the ticket
// may land, 1 when it may not, 2 on misuse.
import { readFileSync, existsSync } from "node:fs";
import { resolve, isAbsolute, join } from "node:path";

const die = (m) => { console.error(`land-check: ${m}`); process.exit(2); };
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) die(`unexpected argument ${a}`);
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) die(`${a} needs a value`);
  args[a.slice(2)] = v;
  i++;
}
for (const k of ["trail", "ticket", "band"]) if (!args[k]) die(`--${k} is required (usage: land-check.mjs --trail <tsv> --ticket <n> --band <band>)`);
const BANDS = ["easy", "medium", "hard", "critical"];
if (!BANDS.includes(args.band)) die(`--band must be one of ${BANDS.join(", ")}: ${args.band}`);
const ticket = args.ticket.replace(/^#/, "");
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(ticket)) die(`--ticket must be an issue number or unit id: ${args.ticket}`);
const pass = (m) => { console.log(`land-check: ok: ${m}`); process.exit(0); };
const block = (m) => { console.log(`land-check: blocked: ${m}`); process.exit(1); };

if (args.band === "easy") pass(`#${ticket} is easy; no architecture pass required`);
if (!existsSync(args.trail)) die(`no trail at ${args.trail}`);
const rows = readFileSync(args.trail, "utf8").split("\n").filter((l) => l.trim()).map((l) => l.split("\t"));
const head = rows[0] ?? [];
const col = Object.fromEntries(["phase", "decision", "evidence"].map((c) => [c, head.indexOf(c)]));
for (const [c, i] of Object.entries(col)) if (i < 0) die(`${args.trail}: header row has no "${c}" column`);

const VERDICTS = ["SOUND WITH FOLLOW-UPS", "SOUND", "REGRESSED"]; // longest first
const mine = rows.slice(1).filter((r) => r[col.phase]?.trim() === "arch")
  .map((r) => ({ r, m: (r[col.decision] ?? "").trim().match(/^#?([A-Za-z0-9][A-Za-z0-9._-]*)\b\s*(.*)$/) }))
  .filter(({ m }) => m && m[1].toLowerCase() === ticket.toLowerCase() && !/^plan\b/i.test(m[2]));
if (!mine.length) block(`no \`arch\` trail row for #${ticket} (band ${args.band}): run the improve-codebase-architecture pass on the staged squash and record it`);
const { r, m } = mine.at(-1);
const verdict = VERDICTS.find((v) => new RegExp(`^${v}(?![\\w-])`).test(m[2].toUpperCase()));
if (!verdict) block(`the last \`arch\` row for #${ticket} has no verdict (${VERDICTS.join(" | ")}): "${r[col.decision]}"`);
const report = (r[col.evidence] ?? "").trim();
if (!report) block(`the last \`arch\` row for #${ticket} names no report path`);
const path = isAbsolute(report) ? report : join(resolve(args.repo ?? process.cwd()), report);
if (!existsSync(path)) block(`the \`arch\` report for #${ticket} does not exist: ${path}`);
if (verdict === "REGRESSED") block(`the architecture pass for #${ticket} says REGRESSED (${report}): fix what the ticket caused, re-run the pass, record a new \`arch\` row`);
pass(`#${ticket} ${verdict} (${report})`);
