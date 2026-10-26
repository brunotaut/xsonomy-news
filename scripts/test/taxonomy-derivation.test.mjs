// Guardrails for the derived-parent taxonomy.
//
// Each test is here because something specific went wrong, or would have. The
// one these exist to prevent: an audit counted stored mid-level parents as if
// they were capabilities and reported "111 unevidenced C-UAS leaves" when the
// real number was 10.

import test from "node:test";
import assert from "node:assert/strict";
import { buildTaxonomy, deriveEffectiveSectors, specificCapabilities, planAssignment } from "../lib/taxonomy.mjs";

// Mirrors the live shape, including the two parts that defeat slug matching:
// `cuas-integrated` is a leaf hanging straight off the root, and `cuas-detection`
// is a parent even though both start with "cuas-".
const SECTORS = [
  { id: "root", slug: "counter-uas", name: "Counter-UAS", kind: "domain", parent_id: null },
  { id: "det", slug: "cuas-detection", name: "C-UAS Detection", kind: "capability", parent_id: "root" },
  { id: "radar", slug: "cuas-det-radar", name: "Radar", kind: "cuas_capability", parent_id: "det" },
  { id: "rf", slug: "cuas-det-rf", name: "RF Detection", kind: "cuas_capability", parent_id: "det" },
  { id: "mit", slug: "cuas-mitigation", name: "C-UAS Mitigation", kind: "capability", parent_id: "root" },
  { id: "kinetic", slug: "cuas-def-kinetic", name: "Kinetic", kind: "cuas_capability", parent_id: "mit" },
  { id: "integrated", slug: "cuas-integrated", name: "Integrated C-UAS", kind: "cuas_capability", parent_id: "root" },
  { id: "uav", slug: "uav", name: "UAV", kind: "domain", parent_id: null },
  { id: "isr", slug: "uav-isr", name: "ISR UAV", kind: "uav_role", parent_id: "uav" },
];
const tax = buildTaxonomy(SECTORS);
const row = (sectorId, extra = {}) => ({ sectorId, sourceUrls: [], ...extra });

test("leaf-ness is structural, not a slug prefix", () => {
  // Both start with "cuas-"; only one is a capability.
  assert.equal(tax.isLeaf("integrated"), true, "cuas-integrated is a leaf despite sitting at the root");
  assert.equal(tax.isLeaf("det"), false, "cuas-detection is a parent despite the cuas- prefix");
  assert.equal(tax.isLeaf("radar"), true);
  // And the root of a different domain is not a C-UAS anything.
  assert.equal(tax.inSubtree("isr", "counter-uas"), false);
});

test("counting capabilities never counts a mid-level parent", () => {
  // The exact regression: a company with radar + a stored detection parent.
  const explicit = [row("radar"), row("det")];
  const caps = specificCapabilities(explicit, tax);
  assert.deepEqual(caps.map((c) => c.sectorId), ["radar"]);
  assert.equal(caps.length, 1, "a stored parent must not inflate the capability count");
});

test("an unevidenced parent of something already held is not stored", () => {
  const plan = planAssignment(row("det"), [row("radar")], tax);
  assert.equal(plan.store, false);
  assert.match(plan.reason, /implied/);
});

test("a leaf arriving later prunes the unevidenced parent already stored", () => {
  const plan = planAssignment(row("radar"), [row("det")], tax);
  assert.equal(plan.store, true);
  assert.deepEqual(plan.prune, ["det"], "the parent is now derivable and should go");
});

test("an evidenced broad-only assignment is stored and kept", () => {
  // AegisX and Phantom Defense: sourced as counter-UAS, no modality stated.
  // Forcing them into a leaf would invent a capability nobody evidenced.
  const plan = planAssignment(row("det", { sourceUrls: ["https://nato.int/x"] }), [], tax);
  assert.equal(plan.store, true);
  assert.equal(specificCapabilities([row("det", { sourceUrls: ["https://nato.int/x"] })], tax).length, 0,
    "a broad-only company contributes no specific capability");
});

test("an evidenced parent is not pruned when a leaf arrives", () => {
  // Milliray: NATO DIANA evidenced detection before the radar leaf existed.
  // Deleting that row to tidy the model would destroy a citation.
  const held = [row("det", { sourceUrls: ["https://nato.int/x"] })];
  assert.deepEqual(planAssignment(row("radar"), held, tax).prune, []);
  // Same protection for a parent that carries product links.
  const withProducts = [row("mit", { hasProducts: true })];
  assert.deepEqual(planAssignment(row("kinetic"), withProducts, tax).prune, []);
});

test("derived parents carry no evidence and name what implies them", () => {
  const eff = deriveEffectiveSectors([row("radar", { sourceUrls: ["https://example.com/radar"] })], tax);
  const det = eff.find((e) => e.sectorId === "det");
  const root = eff.find((e) => e.sectorId === "root");
  assert.equal(det.assignmentType, "derived");
  assert.equal(det.sourceUrls, null, "a derived parent must not borrow the leaf's evidence");
  assert.equal(det.confidence, null);
  assert.deepEqual(det.derivedFrom, ["radar"]);
  assert.equal(root.assignmentType, "derived", "derivation walks all the way up");
});

test("effective sectors list each sector once, explicit winning over derived", () => {
  const explicit = [row("radar"), row("kinetic"), row("det", { sourceUrls: ["https://nato.int/x"] })];
  const eff = deriveEffectiveSectors(explicit, tax);
  const ids = eff.map((e) => e.sectorId);
  assert.equal(new Set(ids).size, ids.length, "no sector appears twice");
  assert.equal(eff.find((e) => e.sectorId === "det").assignmentType, "explicit",
    "an asserted parent stays explicit even though a leaf would also imply it");
  assert.equal(eff.find((e) => e.sectorId === "mit").assignmentType, "derived");
  assert.deepEqual(new Set(ids), new Set(["radar", "kinetic", "det", "mit", "root"]));
});
