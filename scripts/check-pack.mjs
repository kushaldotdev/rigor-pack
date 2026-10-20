#!/usr/bin/env node
// Validate .agents/skills/ against manifest.json and the rules in
// tmp/independent-pack-review.md Decision 7. Run after every build.
// Works without vendors/ (installed copies): vendor re-render checks are then skipped.
//   node scripts/check-pack.mjs [--target=pi|codex|claude] [--repo=<path>]
import { readFileSync, readdirSync, existsSync, lstatSync, readlinkSync } from "node:fs";
import { join, dirname, relative, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyPlan, render, sha256, readFrontmatter, parseOpenaiYaml, openaiYaml, walkFiles, HOSTS } from "./lib/pack.mjs";
import { INTERFACE } from "./pack-layout.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(args.repo ?? here);
const pack = join(repo, ".agents", "skills");
const rel = (f) => relative(pack, f).split("\\").join("/");
let fails = 0;
const fail = (m) => { console.log(`FAIL ${m}`); fails++; };

const manifestPath = join(pack, "manifest.json");
if (!existsSync(manifestPath)) { console.log("FAIL no .agents/skills/manifest.json"); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const names = manifest.skills.map((s) => s.name);

// 1. Skill set equals the manifest; exactly one SKILL.md per host, none elsewhere.
const dirs = readdirSync(pack, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
if (manifest.skillCount !== names.length) fail(`manifest skillCount ${manifest.skillCount} != ${names.length} listed`);
for (const n of names) if (!dirs.includes(n)) fail(`${n}: in manifest, missing from pack`);
for (const d of dirs) if (!names.includes(d)) fail(`${d}: directory not in manifest`);
const skillFiles = walkFiles(pack).filter((f) => f.endsWith("/SKILL.md") || f === "SKILL.md");
for (const f of skillFiles) if (!/^[^/]+\/SKILL\.md$/.test(rel(f))) fail(`${rel(f)}: nested SKILL.md (copied bodies must be renamed)`);
if (skillFiles.length !== names.length) fail(`${skillFiles.length} files named SKILL.md, expected ${names.length}`);

// 2. Frontmatter, visibility parity, generated openai.yaml.
let descChars = 0;
for (const s of manifest.skills) {
  const p = join(pack, s.name, "SKILL.md");
  if (!existsSync(p)) { fail(`${s.name}: no SKILL.md`); continue; }
  let fm;
  try { fm = readFrontmatter(readFileSync(p, "utf8")); } catch (e) { fail(`${s.name}: ${e.message}`); continue; }
  if (fm.name !== s.name) fail(`${s.name}: frontmatter name "${fm.name}"`);
  if (!fm.description) fail(`${s.name}: no description`);
  descChars += (fm.description ?? "").length + s.name.length;
  const hidden = fm["disable-model-invocation"] === true;
  if (hidden !== (s.visibility === "user-invoked")) fail(`${s.name}: frontmatter visibility != manifest (${s.visibility})`);
  const y = join(pack, s.name, "agents", "openai.yaml");
  if (!existsSync(y)) { fail(`${s.name}: no agents/openai.yaml`); continue; }
  const text = readFileSync(y, "utf8");
  if (parseOpenaiYaml(text).implicit === hidden) fail(`${s.name}: openai.yaml allow_implicit_invocation disagrees with frontmatter`);
  if (INTERFACE[s.name] && text !== openaiYaml(...INTERFACE[s.name], !hidden)) fail(`${s.name}: openai.yaml differs from generated (rebuild)`);
}
if (descChars > 8000) fail(`skill list is ${descChars} chars; Codex's default budget is 8000`);
const advertised = manifest.skills.filter((s) => s.visibility === "advertised").length;
if (advertised !== manifest.advertisedCount) fail(`advertised ${advertised} != manifest ${manifest.advertisedCount}`);

// 3. Copies match the manifest; with vendors/ present, they match a fresh render.
const listed = new Set(manifest.files.map((f) => f.dest));
for (const f of manifest.files) {
  const p = join(pack, f.dest);
  if (!existsSync(p)) { fail(`${f.dest}: missing`); continue; }
  if (sha256(readFileSync(p)) !== f.sha256) fail(`${f.dest}: edited (hash differs from manifest); edit vendors/ upstream or the host SKILL.md, never a copy`);
}
for (const h of names) for (const v of ["matt", "pstack"]) {
  const d = join(pack, h, "references", v);
  if (existsSync(d)) for (const f of walkFiles(d)) if (!listed.has(rel(f))) fail(`${rel(f)}: unlisted file in a vendor copy folder`);
}
const index = join(pack, "rigor", "references", "INDEX.md");
if (!existsSync(index) || sha256(readFileSync(index)) !== manifest.indexSha256) fail("rigor/references/INDEX.md missing or edited (rebuild)");
const vendored = existsSync(join(repo, "vendors"));
if (vendored) {
  const plan = copyPlan(repo);
  const planned = new Set(plan.entries.map((e) => e.dest));
  for (const d of listed) if (!planned.has(d)) fail(`${d}: in manifest but not in pack-layout plan (rebuild)`);
  for (const e of plan.entries) {
    if (!listed.has(e.dest)) { fail(`${e.dest}: planned but not in manifest (rebuild)`); continue; }
    const m = manifest.files.find((f) => f.dest === e.dest);
    if (sha256(readFileSync(join(repo, e.src))) !== m.vendorSha256) fail(`${e.src}: vendor file changed since build (rebuild and re-check CHANGES.md)`);
    if (sha256(render(e, plan, repo).bytes) !== m.sha256) fail(`${e.dest}: build output drifted (rebuild)`);
  }
}

// 4. Links resolve. Copies may only keep the dangling links upstream already had.
const LINK = /\]\(([^)\s]+)\)/g;
const CODE = /`([^`\s]+)`/g;
const isPath = (t) => !/[:<>*{}$]/.test(t) && !t.startsWith("#") && !t.startsWith("/") && (t.startsWith("./") || t.startsWith("../") || /\.(md|sh|mjs|ts|tsv|json)$/.test(t.split("#")[0]) || t.endsWith("/"));
const handWritten = names.filter((n) => existsSync(join(pack, n))).flatMap((n) => walkFiles(join(pack, n)).filter((f) => f.endsWith(".md") && !listed.has(rel(f)) && f !== index));
for (const f of handWritten) {
  const t = readFileSync(f, "utf8");
  for (const [, target] of t.matchAll(LINK)) {
    if (!isPath(target)) continue;
    if (!existsSync(join(dirname(f), target.split("#")[0]))) fail(`${rel(f)}: broken link ${target}`);
  }
  // 5. No dependency outside the pack, no harness-specific invocation forms in host bodies.
  if (/subagent-orchestration-policy|<skills-root>|\bvendors\/|\/home\/|~\/\.pi\/agent\/skills/.test(t)) fail(`${rel(f)}: references something outside the pack`);
  if (/^[^/]+\/SKILL\.md$/.test(rel(f)) && /\/skill:[a-z]|(^|\s)\$[a-z-]+\b/m.test(t.replace(/`[^`]*`/g, ""))) fail(`${rel(f)}: hardcodes a harness invocation form outside code`);
}
for (const m of manifest.files.filter((x) => x.dest.endsWith(".md"))) {
  const f = join(pack, m.dest);
  if (!existsSync(f)) continue;
  const t = readFileSync(f, "utf8");
  const allowed = new Set(m.danglingUpstream ?? []);
  for (const re of [LINK, CODE]) for (const [, target] of t.matchAll(re)) {
    const p = target.split("#")[0];
    if (/[:<>*{}]/.test(p) || !(p.startsWith("./") || p.startsWith("../") || /(^|\/)SKILL\.md$/.test(p))) continue;
    if (!existsSync(join(dirname(f), p)) && !allowed.has(target)) fail(`${m.dest}: broken link ${target}`);
  }
}

