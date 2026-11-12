#!/usr/bin/env node
// Build an implementer packet: task text + chain preferences + pack rules + project rules.
//   node mkpacket.mjs --slug S --wt W --base B --branch BR --task FILE --out FILE
//                     [--ref R] [--task-id T] [--band B] [--kind K] [--deliverables A,B]
//                     [--change behaviour|refactor] [--project-rules FILE] [--repo DIR]
// --repo (default cwd) supplies .audit/<slug>.preferences.md (required),
// docs/agents/packet-rules.md (used when --project-rules is absent) and
// docs/agents/workflow.md (read for the "Self-review lenses" line when --band is given).
// <ref> is a tracker issue number ("364") or a unit id ("U2").
// <task-id> names the task inside the ticket ("T2", default "T1"); it fills {task}, so the
// self-review file {wt}/tmp/cr-{ticket}-{task}.md is one per task.
// <band> is the ticket's band: easy, medium, hard or critical. It fills {lenses} in packet rule 6
// from the workflow.md line "Self-review lenses: standards+spec always; blast-radius at medium;
// interrogate at hard and critical" (clauses split on ";", each "<lens> always" or
// "<lens> at <band>[, <band>][ and <band>]"); when the line has a backticked span, only the first
// one is read, so a trailing note is ignored. standards+spec always runs. Without --band, or
// without that line, the self-review is standards+spec only. A bad band, lens or clause exits 2.
// <kind> is code (default) or assessment: a task whose product is an outcome, a report or a doc of
// claims. assessment adds the interrogate lens whatever the band; nothing else the band drives
// changes. A bad kind exits 2.
// <base> must be an ancestor of, or equal to, <branch>'s tip in <wt> (git merge-base --is-ancestor),
// so a packet built with a stale base fails here instead of in the implementer's run; it exits 2,
// and so does a base, branch or worktree git cannot resolve.
// {lens_briefs} in packet rule 6 becomes one read-only child brief per required lens, naming that
// lens's body under {wt}/.agents/skills/code-review/references/, so the implementer copies it
// instead of briefing a child from its own summary. Every self-review loop runs those briefs, in
// parallel. {probe} is the one probe brief, or why there is none: a probe (a child that runs its
// attacks in a throwaway copy, templates/self-review.txt) runs once, on the final loop, for the
// blast-radius and interrogate lenses the band requires, and only when --band is hard or critical
// and --change is behaviour (the default). --change refactor marks a task that keeps behaviour: its
// read-only lenses are the whole self-review. A bad change exits 2. --deliverables is a
// comma-separated list of the deliverable files the task names; it fills each brief (default
// "none").
// The project rules file's "## Architecture rules" section, when present, is lifted out of the
// PROJECT RULES block and inlined as ARCHITECTURE RULES right after the task, so no implementer or
// reviewer has to open another file for the checklist; rule 6 asks the standards lens to end with a
// fixed ARCHITECTURE block. The skill files own the architecture text, so the section quotes them
// instead of copying: a line of the exact form "INLINE: <path>#<Heading>" (path relative to the
// repo root; tried against --repo, then --wt, then the root the pack is installed in) becomes
// "From <path> → <Heading> (source of truth; read the file for more):" and that heading's section,
// up to the next heading of the same or higher level (headings inside ``` fences do not count).
// A missing file or heading exits 2 naming both. Every other line of the section is the project's
// own binding and stays as written.
// A hard or critical task file must also carry an ARCHITECTURE section (a line starting
// "ARCHITECTURE"): the modules the task adds or changes and their deletion-test result, or
// "ARCHITECTURE: none" with the reason. Without one, or with one that names no module (a backticked
// name or a path) or no deletion test, the build exits 2.
// The task file must carry an ORACLE section (a line starting "ORACLE", optionally a markdown
// heading): what right looks like, as CHAIN.md -> The implementer packet says. Without one the
// build exits 2: an implementer with no oracle optimises the rules it can check.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const die = (m) => { console.error(`mkpacket: ${m}`); process.exit(2); };

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
for (const k of ["slug", "wt", "base", "branch", "task", "out"]) if (!args[k]) die(`--${k} is required`);

