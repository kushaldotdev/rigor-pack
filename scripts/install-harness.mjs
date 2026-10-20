#!/usr/bin/env node
// Install the pack into a repo and create each harness's footprint.
//   node scripts/install-harness.mjs --targets=pi,codex,claude [--repo=<path>] [--check]
// --repo defaults to this checkout (footprint only, no copy).
// pi and Codex read .agents/skills/ natively: nothing to create.
// Claude Code reads .claude/skills/: one symlink per pack skill.
// Repo-only: never writes to ~/.claude, ~/.codex, ~/.agents or ~/.pi.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, lstatSync, readlinkSync, symlinkSync, readdirSync } from "node:fs";
import { join, dirname, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(args.repo ?? here);
const src = join(here, ".agents", "skills");
const dst = join(repo, ".agents", "skills");
const targetsFile = join(repo, ".agents", "harness-targets.json");
const die = (m) => { console.error(m); process.exit(1); };

if ("check" in args) {
  const r = spawnSync(process.execPath, [join(here, "scripts", "check-pack.mjs"), `--repo=${repo}`], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}

const targets = (args.targets ?? (existsSync(targetsFile) ? JSON.parse(readFileSync(targetsFile, "utf8")).targets.join(",") : "")).split(",").filter(Boolean);
if (!targets.length) die("usage: install-harness.mjs --targets=pi,codex,claude [--repo=<path>] [--check]");
for (const t of targets) if (!["pi", "codex", "claude"].includes(t)) die(`unknown target ${t}`);

const names = (dir) => existsSync(join(dir, "manifest.json")) ? JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).skills.map((s) => s.name) : [];
const packNames = names(src);

// Copy the pack. Only pack-owned skill folders are replaced; repo skills such
// as a generated verify-<app> are left alone.
if (repo !== resolve(here)) {
  mkdirSync(dst, { recursive: true });
  for (const n of new Set([...names(dst), ...packNames])) rmSync(join(dst, n), { recursive: true, force: true });
  for (const n of packNames) cpSync(join(src, n), join(dst, n), { recursive: true, verbatimSymlinks: true });
  cpSync(join(src, "manifest.json"), join(dst, "manifest.json"));
  console.log(`copied ${packNames.length} skills into ${dst}`);
}
writeFileSync(targetsFile, JSON.stringify({ targets }, null, 2) + "\n");

if (targets.includes("claude")) {
  const dir = join(repo, ".claude", "skills");
  try { if (lstatSync(dir).isSymbolicLink()) { rmSync(dir); console.log("removed whole-directory symlink .claude/skills (per-skill links replace it)"); } } catch {}
  mkdirSync(dir, { recursive: true });
  // Drop links into .agents/skills/ whose target no longer exists.
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (lstatSync(p).isSymbolicLink() && readlinkSync(p).startsWith("../../.agents/skills/") && !existsSync(p)) { rmSync(p); console.log(`removed stale .claude/skills/${e}`); }
  }
  for (const n of packNames) {
    const p = join(dir, n);
    const want = posix.join("..", "..", ".agents", "skills", n);
    let st = null;
    try { st = lstatSync(p); } catch {}
    if (st && !st.isSymbolicLink()) die(`.claude/skills/${n} is a real directory; resolve it by hand (one skill, one place)`);
    if (st && readlinkSync(p) === want) continue;
    if (st) rmSync(p);
    symlinkSync(want, p);
    console.log(`LINK .claude/skills/${n} -> ${want}`);
  }
}
console.log(`targets: ${targets.join(", ")}. Verify with: node ${posix.relative(process.cwd(), join(here, "scripts", "install-harness.mjs")) || "scripts/install-harness.mjs"} --repo=${repo} --check`);
