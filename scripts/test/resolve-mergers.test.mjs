// Regression tests for the merged-away company policy.
//
// The defect: moving ECA Group's aliases to Exail was not enough. The retired
// record's own NAME stayed an exact key, so an article mentioning "ECA Group /
// Infotron" relinked to a draft company nobody can open — and which record won
// depended on the order the rows came back from the database.
//
// The policy these tests pin down:
//   * a company retired INTO another receives no new matches under its own name;
//   * where one unambiguous merger edge names a LIVE successor, the tag resolves
//     to that successor instead;
//   * a LIVE merged_with source is untouched — "EADS (now Airbus Defence and
//     Space)" is a published record and merged_with there is corporate history;
//   * an ordinary draft keeps whatever discovery behaviour it had;
//   * anything ambiguous, cyclic or missing a successor stays unresolved rather
//     than being decided by row order.
//
//   node --test scripts/test/resolve-mergers.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { buildCompanyIndex, matchCompany, buildSuccessorMap, AMBIGUOUS } from "../lib/resolve.mjs";

const live = (id, name, over = {}) =>
  ({ id, name, publication_status: "live", website: `https://${id}.example`, hq_country: "France", ...over });
const draft = (id, name, over = {}) =>
  ({ id, name, publication_status: "draft", website: null, hq_country: "France", ...over });

const merged = (src, tgt) => ({ source_company_id: src, target_company_id: tgt, type: "merged_with" });

// the real cluster, as the database holds it after the 2026-11-01 merge
const CLUSTER = {
  companies: [
    live("exail", "Exail"),
    draft("eca", "ECA Group / Infotron"),
    live("ixblue", "iXblue"),
    // a live merged_with source: history, not a retirement
    live("eads", "EADS (now Airbus Defence and Space)"),
    live("airbus-ds", "Airbus Defence and Space"),
    // an ordinary draft, never merged into anything
    live("front", "Front Ventures"),
    draft("abx", "ABX Dynamics"),
  ],
  aliases: [
    // the merge moved these two off the retired record and onto the survivor
    { company_id: "exail", alias: "ECA Group" },
    { company_id: "exail", alias: "Infotron" },
  ],
  relationships: [merged("eca", "exail"), merged("eads", "airbus-ds")],
};
const IDX = buildCompanyIndex(CLUSTER.companies, CLUSTER.aliases, CLUSTER.relationships);

test("ECA Group / Infotron, ECA Group and Infotron all resolve to Exail", () => {
  for (const tag of ["ECA Group / Infotron", "ECA Group", "Infotron"]) {
    const m = matchCompany(tag, IDX);
    assert.ok(m, `${tag} should resolve`);
    assert.equal(m.id, "exail", `${tag} must resolve to the live successor, not the retired draft`);
  }
  // and the retired record owns no key of its own any more
  assert.equal([...IDX.exact.values()].includes("eca"), false,
    "the retired draft must not be reachable through any exact key");
});

test("a live merged_with source keeps its own identity", () => {
  // EADS is published and has its own page; the edge records history, not retirement
  const m = matchCompany("EADS (now Airbus Defence and Space)", IDX);
  assert.equal(m?.id, "eads", "a live source must not be redirected to its successor");
  assert.equal(matchCompany("Airbus Defence and Space", IDX)?.id, "airbus-ds");
  assert.equal(buildSuccessorMap(CLUSTER.companies, CLUSTER.relationships).has("eads"), false,
    "a live source is not a retired company at all");
});

test("an ordinary unmerged draft still resolves, because discovery depends on it", () => {
  const m = matchCompany("ABX Dynamics", IDX);
  assert.equal(m?.id, "abx", "drafts are not blanket-excluded: only merged-away ones are");
});

test("a retired company with no live successor resolves to nothing", () => {
  const companies = [draft("old", "Obsolete Systems"), draft("newer", "Obsolete Systems Holding")];
  const idx = buildCompanyIndex(companies, [], [merged("old", "newer")]);
  assert.equal(matchCompany("Obsolete Systems", idx), null,
    "the successor is itself not live, so there is nowhere to send the tag");
  const map = buildSuccessorMap(companies, [merged("old", "newer")]);
  assert.deepEqual(map.get("old"), { unresolvable: true });
});

test("a retired company whose successor row is gone resolves to nothing", () => {
  const companies = [draft("old", "Vanished Systems")];
  const idx = buildCompanyIndex(companies, [], [merged("old", "a-row-that-is-not-here")]);
  assert.equal(matchCompany("Vanished Systems", idx), null);
  assert.deepEqual(buildSuccessorMap(companies, [merged("old", "gone")]).get("old"), { unresolvable: true });
});