// 6. AFK contract: every interactive line in AFK scope has a row in rigor/AFK.md.
const INTERACTIVE = /\b(ask the (user|operator|human|invoker)|ask for it|ask whether the user|ask again|check with the user|confirm (them |it )?with the user|quiz the user|until the user approves|wait for (the user|explicit approval|the operator)|stop and ask|offer once|AskQuestion|pause for sign-off|ambiguous, ask|tell the user to run|by asking if the user|vibe-check with the user|approval is a wait|unless the user asks|Ask: ")/i;
const HUMAN_PRESENT = new Set(["setup", "triage", "teach", "retro", "wait-what", "handoff", "grilling"]);
const afkPath = join(pack, "rigor", "AFK.md");
const rows = existsSync(afkPath) ? [...readFileSync(afkPath, "utf8").matchAll(/^\| `([^`]+)` \| (.+?) \| .+\|$/gm)].map((m) => ({ file: m[1], frag: m[2] })) : [];
if (!rows.length) fail("rigor/AFK.md has no precedence rows");
for (const m of manifest.files) {
  if (!m.dest.endsWith(".md") || HUMAN_PRESENT.has(m.dest.split("/")[0])) continue;
  readFileSync(join(pack, m.dest), "utf8").split("\n").forEach((line, i) => {
    if (!INTERACTIVE.test(line)) return;
    if (!rows.some((r) => r.file === m.dest && line.includes(r.frag))) fail(`${m.dest}:${i + 1}: interactive line with no AFK.md row: ${line.trim().slice(0, 90)}`);
  });
}
for (const r of rows) if (!listed.has(r.file)) fail(`AFK.md row points at a file not in the pack: ${r.file}`);

// 7. Harness footprint for the declared (or requested) targets.
const targetsFile = join(repo, ".agents", "harness-targets.json");
const targets = args.target ? [args.target] : existsSync(targetsFile) ? JSON.parse(readFileSync(targetsFile, "utf8")).targets : [];
for (const t of targets) {
  if (!["pi", "codex", "claude"].includes(t)) { fail(`unknown harness target ${t}`); continue; }
  if (t !== "claude") continue;
  for (const n of names) {
    const link = join(repo, ".claude", "skills", n);
    let ok = false;
    try { ok = lstatSync(link).isSymbolicLink() && readlinkSync(link) === posix.join("..", "..", ".agents", "skills", n); } catch {}
    if (!ok) fail(`claude: .claude/skills/${n} is not a symlink to ../../.agents/skills/${n} (run scripts/install-harness.mjs)`);
  }
}

console.log(fails ? `CHECKS FAILED (${fails})` : `pack ok: ${names.length} skills (${advertised} advertised), ${manifest.files.length} vendor files hash-checked${vendored ? " and re-rendered" : ""}, targets: ${targets.join(", ") || "none declared"}`);
process.exit(fails ? 1 : 0);
