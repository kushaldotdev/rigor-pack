#!/usr/bin/env node
// Build an implementer packet: task text + chain preferences + pack rules + project rules.
//   node mkpacket.mjs --slug S --wt W --base B --branch BR --task FILE --out FILE
//                     [--ref R] [--task-id T] [--project-rules FILE] [--repo DIR]
// --repo (default cwd) supplies .audit/<slug>.preferences.md (required) and
// docs/agents/packet-rules.md (used when --project-rules is absent).
// <ref> is a tracker issue number ("364") or a unit id ("U2").
// <task-id> names the task inside the ticket ("T2", default "T1"); it fills {task}, so the
// self-review file {wt}/tmp/cr-{ticket}-{task}.md is one per task.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
