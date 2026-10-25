// Regression tests for article → company linking.
//
// Every case here comes from a false link that reached production. The rule the
// tests enforce: a short, generic or ordinary-language company name is never
// enough on its own — the article has to corroborate it.
//
//   node --test scripts/test/resolve-linking.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { buildCompanyIndex, matchCompany, isAmbiguousName } from "../lib/resolve.mjs";

const COMPANIES = [
  { id: "eos-ua",      name: "EOS",                   website: null,                      hq_country: "Ukraine" },
  { id: "up-innov",    name: "UP Innovations",        website: null,                      hq_country: "Ukraine" },
  { id: "mdsi-dk",     name: "MDSI",                  website: "https://www.mdsi.dk",     hq_country: "Denmark" },
  { id: "quantum-de",  name: "Quantum Systems",       website: "https://quantum-systems.com", hq_country: "Germany" },
  { id: "wingtra-ch",  name: "Wingtra",               website: "https://wingtra.com",     hq_country: "Switzerland" },
  { id: "tekever-pt",  name: "Tekever",               website: "https://www.tekever.com", hq_country: "Portugal" },
  { id: "airrobot-de", name: "AirRobot GmbH & Co. KG", website: "https://airrobot.com",   hq_country: "Germany" },
  { id: "sol-be",      name: "Sol.One",               website: "https://www.sol.one",     hq_country: "Belgium" },
];
const ALIASES = [{ company_id: "airrobot-de", alias: "AirRobot" }];
const INDEX = buildCompanyIndex(COMPANIES, ALIASES);
const ctx = (text, productTags = []) => ({ text, productTags });

test("short name alone is recognised as ambiguous", () => {
  for (const n of ["EOS", "MDSI", "ADS", "UP", "Orqa", "Rift"]) {
    assert.equal(isAmbiguousName(n), true, `${n} should be ambiguous`);
  }
  for (const n of ["Quantum Systems", "AirRobot GmbH & Co. KG", "Frankenburg Technologies"]) {
    assert.equal(isAmbiguousName(n), false, `${n} should be specific`);
  }
});

test("EOS: the production false positive is refused", () => {
  // Nine articles about Australia's EOS Defence Systems linked to a Ukrainian "EOS".
  const m = matchCompany("EOS", INDEX,
    ctx("MARSS signs GBP 370 million contract for Kuwait counter-drone defence"));
  assert.equal(m, null, "bare EOS must not link");
});

test("UP Innovations: the Upstate Medical false positive is refused", () => {
  const m = matchCompany("UP", INDEX,
    ctx("Upstate Medical Hires FAA Veteran Behind The First BVLOS Approvals"));
  assert.equal(m, null);
});

test("short acronym WITH product context links at medium confidence", () => {
  const withProduct = { ...INDEX, companies: COMPANIES.map(
    (c) => (c.id === "mdsi-dk" ? { ...c, productNames: ["Payload Integration Computer"] } : c)) };
  const m = matchCompany("MDSI", withProduct,
    ctx("Danish supplier ships payload computers", ["Payload Integration Computer"]));
  assert.ok(m, "should link when a product of that company is also named");
  assert.equal(m.confidence, "medium");
});

test("short acronym WITHOUT context does not link", () => {
  const m = matchCompany("MDSI", INDEX, ctx("Generic defence procurement roundup"));
  assert.equal(m, null);
});

test("short name corroborated by its own domain links", () => {
  const m = matchCompany("MDSI", INDEX, ctx("See mdsi.dk for the full specification"));
  assert.ok(m);
  assert.equal(m.confidence, "medium");
});

test("alias match on a specific name links at high confidence", () => {
  const m = matchCompany("AirRobot", INDEX, ctx("AirRobot unveils new AR-100 variant"));
  assert.ok(m);
  assert.equal(m.id, "airrobot-de");
});

test("long exact company name links at high confidence", () => {
  const m = matchCompany("Quantum Systems", INDEX, ctx("Quantum Systems raises a new round"));
  assert.ok(m);
  assert.equal(m.id, "quantum-de");
  assert.equal(m.confidence, "high");
});

test("a name shared across countries is not linked on the string alone", () => {
  // "Sol.One" cleans to a 6-character key, so it needs corroboration like any
  // other short name even though two real companies could carry it.
  const bare = matchCompany("Sol.One", INDEX, ctx("Sol.One announces a partnership"));
  assert.equal(bare, null);
  const withCountry = matchCompany("Sol.One", INDEX, ctx("Belgium-based Sol.One opens a Ghent plant"));
  assert.ok(withCountry, "country context should corroborate");
});

test("a product mentioned without its company does not link the company", () => {
  const m = matchCompany("Saboteur", INDEX, ctx("The Saboteur completed trials"));
  assert.equal(m, null, "product names are resolved separately, not as companies");
});

test("ambiguous uncorroborated tags are cacheable as refusals, not matches", () => {
  // The resolver caches this refusal so it is not retried per-article, and the
  // cache loader drops stale *matches* on ambiguous names so a deleted false
  // link cannot come back. Both halves are asserted by the shape of the gate.
  assert.equal(matchCompany("EOS", INDEX, ctx("unrelated story")), null);
  assert.equal(isAmbiguousName("EOS"), true);
});

test("a short name on an ESTABLISHED record still links; the bare directory record does not", () => {
  // Both tags are 3-4 characters. The difference is the record behind them:
  // one has a website and a product catalogue, the other has neither. This is
  // what separates "DJI" (real coverage) from the Ukrainian "EOS" (collision).
  const cos = [
    { id: "dji", name: "DJI", website: "https://www.dji.com", hq_country: "China",
      productNames: ["Mavic 3", "Matrice 350"] },
    { id: "eos-ua", name: "EOS", website: null, hq_country: "Ukraine", productNames: [] },
  ];
  const idx = buildCompanyIndex(cos, []);
  const established = matchCompany("DJI", idx, ctx("DJI opens a 3D heritage contest"));
  assert.ok(established, "an established short-named company may link");
  assert.equal(established.confidence, "medium");
  assert.equal(matchCompany("EOS", idx, ctx("MARSS signs Kuwait counter-drone contract")), null);
});

test("well-known short primes are not lost by the ambiguity guard", () => {
  const cos = [
    { id: "thales", name: "Thales", website: "https://www.thalesgroup.com", hq_country: "France", productNames: ["Ground Master 200"] },
    { id: "boeing", name: "Boeing", website: "https://www.boeing.com", hq_country: "United States", productNames: ["MQ-25"] },
    { id: "diehl",  name: "Diehl Defence", website: "https://www.diehl.com", hq_country: "Germany", productNames: ["IRIS-T"] },
  ];
  const idx = buildCompanyIndex(cos, []);
  for (const [tag, id] of [["Thales", "thales"], ["Boeing", "boeing"], ["Diehl Defence", "diehl"]]) {
    const m = matchCompany(tag, idx, ctx(`${tag} announced a new contract`));
    assert.ok(m, `${tag} must still link`);
    assert.equal(m.id, id);
  }
});
