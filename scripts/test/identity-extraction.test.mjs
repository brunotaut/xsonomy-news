// Regression tests for the extraction identity rules.
//
// Five bad catalogue rows in August 2026 all came through one path — the LLM
// gate, `decision=created, reason=llm` — and all five shared one cause: the
// gate decided what a name WAS from the name and some headlines, because the
// article body is never stored. These tests pin down the three rules that
// replace that, and the counterexamples that must keep working.
//
// Deliberately NOT a blacklist. Nothing below matches on "MMCM" or "XLUUV";
// the fixtures exercise rules that treat an unseen programme the same way.
//
//   node --test scripts/test/identity-extraction.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import {
  OUTCOMES, decideIdentity, mergeEvidence, quoteSupports, mentionsName,
  makerFromEvidence, buildRetiredProductIndex, retiredMatch, normProductKey,
} from "../lib/identity.mjs";

// --- real article text, close enough to the originals to be a fair test -------

const OPEX_MMCM = [
  "Guerre des Mines : Le ministere des armees commande davantage de drones navals.",
  "Le programme MMCM, mene par l'OCCAR pour le compte de la DGA et du ministere",
  "britannique de la Defense, a permis de livrer un premier systeme de guerre des",
  "mines a la Marine nationale en fevrier 2025. Le programme rMCM belgo-neerlandais",
  "porte quant a lui sur douze batiments. Thales conduit l'equipe industrielle.",
].join("\n");

const DRONEXL_GHOSTFIN = [
  "Navy Buys Attack Drone Subs Built in a Philly Marble Showroom.",
  "Albacore has been awarded a contract for its Ghostfin expeditionary drone",
  "submarine, assembled in a former marble showroom in Philadelphia. The company",
  "is one of several pursuing undersea autonomy; Australia's Ghost Shark programme",
  "has drawn attention to the extra-large end of the market.",
].join("\n");

const KONGSBERG_XLUUV = [
  "KONGSBERG and OCEANEERING Team Selected by US DoW to Support DIU CAMP Program.",
  "The team will support the Defense Innovation Unit's CAMP effort for XLUUV, the",
  "Navy's designation for extra-large uncrewed undersea vehicles above 84 inches",
  "in diameter. Boeing's Orca is the vehicle currently filling the class.",
].join("\n");

const ANDURIL_GHOST_SHARK = [
  "Australia expands Ghost Shark payload capabilities as Anduril ramps up deliveries.",
  "Anduril's Ghost Shark extra-large autonomous undersea vehicle will carry Altius 600",
  "loitering munitions and naval mines, the Royal Australian Navy confirmed.",
].join("\n");

// --- rule 1: positive classification -----------------------------------------

test("a programme named like a model is not created as a product", () => {
  for (const name of ["MMCM", "rMCM"]) {
    const d = decideIdentity(
      { name, kind: "programme", quote: "Le programme MMCM, mene par l'OCCAR pour le compte de la DGA" },
      OPEX_MMCM);
    assert.equal(d.outcome, OUTCOMES.REJECT, `${name} must not be created`);
    assert.equal(d.reason, "classified_programme");
  }
});

test("a class term is not created as a product", () => {
  const d = decideIdentity(
    { name: "XLUUV", kind: "class", quote: "the Navy's designation for extra-large uncrewed undersea vehicles" },
    KONGSBERG_XLUUV);
  assert.equal(d.outcome, OUTCOMES.REJECT);
  assert.equal(d.reason, "classified_class");
});

test("contracts, families and organisations are refused by the same rule", () => {
  for (const kind of ["contract", "family", "organisation"]) {
    const d = decideIdentity({ name: "Whatever", kind, quote: "a".repeat(40) }, "a".repeat(40));
    assert.equal(d.outcome, OUTCOMES.REJECT, kind);
    assert.equal(d.reason, `classified_${kind}`);
  }
});

test("the default is NOT a product: an absent or unrecognised kind is held, not published", () => {
  for (const kind of [undefined, null, "", "gizmo", "PRODUCTS"]) {
    const d = decideIdentity(
      { name: "Something", kind, quote: "Boeing's Orca is the vehicle currently filling the class" },
      KONGSBERG_XLUUV);
    assert.equal(d.outcome, OUTCOMES.REVIEW, `kind=${JSON.stringify(kind)}`);
    assert.equal(d.reason, "kind_missing_or_unrecognised");
  }
});

// --- rule 2: quote verification ----------------------------------------------

test("a product no source mentions is held for review, not created", () => {
  // Exail A27: the name appears in no source, so there is no span to find.
  const d = decideIdentity(
    { name: "Exail A27", kind: "product", quote: "Exail A27 autonomous underwater vehicle ordered by the French Navy" },
    OPEX_MMCM);
  assert.equal(d.outcome, OUTCOMES.REVIEW);
  assert.equal(d.reason, "mention_not_found_in_source");
  assert.equal(d.maker, null);
});

