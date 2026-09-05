// Offline tests for the defence/counter-UAV relevance filter and the written
// lead. Fixtures are real headlines from the live feed.
// Run: node scripts/test-relevance.mjs
import assert from "node:assert/strict";
import {
  defenceScore, isDefenceRelevant, splitByRelevance,
  withoutConsumerCompanies, isConsumerCompany,
} from "./lib/relevance.mjs";
import { buildTrends, buildNarrative, MIN_OUTLETS_FOR_MOVER } from "./lib/trends.mjs";

const a = (title, tags = []) => ({ title, tags });

// --- clearly consumer: must be dropped --------------------------------------
const consumer = [
  a("Live from IFA: DJI unveils the Osmo 360 II"),
  a("GoPro CEO Promises 'More Cameras' After Merger, Names None"),
  a("GoPro MAX2 camera unlocks pro video tools in free update"),
  a("Cleveland Clinic's Drone Pharmacy Runs 20 Deliveries A Week"),
  a("A2Z Drone Delivery Launches Longtail Dual for BVLOS Urban Missions"),
  a("Skyports partners with prefecture on air taxi routes", ["evtol", "advanced-air-mobility"]),
];
for (const item of consumer) {
  assert.ok(!isDefenceRelevant(item), `should drop: ${item.title}`);
}

// --- defence stories with NO military wording: must be kept -----------------
// This is the case that broke a stricter first attempt. "Tekever acquires
// Flowcopter" was the most-covered story of a real week and contains no
// military vocabulary at all, so requiring positive military proof lost it.
const quietlyDefence = [
  a("Tekever acquires Flowcopter following AR6 reveal"),
  a("AEVEX, Divergent team up on new autonomous aircraft"),
  a("Quantum Systems Says CIA-Backed Fund Opened Its US Doors"),
  a("Ukrainian ground robot survives five FPV strikes, finishes mission"),
  a("BAE SYSTEMS to demonstrate capabilities and growing Polish presence at MSPO"),
];
for (const item of quietlyDefence) {
  assert.ok(isDefenceRelevant(item), `should keep: ${item.title}`);
}

// --- obviously military: kept, and scoring higher ---------------------------
const military = [
  a("Army awards AeroVironment nearly $500M contract for laser weapons", ["counter-uas"]),
  a("NATO tests British counter-drone system in Baltic exercise", ["counter-uas"]),
  a("German government blames Russia for Leipzig airport drone attack", ["critical-infra"]),
];
for (const item of military) assert.ok(defenceScore(item) >= 2, `strong signal: ${item.title}`);

// A theme tag outweighs incidental consumer wording in the headline.
assert.ok(isDefenceRelevant(a("Ukraine jams Russian camera drones on the front line", ["ukraine", "counter-uas"])),
  "core theme survives a consumer word in the title");

const { kept, dropped } = splitByRelevance([...consumer, ...quietlyDefence]);
assert.equal(dropped.length, consumer.length, "splits consumer out");
assert.equal(kept.length, quietlyDefence.length, "keeps the rest");

// --- consumer-only company suppression --------------------------------------
assert.ok(isConsumerCompany("GoPro"));
assert.ok(isConsumerCompany("Amazon"));
assert.ok(!isConsumerCompany("Anduril"));
// DJI is consumer-branded but central to counter-UAV, so it stays eligible.
assert.ok(!isConsumerCompany("DJI"), "DJI is not suppressed");
assert.deepEqual(withoutConsumerCompanies(["Anduril", "GoPro", "DJI", "Zipline"]),
  ["Anduril", "DJI"], "strips consumer-only names only");

// --- movers need outlet spread ----------------------------------------------
// One prolific publisher must not be able to manufacture a trend. DJI drew 32
// mentions from 2 outlets in a real week; Anduril 10 from 7.
const rep = (n, k) => Array.from({ length: k }, () => n);
const trends = buildTrends(
  {
    items: [{ tags: ["counter-uas"], source: "x" }],
    companies: [...rep("DJI", 32), ...rep("Anduril", 10)],
    companyOutlets: new Map([["DJI", 2], ["Anduril", 7]]),
  },
  {
    items: [{ tags: ["counter-uas"], source: "x" }],
    companies: [...rep("DJI", 25), ...rep("Anduril", 4)],
    companyOutlets: new Map([["DJI", 2], ["Anduril", 5]]),
  }
);
const moverNames = trends.companies.rising.map((r) => r.name);
assert.ok(moverNames.includes("Anduril"), "broadly covered firm is a mover");
assert.ok(!moverNames.includes("DJI"),
  `a firm covered by fewer than ${MIN_OUTLETS_FOR_MOVER} outlets is not a mover, however many mentions`);

// Without outlet data the filter is inert, so existing callers are unaffected.
const noOutlets = buildTrends(
  { items: [], companies: [...rep("DJI", 32)] },
  { items: [], companies: [...rep("DJI", 25)] }
);
assert.equal(noOutlets.companies.rising[0].name, "DJI", "no outlet data = no filtering");

// --- the written lead -------------------------------------------------------
const narrative = buildNarrative(trends, [
  { title: "Tekever acquires Flowcopter following AR6 reveal", outlets: 4 },
], "week");

assert.ok(narrative.length >= 2 && narrative.length <= 6, "a short paragraph, not an essay");
const text = narrative.join(" ");
assert.ok(text.includes("Counter-UAS led the week"), "opens with the dominant theme");
assert.ok(text.includes("Anduril"), "names who moved");
assert.ok(!text.includes("DJI"), "does not highlight a single-publisher firm");
assert.ok(text.includes("carried by 4 outlets"), "names the most-covered story");
assert.ok(/^[A-Z]/.test(text) && text.trim().endsWith("."), "reads as sentences");
assert.ok(!/undefined|NaN|\[object Object\]/.test(text), "no leaks");
assert.deepEqual(buildNarrative(null, [], "week"), [], "no trends, no lead");

console.log("✓ all relevance and narrative checks passed");
