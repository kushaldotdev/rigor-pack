#!/usr/bin/env node
// Write the self-review children's briefs from an implementer packet, one file per child, so no
// child is ever briefed from the implementer's own summary of a lens (templates/self-review.txt).
//   node lens-brief.mjs --packet <packet.md> --out-dir <dir> [--loop 1]
//   node lens-brief.mjs --packet <packet.md> --out-dir <dir> --loop <n> --since <rev> [--lenses <a,b>]
//   node lens-brief.mjs --packet <packet.md> --out-dir <dir> --fix-round --since <rev> [--class <text>]...
//   node lens-brief.mjs --packet <packet.md> --out-dir <dir> --probe
// The packet is mkpacket.mjs output. Its rule 6 names the required lenses ("with these lenses: ...")
// and carries one "- Lens: <name>. Read <body> in full first, ..." brief per lens and, when the task
// gets one, a "- Probe, final loop, once. ..." brief.
// --loop 1 (the default): every required lens, its packet brief verbatim, over the whole range.
// --loop <n> (n >= 2) with --since <rev>: a delta brief over <rev>..HEAD (the fix commits since the
// previous loop) for standards + spec, always, plus each lens --lenses names (blast-radius,
// interrogate: the lenses that raised a finding those commits fix). A lens the packet does not
// require exits 2.
// --fix-round with --since <rev> (the tip the review saw): a delta brief for standards + spec only,
// plus, when the packet gives the task a probe, one probe brief targeted on the finding classes
// --class names (one --class per class; at least one is required then). --class on a task with no
// probe exits 2.
// --probe: the final loop's probe brief, the packet's own.
// Every brief, delta or not, names its lens body by path, so a child's text always carries it. Each
// file appends, verbatim from the packet: the task's ORACLE section; for standards + spec and the
// probe, the ARCHITECTURE RULES section; for the probe, the PROJECT RULES "## Tests in isolation"
// section. A packet with no ORACLE section exits 2.
// Files are <out-dir>/<mode>-<lens>.txt (mode loop<n>, fix-round or probe; lens standards-spec,
// blast-radius, interrogate or probe); the directory is created, an existing file is replaced. Prints
// one written path per line. Exits 2 on misuse or a packet it cannot read.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const die = (m) => { console.error(`lens-brief: ${m}`); process.exit(2); };
const args = { class: [] };
const FLAGS = new Set(["fix-round", "probe"]);
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) die(`unexpected argument ${a}`);
  const k = a.slice(2);
  if (FLAGS.has(k)) { args[k] = true; continue; }
  if (!["packet", "out-dir", "loop", "since", "lenses", "class"].includes(k)) die(`unknown option ${a}`);
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) die(`${a} needs a value`);
  if (k === "class") args.class.push(v); else args[k] = v;
  i++;
}
for (const k of ["packet", "out-dir"]) if (!args[k]) die(`--${k} is required`);
if (!existsSync(args.packet)) die(`no such file: ${args.packet}`);
const modes = [args["fix-round"], args.probe, args.loop !== undefined].filter(Boolean).length;
if (modes > 1) die("--loop, --fix-round and --probe are exclusive");
const loop = args.loop === undefined ? 1 : Number(args.loop);
if (!Number.isInteger(loop) || loop < 1) die(`--loop must be a whole number from 1: ${args.loop}`);
const delta = args["fix-round"] || loop > 1;
if (delta && !args.since) die(`${args["fix-round"] ? "--fix-round" : `--loop ${loop}`} needs --since <rev>`);
if (!delta && args.since) die("--since goes with --loop <n> (n >= 2) or --fix-round");
if (args.lenses && !(loop > 1)) die("--lenses goes with --loop <n> (n >= 2)");
if (args.class.length && !args["fix-round"]) die("--class goes with --fix-round");

