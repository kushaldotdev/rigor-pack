// Shared by build-pack.mjs and check-pack.mjs: the copy plan, the mechanical
// transforms, a strict frontmatter reader, and hashing. No dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, posix } from "node:path";
import { createHash } from "node:crypto";
import { VENDORS, HOSTS, DROPPED, EXCLUDE } from "../pack-layout.mjs";
import { NEUTRAL, NEUTRAL_ALL } from "../harness-neutral.mjs";

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const toPosix = (p) => p.split("\\").join("/");

export function walkFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = join(dir, e.name);
    return e.isDirectory() ? walkFiles(f) : [f];
  });
}

// "matt:engineering/tdd" -> { vendor, folder (repo-relative), name }
export function parseSource(src) {
  const [vendor, path] = src.split(":");
  if (!VENDORS[vendor]) throw new Error(`unknown vendor in ${src}`);
  return { vendor, folder: posix.join(VENDORS[vendor].root, path), name: posix.basename(path) };
}

// Every vendor skill folder (a folder holding SKILL.md), as "<vendor>:<path>".
export function vendorSkills(root) {
  const out = [];
  for (const [vendor, { root: vroot }] of Object.entries(VENDORS)) {
    const abs = join(root, vroot);
    if (!existsSync(abs)) continue;
    for (const f of walkFiles(abs)) {
      if (posix.basename(toPosix(f)) !== "SKILL.md") continue;
      const rel = toPosix(relative(abs, dirname(f)));
      if (!rel.includes("/") || vendor === "matt") out.push(`${vendor}:${rel}`);
    }
  }
  return out.sort();
}

// The full copy plan: one entry per vendor file that lands in the pack.
// src is repo-relative, dest is relative to .agents/skills/.
export function copyPlan(root) {
  const entries = [];
  const folders = []; // { srcFolder, destFolder, name } for path mapping
  for (const [host, spec] of Object.entries(HOSTS)) {
    const vendorsUsed = new Set();
    for (const s of spec.sources) {
      const { vendor, folder, name } = parseSource(s);
      vendorsUsed.add(vendor);
      const destFolder = `${host}/references/${vendor}/${name}`;
      folders.push({ srcFolder: folder, destFolder, name });
      for (const f of walkFiles(join(root, folder))) {
        const within = toPosix(relative(join(root, folder), f));
        if (EXCLUDE.some((re) => re.test(within))) continue;
        const dest = within === "SKILL.md" ? `${destFolder}/${name}.md` : `${destFolder}/${within}`;
        entries.push({ host, source: s, src: posix.join(folder, within), dest, skillBody: within === "SKILL.md" });
      }
    }
    for (const v of vendorsUsed) entries.push({ host, source: `${v}:LICENSE`, src: VENDORS[v].license, dest: `${host}/references/${v}/LICENSE`, skillBody: false });
    for (const [s, destRel] of Object.entries(spec.extras ?? {})) {
      const [vendor, path] = s.split(":");
      entries.push({ host, source: s, src: posix.join(VENDORS[vendor].root, path), dest: `${host}/${destRel}`, skillBody: false });
    }
  }
  return { entries, folders, aliases: aliasSkills(root) };
}

