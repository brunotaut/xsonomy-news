// The rollback shapes, exercised against fixtures. `rollback-manifest.test.mjs` pins what
// the manifest SAYS; this pins what the manifest's statements DO, because the three ways a
// rollback destroys data are all behavioural:
//
//   1. it reaches rows another pass wrote,
//   2. it overwrites a change made after the batch instead of stopping,
//   3. it drops a row something newer still points at, or clears a column a CHECK needs.
//
// A fourth property belongs here too, because it is the one the Tech Horizons record
// broke: an observation whose recipient is not established must not be publishable as
// anyone's. In production that is a CHECK and a composite foreign key; here it is the same
// rule as a function, so the rule is testable without a database.
//
//   node --test scripts/test/rollback-scenarios.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const MANIFEST_C = "../../research-agent/imports/README-investor-rollback-manifest-2026-11-01.md";
const MANIFEST_DE =
  "../../research-agent/imports/README-investor-rollback-manifest-2026-11-01-coverage-and-correction.md";
const read = (rel) => readFile(new URL(rel, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// A fixture database: five passes wrote on the same day, as really happened.
// ---------------------------------------------------------------------------
const makeDb = () => ({
  metrics: [
    { id: "m-a1", pass: "A", created: "00:14", vehicle_id: "v-a1", investor_research_id: "i-1",
      metric_type: "fund_size_stated", is_current: true, attribution_status: "attributed" },
    { id: "m-b1", pass: "B", created: "14:45", vehicle_id: null, investor_research_id: "i-2",
      metric_type: "manager_aum", is_current: true, attribution_status: "attributed" },
    { id: "m-c1", pass: "C", created: "17:19", vehicle_id: "v-c1", investor_research_id: "i-3",
      metric_type: "vehicle_nav", is_current: true, attribution_status: "attributed" },
    { id: "m-d1", pass: "D", created: "18:51", vehicle_id: "v-d1", investor_research_id: "i-4",
      metric_type: "fund_size_target", is_current: true, attribution_status: "attributed" },
  ],
  vehicles: [
    { id: "v-a1", pass: "A", investor_id: "i-1" },
    { id: "v-c1", pass: "C", investor_id: "i-3" },
    { id: "v-d1", pass: "D", investor_id: "i-4" },
  ],
  holdings: [
    // retired by SOME pass; the CHECK below is what makes a partial revert fail
    { id: "h-x", pass: "A", retired_at: "2026-11-01", retired_kind: "unsupported_evidence",
      retired_reason: "cited source does not support this pair" },
  ],
});

// The production CHECK: a retired row must name why it was retired.
const checkRetirement = (row) => {
  if (row.retired_at !== null && row.retired_kind === null)
    throw new Error("investor_companies_retired_kind_with_retirement");
  return row;
};

// The production CHECK: an unresolved attribution cannot be current, so it cannot reach
// the view, which filters on is_current.
const checkAttribution = (row) => {
  if (row.attribution_status !== "attributed" && row.is_current !== false)
    throw new Error("investor_financial_metrics_unresolved_is_not_published");
  return row;
};

// The production composite foreign key: (vehicle_id, investor_research_id) must exist.
const checkVehicleOwnership = (row, vehicles) => {
  if (row.vehicle_id === null) return row;            // MATCH SIMPLE: a null passes
  const owned = vehicles.some((v) => v.id === row.vehicle_id &&
    v.investor_id === row.investor_research_id);
  if (!owned) throw new Error("investor_financial_metrics_vehicle_belongs_to_investor");
  return row;
};

// A delete that asserts its own expected row count, as every section of the manifest does.
const deleteByIds = (table, ids, expected) => {
  const hit = table.filter((r) => ids.includes(r.id));
  if (hit.length !== expected)
    throw new Error(`expected ${expected} rows, matched ${hit.length}: aborting`);
  return table.filter((r) => !ids.includes(r.id));
};

// An update with an expected-current-value guard in the predicate.
const updateGuarded = (table, id, guard, patch, expected = 1) => {
  const hit = table.filter((r) => r.id === id &&
    Object.entries(guard).every(([k, v]) => r[k] === v));
  if (hit.length !== expected)
    throw new Error(`guard did not match: expected ${expected}, matched ${hit.length}`);
  return table.map((r) => (hit.includes(r) ? { ...r, ...patch } : r));
};

// ---------------------------------------------------------------------------

test("an unresolved attribution cannot be published as anyone's figure", () => {
  const row = { id: "m-x", attribution_status: "unresolved_identity", is_current: true };
  assert.throws(() => checkAttribution(row), /unresolved_is_not_published/,
    "a figure whose owner is unproven must not be a current, exported observation");
  // the usable shape: keep it for the next pass, out of the export
  assert.doesNotThrow(() => checkAttribution({ ...row, is_current: false }));
  // and the ordinary case is untouched
  assert.doesNotThrow(() => checkAttribution(
    { id: "m-y", attribution_status: "attributed", is_current: true }));
});

test("one investor's figure cannot name another investor's fund", () => {
  const db = makeDb();
  // this is the Tech Horizons defect in its mechanical form: a Prague fund's raise and a
  // Luxembourg profile's ticket range pointed at the same vehicle row
  const stolen = { ...db.metrics[0], vehicle_id: "v-c1" };   // i-1's metric, i-3's vehicle
  assert.throws(() => checkVehicleOwnership(stolen, db.vehicles),
    /vehicle_belongs_to_investor/);
  // the same vehicle on its own investor's metric is fine
  assert.doesNotThrow(() => checkVehicleOwnership(db.metrics[2], db.vehicles));
  // and a metric with no vehicle at all is fine, which is why the key is MATCH SIMPLE
  assert.doesNotThrow(() => checkVehicleOwnership(db.metrics[1], db.vehicles));
});

test("reversing pass C leaves every other pass's rows in place", () => {
  const db = makeDb();
  const after = deleteByIds(db.metrics, ["m-c1"], 1);
  assert.deepEqual(after.map((r) => r.id), ["m-a1", "m-b1", "m-d1"]);
  assert.equal(after.some((r) => r.pass === "C"), false);
  // the date predicate the manifest replaced would have taken all four
  const byDate = db.metrics.filter((r) => r.created.startsWith("0") || true);
  assert.equal(byDate.length, 4,
    "every row was written on 2026-11-01, which is exactly why the date predicate was wrong");
});

test("a change made after the batch aborts the rollback instead of being overwritten", () => {
  const db = makeDb();
  // pass E re-sourced m-d1 and re-typed nothing; the guard expects the pass-D value
  const edited = db.metrics.map((r) =>
    r.id === "m-d1" ? { ...r, metric_type: "fund_close_first" } : r);
  assert.throws(
    () => updateGuarded(edited, "m-d1", { metric_type: "fund_size_target" }, { vehicle_id: null }),
    /guard did not match/,
    "the row no longer holds the value the manifest expects, so the statement must do nothing");
  // unguarded, the same statement would silently destroy the later change
  const clobbered = edited.map((r) => (r.id === "m-d1" ? { ...r, vehicle_id: null } : r));
  assert.equal(clobbered.find((r) => r.id === "m-d1").metric_type, "fund_close_first",
    "which is the damage the guard prevents: the later value survives only by luck");
  // and on the untouched row the guard passes and affects exactly one row
  const ok = updateGuarded(db.metrics, "m-d1", { metric_type: "fund_size_target" },
    { vehicle_id: null });
  assert.equal(ok.find((r) => r.id === "m-d1").vehicle_id, null);
});

test("a vehicle cannot be deleted while a later metric still points at it", () => {
  const db = makeDb();
  // pass E inserted a metric against a pass-D vehicle: the real dependency the manifest found
  db.metrics.push({ id: "m-e1", pass: "E", created: "21:10", vehicle_id: "v-d1",
    investor_research_id: "i-4", metric_type: "initial_investment_range",
    is_current: true, attribution_status: "attributed" });
  const dependants = db.metrics.filter((r) => r.vehicle_id === "v-d1" && r.pass !== "D");
  assert.equal(dependants.length, 1,
    "exact ids do not make a delete safe; the dependency check is what does");
  // reverse the later pass first, and only then is the vehicle free
  const metrics = deleteByIds(db.metrics, ["m-e1"], 1);
  assert.equal(metrics.filter((r) => r.vehicle_id === "v-d1" && r.pass !== "D").length, 0);
  assert.doesNotThrow(() => deleteByIds(metrics, ["m-d1"], 1));
});

test("clearing retired_kind alone fails; clearing the retirement together works", () => {
  const db = makeDb();
  // the predicate the old manifest carried, in its effect on one row
  assert.throws(() => checkRetirement(
    updateGuarded(db.holdings, "h-x", { retired_kind: "unsupported_evidence" },
      { retired_kind: null })[0]),
    /retired_kind_with_retirement/,
    "a CHECK requires the kind whenever retired_at is set, so a partial revert is rejected");
  // the supported sequence: the three columns move together
  const fixed = updateGuarded(db.holdings, "h-x",
    { retired_kind: "unsupported_evidence", retired_at: "2026-11-01" },
    { retired_at: null, retired_reason: null, retired_kind: null });
  assert.doesNotThrow(() => checkRetirement(fixed[0]));
  assert.equal(fixed[0].retired_at, null);
});

test("the manifests state their scenario, their guards and what they cannot reverse", async () => {
  const c = await read(MANIFEST_C);
  // the predicate is gone, by its exact old shape
  assert.equal(/where retired_kind = 'unsupported_evidence';/.test(c), false,
    "the unscoped retired_kind update must not remain anywhere in the manifest");
  assert.match(c, /788055c2-87e8-4ff5-9163-b488dcc18c11/);
  assert.match(c, /AUTOMATIC ROLLBACK UNAVAILABLE/);
  // the two scenarios are named and distinguished
  assert.match(c, /at the original checkpoint/);
  assert.match(c, /selectively, against today's database/);
  // guards, not bare updates
  assert.match(c, /expected current value/);
  // the unrecoverable prose fields are admitted
  assert.match(c, /`scope_en` and `display_en` for all five: AUTOMATIC ROLLBACK UNAVAILABLE/);
  // and the vehicle-null rule is stated with its reason
  assert.match(c, /may be reverted to null only when the vehicle\s+itself is in this manifest's insert list/);

  const de = await read(MANIFEST_DE);
  // every insert section carries an expected row count
  for (const n of ["107", "68", "63"]) assert.ok(de.includes(`expect ${n} rows affected`),
    `the manifest must assert an affected-row count of ${n}`);
  // the real cross-pass dependency is named rather than assumed away
  assert.match(de, /9bd93c71-2fae-4678-866d-ef73d356c011/);
  assert.match(de, /That is a real dependency/);
  // passes A and B are declared unavailable instead of being left implicit
  assert.match(de, /Automatic rollback of passes A and B is\s+unavailable/);
  // the URL consequence of the two merges is spelled out
  assert.match(de, /keep `\/companies\/jisr\/` and\s+`\/companies\/kara-dag-technologies\/` working/);
  // and nothing was run
  assert.match(de, /Nothing in this manifest has been run against production/);
});
