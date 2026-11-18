#!/usr/bin/env node
// Turn a quota error's "reset after" value into the clock time it names, measured from the error's
// own timestamp and never from now (CHAIN.md → The delegation adapter, an L0 that hits a 429).
//   node reset-at.mjs "<reset after 45m42s>" --from <iso timestamp> [--tz <IANA zone>]
// --from is the moment the 429 was received (an ISO 8601 timestamp, a date, or epoch millis).
// --tz is the zone to print the local time in (default: the process zone, which TZ sets).
// The value is read out of whatever wording carries it: "reset after 45m42s", "resets in 1h30m",
// "retry after 90 seconds", "reset after 2026-11-23T09:54:00Z" (an absolute time is printed as it
// stands). Units: d, h, m, s, ms (and the long forms day, hour, minute, second); a bare number is
// seconds. Prints two lines, "UTC <iso>" and "local <iso> (<zone>)", then "epoch <ms>".
// Exits 2 on misuse: no --from, an unparseable timestamp, or a value with no duration or time in it.
const die = (m) => { console.error(`reset-at: ${m}`); process.exit(2); };

const argv = process.argv.slice(2);
let from;
let tz;
const words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--from" || a === "--tz") {
    const v = argv[++i];
    if (v === undefined || v.startsWith("--")) die(`${a} needs a value`);
    if (a === "--from") from = v; else tz = v;
  } else if (a.startsWith("--")) die(`unknown option ${a}`);
  else words.push(a);
}
if (!words.length) die('usage: reset-at.mjs "<reset after 45m42s>" --from <iso timestamp> [--tz <zone>]');
if (!from) die("--from <the 429's own timestamp> is required: never compute the reset from now");

const base = /^\d+$/.test(from) ? Number(from) : Date.parse(from);
if (!Number.isFinite(base)) die(`cannot read --from as a timestamp: ${from}`);

const text = words.join(" ");
// An absolute time in the value wins: the error already says when.
const absolute = text.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/)?.[0];
const UNIT = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, second: 1000, seconds: 1000, minute: 60000, minutes: 60000, hour: 3600000, hours: 3600000, day: 86400000, days: 86400000 };
let at;
if (absolute) {
  at = Date.parse(absolute.includes(" ") ? absolute.replace(" ", "T") : absolute);
  if (!Number.isFinite(at)) die(`cannot read the time in the value: ${absolute}`);
} else {
  // Compact and spaced forms both count: "45m42s", "1h 30m", "90 seconds".
  const parts = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|seconds?|minutes?|hours?|days?)(?![a-z])/gi)];
  let ms = 0;
  for (const [, n, u] of parts) ms += Number(n) * UNIT[u.toLowerCase()];
  if (!parts.length) {
    const bare = text.match(/\b(?:after|in)\s+(\d+)\b(?:\s*seconds?)?/i)?.[1];
    if (!bare) die(`no duration or time in the value: ${text}`);
    ms = Number(bare) * 1000;
  }
  at = base + ms;
}

const zone = tz ?? process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const iso = (t) => new Date(t).toISOString().replace(".000Z", "Z");
let local;
try {
  local = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, dateStyle: "short", timeStyle: "medium", hour12: false }).format(new Date(at)).replace(" ", "T");
} catch (e) {
  die(`unknown zone for --tz: ${zone}`);
}
console.log(`UTC ${iso(at)}`);
console.log(`local ${local} (${zone})`);
console.log(`epoch ${at}`);
