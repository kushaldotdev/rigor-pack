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
  "code-review": { bucket: "engineering", extra: "- The two review axes run as two parallel read-only reviewer children in one pi `subagent` workflow, launched async; the parent aggregates their reports (see `subagent-orchestration-policy` §6 for lenses and disposition)." },
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
  "wait-what": { bucket: "productivity" },
  "writing-for-agents": { bucket: "productivity" },
};

// Cross-skill references use the hybrid form:
//   read and follow the `<name>` skill (<skills-root>/<name>/SKILL.md)
// Name-first because pi resolves a model-invocable skill by the absolute `<location>`
// it injects into the prompt - every cross-reference target in this pack is
// model-invocable, so the name always resolves. The path is kept as fallback, as a
// greppable anchor for scripts/check-pack.mjs, and for non-pi harnesses.
//
// `<skills-root>` is NOT a pi token - pi has no root placeholder. It is this pack's
// own hint (defined in CHANGES.md), never a contract: the repo's `.agents/skills/`,
// the global `~/.pi/agent/skills/`, or `~/.agents/skills/`, whichever holds the
// target. A hardcoded `.agents/skills/` path is dead for a globally-installed target.
const SKILLS_ROOT = "<skills-root>";

// Upstream quotes a skill name with either "..." or `...`, depending on the file.
const NAME = '["`]([a-z-]+)["`]';
const REF = (a) => `read and follow the \`${a}\` skill (${SKILLS_ROOT}/${a}/SKILL.md)`;
const REF_ING = (a) => `reading and following the \`${a}\` skill (${SKILLS_ROOT}/${a}/SKILL.md)`;

// Content transforms: upstream harness assumptions -> self-contained, pi-native forms.
function transform(src) {
  let t = src;
  t = t.replace(new RegExp(`[Cc]all the Skill tool twice, for ${NAME} and ${NAME}`, "g"),
    (_m, a, b) => `${REF(a)} and ${REF(b)}`);
  t = t.replace(new RegExp(`\\b[Cc]alls? the Skill tool with ${NAME}`, "g"),
    (_m, a) => REF(a));
  t = t.replace(new RegExp(`calling the Skill tool with ${NAME}`, "gi"),
    (_m, a) => REF_ING(a));
  t = t.replace(/call the Skill tool for whichever skills ([^,.]+)/gi,
    (_m, rest) => `read and follow the SKILL.md of whichever skills ${rest} (each \`<name>\` skill, file under ${SKILLS_ROOT}/<name>/SKILL.md)`);
  t = t.replace(/call the Skill tool/gi, `read and follow the named skill (file under ${SKILLS_ROOT}/<name>/SKILL.md)`);
  t = t.replace(/calling the Skill tool/gi, `reading and following the named skill (file under ${SKILLS_ROOT}/<name>/SKILL.md)`);
  t = t.replace(/together, in the foreground, and aggregate/g, "together as async children, and aggregate");
  t = t.replace(/run `\/setup-matt-pocock-skills`/g, "run `/skill:setup-matt-pocock-skills`");
  t = t.replace(/run `\/([a-z-]+)`/g, (_m, a) => `run \`/skill:${a}\``);
  return t;
}

// Skills deliberately absent from the pack (see CHANGES.md). A generated wrapper
// must not point at one, or the build fails at the guard. Omitted on purpose:
// `teach` and `pr` are ordinary prose/CLI tokens ("gh pr ..."), so they stay out
// of the mechanical guard.
const DROPPED_SKILLS = ["grill-me", "to-questionnaire", "wizard", "implement-spec"];
const DROPPED_RE = new RegExp("`(" + DROPPED_SKILLS.join("|") + ")`", "i");

const ADAPT = (extra) => (extra ? `\n## pi notes\n\n${extra}\n` : "");

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
  const dropped = materialized.match(DROPPED_RE);
  if (dropped) { console.error(`DROPPED SKILL REF ${name}: \`${dropped[1]}\` is not in the pack`); process.exit(1); }
  mkdirSync(out(name), { recursive: true });
  // carry the whole upstream skill folder (support files: references, formats, scripts)
  cpSync(vend("mattpocock", "skills", bucket, name), out(name), { recursive: true });
  writeFileSync(out(name, "SKILL.md"), materialized);
  built++;
  console.log(`built ${name}`);
}
console.log(`\n${built} wrappers materialized (self-contained; no vendors/ reference survives)`);