// Map a repo-relative vendor path (file or folder) to its pack-relative copy.
function mapper(entries, folders) {
  const byFile = new Map(entries.map((e) => [e.src, e.dest]));
  return (vendorPath) => {
    if (byFile.has(vendorPath)) return byFile.get(vendorPath);
    const f = folders.find((x) => vendorPath === x.srcFolder || vendorPath.startsWith(x.srcFolder + "/"));
    if (!f) return null;
    const rest = vendorPath.slice(f.srcFolder.length).replace(/^\//, "");
    return rest ? `${f.destFolder}/${rest}` : f.destFolder;
  };
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const ALIAS_BODY = /^Call the Skill tool with [`"']([a-z0-9-]+)[`"']\.?$/;

// A vendor skill whose whole body is one line naming another skill is an alias,
// not a skill: nothing is copied for it, and its name resolves to that other
// skill wherever a copied body mentions it. Upstream keeps the alias folder.
export function aliasSkills(root) {
  const found = new Map();
  for (const source of vendorSkills(root)) {
    const { folder, name } = parseSource(source);
    const file = join(root, folder, "SKILL.md");
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8").replace(FRONTMATTER, "").trim();
    const m = body.match(ALIAS_BODY);
    if (m) found.set(source, m[1] === name ? null : m[1]);
  }
  return new Map([...found].filter(([, target]) => target));
}
const LINK = /\]\(([^)\s]+)\)/g; // markdown link target
const CODE = /`([^`\s]+)`/g; // inline code span holding one token

// Rewrite one relative path token if it points at a copied vendor file whose
// relative location changed. Returns null when the token is not a vendor path.
function relink(token, srcFile, destFile, map, root) {
  if (/[:<>*{}]/.test(token) || token.startsWith("#") || token.startsWith("/")) return null;
  const [path, hash = ""] = token.split(/(?=#)/);
  if (!(path.startsWith("./") || path.startsWith("../") || /(^|\/)SKILL\.md$/.test(path))) return null;
  const resolved = posix.normalize(posix.join(posix.dirname(srcFile), path)).replace(/\/$/, "");
  if (!existsSync(join(root, resolved))) return { dangling: token };
  const target = map(resolved);
  if (!target) return { dangling: token };
  let next = posix.relative(posix.dirname(destFile), target) || posix.basename(target);
  if (path.endsWith("/")) next += "/";
  if (path.startsWith("./") && !next.startsWith(".")) next = "./" + next;
  return next === path ? null : { next: next + hash };
}

// Produce the bytes for one plan entry plus the transforms applied to them.
export function render(entry, plan, root) {
  const raw = readFileSync(join(root, entry.src));
  if (!entry.src.endsWith(".md")) return { bytes: raw, transforms: [], pre: sha256(raw), dangling: [], globalHits: [] };
  let text = raw.toString("utf8");
  const transforms = [];
  if (entry.skillBody) {
    const m = text.match(FRONTMATTER);
    if (!m) throw new Error(`no frontmatter: ${entry.src}`);
    text = text.slice(m[0].length);
    transforms.push("strip-frontmatter", `rename SKILL.md -> ${posix.basename(entry.dest)}`);
  }
  const pre = sha256(Buffer.from(text, "utf8"));
  // Resolve absorbed alias names before relinking, so a renamed wiki link still
  // points at a real vendor file and gets relinked.
  for (const [source, target] of plan.aliases ?? []) {
    const name = parseSource(source).name;
    // Whole names only: `grill-me` must not match inside a longer name like `grill-me-twice`.
    const whole = new RegExp(`(?<![\\w-])${name.replace(/[-]/g, "\\-")}(?![\\w-])`, "g");
    if (name === target || !whole.test(text)) continue;
    text = text.replace(whole, target);
    transforms.push("resolve-alias");
  }
  const map = mapper(plan.entries, plan.folders);
  const dangling = [];
  let relinked = 0;
  const swap = (whole, token, wrap) => {
    const r = relink(token, entry.src, entry.dest, map, root);
    if (!r) return whole;
    if (r.dangling) { dangling.push(r.dangling); return whole; }
    relinked++;
    return wrap(r.next);
  };
  text = text.replace(LINK, (w, t) => swap(w, t, (n) => `](${n})`));
  text = text.replace(CODE, (w, t) => swap(w, t, (n) => `\`${n}\``));
  if (relinked) transforms.push(`relink ${relinked} relative path(s) to the copied location`);
  // Harness-specific wording -> neutral wording. Drift in upstream text throws here.
  const rules = NEUTRAL[entry.src] ?? [];
  for (const [from, to] of rules) {
    const n = text.split(from).length - 1;
    if (n !== 1) throw new Error(`harness-neutral: ${entry.src}: ${JSON.stringify(from)} occurs ${n} times, expected exactly once`);
    text = text.replace(from, () => to);
  }
  if (rules.length) transforms.push(`neutralize ${rules.length} harness-specific phrase(s)`);
  const globalHits = [];
  NEUTRAL_ALL.forEach(([from, to], i) => {
    const n = text.split(from).length - 1;
    if (!n) return;
    text = text.split(from).join(to);
    globalHits.push(i);
    transforms.push(`neutralize ${n} pack-wide phrase(s)`);
  });
  return { bytes: Buffer.from(text, "utf8"), transforms, pre, dangling, globalHits };
}

// Strict reader for the flat frontmatter this pack's host skills use:
// `key: value` lines, values optionally double-quoted. Anything else throws.
export function readFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("no frontmatter");
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
    if (!kv) throw new Error(`unsupported frontmatter line: ${line}`);
    let v = kv[2];
    if (v.startsWith('"')) {
      if (!/^"(?:[^"\\]|\\.)*"$/.test(v)) throw new Error(`bad quoted value: ${line}`);
      v = JSON.parse(v);
    } else if (v === "true" || v === "false") v = v === "true";
    out[kv[1]] = v;
  }
  return out;
}

// The generated Codex interface file for one host.
export function openaiYaml(display, short, implicit) {
  const q = (s) => JSON.stringify(s);
  return `interface:\n  display_name: ${q(display)}\n  short_description: ${q(short)}\npolicy:\n  allow_implicit_invocation: ${implicit}\n`;
}

export function parseOpenaiYaml(text) {
  const get = (k) => text.match(new RegExp(`^\\s+${k}:\\s*(.+)$`, "m"))?.[1];
  const implicit = get("allow_implicit_invocation");
  return { display: get("display_name") && JSON.parse(get("display_name")), short: get("short_description") && JSON.parse(get("short_description")), implicit: implicit === undefined ? true : implicit === "true" };
}

export { HOSTS, DROPPED, VENDORS };
