#!/usr/bin/env node
// Validate the pack: run after any rebuild or re-vendor.
//  1. Frontmatter parses (same YAML lib pi uses) with name + description
//  2. Every .agents/skills/<name>/SKILL.md referenced from any skill file resolves in-pack
//  3. No vendors/ references survive in .agents/skills (self-contained rule)
//  4. No Cursor-isms
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packDir = join(root, ".agents", "skills");
const require = createRequire(import.meta.url);
const YAML = require("/home/kushal/.nvm/versions/node/v24.16.0/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/yaml");

let fail = 0;
const die = (msg) => { console.log(`FAIL ${msg}`); fail = 1; };

// Skills deliberately absent from the pack (see CHANGES.md); a pack file must not
// point at one. Omitted on purpose: `teach` and `pr` are ordinary prose/CLI tokens
// ("gh pr ..."), so they are not guardable mechanically.
const DROPPED_SKILLS = ["grill-me", "to-questionnaire", "wizard", "implement-spec"];
const DROPPED_RE = new RegExp("`(" + DROPPED_SKILLS.join("|") + ")`", "i");

const skills = readdirSync(packDir).filter((d) => statSync(join(packDir, d)).isDirectory());

for (const s of skills) {
  const p = join(packDir, s, "SKILL.md");
  if (!existsSync(p)) { die(`${s}: no SKILL.md`); continue; }
  if (!existsSync(join(packDir, s, "agents", "openai.yaml")))
    die(`${s}: no agents/openai.yaml (OpenAI-format interface file)`);
  else try { YAML.parse(readFileSync(join(packDir, s, "agents", "openai.yaml"), "utf8")); }
  catch (e) { die(`${s}: openai.yaml YAML: ${e.message.split("\n")[0]}`); }
  const t = readFileSync(p, "utf8");
  const m = t.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { die(`${s}: no frontmatter`); continue; }
  try {
    const d = YAML.parse(m[1]);
    if (!d.name || !d.description) die(`${s}: frontmatter missing name/description`);
    if (d.name !== s) die(`${s}: name "${d.name}" != dir`);
  } catch (e) { die(`${s}: YAML: ${e.message.split("\n")[0]}`); }
  // self-contained rule
  if (/vendors\//.test(t)) die(`${s}: references vendors/ (not self-contained)`);
  // cursor-isms
  if (/task tool|askquestion|~\/\.cursor|team-kit|deslop|agent-transcripts|multi-model/i.test(t))
    die(`${s}: Cursor-ism present`);
  // support .md files (references/, playbooks/, scripts/ docs): same
  // self-contained / Cursor-ism / relative-link rules as SKILL.md
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const f = join(d, e.name);
    return e.isDirectory() ? walk(f) : f.endsWith(".md") ? [f] : [];
  });
  for (const f of walk(join(packDir, s))) {
    if (f === p) continue;
    const rel = relative(packDir, f);
    const t2 = readFileSync(f, "utf8");
    if (/vendors\//.test(t2)) die(`${rel}: references vendors/ (not self-contained)`);
    if (/task tool|askquestion|~\/\.cursor|team-kit|deslop|agent-transcripts|multi-model/i.test(t2))
      die(`${rel}: Cursor-ism present`);
    const dropped2 = t2.match(DROPPED_RE);
    if (dropped2) die(`${rel}: references dropped skill \`${dropped2[1]}\``);
    // ponytail: relative links in support files are unchecked - upstream examples
    // (e.g. domain-modeling GLOSSARY-FORMAT.md) use illustrative ./src/ paths
  }
  // in-pack cross references resolve (either scope form: repo `.agents/skills/` or
  // the scope-agnostic `<skills-root>/` form used for globally-installed copies).
  // This is the hybrid form's real validator: name and path are emitted as a pair,
  // so a resolvable path implies a correct name. A standalone "is the named skill in
  // the pack" check is deliberately NOT done - legitimately names externals
  // (`pi-subagents`) and consumer-local skills (`codebase-memory`).
  for (const ref of t.matchAll(/(?:\.agents\/skills|<skills-root>)\/([a-z0-9-]+)\/SKILL\.md/g)) {
    if (ref[1] === "name") continue; // the `<skills-root>/<name>/SKILL.md` template itself
    if (!existsSync(join(packDir, ref[1], "SKILL.md"))) die(`${s}: dangling ref -> ${ref[1]}`);
  }
  // no reference to a skill deliberately left out of the pack (backtick-anchored so
  // ordinary prose words like "teach" or "pr" never trip it)
  const dropped = t.match(DROPPED_RE);
  if (dropped) die(`${s}: references dropped skill \`${dropped[1]}\``);
  // support files: any reference to a local file that must exist
  for (const ref of t.matchAll(/\]\((\.{1,2}\/[^)]+\.md)\)/g)) {
    const target = join(packDir, s, ref[1]);
    if (!existsSync(target)) die(`${s}: broken relative link ${ref[1]}`);
  }
}

console.log(fail ? "CHECKS FAILED" : `all ${skills.length} skills pass (${skills.join(", ")})`);
process.exit(fail);
