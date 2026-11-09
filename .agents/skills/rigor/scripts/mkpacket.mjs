#!/usr/bin/env node
// Build an implementer packet: task text + chain preferences + pack rules + project rules.
//   node mkpacket.mjs --slug S --wt W --base B --branch BR --task FILE --out FILE
//                     [--ref R] [--task-id T] [--band B] [--kind K] [--project-rules FILE] [--repo DIR]
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
// {lens_briefs} in packet rule 6 becomes one reviewer-child brief per required lens, naming that
// lens's body under {wt}/.agents/skills/code-review/references/, so the implementer copies it
// instead of briefing a child from its own summary.
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
const band = args.band;
if (band !== undefined && !BANDS.includes(band)) die(`--band must be one of ${BANDS.join(", ")}: ${band}`);
const kind = args.kind ?? "code";
if (!KINDS.includes(kind)) die(`--kind must be one of ${KINDS.join(", ")}: ${kind}`);

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
    return `   - Lens: ${name}. Read ${args.wt}/.agents/skills/code-review/references/${body} in full first, then review ${args.base}..HEAD in ${args.wt} and every deliverable the task names: <deliverable paths, or none>. Read-only: edit nothing, run nothing that writes.`;
  }).join("\n"),
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
const out = `${body}\n\nSTANDING ORDERS (binding):\n${sub(prefs)}\n\nRULES:\n${sub(pack)}\n\nPROJECT RULES:\n${sub(proj)}`;

const left = [...out.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => k in vars);
if (left.length) die(`unreplaced placeholder(s) in ${args.out}: ${[...new Set(left)].map((k) => `{${k}}`).join(", ")}`);

writeFileSync(args.out, out);
console.log(`${args.out}: ${body.length} task chars, ${out.length} total chars`);
