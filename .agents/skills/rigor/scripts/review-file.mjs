#!/usr/bin/env node
// Check an implementer's self-review file against the packet it was built from.
//   node review-file.mjs --packet <packet.md> <cr-file.md>
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
import { readFileSync, existsSync } from "node:fs";

const die = (m) => { console.error(`review-file: ${m}`); process.exit(2); };
const argv = process.argv.slice(2);
const at = argv.indexOf("--packet");
const packetPath = at >= 0 ? argv[at + 1] : undefined;
const files = argv.filter((a, i) => !a.startsWith("--") && i !== at + 1);
if (!packetPath || files.length !== 1) die("usage: review-file.mjs --packet <packet.md> <cr-file.md>");
for (const p of [packetPath, files[0]]) if (!existsSync(p)) die(`no such file: ${p}`);
const packet = readFileSync(packetPath, "utf8");
const review = readFileSync(files[0], "utf8");

const NAMES = { "standards + spec": /standards\s*(\+|and)\s*spec/i, "blast radius": /blast[ -]radius/i, "interrogate": /interrogat/i };
const listed = packet.match(/with these\s+lenses: ([\s\S]*?)\.\s+(?:Before the first loop|Each loop starts)/);
if (!listed) die(`${packetPath}: no rule 6 lens list (not a packet from this pack's mkpacket.mjs?)`);
const lenses = [...listed[1].matchAll(/(standards \+ spec|blast radius|interrogate) \(/g)].map((m) => m[1]);
const probe = /^\s*- Probe, final loop, once\./m.test(packet);
const LABEL = /^\s*(?:#+\s*)?(?:\*\*)?ARCHITECTURE\b/;
const ITEMS = ["Deletion test", "Duplicated owners", "Shims left", "Single-implementation seams", "ADRs", "Lint/contract output"];

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
