// Shared by mkpacket.mjs and mkbrief.mjs: quote a skill file's section into a brief instead of
// pointing at the file, so the file stays the one owner of the text and no agent can skip reading it.
// A line of the exact form "INLINE: <path>#<Heading>" (path relative to a root; roots are tried in
// order) becomes "From <path> → <Heading> (source of truth; read the file for more):" and that
// heading's section, up to the next heading of the same or higher level (headings inside ``` fences
// do not count). An H1 heading therefore quotes the whole file. A missing file or heading calls die.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function sectionOf(text, heading) {
  const lines = text.split("\n");
  let fence = false;
  const heads = lines.map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return null; }
    const m = !fence && l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    return m ? { level: m[1].length, text: m[2] } : null;
  });
  const at = heads.findIndex((h) => h && h.text === heading);
  if (at < 0) return null;
  const end = heads.findIndex((h, i) => i > at && h && h.level <= heads[at].level);
  return lines.slice(at + 1, end < 0 ? lines.length : end).join("\n").trim();
}

export function expandInline(text, roots, die) {
  return text.split("\n").map((l) => {
    const m = l.match(/^INLINE: (\S[^#]*?)#(.+?)\s*$/);
    if (!m) return l;
    const [, path, heading] = m;
    const file = roots.map((r) => join(r, path)).find((f) => existsSync(f));
    if (!file) die(`INLINE: no file ${path} (heading "${heading}") under ${roots.join(", ")}`);
    const section = sectionOf(readFileSync(file, "utf8"), heading);
    if (section === null) die(`INLINE: no heading "${heading}" in ${path} (${file})`);
    return `From ${path} → ${heading} (source of truth; read the file for more):\n${section}`;
  }).join("\n");
}