const anc = spawnSync("git", ["-C", args.wt, "merge-base", "--is-ancestor", args.base, args.branch], { encoding: "utf8" });
if (anc.status === 1) die(`--base ${args.base} is not an ancestor of ${args.branch}'s tip in ${args.wt}: the base is stale; take the branch tip again`);
if (anc.status !== 0) die(`cannot check --base ${args.base} against ${args.branch} in ${args.wt}: ${(anc.stderr || anc.error?.message || "").trim()}`);

const repo = resolve(args.repo ?? process.cwd());
const script = dirname(fileURLToPath(import.meta.url));
const read = (p, what) => { try { return readFileSync(p, "utf8"); } catch (e) { die(`cannot read ${what} ${p}: ${e.code ?? e.message}`); } };

const prefsPath = join(repo, ".audit", `${args.slug}.preferences.md`);
if (!existsSync(prefsPath)) die(`no preferences at ${prefsPath}`);
const prefs = read(prefsPath, "preferences");

const packPath = join(script, "..", "templates", "packet-rules.txt");
if (!existsSync(packPath)) die(`no pack rules at ${packPath}`);
const pack = read(packPath, "pack rules");

const projPath = args["project-rules"] ?? join(repo, "docs", "agents", "packet-rules.md");
const proj = existsSync(projPath) ? read(projPath, "project rules") : "none";
const task = read(args.task, "task");
if (!/^\s*(?:#+\s*)?(?:\*\*)?ORACLE\b/m.test(task)) die(`no ORACLE section in ${args.task}: add a line starting "ORACLE" that says what right looks like (today's behaviour per input shape, the input shapes of a guard, one observable scenario, the claims to run, or "ORACLE: none" with the reason)`);

const ref = args.ref;
const taskId = args["task-id"] ?? "T1";
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId)) die(`--task-id must be letters, digits, ".", "_" or "-": ${taskId}`);
const BANDS = ["easy", "medium", "hard", "critical"];
const LENSES = { // order here is the order rule 6 lists them in
  "standards+spec": "standards + spec (the default lens, both axes)",
  "blast-radius": "blast radius (for each safety fact, the step you proved it to, or unproven)",
  "interrogate": "interrogate (adversaries on the `interrogate reviewers` role; put its Findings and Dropped lists in the file)",
};
const BODIES = { // each lens's body, under {wt}/.agents/skills/code-review/references/
  "standards+spec": ["standards + spec", "matt/code-review/code-review.md"],
  "blast-radius": ["blast radius", "pstack/blast-radius/blast-radius.md"],
  "interrogate": ["interrogate", "pstack/interrogate/interrogate.md"],
};
const KINDS = ["code", "assessment"];
const CHANGES = ["behaviour", "refactor"];
const band = args.band;
if (band !== undefined && !BANDS.includes(band)) die(`--band must be one of ${BANDS.join(", ")}: ${band}`);
const kind = args.kind ?? "code";
if (!KINDS.includes(kind)) die(`--kind must be one of ${KINDS.join(", ")}: ${kind}`);
const change = args.change ?? "behaviour";
if (!CHANGES.includes(change)) die(`--change must be one of ${CHANGES.join(", ")}: ${change}`);
const TOP = ["hard", "critical"];