const packet = readFileSync(args.packet, "utf8");
const KEY = { "standards + spec": "standards-spec", "blast radius": "blast-radius", "interrogate": "interrogate" };
const listed = packet.match(/with these\s+lenses: ([\s\S]*?)\.\s+(?:Before the first loop|Each loop starts)/);
if (!listed) die(`${args.packet}: no rule 6 lens list (not a packet from this pack's mkpacket.mjs?)`);
const required = [...listed[1].matchAll(/(standards \+ spec|blast radius|interrogate) \(/g)].map((m) => m[1]);
const briefs = Object.fromEntries([...packet.matchAll(/^\s*- (Lens: (standards \+ spec|blast radius|interrogate)\. .*)$/gm)].map((m) => [m[2], m[1]]));
for (const lens of required) if (!briefs[lens]) die(`${args.packet}: rule 6 names ${lens} but carries no "- Lens: ${lens}." brief`);
const probeLine = packet.match(/^\s*- (Probe, final loop, once\. .*)$/m)?.[1] ?? null;

// The task body is everything before the inlined ARCHITECTURE RULES; the ORACLE section runs from its
// label to the next heading of the same or a higher level (a bare label: any heading or capitalised
// label), the way mkpacket.mjs finds the ARCHITECTURE section.
const taskEnd = packet.indexOf("\n\nARCHITECTURE RULES (binding):");
const task = taskEnd < 0 ? packet : packet.slice(0, taskEnd);
function oracle() {
  const lines = task.split("\n");
  const at = lines.findIndex((l) => /^\s*(?:#+\s*)?(?:\*\*)?ORACLE\b/.test(l));
  if (at < 0) return null;
  const level = lines[at].match(/^\s*(#+)/)?.[1].length ?? 0;
  const rest = lines.slice(at + 1);
  const end = rest.findIndex((l) => {
    const h = l.match(/^\s*(#+)\s/);
    if (h) return level === 0 || h[1].length <= level;
    return level === 0 && /^\s*(?:\*\*)?[A-Z][A-Z' ]{3,}\b(?![a-z])/.test(l);
  });
  return [lines[at], ...(end < 0 ? rest : rest.slice(0, end))].join("\n").trim();
}
const ORACLE = oracle();
if (ORACLE === null) die(`${args.packet}: no ORACLE section in the task`);
const archAt = packet.indexOf("ARCHITECTURE RULES (binding):");
const archEnd = packet.indexOf("\n\nSTANDING ORDERS (binding):");
const ARCH = archAt >= 0 ? packet.slice(archAt, archEnd > archAt ? archEnd : undefined).trim() : "ARCHITECTURE RULES: none in this packet.";
const proj = packet.slice(Math.max(0, packet.indexOf("\nPROJECT RULES:")));
const TESTS = proj.match(/^## Tests in isolation[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m)?.[0].trim() ?? "Tests in isolation: none in the project rules.";

// What a lens brief says about its range and body, read back from the packet's own brief.
const bodyOf = (lens) => briefs[lens].match(/Read (\S+) in full first/)?.[1] ?? die(`${args.packet}: the ${lens} brief names no body`);
const wt = briefs[required[0]].match(/\.\.HEAD in (\S+) and every deliverable/)?.[1] ?? die(`${args.packet}: the lens brief names no worktree`);
const crFile = packet.match(/review-file\.mjs --packet \S+ --init (\S+\.md)/)?.[1] ?? `${wt}/tmp/cr-<ticket>-<task>.md`;
const deliverables = briefs[required[0]].match(/every deliverable the task names: (.*?)\. Read-only/)?.[1] ?? "none";
const READ_ONLY = "Read-only: edit nothing, run nothing that writes.";

function deltaBrief(lens, label, what) {
  return `Lens: ${lens}. ${label}. Read ${bodyOf(lens)} in full first (again, if it has left your context), then review only ${args.since}..HEAD in ${wt}: ${what} The findings and earlier loops are in ${crFile}. For each finding the delta answers, check it is fixed at every site of its class; then look for what the delta newly lets through, in it and in every consumer of a value, default or rule it moves. Deliverables the delta touches, from: ${deliverables}. ${READ_ONLY}`;
}

const out = []; // [file key, brief, extras]
const extras = (lens) => (lens === "standards + spec" ? ["oracle", "arch"] : ["oracle"]);
if (args.probe) {
  if (!probeLine) die(`${args.packet}: this task gets no probe (rule 6 says why)`);
  out.push(["probe-probe", probeLine, ["oracle", "arch", "tests"]]);
} else if (args["fix-round"]) {
  out.push(["fix-round-standards-spec", deltaBrief("standards + spec", "Fix round after a review, delta review", "the commits answering the review's findings."), extras("standards + spec")]);
  if (probeLine && !args.class.length) die(`${args.packet}: this task gets a probe, so a fix round needs --class <finding class> for its targeted probe`);
  if (!probeLine && args.class.length) die(`${args.packet}: this task gets no probe, so --class has nothing to target`);
  if (probeLine) {
    const heads = probeLine.match(/^Probe, final loop, once\. ((?:Lens: [^.]+\. )+)/)?.[1] ?? "";
    const reads = probeLine.match(/Read (.+?) in full first/)?.[1] ?? die(`${args.packet}: the probe brief names no body`);
    const limits = probeLine.match(/(Run every attack yourself[\s\S]*)$/)?.[1] ?? die(`${args.packet}: the probe brief has no limits`);
    const classes = args.class.map((c) => `"${c}"`).join(", ");
    out.push(["fix-round-probe", `Probe, fix round, once, targeted. ${heads}Read ${reads} in full first, then attack only the finding class(es) ${classes} at HEAD: the fix range ${args.since}..HEAD in ${wt} and every site or input shape of each class the round lists in ${crFile}, in a throwaway copy under ${wt}/tmp/probe/; never edit ${wt}. ${limits}`, ["oracle", "arch", "tests"]]);
  }
} else if (loop === 1) {
  for (const lens of required) out.push([`loop1-${KEY[lens]}`, briefs[lens], extras(lens)]);
} else {
  const named = (args.lenses ?? "").split(",").map((l) => l.trim()).filter(Boolean);
  const ALIASES = { "standards+spec": "standards + spec", "blast-radius": "blast radius", "interrogate": "interrogate" };
  const chosen = new Set(["standards + spec"]);
  for (const n of named) {
    const lens = ALIASES[n];
    if (!lens) die(`unknown lens in --lenses: ${n} (known: ${Object.keys(ALIASES).join(", ")})`);
    if (!required.includes(lens)) die(`--lenses names ${n}, which this packet does not require`);
    chosen.add(lens);
  }
  for (const lens of required.filter((l) => chosen.has(l))) {
    out.push([`loop${loop}-${KEY[lens]}`, deltaBrief(lens, `Loop ${loop}, delta review`, "the fix commits since the previous loop."), extras(lens)]);
  }
}

const SECTION = {
  oracle: `The task's ORACLE section, verbatim from the packet:\n${ORACLE}`,
  arch: `The packet's ARCHITECTURE RULES section, verbatim:\n${ARCH}`,
  tests: `The PROJECT RULES on tests in isolation, verbatim:\n${TESTS}`,
};
mkdirSync(args["out-dir"], { recursive: true });
for (const [key, brief, add] of out) {
  const file = join(args["out-dir"], `${key}.txt`);
  writeFileSync(file, [brief, "Never read any .env file.", ...add.map((a) => SECTION[a])].join("\n\n") + "\n");
  console.log(file);
}