test("a retired company with two live successors stays unresolved", () => {
  // the real DefSecIntel case: one composite draft merged into two live companies
  const companies = [
    draft("composite", "DefSecIntel · Origin Robotics"),
    live("defsec", "DefSecIntel Solutions"),
    live("origin", "Origin Robotics"),
  ];
  const rels = [merged("composite", "defsec"), merged("composite", "origin")];
  const idx = buildCompanyIndex(companies, [], rels);
  assert.equal(matchCompany("DefSecIntel · Origin Robotics", idx), null,
    "nothing picks between two successors, so the tag must not be awarded to either");
  assert.deepEqual(buildSuccessorMap(companies, rels).get("composite"), { ambiguous: true });
  // the two survivors are unaffected
  assert.equal(matchCompany("DefSecIntel Solutions", idx)?.id, "defsec");
  assert.equal(matchCompany("Origin Robotics", idx)?.id, "origin");
});

test("a merger chain walks through to the live company at the end", () => {
  const companies = [draft("a", "Alpha Systems"), draft("b", "Beta Systems"), live("c", "Gamma Systems")];
  const rels = [merged("a", "b"), merged("b", "c")];
  const idx = buildCompanyIndex(companies, [], rels);
  assert.equal(matchCompany("Alpha Systems", idx)?.id, "c", "A → B → C resolves to C");
  assert.equal(matchCompany("Beta Systems", idx)?.id, "c");
  assert.deepEqual(buildSuccessorMap(companies, rels).get("a"), { id: "c" });
});

test("a merger cycle terminates and resolves to nothing", () => {
  const companies = [draft("x", "Ouroboros Systems"), draft("y", "Ouroboros Holdings")];
  const rels = [merged("x", "y"), merged("y", "x")];
  // the real risk here is a hang, so the assertion is that this returns at all
  const map = buildSuccessorMap(companies, rels);
  assert.deepEqual(map.get("x"), { cycle: true });
  assert.deepEqual(map.get("y"), { cycle: true });
  const idx = buildCompanyIndex(companies, [], rels);
  assert.equal(matchCompany("Ouroboros Systems", idx), null);
  assert.equal(matchCompany("Ouroboros Holdings", idx), null);
});

test("a self-merge is ignored rather than treated as a retirement", () => {
  const companies = [live("self", "Self Referential Ltd")];
  assert.equal(buildSuccessorMap(companies, [merged("self", "self")]).size, 0);
  const idx = buildCompanyIndex(companies, [], [merged("self", "self")]);
  assert.equal(matchCompany("Self Referential Ltd", idx)?.id, "self");
});

test("a company's own name outranks another company's alias", () => {
  // the real KNDS case: "KNDS France" is an alias of KNDS and the name of KNDS France
  const companies = [live("knds", "KNDS"), live("knds-fr", "KNDS France")];
  const aliases = [{ company_id: "knds", alias: "KNDS France" }];
  // built in both orders: the answer must not depend on which row came back first
  for (const cos of [companies, [...companies].reverse()]) {
    const idx = buildCompanyIndex(cos, aliases, []);
    assert.equal(matchCompany("KNDS France", idx)?.id, "knds-fr",
      "the company of that name beats another company's alias, in either row order");
  }
});

test("two companies claiming one exact name is refused, not decided by row order", () => {
  const companies = [live("a1", "Helios Defence"), live("a2", "Helios Defence")];
  for (const cos of [companies, [...companies].reverse()]) {
    const idx = buildCompanyIndex(cos, [], []);
    assert.equal(idx.exact.get("helios defence"), AMBIGUOUS);
    assert.equal(matchCompany("Helios Defence", idx), null,
      "a genuine name collision goes to the LLM gate instead of a coin toss");
  }
});

test("two companies claiming one alias is refused as well", () => {
  const companies = [live("b1", "Northern Aero"), live("b2", "Southern Aero")];
  const aliases = [{ company_id: "b1", alias: "NSA Group" }, { company_id: "b2", alias: "NSA Group" }];
  const idx = buildCompanyIndex(companies, aliases, []);
  assert.equal(idx.exact.get("nsa group"), AMBIGUOUS);
  assert.equal(matchCompany("NSA Group", idx), null);
});

test("a missing publication_status changes nothing", () => {
  // a caller that forgets the column must not un-index the catalogue
  const companies = [{ id: "n1", name: "Nostatus Systems" }, { id: "n2", name: "Successor Systems" }];
  const idx = buildCompanyIndex(companies, [], [merged("n1", "n2")]);
  assert.equal(matchCompany("Nostatus Systems", idx)?.id, "n1");
  assert.equal(buildSuccessorMap(companies, [merged("n1", "n2")]).size, 0);
});

test("non-merger relationship types are not retirements", () => {
  const companies = [draft("sub", "Subsidiary Systems"), live("parent", "Parent Group")];
  for (const type of ["acquired_by", "subsidiary_of", "division_of", "jv_partner", "partner"]) {
    const rels = [{ source_company_id: "sub", target_company_id: "parent", type }];
    assert.equal(buildSuccessorMap(companies, rels).size, 0, `${type} must not retire a company`);
    assert.equal(matchCompany("Subsidiary Systems", buildCompanyIndex(companies, [], rels))?.id, "sub");
  }
});
