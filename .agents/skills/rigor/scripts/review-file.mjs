#!/usr/bin/env node
// Check an implementer's self-review file against the packet it was built from, or write its scaffold.
//   node review-file.mjs --packet <packet.md> <cr-file.md>
//   node review-file.mjs --packet <packet.md> --init <cr-file.md>
// --init writes the file's skeleton, so its shape is right by construction: a Loops section (one
// line per loop: range, lenses, act-on count), an Own runs section, one "## " heading per required
// lens in the packet's order with the ARCHITECTURE block (its items copied from the packet's rule 6,
// "<...>" placeholders and all) at the end of the standards + spec section, and a probe heading when
// the packet asks for one. The placeholders fail the check until they are filled. It refuses to
// overwrite a file (exit 2) and prints the path it wrote.
// The packet (mkpacket.mjs output) names the required lenses in rule 6 ("with these lenses: ...")
// and carries a "- Probe, final loop, once." brief when the task gets a probe. The self-review file
// must hold one markdown heading per required lens (its name anywhere in the heading text), a
// heading naming "probe" when the packet asks for one, and, after the standards + spec heading and
// before the next lens heading, a line starting "ARCHITECTURE" followed by the six items packet rule
// 6 lays out, each as "- <item>: <text>" with no "<...>" placeholder left.
// Prints one line per check: "lens <name> section:<yes|no>", "probe required:<yes|no>
// section:<yes|no|n/a>", "architecture block:<yes|no> missing:<items or none>". A failing block line
// adds what ended the standards section: `cut by:"<heading>" (line <n>)` or `cut by:end of file`,
// plus `ARCHITECTURE at line <n> falls outside` when the label sits past the cut. Exits 0 when every
// check passes, 1 when one does not, 2 on misuse.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const die = (m) => { console.error(`review-file: ${m}`); process.exit(2); };
const argv = process.argv.slice(2);
const at = argv.indexOf("--packet");
const packetPath = at >= 0 ? argv[at + 1] : undefined;
const init = argv.includes("--init");
const files = argv.filter((a, i) => !a.startsWith("--") && i !== at + 1);
const unknown = argv.filter((a) => a.startsWith("--") && !["--packet", "--init"].includes(a));
if (!packetPath || files.length !== 1 || unknown.length) die("usage: review-file.mjs --packet <packet.md> [--init] <cr-file.md>");
if (!existsSync(packetPath)) die(`no such file: ${packetPath}`);
if (init && existsSync(files[0])) die(`${files[0]} exists; --init never overwrites a self-review file`);
if (!init && !existsSync(files[0])) die(`no such file: ${files[0]}`);
const packet = readFileSync(packetPath, "utf8");

const NAMES = { "standards + spec": /standards\s*(\+|and)\s*spec/i, "blast radius": /blast[ -]radius/i, "interrogate": /interrogat/i };
const listed = packet.match(/with these\s+lenses: ([\s\S]*?)\.\s+(?:Before the first loop|Each loop starts)/);
if (!listed) die(`${packetPath}: no rule 6 lens list (not a packet from this pack's mkpacket.mjs?)`);
const lenses = [...listed[1].matchAll(/(standards \+ spec|blast radius|interrogate) \(/g)].map((m) => m[1]);
const probe = /^\s*- Probe, final loop, once\./m.test(packet);
const LABEL = /^\s*(?:#+\s*)?(?:\*\*)?ARCHITECTURE\b/;
const ITEMS = ["Deletion test", "Duplicated owners", "Shims left", "Single-implementation seams", "ADRs", "Lint/contract output"];

// The packet's ARCHITECTURE block lines, as rule 6 lays them out; the fixed items if it has none.
function archBlock() {
  const rules = packet.slice(Math.max(0, packet.indexOf("\nRULES:\n"))); // past the task's own ARCHITECTURE section
  const m = rules.match(/^[ \t]*ARCHITECTURE\n((?:[ \t]*- .*\n?)+)/m);
  const items = m ? m[1].split("\n").map((l) => l.trim()).filter(Boolean) : [];
  return items.length ? items : ITEMS.map((i) => `- ${i}: <fill from a read or a run>`);
}
const HEADINGS = { "standards + spec": "Standards + spec", "blast radius": "Blast radius", "interrogate": "Interrogate" };
if (init) {
  const parts = ["# Self-review", "", `Packet: ${packetPath}`, "", "## Loops", "",
    "- Loop 1: <task base>..<last commit>, lenses: all, act-on: <n>", "", "## Own runs", "",
    "<deleted-name greps and the touched tests run together, each command with its output, per loop>", ""];
  for (const lens of lenses) {
    parts.push(`## ${HEADINGS[lens]}`, "", "<per finding: class, proof, fixed / deferred / rejected with the reason; or none>", "");
    if (lens === "standards + spec") parts.push("ARCHITECTURE", ...archBlock(), "");
  }
  if (probe) parts.push("## Probe (final loop)", "", "<each attack: command and output; the rest listed as not run>", "");
  if (!existsSync(dirname(resolve(files[0])))) die(`no directory for ${files[0]}`);
  writeFileSync(files[0], parts.join("\n"));
  console.log(files[0]);
  process.exit(0);
}
const review = readFileSync(files[0], "utf8");
const lines = review.split("\n");
const headings = lines.map((l, i) => ({ i, m: l.match(/^#{1,6}\s+(.*)$/) })).filter((h) => h.m).map((h) => ({ i: h.i, text: h.m[1] }));
const lensOf = (text) => Object.keys(NAMES).find((n) => NAMES[n].test(text));
let ok = true;
const say = (line, pass) => { console.log(line); if (!pass) ok = false; };

for (const lens of lenses) {
  const has = headings.some((h) => NAMES[lens].test(h.text));
  say(`lens ${lens} section:${has ? "yes" : "no"}`, has);
}
const probeHas = headings.some((h) => /\bprobe\b/i.test(h.text));
say(`probe required:${probe ? "yes" : "no"} section:${probe ? (probeHas ? "yes" : "no") : "n/a"}`, !probe || probeHas);

// The ARCHITECTURE block: after the standards heading, before the next heading that names a lens
// or the probe (an "## ARCHITECTURE" heading of its own counts as inside).
const std = headings.find((h) => NAMES["standards + spec"].test(h.text));
let missing = ITEMS;
let cut = "";
if (std) {
  const next = headings.find((h) => h.i > std.i && (lensOf(h.text) || /\bprobe\b/i.test(h.text)));
  const span = lines.slice(std.i + 1, next ? next.i : lines.length);
  cut = next ? ` cut by:"${lines[next.i].trim()}" (line ${next.i + 1})` : " cut by:end of file";
  const later = next ? lines.findIndex((l, i) => i > next.i && LABEL.test(l)) : -1;
  if (later >= 0) cut += `; ARCHITECTURE at line ${later + 1} falls outside`;
  const label = span.findIndex((l) => LABEL.test(l));
  if (label >= 0) {
    const block = span.slice(label + 1);
    missing = ITEMS.filter((item) => !block.some((l) => {
      const m = l.match(/^\s*[-*]\s+(?:\*\*)?([^:*]+?)(?:\*\*)?:\s*(.*)$/);
      return m && m[1].trim().toLowerCase() === item.toLowerCase() && m[2].trim() && !/<[^>]+>/.test(m[2]);
    }));
  }
}
say(`architecture block:${missing.length ? "no" : "yes"} missing:${missing.length ? missing.join(", ") + cut : "none"}`, !missing.length);
process.exit(ok ? 0 : 1);
