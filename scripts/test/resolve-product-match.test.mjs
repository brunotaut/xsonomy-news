// Regression tests for matchProduct.
//
// WHY THIS FILE EXISTS. The daily scheduled pipeline failed every day from
// 2026-10-27 to 2026-11-01 — six consecutive runs — because `matchProduct`
// called an internal gate() with an identifier that is not one of its
// parameters:
//
//     export function matchProduct(tag, index) {
//       const hit = index.exact.get(tag.toLowerCase());
//       if (hit) return gate(tag, { id: hit, reason: "exact" }, index, context);
//                                                               ^^^^^^^ undeclared
//
// `ReferenceError: context is not defined`, thrown from the resolve step, which
// aborted the whole run. Build and deploy were `needs`-skipped behind it, so the
// daily site rebuild stopped too.
//
// It stayed hidden for two days because it only fires on a tag that BOTH matches
// an existing product name exactly AND is not already in tag_resolutions — a
// cached tag never reaches this function. The commit that introduced it
// (aaf7b6b, 2026-10-25) landed after that day's run; the first run to carry it
// was 2026-10-27, and every run after it failed.
//
// matchProduct had NO test coverage at all. One call with an exact hit would
// have caught it on the first run of the suite. That is this file.
//
//   node --test scripts/test/resolve-product-match.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { buildProductIndex, matchProduct } from "../lib/resolve.mjs";

const PRODUCTS = [
  { id: "p-tb2",    name: "Bayraktar TB2" },
  { id: "p-shahed", name: "Shahed-136" },
  { id: "p-ghost",  name: "Ghost Shark" },
  { id: "p-remus",  name: "REMUS 100" },
];
const INDEX = buildProductIndex(PRODUCTS);

test("an EXACT product-name match returns, and does not throw", () => {
  // The exact call that brought the pipeline down for six days.
  const m = matchProduct("Bayraktar TB2", INDEX);
  assert.deepEqual(m, { id: "p-tb2", reason: "exact" });
});

test("exact matching is case-insensitive", () => {
  for (const tag of ["bayraktar tb2", "BAYRAKTAR TB2", "Bayraktar Tb2"]) {
    assert.equal(matchProduct(tag, INDEX)?.id, "p-tb2", tag);
  }
});

test("the NORMALIZED branch still works and is reported as such", () => {
  const m = matchProduct("Shahed 136", INDEX);   // space instead of hyphen
  assert.equal(m?.id, "p-shahed");
  assert.equal(m?.reason, "normalized");
});

test("a genuine miss returns null rather than throwing", () => {
  assert.equal(matchProduct("Inspector 125", INDEX), null);
  assert.equal(matchProduct("", INDEX), null);
});

test("every product in the index is reachable by its own exact name", () => {
  // A loop, so adding a product to the fixture cannot leave a hole, and so a
  // throw anywhere in the exact path fails the suite rather than one case.
  for (const p of PRODUCTS) {
    const m = matchProduct(p.name, INDEX);
    assert.equal(m?.id, p.id, p.name);
  }
});

test("matchProduct takes exactly the arguments it uses", () => {
  // The defect was a reference to a name that was never a parameter. Calling
  // with the documented two arguments must be sufficient — if someone
  // reintroduces a third, this fails.
  assert.equal(matchProduct.length, 2, "signature is (tag, index)");
  assert.doesNotThrow(() => matchProduct("Ghost Shark", INDEX));
  assert.doesNotThrow(() => matchProduct("REMUS 100", INDEX));
});

test("a malformed index does not throw an undefined-variable error", () => {
  // Defensive: whatever goes wrong here should be about the data, not a typo in
  // the function body.
  assert.throws(() => matchProduct("x", {}), (e) => !(e instanceof ReferenceError),
    "a missing index member must not surface as a ReferenceError");
});
