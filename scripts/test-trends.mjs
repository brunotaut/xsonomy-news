// Offline tests for the trends maths and the weekly/monthly digest rendering.
// No network, no env, no Supabase. Run: node scripts/test-trends.mjs
import assert from "node:assert/strict";
import {
  tally, pctChange, compare, topBy, rising, newcomers, falling,
  themeTally, buildTrends, isoWeek, issueSlug, issueTitle,
} from "./lib/trends.mjs";
import { buildHtml, trendsHtml } from "./digest.mjs";

// --- counting ---------------------------------------------------------------
const t = tally(["DJI", "Anduril", "DJI", "", null, "DJI"]);
assert.equal(t.get("DJI"), 3, "counts repeats");
assert.equal(t.get("Anduril"), 1);
assert.equal(t.has(""), false, "skips empty names");
assert.equal(t.has(null), false, "skips null names");

assert.equal(pctChange(15, 10), 50, "+50%");
assert.equal(pctChange(5, 10), -50, "-50%");
assert.equal(pctChange(7, 0), null, "no previous = null, not Infinity");

// --- comparison -------------------------------------------------------------
const cur = tally(["A", "A", "A", "B", "B", "C", "D"]);
const prev = tally(["A", "B", "B", "B", "E"]);
const rows = compare(cur, prev);

const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
assert.equal(byName.A.change, 2, "A rose 1 -> 3");
assert.equal(byName.B.change, -1, "B fell 3 -> 2");
assert.equal(byName.C.isNew, true, "C is new");
assert.equal(byName.E, undefined, "E dropped to zero and is filtered by min=1");

assert.equal(compare(cur, prev, { min: 2 }).length, 2, "min filters one-offs (A and B only)");

assert.equal(topBy(rows, 2).map((r) => r.name).join(","), "A,B", "top by current count");
assert.equal(rising(rows).map((r) => r.name).join(","), "A", "rising excludes brand-new names");
assert.deepEqual(newcomers(rows).map((r) => r.name), ["C", "D"], "newcomers sorted then alphabetical");
assert.equal(falling(rows)[0].name, "B", "falling picks the decline");

// --- themes: curated tags only ---------------------------------------------
const items = [
  { tags: ["counter-uas", "news", "featured"], source: "Breaking Defense" },
  { tags: ["counter-uas", "ukraine"], source: "Militarnyi" },
  { tags: ["drone-news-feeds"], source: "DroneLife" },
];
const themes = themeTally(items);
assert.equal(themes.get("counter-uas"), 2);
assert.equal(themes.get("ukraine"), 1);
assert.equal(themes.has("news"), false, "raw outlet category ignored");
assert.equal(themes.has("featured"), false, "raw outlet category ignored");
assert.equal(themes.has("drone-news-feeds"), false, "raw outlet category ignored");

// --- full payload -----------------------------------------------------------
const trends = buildTrends(
  {
    items,
    companies: ["DJI", "DJI", "DJI", "Epirus", "Epirus", "Anduril", "Anduril", "Anduril"],
    products: ["Mavic 3", "Mavic 3"],
  },
  {
    items: [{ tags: ["counter-uas"], source: "DroneLife" }],
    companies: ["DJI", "Anduril", "Anduril", "Anduril", "Anduril", "Anduril"],
    products: [],
  }
);

assert.equal(trends.volume.current, 3);
assert.equal(trends.volume.previous, 1);
assert.equal(trends.volume.pct, 200, "3 vs 1 = +200%");
assert.equal(trends.companies.rising[0].name, "DJI", "DJI is the top climber");
assert.equal(trends.companies.newcomers[0].name, "Epirus", "Epirus is new (0 -> 2)");
assert.equal(trends.companies.falling[0].name, "Anduril", "Anduril fell 5 -> 3");

// A company that vanished entirely is the strongest decline, and must not be
// filtered out for having no mentions in the current period.
const vanished = buildTrends(
  { items: [], companies: ["Kept", "Kept"] },
  { items: [], companies: [...Array(9).fill("Joby Aviation"), "Kept"] }
);
assert.equal(vanished.companies.falling[0].name, "Joby Aviation", "9 -> 0 is the top faller");
assert.equal(vanished.companies.falling[0].current, 0);
assert.equal(vanished.companies.falling[0].change, -9);
assert.equal(trends.isEmpty, false);
assert.equal(buildTrends({ items: [] }, { items: [] }).isEmpty, true, "empty in, empty out");

