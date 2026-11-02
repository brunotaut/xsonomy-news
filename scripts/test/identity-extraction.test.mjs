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
  OUTCOMES,
  decideIdentity,
  mergeEvidence,
  quoteSupports,
  mentionsName,
  makerFromEvidence,
  buildRetiredProductIndex,
  retiredMatch,
  normProductKey,
  SUPPLY_ONLY,
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
  // DELIBERATE REVERSAL. This assertion used to expect maker "Exail" from
  // "fournis par Exail" — supplied by Exail. Supplying a system is not building
  // it: a prime integrator, a reseller and a sustainment contractor all supply.
  // So the relationship is now reported as the `supply_only` cue, which assigns
  // no maker and routes the candidate to review. The product itself still
  // survives, which is what this counterexample exists to protect.
  assert.equal(product.maker, null, "supply is not manufacture, so no maker is assigned");
  assert.equal(
    makerRelationship("deux drones de surface Inspector 125 fournis par Exail", "Inspector 125", "Exail"),
    SUPPLY_ONLY,
    "but the relationship is recorded rather than discarded");
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

// --- rule 3 hardened: co-mention is not a relationship ------------------------
//
// The first version of rule 3 only required ONE span naming both sides. That is
// not enough, and it failed on the real article: given the dronexl passage as a
// single span, it accepted ALBACORE as Ghost Shark's maker. It had only
// appeared to work because a sentence splitter cut between the two names — luck,
// not a rule. These tests pin down the relationship requirement that replaced it.

import { makerRelationship, acronymOf } from "../lib/identity.mjs";

const DRONEXL_PASSAGE =
  "Australia got there first with a partner. Anduril's Ghost Shark went from concept to a " +
  "A$1.7 billion five-year contract with the Royal Australian Navy in roughly three years, " +
  "and the company opened a Sydney factory to build them. Albacore is aiming much smaller " +
  "and much cheaper, which is the entire argument for buying hundreds instead of dozens.";

test("THE REGRESSION: the real passage must not make Albacore the maker", () => {
  const d = decideIdentity({
    name: "Ghost Shark", kind: "product",
    quote: "Anduril's Ghost Shark went from concept to a",
    maker: "Albacore", makerQuote: DRONEXL_PASSAGE,
  }, DRONEXL_PASSAGE);
  assert.equal(d.maker, null, "both names in one span is not a maker relationship");
  assert.equal(d.outcome, OUTCOMES.CREATE, "the product itself is still fine");
});

test("the same passage DOES establish Anduril, from the possessive", () => {
  const d = decideIdentity({
    name: "Ghost Shark", kind: "product",
    quote: "Anduril's Ghost Shark went from concept to a",
    maker: "Anduril", makerQuote: DRONEXL_PASSAGE,
  }, DRONEXL_PASSAGE);
  assert.equal(d.maker, "Anduril");
});

test("negative: a customer is not a manufacturer", () => {
  for (const span of [
    "The Royal Australian Navy ordered the Ghost Shark",
    "Ghost Shark is operated by the Royal Australian Navy",
    "the Royal Australian Navy, the customer for Ghost Shark, confirmed delivery",
    "Ghost Shark was selected by the Royal Australian Navy",
  ]) {
    assert.equal(makerRelationship(span, "Ghost Shark", "Royal Australian Navy"), null, span);
  }
});

test("negative: a comparison or competitor is not a manufacturer", () => {
  for (const span of [
    "Albacore is aiming smaller than Anduril's Ghost Shark",
    "Anduril competitor Albacore builds a cheaper vehicle than Ghost Shark",
    "Unlike Ghost Shark, Albacore's design is expendable",
    "Ghost Shark versus Albacore: two approaches to undersea autonomy",
    "Ghost Shark, compared with Albacore's offering, is far larger",
  ]) {
    assert.equal(makerRelationship(span, "Ghost Shark", "Albacore"), null, span);
  }
});

test("negative: a partner or integrator is not stated as the manufacturer", () => {
  for (const span of [
    "Ghost Shark was developed alongside partner Albacore",
    "Ghost Shark, in collaboration with Albacore, completed trials",
    "Albacore teamed with the programme behind Ghost Shark",
  ]) {
    assert.equal(makerRelationship(span, "Ghost Shark", "Albacore"), null, span);
  }
});

test("negative: a competing manufacturer named in the same breath", () => {
  const span = "Boeing's Orca and Anduril's Ghost Shark are the two XL-AUVs in service";
  assert.equal(makerRelationship(span, "Ghost Shark", "Boeing"), null,
    "Boeing makes the other one");
  assert.equal(makerRelationship(span, "Ghost Shark", "Anduril"), "possessive");
  assert.equal(makerRelationship(span, "Orca", "Boeing"), "possessive");
});

