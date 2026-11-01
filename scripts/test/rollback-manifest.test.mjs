// A rollback manifest is only worth having if its shape is safe. These tests pin down the
// two properties that mattered, against fixtures rather than production:
//
//   1. A delete scoped by DATE is wider than the batch it claims to reverse. That is not a
//      hypothetical: three passes wrote to these tables on 2026-11-01, so the date-scoped
//      delete in the first ledger would have removed 101 metric rows to undo 51.
//   2. A delete scoped by an explicit ID LIST touches exactly those rows, and reverting an
//      update needs a before-image that the manifest actually carries.
//
//   node --test scripts/test/rollback-manifest.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// a table as rows, and the two predicate shapes a rollback can use
const rows = [
  // the 00:00 pass
  { id: "a1", created: "2026-11-01T00:14:00Z", checked_at: "2026-11-01", batch: "earlier" },
  { id: "a2", created: "2026-11-01T00:15:00Z", checked_at: "2026-11-01", batch: "earlier" },
  // the 14:00 pass
  { id: "b1", created: "2026-11-01T14:38:00Z", checked_at: "2026-11-01", batch: "hubs" },
  // this batch
  { id: "c1", created: "2026-11-01T17:19:00Z", checked_at: "2026-11-01", batch: "mine" },
  { id: "c2", created: "2026-11-01T17:34:00Z", checked_at: "2026-11-01", batch: "mine" },
];
const byDate = (rs) => rs.filter((r) => r.checked_at === "2026-11-01" && r.created.startsWith("2026-11-01"));
const byIds = (rs, ids) => rs.filter((r) => ids.includes(r.id));

test("a date-scoped delete reaches other passes' rows", () => {
  const hit = byDate(rows);
  assert.equal(hit.length, 5, "the date predicate matches every row written that day");
  assert.ok(hit.some((r) => r.batch !== "mine"),
    "and that is the defect: it would delete rows this batch never created");
});

test("an id-scoped delete reaches exactly the batch", () => {
  const manifest = ["c1", "c2"];
  const hit = byIds(rows, manifest);
  assert.equal(hit.length, manifest.length, "expected affected-row count must match the manifest");
  assert.ok(hit.every((r) => r.batch === "mine"));
  // an id that is already gone must not make the count pass by accident
  assert.equal(byIds(rows, ["c1", "c2", "c3-never-existed"]).length, 2,
    "a manifest whose count does not match the rows found is a failed assertion, not a success");
});

test("reverting an update needs a before-image, and the manifest carries one", async () => {
  const md = await readFile(new URL("../../research-agent/imports/README-investor-rollback-manifest-2026-11-01.md",
    import.meta.url), "utf8");
  // the five re-typed metrics, each with the value to restore
  for (const [id, before] of [
    ["73fc025e-739c-4472-b015-790075232879", "manager_aum"],
    ["0f58d997-2207-4311-9b20-a4eed83f766c", "initial_investment_range"],
    ["e505f068-8ceb-4d36-ac9d-abf1cf61bcfc", "cumulative_capital_invested"],
    ["59ebaf8f-067e-4d71-a1a9-60fa7d6246a7", "investment_count"],
    ["fb2f357e-56e4-4118-ae8b-ebb309b2a10a", "fund_size_target"],
  ]) {
    assert.ok(md.includes(id), `${id} must be named in the manifest`);
    assert.ok(md.includes(before), `${id} needs its prior metric_type recorded`);
  }
  assert.match(md, /MITS bridge/);
  assert.match(md, /before-image: `null`/);
});

test("the manifest refuses to fake a rollback it cannot perform", async () => {
  const md = await readFile(new URL("../../research-agent/imports/README-investor-rollback-manifest-2026-11-01.md",
    import.meta.url), "utf8");
  assert.match(md, /AUTOMATIC ROLLBACK UNAVAILABLE/,
    "the six deleted unresolved rows lost their ids; saying so beats a broad delete");
  assert.match(md, /re-created by hand/);
  // and the dangerous shapes must not reappear anywhere in it
  assert.equal(/created_at::date\s*=\s*'2026-11-01'\s*;/.test(md), false,
    "no executable date-scoped delete may remain in the manifest");
});

test("the superseded ledger no longer carries a date-scoped delete", async () => {
  const md = await readFile(new URL("../../research-agent/reports/2026-11-02-investor-financial-ledger.md",
    import.meta.url), "utf8");
  for (const bad of ["delete from investor_financial_metrics where checked_at",
                     "delete from investor_companies where reviewed_at",
                     "delete from investor_fund_positions where reviewed_at",
                     "delete from investor_research_vehicles where created_at"])
    assert.equal(md.includes(bad), false, `the ledger must not still contain: ${bad}`);
  assert.match(md, /README-investor-rollback-manifest-2026-11-01\.md/,
    "it must point at the exact manifest instead");
});

test("the reversal order respects the foreign keys", async () => {
  const md = await readFile(new URL("../../research-agent/imports/README-investor-rollback-manifest-2026-11-01.md",
    import.meta.url), "utf8");
  // only the numbered list, not the prose above it that names the tables in FK order
  const section = md.slice(md.indexOf("## Reversal order"), md.indexOf("## 1. Inserted rows"));
  const order = section.slice(section.indexOf("Reverse in this order:"));
  // metrics and relationships reference vehicles, so vehicles must come after them
  assert.ok(order.indexOf("metrics") < order.indexOf("vehicles"));
  assert.ok(order.indexOf("relationships") < order.indexOf("vehicles"));
  // companies cascade to relationships, so the relationships must be deleted first
  assert.ok(order.indexOf("relationships") < order.indexOf("companies"));
  assert.match(md, /Delete the relationship rows above first/);
  // and the CHECK constraints come last, because the re-typings need the new vocabulary
  assert.match(md, /Restore the \*\*CHECK constraints last\*\*/);
});