// --- ISO weeks and issue ids ------------------------------------------------
assert.deepEqual(isoWeek(new Date("2026-01-01T00:00:00Z")), { year: 2026, week: 1 },
  "1 Jan 2026 is a Thursday, so ISO week 1");
assert.deepEqual(isoWeek(new Date("2021-01-01T00:00:00Z")), { year: 2020, week: 53 },
  "1 Jan 2021 belongs to ISO week 53 of 2020");
assert.deepEqual(isoWeek(new Date("2026-12-31T00:00:00Z")), { year: 2026, week: 53 },
  "a year starting Thursday has 53 weeks");

assert.equal(issueSlug("week", new Date("2026-09-05T00:00:00Z")), "2026-w36");
assert.equal(issueSlug("month", new Date("2026-09-01T07:00:00Z")), "2026-08",
  "a monthly issue sent on 1 Sep reports on August");
assert.equal(issueTitle("month", new Date("2026-09-01T07:00:00Z")), "August 2026");
assert.equal(issueTitle("week", new Date("2026-09-05T00:00:00Z")), "Week 36, 2026");
assert.equal(issueSlug("month", new Date("2026-01-01T07:00:00Z")), "2025-12",
  "January rolls back to December of the previous year");

// --- rendering --------------------------------------------------------------
const block = trendsHtml(trends, "week");
assert.ok(block.includes("The numbers"), "renders the heading");
assert.ok(block.includes("DJI"), "names the top mover");
assert.ok(block.includes("Epirus"), "names the newcomer");
assert.ok(block.includes("▲"), "up arrow for climbers");
assert.ok(block.includes("▼"), "down arrow for fallers");
assert.ok(block.includes("+200%"), "shows the volume change");
assert.equal(trendsHtml(null, "week"), "", "no trends = no block");
assert.equal(trendsHtml({ isEmpty: true }, "week"), "", "empty trends = no block");

const sample = [
  { url: "https://example.com/a", title: "Army awards C-UAS jammer contract", summary: "Counter-drone system.",
    source: "Breaking Defense", published_at: "2026-09-02T09:00:00Z", tags: ["counter-uas"] },
];

const monthly = buildHtml(sample, "month", { trends, issueTitle: "August 2026" });
assert.ok(monthly.includes("Monthly digest"), "monthly label");
assert.ok(monthly.includes("The numbers"), "monthly carries the trends block");
assert.ok(monthly.includes("August 2026"), "shows the issue title");

const capped = buildHtml(sample, "month", { trends, totalCount: 852, issueTitle: "August 2026" });
assert.ok(capped.includes("of 852 stories"), "says when the listing is only part of the period");
assert.ok(!buildHtml(sample, "month", { trends, totalCount: 1 }).includes("most recent of"),
  "no cap note when nothing was trimmed");

const daily = buildHtml(sample, "day");
assert.ok(daily.includes("Daily digest"), "daily label unchanged");
assert.ok(!daily.includes("The numbers"), "daily carries no trends block");

const web = buildHtml(sample, "week", {
  trends, forWeb: true, archiveUrl: "https://uav360.xyz/digest/2026-w36/", issueTitle: "Week 36, 2026",
});
assert.ok(web.includes("<title>"), "archive page has a title tag");
assert.ok(web.includes('rel="canonical"'), "archive page has a canonical link");
assert.ok(!web.includes("Unsubscribe"), "archive page has no unsubscribe furniture");

const mail = buildHtml(sample, "week", {
  trends, archiveUrl: "https://uav360.xyz/digest/2026-w36/", email: "a@b.com",
});
assert.ok(mail.includes("Read this issue on the web"), "email links to the archive copy");
assert.ok(mail.includes("Unsubscribe"), "email keeps the unsubscribe link");

assert.ok(!/undefined|NaN|\[object Object\]/.test(monthly + web + mail),
  "nothing leaked into the rendered output");

console.log("✓ all trends checks passed");
