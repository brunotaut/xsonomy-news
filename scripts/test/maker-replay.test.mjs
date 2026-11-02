// The replay rewrites stored maker verdicts without calling the model. Its one
// dangerous power is removal, so these tests pin the asymmetry: it may add a
// maker from any span it has, but it may only take one away when the row stores
// the span that maker was decided from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { replayRow, replayEvidence } from "../replay-maker-rules.mjs";

const row = (o) => ({ name: "Ghost-X", kind: "product", outcome: "create",
  quote: "", maker: null, makerCue: null, makerClaimed: null,
  quotedFromBody: true, ...o });

test("a maker the old rules missed is recovered from the product quote", () => {
  const r = replayRow(row({
    name: "Black Widow", makerClaimed: "Teal Drones",
    quote: "Teal Drones builds 1,000 Black Widow units a month.",
  }));
  assert.equal(r.change, "add");
  assert.equal(r.maker, "Teal Drones");
  assert.ok(r.cue);
});

test("an existing maker is NOT cleared when the row stores no makerQuote", () => {
  // This is the 38-row case: accepted on a makerQuote that was never saved.
  // The product quote does not name the maker, so the replay sees nothing —
  // which is not evidence of absence.
  const r = replayRow(row({
    maker: "Anduril", makerClaimed: "Anduril", makerCue: "maker_verb",
    quote: "The Ghost-X flew for 75 minutes.",
  }));
  assert.equal(r.change, null);
  assert.equal(r.blocked, "no_maker_quote_stored");
});

test("an existing maker IS cleared when its own stored makerQuote now fails", () => {
  // The real Brave1 row: the span credits a *participant* of Brave1, which the
  // party guard added on 2026-11-02 now refuses.
  const r = replayRow(row({
    name: "Heavy Shot Ayudag-6", maker: "Brave1", makerClaimed: "Brave1",
    makerCue: "made_by",
    quote: "The Heavy Shot Ayudag-6 was shown this week.",
    makerQuote: "The Heavy Shot Ayudag-6 was built by a Brave1 participant.",
  }));
  assert.equal(r.change, "clear");
  assert.equal(r.maker, null);
  assert.equal(r.cue, "qualified_party");
});

test("a makerQuote that never names the product clears the maker with no cue", () => {
  // Nothing relates the two names, so there is no cue to record — but the row
  // does store the span the maker was decided from, so the removal is honest.
  const r = replayRow(row({
    name: "Heavy Shot Ayudag-6", maker: "Brave1", makerClaimed: "Brave1",
    makerCue: "made_by",
    makerQuote: "The drone was built by a Brave1 participant.",
  }));
  assert.equal(r.change, "clear");
  assert.equal(r.cue, null);
});

test("a makerQuote that still states the relationship keeps its maker", () => {
  const r = replayRow(row({
    maker: "Anduril", makerClaimed: "Anduril", makerCue: "maker_verb",
    quote: "The Ghost-X flew for 75 minutes.",
    makerQuote: "Anduril manufactures the Ghost-X at its Ohio plant.",
  }));
  assert.notEqual(r.change, "clear");
});

test("makerQuote is preferred over quote when both are present", () => {
  // The decision must be made from the span the model offered for the maker,
  // not from whichever span happens to read better.
  const r = replayRow(row({
    name: "Ghostfin", maker: null, makerClaimed: "Anduril",
    quote: "Anduril makes the Ghostfin.",                       // would pass
    makerQuote: "Unlike Anduril's Ghost Shark, the Ghostfin is smaller.",  // fails
  }));
  assert.equal(r.change, null);
});

test("a row the model never gave a maker for is left completely alone", () => {
  const r = replayRow(row({ quote: "The Ghost-X flew for 75 minutes." }));
  assert.equal(r.change, null);
});

test("the cue is corrected without disturbing an agreed maker", () => {
  const r = replayRow(row({
    name: "Black Widow", maker: "Teal Drones", makerClaimed: "Teal Drones",
    makerCue: "stale_cue_name",
    makerQuote: "Teal Drones builds 1,000 Black Widow units a month.",
  }));
  assert.equal(r.change, "cue");
  assert.equal(r.maker, "Teal Drones");
  assert.notEqual(r.cue, "stale_cue_name");
});

test("replayEvidence preserves every other field on the row", () => {
  const before = row({
    name: "Black Widow", kind: "product", outcome: "create",
    reason: "verified_no_maker_evidence", makerClaimed: "Teal Drones",
    quote: "Teal Drones builds 1,000 Black Widow units a month.",
    quotedFromBody: true,
  });
  const { next, changes } = replayEvidence([before]);
  assert.equal(changes.length, 1);
  const after = next[0];
  for (const k of ["name", "kind", "outcome", "reason", "quote", "makerClaimed", "quotedFromBody"]) {
    assert.deepEqual(after[k], before[k], `field ${k} must not change`);
  }
  assert.equal(after.maker, "Teal Drones");
});

test("an unchanged row is returned as the very same object", () => {
  // Cheap proof that a no-op replay cannot silently rewrite anything.
  const e = row({ quote: "The Ghost-X flew for 75 minutes." });
  const { next, changes } = replayEvidence([e]);
  assert.equal(next[0], e);
  assert.equal(changes.length, 0);
});