test("quote verification survives smart quotes and dashes but refuses a stub", () => {
  const body = 'The firm said the "Orca" XLUUV — its largest — had completed trials.';
  assert.equal(quoteSupports('the "Orca" XLUUV — its largest — had completed trials', body), true);
  assert.equal(quoteSupports('the “Orca” XLUUV - its largest', body), true);
  assert.equal(quoteSupports("Orca", body), false, "too short to evidence anything");
  assert.equal(quoteSupports("had completed sea trials in Norway", body), false, "not in the text");
});

test("no article text at all is a reason to review, never to trust", () => {
  const d = decideIdentity({ name: "Orca", kind: "product", quote: "x".repeat(40) }, "", { haveArticleText: false });
  assert.equal(d.outcome, OUTCOMES.REVIEW);
  assert.equal(d.reason, "no_article_text_to_verify");
});

// --- rule 3: joint evidence for ownership ------------------------------------

test("co-occurrence in one article does not make an ownership claim", () => {
  // The exact failure: Ghost Shark extracted from an article about Albacore's
  // Ghostfin. Both names are in the text. Neither span ties them together.
  const d = decideIdentity({
    name: "Ghost Shark",
    kind: "product",
    quote: "Australia's Ghost Shark programme has drawn attention to the extra-large end",
    maker: "Albacore",
    makerQuote: "Albacore has been awarded a contract for its Ghostfin expeditionary drone",
  }, DRONEXL_GHOSTFIN);
  assert.equal(d.outcome, OUTCOMES.CREATE, "the product itself is fine — it was mentioned");
  assert.equal(d.maker, null, "but the maker must be dropped");
  assert.equal(d.reason, "verified_no_maker_evidence");
});

test("a single span naming both sides DOES establish the maker", () => {
  const d = decideIdentity({
    name: "Ghost Shark",
    kind: "product",
    quote: "Anduril's Ghost Shark extra-large autonomous undersea vehicle will carry Altius 600",
    maker: "Anduril",
    makerQuote: "Anduril's Ghost Shark extra-large autonomous undersea vehicle will carry Altius 600",
  }, ANDURIL_GHOST_SHARK);
  assert.equal(d.outcome, OUTCOMES.CREATE);
  assert.equal(d.maker, "Anduril");
  assert.equal(d.reason, "verified_with_maker");
});

test("a maker quote that is not actually in the article is refused", () => {
  const maker = makerFromEvidence({
    name: "Ghost Shark", maker: "Anduril",
    makerQuote: "Anduril builds the Ghost Shark for the Royal Australian Navy",
  }, DRONEXL_GHOSTFIN);
  assert.equal(maker, null, "plausible, well-known, and still not in this source");
});

test("a weak corporate token cannot carry a maker match on its own", () => {
  assert.equal(mentionsName("the Systems integration work continues", "BAE Systems"), false);
  assert.equal(mentionsName("BAE delivered the vehicle", "BAE Systems"), true);
  assert.equal(mentionsName("Anduril's Ghost Shark", "Anduril Industries"), true,
    "a distinctive token still matches a longer official name");
});

// --- counterexamples: legitimate products must survive -----------------------

test("a real product named alongside a programme is still created", () => {
  const body = OPEX_MMCM +
    "\nChaque batiment embarque deux drones de surface Inspector 125 fournis par Exail.";
  const programme = decideIdentity(
    { name: "rMCM", kind: "programme", quote: "Le programme rMCM belgo-neerlandais" }, body);
  const product = decideIdentity({
    name: "Inspector 125", kind: "product",
    quote: "deux drones de surface Inspector 125 fournis par Exail",
    maker: "Exail",
    makerQuote: "deux drones de surface Inspector 125 fournis par Exail",
  }, body);
  assert.equal(programme.outcome, OUTCOMES.REJECT, "the programme is refused");
  assert.equal(product.outcome, OUTCOMES.CREATE, "the product beside it is not");
  assert.equal(product.maker, "Exail", "and keeps its evidenced maker");
});

test("an ordinary well-evidenced product is unaffected by any of this", () => {
  const body = "Baykar's Bayraktar TB2 has been exported to more than thirty countries.";
  const d = decideIdentity({
    name: "Bayraktar TB2", kind: "product",
    quote: "Baykar's Bayraktar TB2 has been exported to more than thirty countries",
    maker: "Baykar",
    makerQuote: "Baykar's Bayraktar TB2 has been exported to more than thirty countries",
  }, body);
  assert.deepEqual({ o: d.outcome, m: d.maker }, { o: OUTCOMES.CREATE, m: "Baykar" });
});

// --- disagreement between sources --------------------------------------------