test("positive cues, and each is labelled so a decision is auditable", () => {
  assert.equal(makerRelationship("Anduril's Ghost Shark completed trials", "Ghost Shark", "Anduril"), "possessive");
  assert.equal(makerRelationship("Albacore has been awarded a contract for its Ghostfin", "Ghostfin", "Albacore"), "possessive_its");
  assert.equal(makerRelationship("The Ghost Shark, built by Anduril, entered service", "Ghost Shark", "Anduril"), "made_by");
  assert.equal(makerRelationship("The Anduril Ghost Shark completed trials", "Ghost Shark", "Anduril"), "adjacent");
  assert.equal(makerRelationship("Baykar develops the Bayraktar TB2", "Bayraktar TB2", "Baykar"), "maker_verb");
});

test("distance matters: a maker mentioned far away is not the relationship", () => {
  const far = "Ghost Shark completed trials. " + "Filler text about procurement. ".repeat(6) + "Albacore raised a round.";
  assert.equal(makerRelationship(far, "Ghost Shark", "Albacore"), null);
});

test("the relationship rule is not English-only", () => {
  // The feed carries French, German and Italian sources. An English-only rule
  // would silently drop the maker for all of them — which a counterexample
  // caught when "fournis par Exail" started returning null.
  assert.ok(makerRelationship("deux drones de surface Inspector 125 fournis par Exail", "Inspector 125", "Exail"));
  assert.ok(makerRelationship("le chasseur de mines rMCM construit par Naval Group", "rMCM", "Naval Group"));
  assert.ok(makerRelationship("il drone Falco prodotto da Leonardo", "Falco", "Leonardo"));
  assert.ok(makerRelationship("die Drohne Luna von Rheinmetall gebaut", "Luna", "Rheinmetall"));
  assert.equal(makerRelationship("la Marine nationale a commandé le drone A-18M", "A-18M", "Marine nationale"), null,
    "a French customer is still not a maker");
});

// --- the retired guard: what it actually catches ------------------------------
//
// An earlier report implied the guard stopped any differently worded duplicate.
// It did not: collapsing punctuation does not equate an acronym with its
// expansion. These tests state the real boundary.

test("the key test catches punctuation and spacing variants only", () => {
  const ix = buildRetiredProductIndex([{ id: "r1", name: "MMCM", publication_status: "draft" }]);
  for (const n of ["MMCM", "M.M.C.M.", "mm cm", "m-m-c-m", "MMCM programme"]) {
    assert.equal(retiredMatch(n, ix).how, "key", n);
  }
});

test("an acronym's EXPANSION is now caught, and flagged as the weaker test", () => {
  const ix = buildRetiredProductIndex([{ id: "r1", name: "MMCM", publication_status: "draft" }]);
  const hit = retiredMatch("Maritime Mine Counter Measures", ix);
  assert.equal(hit.id, "r1");
  assert.equal(hit.how, "acronym", "plausible, not proven — belongs in review");
  assert.equal(retiredMatch("Maritime Mine Counter-Measures", ix).how, "acronym");
});

test("acronym matching works both ways and skips connectives either way", () => {
  assert.equal(acronymOf("MMCM", "Maritime Mine Counter Measures"), true);
  assert.equal(acronymOf("MOD", "Ministry of Defence"), true, "some acronyms keep the connective");
  assert.equal(acronymOf("MCM", "Mine Counter Measures"), true);
  assert.equal(acronymOf("TB2", "Bayraktar TB2"), false, "not an initialism");
  assert.equal(acronymOf("ABC", "Alpha Bravo"), false, "wrong length");
});

test("a LIMIT, stated: a phonetic acronym is not caught", () => {
  // XLUUV expands to "extra-large uncrewed undersea vehicle", whose initials are
  // ELUUV. The X is a sound. This rule catches true initialisms only, and
  // anything it misses still has to pass the `kind` rule, where a class term is
  // refused anyway.
  assert.equal(acronymOf("XLUUV", "Extra Large Uncrewed Undersea Vehicle"), false);
});

test("unrelated new products are not swept up by the acronym test", () => {
  const ix = buildRetiredProductIndex([
    { id: "r1", name: "MMCM", publication_status: "draft" },
    { id: "r2", name: "XLUUV", publication_status: "draft" },
  ]);
  for (const n of ["Inspector 125", "Bayraktar TB2", "Mine Counter Measures", "Ghost Shark"]) {
    assert.equal(retiredMatch(n, ix), null, n);
  }
});