// The task's ARCHITECTURE section: from its label line to the next heading or capitalised label.
function architectureOf(text) {
  const lines = text.split("\n");
  const label = /^\s*(?:#+\s*)?(?:\*\*)?ARCHITECTURE\b/;
  const at = lines.findIndex((l) => label.test(l));
  if (at < 0) return null;
  const rest = lines.slice(at + 1);
  const end = rest.findIndex((l) => /^\s*#/.test(l) || /^\s*(?:\*\*)?[A-Z][A-Z' ]{3,}\b(?![a-z])/.test(l));
  return [lines[at], ...(end < 0 ? rest : rest.slice(0, end))].join("\n");
}
if (TOP.includes(band)) {
  const arch = architectureOf(task);
  const fix = `add a line starting "ARCHITECTURE" naming each module the task adds or changes and its deletion-test result, or "ARCHITECTURE: none" with the reason`;
  if (arch === null) die(`no ARCHITECTURE section in ${args.task} (band ${band}): ${fix}`);
  const none = /^\s*(?:#+\s*)?(?:\*\*)?ARCHITECTURE(?:\*\*)?\s*:?\s*none\b\W*\S/i.test(arch);
  const names = /`[^`\s][^`]*`|[\w.-]+\/[\w./-]+|\b\w+\.(?:py|ts|tsx|js|mjs|go|rs|rb|java|kt|cs|md)\b/.test(arch);
  if (!none && !(names && /deletion[ -]test/i.test(arch))) die(`the ARCHITECTURE section in ${args.task} names no module (a backticked name or a path) or no deletion-test result: ${fix}`);
}

// Lenses the band requires, from workflow.md's "Self-review lenses" line.
function lensesFor(band) {
  const chosen = new Set(["standards+spec"]);
  if (band === undefined) return chosen;
  const wfPath = join(repo, "docs", "agents", "workflow.md");
  const line = existsSync(wfPath) && read(wfPath, "workflow").split("\n").find((l) => /^\s*-\s*Self-review lenses:/.test(l));
  if (!line) { console.error(`mkpacket: no "Self-review lenses" line in ${wfPath}; self-review is standards+spec only`); return chosen; }
  const rest = line.replace(/^\s*-\s*Self-review lenses:/, "");
  const ticked = rest.match(/`([^`]*)`/); // the value is the first backticked span; anything after it is a note
  const value = (ticked ? ticked[1] : rest.replace(/<!--.*?-->/g, "")).trim();
  for (const clause of value.split(";").map((c) => c.trim()).filter(Boolean)) {
    const m = clause.match(/^(\S+)\s+(always|at\s+(.+))$/);
    if (!m) die(`bad clause in "Self-review lenses": ${clause}`);
    const [, lens, when, list] = m;
    if (!(lens in LENSES)) die(`unknown lens in "Self-review lenses": ${lens} (known: ${Object.keys(LENSES).join(", ")})`);
    const bands = when === "always" ? BANDS : list.split(/\s*,\s*|\s+and\s+/).map((b) => b.trim());
    for (const b of bands) if (!BANDS.includes(b)) die(`unknown band in "Self-review lenses": ${b}`);
    if (bands.includes(band)) chosen.add(lens);
  }
  return chosen;
}
const lenses = lensesFor(band);
if (kind === "assessment") lenses.add("interrogate");
const required = Object.keys(LENSES).filter((k) => lenses.has(k));
const deliverables = (args.deliverables ?? "").split(",").map((d) => d.trim()).filter(Boolean).join(", ") || "none";
const PROBE = new Set(["blast-radius", "interrogate"]); // lenses the final-loop probe runs
const probed = required.filter((k) => PROBE.has(k));
const probeNone = !probed.length ? "none: no lens this task requires runs as a probe"
  : !TOP.includes(band) ? `none: ${band === undefined ? "a band-less" : band === "easy" ? "an easy" : `a ${band}`} task keeps read-only lenses on every loop`
  : change === "refactor" ? "none: a refactor that keeps behaviour keeps read-only lenses on every loop"
  : null;

// The project's "## Architecture rules" section, lifted out of the project rules.
const ARCH = /^## Architecture rules[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m;
const packRoot = resolve(script, "..", "..", "..", ".."); // <root>/.agents/skills/rigor/scripts
function sectionOf(text, heading) {
  const lines = text.split("\n");
  let fence = false;
  const heads = lines.map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return null; }
    const m = !fence && l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    return m ? { level: m[1].length, text: m[2] } : null;
  });
  const at = heads.findIndex((h) => h && h.text === heading);
  if (at < 0) return null;
  const end = heads.findIndex((h, i) => i > at && h && h.level <= heads[at].level);
  return lines.slice(at + 1, end < 0 ? lines.length : end).join("\n").trim();
}
function expandInline(text) {
  return text.split("\n").map((l) => {
    const m = l.match(/^INLINE: (\S[^#]*?)#(.+?)\s*$/);
    if (!m) return l;
    const [, path, heading] = m;
    const file = [repo, resolve(args.wt), packRoot].map((r) => join(r, path)).find((f) => existsSync(f));
    if (!file) die(`INLINE: no file ${path} (heading "${heading}") under ${repo}, ${resolve(args.wt)} or ${packRoot}`);
    const section = sectionOf(read(file, "inlined file"), heading);
    if (section === null) die(`INLINE: no heading "${heading}" in ${path} (${file})`);
    return `From ${path} → ${heading} (source of truth; read the file for more):\n${section}`;
  }).join("\n");
}
const archRaw = proj.match(ARCH)?.[1].trim() ?? null;
const archRules = archRaw === null ? null : expandInline(archRaw);
const projBody = archRules === null ? proj : proj.replace(ARCH, "## Architecture rules\n\nInlined above as ARCHITECTURE RULES.\n\n");

const slug = args.slug;
const vars = {
  wt: args.wt,
  base: args.base,
  branch: args.branch,
  slug,
  ref: ref ?? "",
  ticket: ref ?? slug,
  task: taskId.toLowerCase(),
  commit_subject: "",
  commit_trailer: "",
  lenses: required.map((k) => LENSES[k]).join("; "),
  lens_briefs: required.map((k) => {
    const [name, body] = BODIES[k];
    return `   - Lens: ${name}. Read ${args.wt}/.agents/skills/code-review/references/${body} in full first, then review ${args.base}..HEAD in ${args.wt} and every deliverable the task names: ${deliverables}. Read-only: edit nothing, run nothing that writes.`;
  }).join("\n"),
  probe: probeNone ?? `one probe child, once, on the final loop only (the read-only lenses came back with an empty act-on list), started with this brief verbatim plus the ORACLE and the PROJECT RULES on tests in isolation:
   - Probe, final loop, once. ${probed.map((k) => `Lens: ${BODIES[k][0]}.`).join(" ")} Read ${probed.map((k) => `${args.wt}/.agents/skills/code-review/references/${BODIES[k][1]}`).join(" and ")} in full first, then attack HEAD (range ${args.base}..HEAD, deliverables: ${deliverables}) in a throwaway copy under ${args.wt}/tmp/probe/; never edit ${args.wt}. Run every attack yourself and report each finding with its command and output; a finding with no run is "unproven". Limits: 15 minutes of attacks; at most 5 attacks, picked from the ORACLE rows by risk; a mutant table only if the ORACLE asks for one; targeted test files by path only, never the whole suite or a runner call without a test path; foreground commands under \`timeout\`, no \`sleep\` polling; one container pair, removed before you report. Budget: 25 minutes wall time in all; past 20 minutes, stop and report what ran, listing the rest as "not run". Never ask to be resumed.`,
};
if (ref && /^\d+$/.test(ref)) { // tracker issue
  vars.ticket = ref;
  vars.commit_subject = `\`<type>(<scope>): <imperative> #${ref}\``;
  vars.commit_trailer = `\`Refs #${ref}\``;
} else if (ref) { // unit id: no issue to reference
  vars.ticket = ref.toLowerCase();
  vars.commit_subject = `\`<type>(<scope>): <imperative> (${slug} ${ref})\``;
  vars.commit_trailer = `\`Refs ${slug} ${ref}\``;
} else {
  vars.commit_subject = "`<type>(<scope>): <imperative>`";
  vars.commit_trailer = "no trailer";
}

const sub = (text) => text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

const body = sub(task);
const archBlock = archRules === null
  ? "none in the project rules: the ARCHITECTURE block items in rule 6 are the checklist."
  : `the project's checklist, inlined here so no other file is needed for it; a file it names is background reading, not a precondition:\n${sub(archRules)}`;
const out = `${body}\n\nARCHITECTURE RULES (binding): ${archBlock}\n\nSTANDING ORDERS (binding):\n${sub(prefs)}\n\nRULES:\n${sub(pack)}\n\nPROJECT RULES:\n${sub(projBody)}`;

const left = [...out.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => k in vars);
if (left.length) die(`unreplaced placeholder(s) in ${args.out}: ${[...new Set(left)].map((k) => `{${k}}`).join(", ")}`);

writeFileSync(args.out, out);
console.log(`${args.out}: ${body.length} task chars, ${out.length} total chars`);