test("sources that disagree about what a name is leave it unresolved, not decided by order", () => {
  const asProduct = { name: "MMCM", kind: "product", outcome: OUTCOMES.CREATE, reason: "verified_with_maker", maker: "Thales", articleUrl: "https://a" };
  const asProgramme = { name: "MMCM", kind: "programme", outcome: OUTCOMES.REJECT, reason: "classified_programme", maker: null, articleUrl: "https://b" };
  const ab = mergeEvidence(asProduct, asProgramme);
  const ba = mergeEvidence(asProgramme, asProduct);
  assert.equal(ab.outcome, OUTCOMES.REVIEW);
  assert.equal(ab.maker, null);
  assert.match(ab.reason, /sources_disagree/);
  assert.deepEqual([ab.outcome, ab.reason], [ba.outcome, ba.reason], "must be commutative");
});

test("two sources naming different makers publish neither", () => {
  const a = { name: "X", kind: "product", outcome: OUTCOMES.CREATE, reason: "verified_with_maker", maker: "Anduril", articleUrl: "https://a" };
  const b = { name: "X", kind: "product", outcome: OUTCOMES.CREATE, reason: "verified_with_maker", maker: "Albacore", articleUrl: "https://b" };
  const m = mergeEvidence(a, b);
  assert.equal(m.maker, null);
  assert.equal(m.outcome, OUTCOMES.REVIEW);
  assert.match(m.reason, /makers_disagree/);
  assert.deepEqual(mergeEvidence(b, a).reason, m.reason, "commutative");
});

test("agreeing sources keep the evidenced maker", () => {
  const a = { name: "X", kind: "product", outcome: OUTCOMES.CREATE, reason: "verified_with_maker", maker: "Anduril", articleUrl: "https://a" };
  const b = { name: "X", kind: "product", outcome: OUTCOMES.CREATE, reason: "verified_no_maker_evidence", maker: null, articleUrl: "https://b" };
  assert.equal(mergeEvidence(a, b).maker, "Anduril");
  assert.equal(mergeEvidence(b, a).maker, "Anduril");
});

// --- retired artefacts must not come back ------------------------------------

test("a retired artefact cannot be recreated, even under a differently worded name", () => {
  const products = [
    { id: "p-mmcm", name: "MMCM", publication_status: "draft" },
    { id: "p-live", name: "Bayraktar TB2", publication_status: "live" },
  ];
  const ix = buildRetiredProductIndex(products);
  assert.equal(ix.size, 1, "only non-live rows are protected");
  assert.equal(retiredMatch("MMCM", ix).id, "p-mmcm");
  assert.equal(retiredMatch("M.M.C.M.", ix).id, "p-mmcm", "punctuation variant");
  assert.equal(retiredMatch("m m c m", ix).id, "p-mmcm", "spacing variant");
  assert.equal(retiredMatch("Bayraktar TB2", ix), null, "a live product is not a retired artefact");
  assert.equal(retiredMatch("Inspector 125", ix), null, "an unrelated new product is free to be created");
});

test("the loose key collapses punctuation but keeps model numbers distinct", () => {
  assert.equal(normProductKey("A-18M"), normProductKey("a 18 m"));
  assert.notEqual(normProductKey("A-18M"), normProductKey("A27"));
  assert.notEqual(normProductKey("REMUS 100"), normProductKey("REMUS 130"));
});

test("an ordinary draft is still protected from duplication, which is the point", () => {
  // Not every non-live row is a retired artefact — some are simply unreviewed.
  // Either way, creating a SECOND row for the same name is wrong, so the guard
  // routes to review rather than silently making a duplicate.
  const ix = buildRetiredProductIndex([{ id: "d1", name: "Some New Drone", publication_status: "review" }]);
  assert.equal(retiredMatch("Some New Drone", ix).status, "review");
});

// --- the two bugs the counterexamples above caught, pinned down --------------
//
// Both were in the FIX, not the original pipeline, and both are the same class
// of error the fix exists to prevent. Worth their own tests so they cannot
// return quietly.

test("a similar name is not a match: Ghostfin must never satisfy Ghost Shark", () => {
  assert.equal(mentionsName("Albacore's Ghostfin drone submarine", "Ghost Shark"), false,
    "substring matching made these equal through the shared 'ghost'");
  assert.equal(mentionsName("Anduril's Ghost Shark XL-AUV", "Ghost Shark"), true);
  assert.equal(mentionsName("the Ghostfin was delivered", "Ghostfin"), true);
});

test("short real maker names still match; decoration still does not", () => {
  assert.equal(mentionsName("BAE delivered the vehicle", "BAE Systems"), true);
  assert.equal(mentionsName("MBDA confirmed the order", "MBDA Missile Systems"), true);
  assert.equal(mentionsName("the Systems integration work continues", "BAE Systems"), false);
  assert.equal(mentionsName("a group of engineers", "Rheinmetall Group"), false);
});

test("word boundaries do not break possessives or punctuation", () => {
  assert.equal(mentionsName("Anduril's Ghost Shark", "Anduril"), true);
  assert.equal(mentionsName("(Exail) supplied the vehicle", "Exail"), true);
  assert.equal(mentionsName("Exail-built vehicles", "Exail"), true);
  assert.equal(mentionsName("Exailed praise from the navy", "Exail"), false);
});
