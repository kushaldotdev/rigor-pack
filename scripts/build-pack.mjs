#!/usr/bin/env node
// Materialize Matt Pocock wrappers into self-contained .agents/skills/ entries.
// .agents/skills/ must work with NO vendors/ present (install = copy .agents/skills/).
// Sources stay pristine under vendors/ for upgrade diffs. Forks, ask-pack, and
// rigor are hand-maintained and NOT touched by this script.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vend = (...p) => join(root, "vendors", ...p);
const out = (...p) => join(root, ".agents", "skills", ...p);
const PIN = "49dd158"; // mattpocock/skills v1.3.1

// name -> {bucket, extra}
const WRAPPERS = {
  "tdd": { bucket: "engineering" },
  "code-review": { bucket: "engineering", extra: "- The two review axes run as two parallel read-only reviewer children in one pi `subagent` workflow; the parent aggregates their reports (see `subagent-orchestration-policy` §6 for lenses and disposition)." },
  "diagnosing-bugs": { bucket: "engineering" },
  "domain-modeling": { bucket: "engineering" },
  "grill-with-docs": { bucket: "engineering" },
  "implement": { bucket: "engineering", extra: "- Issue-tracker operations use the repo's configured tracker (see the repo's agent docs for which CLI and workflow)." },
  "improve-codebase-architecture": { bucket: "engineering" },
  "prototype": { bucket: "engineering" },
  "research": { bucket: "engineering" },
  "to-spec": { bucket: "engineering" },
  "to-tickets": { bucket: "engineering" },
  "triage": { bucket: "engineering" },
  "wayfinder": { bucket: "engineering", extra: "- Parallel research children run as one pi `subagent` workflow, each resolving its ticket via the `research` skill." },
  "codebase-design": { bucket: "engineering" },
  "retro": { bucket: "engineering" },
  "setup-matt-pocock-skills": { bucket: "engineering" },
  "grilling": { bucket: "productivity" },
};

// Content transforms: upstream harness assumptions -> in-repo, self-contained forms.
function transform(src) {
  let t = src;
  t = t.replace(/Call the Skill tool twice, for "([a-z-]+)" and "([a-z-]+)"/gi,
    (_m, a, b) => `read and follow .agents/skills/${a}/SKILL.md and .agents/skills/${b}/SKILL.md`);
  t = t.replace(/\b[Cc]alls? the Skill tool with "([a-z-]+)"/g,
    (_m, a) => `read and follow .agents/skills/${a}/SKILL.md`);
  t = t.replace(/\b[Cc]alls? the Skill tool with "([a-z-]+)"/g,
    (_m, a) => `read and follow .agents/skills/${a}/SKILL.md`);
  t = t.replace(/calling the Skill tool with "([a-z-]+)"/gi,
    (_m, a) => `reading and following .agents/skills/${a}/SKILL.md`);
  t = t.replace(/call the Skill tool twice, for "([a-z-]+)" and "([a-z-]+)"/gi,
    (_m, a, b) => `read and follow .agents/skills/${a}/SKILL.md and .agents/skills/${b}/SKILL.md`);
  t = t.replace(/call the Skill tool for whichever skills ([^,.]+)/gi,
    (_m, rest) => `read and follow the SKILL.md of whichever skills ${rest} (under .agents/skills/<name>/)`);
  t = t.replace(/call the Skill tool/gi, "read and follow the named skill under .agents/skills/<name>/SKILL.md");
  t = t.replace(/Call the Skill tool/gi, "Read and follow the named skill under .agents/skills/<name>/SKILL.md");
  t = t.replace(/calling the Skill tool/gi, "reading and following the named skill under .agents/skills/<name>/SKILL.md");
  t = t.replace(/run `\/setup-matt-pocock-skills`/g, "ask for the setup-matt-pocock-skills skill");
  t = t.replace(/run `\/([a-z-]+)`/g, (_m, a) => `ask for the ${a} skill`);
  t = t.replace(/run `\/([a-z-]+)`/g, (_m, a) => `ask for the ${a} skill`);
  return t;
}

const ADAPT = (extra) => `

<!-- materialized from vendors/mattpocock/skills@${PIN}; do not hand-edit - rebuild: node scripts/build-pack.mjs; deviations: CHANGES.md -->

## pi adaptations

- Subagent or background-agent work: use the pi \`subagent\` tool under the ceilings in \`~/.pi/agent/skills/subagent-orchestration-policy/SKILL.md\`.
- Upstream slash commands (e.g. \`/setup-matt-pocock-skills\`): pi has none - the user asks for the skill by name.
- Skills referenced above live in this repo's \`.agents/skills/<name>/SKILL.md\`.
${extra ?? ""}`;

let built = 0;
for (const [name, { bucket, extra }] of Object.entries(WRAPPERS)) {
  const src = vend("mattpocock", "skills", bucket, name, "SKILL.md");
  if (!existsSync(src)) { console.error(`MISSING SOURCE ${src}`); process.exit(1); }
  const upstream = readFileSync(src, "utf8");
  // split frontmatter from body
  const m = upstream.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { console.error(`NO FRONTMATTER ${src}`); process.exit(1); }
  let [, fm, body] = m;
  // description mentioning another skill's trigger is fine; keep upstream fm verbatim
  const materialized = `---\n${fm}\n---\n${transform(body).trimStart()}${ADAPT(extra)}`;
  mkdirSync(out(name), { recursive: true });
  // carry the whole upstream skill folder (support files: references, formats, scripts)
  cpSync(vend("mattpocock", "skills", bucket, name), out(name), { recursive: true });
  writeFileSync(out(name, "SKILL.md"), materialized);
  built++;
  console.log(`built ${name}`);
}
console.log(`\n${built} wrappers materialized (self-contained; no vendors/ reference survives)`);
