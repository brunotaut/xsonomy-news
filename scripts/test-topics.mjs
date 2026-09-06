// Offline tests for topic clustering and ranking. No network, no env.
// Fixtures are real headline patterns taken from the live feed.
// Run: node scripts/test-topics.mjs
import assert from "node:assert/strict";
import { similarity, rankTopics, companyReach } from "./lib/topics.mjs";
import { topicsHtml, buildHtml } from "./digest.mjs";

// --- similarity -------------------------------------------------------------
// Identical syndicated copy (this really is published verbatim by three outlets).
assert.equal(similarity("Tekever acquires Flowcopter following AR6 reveal",
                        "Tekever acquires Flowcopter following AR6 reveal"), 1, "identical = 1");

// Same story, independently worded — must still cluster.
assert.ok(similarity(
  "Terra Drone Begins Development of C-UAS System to Protect Critical Infrastructure in Peacetime",
  "Terra Drone to develop C-UAS system with interceptors for critical infrastructure") >= 0.42,
  "paraphrases of one story clear the threshold");

// Unrelated drone stories must NOT cluster, despite shared vocabulary.
assert.ok(similarity(
  "Wing Names New Engineering Leadership",
  "Textron wins Navy task orders for drone ISR services to support 7th Fleet") < 0.42,
  "unrelated stories stay apart");

assert.equal(similarity("", "anything"), 0, "empty title is not similar to anything");

// --- clustering and ranking -------------------------------------------------
const article = (title, source, companies = [], published_at = "2026-09-04T12:00:00Z") =>
  ({ title, source, companies, published_at, url: `https://example.com/${encodeURIComponent(title.slice(0, 20))}`, summary: "" });

const items = [
  // One story, three outlets, verbatim — should rank first.
  article("Tekever acquires Flowcopter following AR6 reveal", "Army Technology", ["Tekever", "Flowcopter"]),
  article("Tekever acquires Flowcopter following AR6 reveal", "Naval Technology", ["Tekever", "Flowcopter"]),
  article("Tekever acquires Flowcopter following AR6 reveal", "Airforce Technology", ["Tekever", "Flowcopter"]),
  // One story, two outlets, reworded.
  article("Terra Drone Begins Development of C-UAS System to Protect Critical Infrastructure in Peacetime", "sUAS News", ["Terra Drone"]),
  article("Terra Drone to develop C-UAS system with interceptors for critical infrastructure", "Unmanned Airspace", ["Terra Drone"]),
  // Single-outlet story about a company several outlets are covering.
  article("Anduril opens new production line", "DefenseScoop", ["Anduril"]),
  article("Anduril wins Army contract", "Breaking Defense", ["Anduril"]),
  article("Anduril partners with European supplier", "Naval News", ["Anduril"]),
  // Single-outlet story about nobody in particular — should rank last.
  article("A quiet note about airspace paperwork", "DroneLife", []),
];

const topics = rankTopics(items, { limit: 10 });

assert.equal(topics[0].title, "Tekever acquires Flowcopter following AR6 reveal", "3-outlet story ranks first");
assert.equal(topics[0].outlets, 3, "counts distinct outlets");
assert.equal(topics[0].articles.length, 3, "keeps every article in the cluster");
assert.equal(topics[0].reason, "3 outlets covered this", "explains why it ranked");
// Equal mention counts tie-break alphabetically, so the order is deterministic.
assert.deepEqual([...topics[0].companies].sort(), ["Flowcopter", "Tekever"], "names the companies involved");

assert.equal(topics[1].outlets, 2, "2-outlet story ranks second");
assert.ok(topics[1].title.startsWith("Terra Drone"), "and it is the Terra Drone story");

// The three separate Anduril stories are DIFFERENT stories: they must not merge.
const anduril = topics.filter((t) => t.companies.includes("Anduril"));
assert.equal(anduril.length, 3, "distinct stories about one company stay distinct");
assert.ok(anduril.every((t) => t.outlets === 1), "each is single-outlet");
assert.ok(anduril[0].reason.includes("Anduril"),
  "a single-outlet story is justified by the company's reach, not by outlet count");

assert.equal(topics[topics.length - 1].title, "A quiet note about airspace paperwork",
  "an isolated story with no notable company ranks last");
assert.equal(topics[topics.length - 1].reason, "single report");

// Ranking must not be a popularity contest on raw article count: DJI drew 32
// mentions from 2 outlets in the real data, Anduril 10 from 7. Outlets win.
const lopsided = [
  ...Array.from({ length: 6 }, (_, i) => article(`DJI story number ${i} about something`, "DroneXL", ["DJI"])),
  article("Epirus microwave weapon demonstrated at range", "Breaking Defense", ["Epirus"]),
  article("Epirus microwave weapon demonstrated at range", "DefenseScoop", ["Epirus"]),
];
const ranked = rankTopics(lopsided, { limit: 5 });
assert.equal(ranked[0].companies[0], "Epirus",
  "two outlets on one story beat six articles from a single outlet");

