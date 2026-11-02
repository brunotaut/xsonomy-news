// Guardrails for the stale-derivation check.
//
// The defect it watches for: a `source='rule'` taxonomy row records its basis
// as `note='category=UAV'`, the product's category is later corrected, and the
// derived row survives asserting the old basis. Two live examples were found
// that way (Cassio S, DA 15-N.ISS).
//
// The thing it must NOT do: flag a product that legitimately holds more than
// one domain, or overrule an observed row because the category disagrees.
//
//   node --test scripts/test/derived-taxonomy.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import {
  derivedBasis, findStaleDerivations, multiDomainProducts, STALE_DERIVATION_SQL,
} from "../lib/derived-taxonomy.mjs";

const row = (o) => ({
  product_id: "p1", product_name: "Thing", category: "UAV",
  facet: "domain", option: "aerial-uav-uas", source: "rule", note: "category=UAV", ...o,
});

test("a stale derivation is flagged, with its basis named", () => {
  // Cassio S: derived when the category was UAV, category since corrected.
  const { stale } = findStaleDerivations([
    row({ product_id: "6fb1094b", product_name: "Cassio S", category: "Other" }),
  ]);
  assert.equal(stale.length, 1);
  assert.equal(stale[0].basis, "UAV");
  assert.match(stale[0].reason, /derived from category=UAV, product is now Other/);
});

test("a derivation whose basis still holds is not flagged", () => {
  const { stale } = findStaleDerivations([row({ category: "UAV" })]);
  assert.equal(stale.length, 0, "1,007 of the live rows are in exactly this state");
});

test("an OBSERVED row is never flagged, whatever the category says", () => {
  // An observed row is evidence. A category is not grounds to overrule it, and
  // treating it as such is how you delete research by accident.
  for (const source of ["web", "knowledge"]) {
    const { stale } = findStaleDerivations([
      row({ source, note: "Surface (USV). Confirmed against the maker's site.", category: "UAV" }),
    ]);
    assert.equal(stale.length, 0, source);
  }
});

test("a legitimate MULTI-DOMAIN product is not an inconsistency", () => {
  // HALIA is amphibious float-and-fly: a surface row AND an aerial row, both
  // observed, category correctly UAV. Nothing here may touch it.
  const halia = [
    row({ product_id: "4d80bcae", product_name: "HALIA", category: "UAV",
          option: "surface-usv", source: "web", note: "amphibious float-and-fly" }),
    row({ product_id: "4d80bcae", product_name: "HALIA", category: "UAV",
          option: "aerial-uav-uas", source: "web", note: "also retains aerial domain" }),
  ];
  assert.equal(findStaleDerivations(halia).stale.length, 0, "no row is derived");
  const multi = multiDomainProducts(halia);
  assert.equal(multi.length, 1);
  assert.deepEqual(multi[0].options, ["aerial-uav-uas", "surface-usv"]);
  assert.equal(multi[0].allObserved, true, "both rows are evidence, not derivations");
});

test("a multi-domain product can still have ONE stale derivation among its rows", () => {
  const mixed = [
    row({ product_id: "x", category: "Other", option: "surface-usv", source: "web", note: "observed" }),
    row({ product_id: "x", category: "Other", option: "aerial-uav-uas", source: "rule", note: "category=UAV" }),
  ];
  const { stale } = findStaleDerivations(mixed);
  assert.equal(stale.length, 1, "only the derived row");
  assert.equal(stale[0].option, "aerial-uav-uas");
  assert.equal(multiDomainProducts(mixed)[0].allObserved, false);
});

test("an unparseable rule note is reported, not silently passed", () => {
  const { stale, unparseable } = findStaleDerivations([row({ note: "seeded somehow" })]);
  assert.equal(stale.length, 0);
  assert.equal(unparseable.length, 1, "a rule row with no stated basis cannot be checked");
});

test("derivedBasis only reads a basis off a rule row", () => {
  assert.equal(derivedBasis(row({ note: "category=Sensor" })), "Sensor");
  assert.equal(derivedBasis(row({ source: "web", note: "category=UAV" })), null);
  assert.equal(derivedBasis(row({ note: "" })), null);
});

test("the SQL and the logic agree on what they select", () => {
  // Both must key on source='rule' and a note shaped `category=…`, and compare
  // it against the CURRENT category. If one drifts, this is the tripwire.
  assert.match(STALE_DERIVATION_SQL, /pt\.source = 'rule'/);
  assert.match(STALE_DERIVATION_SQL, /note ~ '\^category='/);
  assert.match(STALE_DERIVATION_SQL, /<> p\.category/);
  assert.doesNotMatch(STALE_DERIVATION_SQL, /\b(delete|update|insert)\b/i, "must stay read-only");
});