// --- second pass: one story told differently ---------------------------------
// Real pair from the live feed. Title similarity alone is 0.261 — below the
// 0.42 duplicate threshold — but they name the same (resolved) company, so the
// related-story pass must merge them.
const laser = [
  { ...article("U.S. Army awards AV $464.8 million laser weapon deal", "Defense News – Unmanned"),
    resolved_companies: ["AeroVironment"] },
  { ...article("Army awards AeroVironment nearly $500M contract for laser weapons", "Breaking Defense"),
    resolved_companies: ["AeroVironment"] },
];
const merged = rankTopics(laser, { limit: 5 });
assert.equal(merged.length, 1, "the same story reported twice is one topic");
assert.equal(merged[0].outlets, 2, "and it is credited to both outlets");

// The same pass must NOT collapse genuinely separate stories about one company.
const separate = [
  { ...article("After losses, Air Force pushes to replace Reaper faster", "DefenseScoop"),
    resolved_companies: ["Anduril"] },
  { ...article("Navy kicks off search for first increment of CCA drones", "Breaking Defense"),
    resolved_companies: ["Anduril"] },
];
assert.equal(rankTopics(separate, { limit: 5 }).length, 2,
  "different stories sharing a company stay separate");

// Resolved names win over the raw text array, so aliases do not double-count.
const aliased = rankTopics([
  { ...article("Terra Drone builds C-UAS interceptors", "sUAS News", ["Terra Drone Corporation", "Terra Drone"]),
    resolved_companies: ["Terra Drone"] },
], { limit: 1 });
assert.deepEqual(aliased[0].companies, ["Terra Drone"], "alias folded into one name");

// --- momentum ---------------------------------------------------------------
// Two single-outlet stories; the one about a firm whose coverage jumped wins.
const movers = [
  article("Steady prime announces routine milestone", "DroneLife", ["Lockheed Martin"]),
  article("Epirus microwave weapon clears Army test", "DefenseScoop", ["Epirus"]),
];
const boosted = rankTopics(movers, { limit: 2, momentum: new Map([["Epirus", 6]]) });
assert.equal(boosted[0].companies[0], "Epirus", "rising coverage outranks steady presence");
assert.equal(boosted[0].mover, "Epirus");
assert.ok(boosted[0].reason.includes("coverage up 6"), "explains the momentum in the reason");
assert.equal(boosted[1].mover, null, "the steady story has no mover");

// --- one outlet can never out-shout the industry -----------------------------
// A real backfill month had one feed publish 206 near-identically-titled items,
// which scored 21,600 and buried genuine three-outlet reporting at 3,408.
// However many pieces one outlet files, two outlets on a story must win.
const spam = Array.from({ length: 206 }, (_, i) =>
  article(`UAV Coach | Commercial UAV News ${i}`, "Commercial UAV News", ["Anduril"]));
const realStory = [
  article("Air Force selects General Atomics and Anduril for CCA production", "Breaking Defense", ["Anduril"]),
  article("Air Force selects General Atomics and Anduril for CCA production", "DefenseScoop", ["Anduril"]),
];
const mixed = rankTopics([...spam, ...realStory], { limit: 3 });
assert.equal(mixed[0].outlets, 2, "the two-outlet story ranks first");
assert.ok(mixed[0].title.startsWith("Air Force selects"), "and it is the real story");

// The related-story pass must not chain one outlet's boilerplate into a blob.
const sameOutlet = [
  { ...article("Army trials new counter-drone jammer", "DroneLife"), resolved_companies: ["Anduril"] },
  { ...article("Navy orders long-range reconnaissance drones", "DroneLife"), resolved_companies: ["Anduril"] },
];
assert.equal(rankTopics(sameOutlet, { limit: 5 }).length, 2,
  "two stories from ONE outlet sharing a company stay separate");

// --- reach ------------------------------------------------------------------
const reach = companyReach(items);
assert.equal(reach.get("Anduril"), 3, "Anduril appeared in three outlets");
assert.equal(reach.get("Tekever"), 3);

// --- limits and rendering ---------------------------------------------------
assert.equal(rankTopics(items, { limit: 2 }).length, 2, "limit is respected");
assert.deepEqual(rankTopics([], { limit: 10 }), [], "no articles, no topics");

const html = topicsHtml(topics.slice(0, 3), "week");
assert.ok(html.includes("Top 3 of the week"), "heading names the count");
assert.ok(html.includes("Ranked by how many outlets covered each story"), "explains the ranking");
assert.ok(html.includes("Tekever"), "names companies");
assert.ok(html.includes("Also in"), "credits the other outlets that covered it");
assert.equal(topicsHtml([], "week"), "", "no topics, no block");

const monthly = topicsHtml(topics.slice(0, 2), "month");
assert.ok(monthly.includes("Top 2 of the month"), "monthly heading");

// A roundup with topics must NOT fall back to dumping every headline.
const roundup = buildHtml(items, "week", { topics: topics.slice(0, 3), totalCount: 212 });
assert.ok(roundup.includes("212 stories, distilled to the 3 that mattered"), "says what was distilled");
assert.ok(!roundup.includes("A quiet note about airspace paperwork"),
  "stories outside the shortlist are not listed");
assert.ok(!/undefined|NaN|\[object Object\]/.test(roundup), "nothing leaked into the output");

// The daily digest keeps its original theme-grouped listing.
const daily = buildHtml(items.slice(0, 2), "day");
assert.ok(!daily.includes("of the week"), "daily has no topics block");

console.log("✓ all topic checks passed");
