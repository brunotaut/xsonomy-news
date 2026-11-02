// Regression tests for the failures the first production evaluation exposed
// (run 41438189153, commit cc2c6b8):
//
//   • an evidence-heavy French article came back "unparseable response"
//   • the XLUUV article yielded four products belonging to OTHER headlines
//   • that same article's body was truncated mid-quote by the word "comments:"
//   • eight manufacturer claims were dropped, including correct ones
//
// Each test below is one of those, plus the negative counterexamples that must
// keep failing. No network and no model calls.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  htmlToText, parseJsonDetailed, validateEntities, PARSE_FAILURES, BODY_FAILURES,
} from "../lib/analyze.mjs";
import { makerRelationship, isMakerCue, SUPPLY_ONLY } from "../lib/identity.mjs";
import { judge, AFFECTED } from "../eval-extraction.mjs";
import { OUTCOMES } from "../lib/identity.mjs";

// --- 1. parse failures must be distinguishable -------------------------------

test("a reply cut off at the token ceiling is reported as truncation, not bad JSON", () => {
  const partial = '{"companies":["Exail"],"products":["A-18M"],"evidence":[{"name":"A-18M","kind":"prod';
  const got = parseJsonDetailed(partial, { stopReason: "max_tokens" });
  assert.equal(got.failure, PARSE_FAILURES.TRUNCATED);
  assert.match(got.detail, /max_tokens/);
  assert.equal(got.value, undefined, "a truncated object is never handed back as data");
});

test("an unterminated object is truncation even when stop_reason is missing", () => {
  assert.equal(parseJsonDetailed('{"companies":[]').failure, PARSE_FAILURES.TRUNCATED);
});

test("genuinely malformed JSON is reported as invalid, not truncated", () => {
  assert.equal(parseJsonDetailed('{"companies": [,]}').failure, PARSE_FAILURES.INVALID_JSON);
});

test("prose with no object, and an empty reply, are their own failures", () => {
  assert.equal(parseJsonDetailed("I'm sorry, I can't help with that.").failure, PARSE_FAILURES.NO_OBJECT);
  assert.equal(parseJsonDetailed("").failure, PARSE_FAILURES.EMPTY);
  assert.equal(parseJsonDetailed("   ").failure, PARSE_FAILURES.EMPTY);
});

test("a fenced reply still parses", () => {
  const got = parseJsonDetailed('```json\n{"companies":[],"products":[]}\n```');
  assert.deepEqual(got.value, { companies: [], products: [] });
});

test("a well-formed reply of the wrong shape is a schema violation, not an empty success", () => {
  assert.deepEqual(validateEntities({ companies: [], products: [] }), []);
  assert.deepEqual(validateEntities({ companies: [] }), ["products is missing"]);
  assert.deepEqual(validateEntities({ companies: {}, products: [] }), ["companies is not an array"]);
  assert.deepEqual(validateEntities(null), ["reply is not a JSON object"]);
  assert.deepEqual(validateEntities([]), ["reply is not a JSON object"]);
  assert.deepEqual(validateEntities({ companies: [], products: [], evidence: "x" }), ["evidence is not an array"]);
});

// --- 2. article-body selection ----------------------------------------------

// The shape that broke: a leading rail of other headlines, the story inside a
// single <article> whose opening tag sits inside a junk-classed <div>, and a
// nested <div> so the junk strip's non-greedy close lands in the wrong place.
const RAIL_PAGE = `<!doctype html><html><head><title>Story – Mag</title></head><body>
<div class="latest-posts">
  <a href="/a">DroneShield Completes Acceptance of DroneSentry-X Mk2</a>
  <a href="/b">Rheinmetall ships Mission Master SP</a>
  <a href="/c">FUSE and Chaparral selected</a>
  <div class="inner-wrap">
    <article class="post">
      <h1>KONGSBERG and OCEANEERING Team Selected for XLUUV</h1>
      <p>KONGSBERG and Oceaneering announced their selection by the Defense Innovation
      Unit to support the CAMP program, focused on an Extra-Large Uncrewed Undersea
      Vehicle (XLUUV) for future Navy missions. The program accelerates transition of
      mature commercial technologies into operational naval capabilities.</p>
      <p>Bill Merz, Senior Vice President of Aerospace and Defense Technologies for
      OCEANEERING, comments: "We are pleased to partner with KONGSBERG on this
      important initiative, combining advanced undersea technologies."</p>
      <p>The design is expected to be delivered in the third quarter of this year.</p>
    </article>
  </div>
</div>
<div class="related"><a href="/x">More in Drones</a></div>
</body></html>`;

test("a leading headline rail does not leak into the article body", () => {
  const text = htmlToText(RAIL_PAGE);
  assert.ok(text.includes("XLUUV"), "the real subject survives");
  for (const stray of ["DroneSentry", "Mission Master", "FUSE", "Chaparral"]) {
    assert.ok(!text.includes(stray), `${stray} belongs to another headline and must not appear`);
  }
});

test("the word 'comments:' in a quote no longer truncates the article", () => {
  const text = htmlToText(RAIL_PAGE);
  assert.ok(text.includes("comments:"), "the sentence itself is kept");
  assert.ok(text.includes("third quarter"),
    "and so is everything after it — this is the half of the body that used to be discarded");
});

test("a boilerplate marker IS still honoured when it starts a line", () => {
  const page = `<html><body><article><p>${"Real body text about a drone. ".repeat(20)}</p>
    <h2>Related Articles</h2><p>Some other drone called Phantom Nine.</p></article></body></html>`;
  const text = htmlToText(page);
  assert.ok(text.includes("Real body text"));
  assert.ok(!text.includes("Phantom Nine"), "the related rail is still cut");
});

test("several <article> elements pick the longest, not the first teaser", () => {
  const page = `<html><body>
    <article><h2>Teaser about Bayraktar TB2</h2></article>
    <article><h1>The actual story</h1><p>${"Substantive body about the Ghostfin vehicle. ".repeat(12)}</p></article>
  </body></html>`;
  const text = htmlToText(page);
  assert.ok(text.includes("Ghostfin"));
  assert.ok(!text.includes("Bayraktar"), "the teaser article is not the story");
});

test("body failure kinds are distinct values", () => {
  assert.deepEqual(
    Object.values(BODY_FAILURES).sort(),
    ["body_mismatch", "body_too_short", "fetch_failed"],
  );
});

// --- 3. manufacturer attribution: the observed drops ------------------------

test("manufacturer relationships that ARE stated are now kept", () => {
  const kept = [
    ["Kongsberg, which builds the Protector RWS, said", "Protector", "Kongsberg"],
    ["the Protector, a product of Kongsberg", "Protector", "Kongsberg"],
    ["the MQ-9, a General Atomics aircraft", "MQ-9", "General Atomics"],
    ["Anduril said its Ghost Shark had completed trials", "Ghost Shark", "Anduril"],
    ["the Ghost Shark, an Anduril design", "Ghost Shark", "Anduril"],
    ["Anduril is the manufacturer of Ghost Shark", "Ghost Shark", "Anduril"],
    ["Ghost Shark is an Anduril product", "Ghost Shark", "Anduril"],
    ["Anduril-built Ghost Shark", "Ghost Shark", "Anduril"],
    ["Anduril-made Ghost Shark", "Ghost Shark", "Anduril"],
    ["the TB2, built and supplied by Baykar", "TB2", "Baykar"],
    ["the TB2, supplied and built by Baykar", "TB2", "Baykar"],
  ];
  for (const [span, product, maker] of kept) {
    const cue = makerRelationship(span, product, maker);
    assert.ok(isMakerCue(cue), `expected a maker cue for: ${span} (got ${cue})`);
  }
});

test("Ghost Shark takes Anduril from this article and never Albacore", () => {
  const span = "Anduril's Ghost Shark went from concept to a five-year contract with the Royal Australian Navy";
  assert.equal(makerRelationship(span, "Ghost Shark", "Anduril"), "possessive");
  assert.equal(makerRelationship(span, "Ghost Shark", "Albacore"), null);
});

test("the three Ghostfin/Albacore spans in the real article state no manufacture", () => {
  // Inspected from the published article. Albacore does build Ghostfin, but
  // this article only says so across sentences, so one-span evidence finds
  // nothing — and must not invent it.
  const spans = [
    "Albacore publishes Ghostfin's numbers: a 102-inch base length, a 12.75-inch outer diameter",
    "including the battery design Albacore credits for the range, which the company says gives Ghostfin ten times the transit distance",
    "Albacore names coastal defense of an island like Taiwan as its lead use case",
  ];
  for (const s of spans) {
    assert.equal(makerRelationship(s, "Ghostfin", "Albacore"), null, s);
  }
});

test("customers, operators, competitors, partners and integrators are still refused", () => {
  const refused = [
    ["the Navy ordered Albacore's rival Ghostfin", "Ghostfin", "Navy"],
    ["unlike Anduril's Ghost Shark, the Ghostfin is smaller", "Ghostfin", "Anduril"],
    ["Boeing's Orca and Anduril's Ghost Shark", "Ghost Shark", "Boeing"],
    ["the Royal Australian Navy operates Ghost Shark", "Ghost Shark", "Royal Australian Navy"],
    ["Ghost Shark competes with Boeing's Orca", "Ghost Shark", "Boeing"],
    ["Leonardo partnered with Baykar on the TB2", "TB2", "Leonardo"],
    ["the Ghostfin was selected by the US Navy", "Ghostfin", "US Navy"],
    ["Albacore intends to build 75 vehicles a year", "Ghostfin", "Albacore"],
    ["Thales supplies the sonar for the A-18M", "A-18M", "Thales"],
  ];
  for (const [span, product, maker] of refused) {
    assert.equal(makerRelationship(span, product, maker), null, span);
  }
});

test("supply is reported as supply, in every language, and is not manufacture", () => {
  const supplied = [
    ["deux drones de surface Inspector 125 fournis par Exail", "Inspector 125", "Exail"],
    ["the A-18M, supplied by Exail", "A-18M", "Exail"],
    ["the Ghostfin, delivered by Albacore", "Ghostfin", "Albacore"],
    ["Thales supplies the Searchmaster", "Searchmaster", "Thales"],
    ["das System wurde von Rheinmetall geliefert", "System", "Rheinmetall"],
    ["il sistema fornito da Leonardo", "sistema", "Leonardo"],
  ];
  for (const [span, product, maker] of supplied) {
    const cue = makerRelationship(span, product, maker);
    assert.equal(cue, SUPPLY_ONLY, span);
    assert.equal(isMakerCue(cue), false, "supply alone must not assign a maker");
  }
});

test("German decides from the participle after the name, and bare 'von' decides nothing", () => {
  assert.equal(makerRelationship("das System wurde von Rheinmetall gebaut", "System", "Rheinmetall"), "made_by");
  assert.equal(makerRelationship("das System wurde von Rheinmetall geliefert", "System", "Rheinmetall"), SUPPLY_ONLY);
  assert.equal(makerRelationship("ein Bericht von Rheinmetall erwähnt das System", "System", "Rheinmetall"), null);
});

// --- 4. the evaluation's own verdicts ---------------------------------------

const ev = (over = {}) => ({
  name: "Ghost Shark", kind: "product", outcome: OUTCOMES.CREATE,
  reason: "ok", maker: null, makerClaimed: null, makerCue: null, ...over,
});

test("a correct maker passes; the historical wrong maker fails", () => {
  const exp = { name: "Ghost Shark", want: "maker", maker: "Anduril", notMaker: "Albacore" };
  assert.equal(judge(exp, { evidence: [ev({ maker: "Anduril", makerCue: "possessive" })] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ maker: "Albacore", makerCue: "adjacent" })] }).verdict, "FAIL");
});

test("no maker at all FAILS a positive manufacturer-recall assertion", () => {
  // It prevents the historical error, but preventing an error is not recall.
  // The old evaluation printed "PREVENTED" here and exited 0.
  const exp = { name: "Ghost Shark", want: "maker", maker: "Anduril", notMaker: "Albacore" };
  const res = judge(exp, { evidence: [ev({ makerClaimed: "Anduril" })] });
  assert.equal(res.verdict, "FAIL");
  assert.match(res.reason, /fails recall/);
});

test("a programme must not be created, and not being extracted at all is acceptable", () => {
  const exp = { name: "rMCM", want: "rejected" };
  assert.equal(judge(exp, { evidence: [] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ name: "rMCM", outcome: OUTCOMES.REJECT })] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ name: "rMCM", outcome: OUTCOMES.CREATE })] }).verdict, "FAIL");
});

test("a product expected to survive FAILS when it is missing or held", () => {
  const exp = { name: "Dire WOLF", want: "product" };
  assert.equal(judge(exp, { evidence: [] }).verdict, "FAIL");
  assert.equal(judge(exp, { evidence: [ev({ name: "Dire WOLF", outcome: OUTCOMES.REVIEW })] }).verdict, "FAIL");
  assert.equal(judge(exp, { evidence: [ev({ name: "Dire WOLF" })] }).verdict, "PASS");
});

test("a contamination name appearing at all is a failure", () => {
  const exp = { name: "Chaparral", want: "absent" };
  assert.equal(judge(exp, { evidence: [] }).verdict, "PASS");
  const bad = judge(exp, { evidence: [ev({ name: "Chaparral", outcome: OUTCOMES.REVIEW })] });
  assert.equal(bad.verdict, "FAIL");
  assert.match(bad.reason, /leaked/);
});

test("Ghostfin may keep Albacore or no maker, but never a different company", () => {
  const exp = { name: "Ghostfin", want: "product", makerIn: ["Albacore", null] };
  assert.equal(judge(exp, { evidence: [ev({ name: "Ghostfin", maker: "Albacore", makerCue: "possessive" })] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ name: "Ghostfin" })] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ name: "Ghostfin", maker: "Anduril", makerCue: "adjacent" })] }).verdict, "FAIL");
});

test("every required case carries at least one assertion", () => {
  assert.ok(AFFECTED.length >= 4);
  for (const c of AFFECTED) {
    assert.ok(c.url && c.id, "a case needs a url and a stable id");
    assert.ok((c.expect || []).length > 0, `${c.id} asserts nothing`);
  }
  const fr = AFFECTED.filter((c) => c.lang && c.lang !== "en");
  assert.ok(fr.length >= 1, "the required set must include a non-English article");
});

test("an unverifiable article creates nothing live", () => {
  const exp = { name: "Dire WOLF", want: "not-created-live" };
  assert.equal(judge(exp, { evidence: [] }).verdict, "PASS");
  assert.equal(judge(exp, { evidence: [ev({ name: "Dire WOLF", outcome: OUTCOMES.REVIEW })] }).verdict, "PASS");
  const bad = judge(exp, { evidence: [ev({ name: "Dire WOLF", outcome: OUTCOMES.CREATE })] });
  assert.equal(bad.verdict, "FAIL");
  assert.match(bad.reason, /created live/);
});

test("the WAF-blocked article is declared unfetchable rather than silently passing", () => {
  const blocked = AFFECTED.find((c) => c.url.includes("defence-blog.com"));
  assert.ok(blocked, "the case is still in the required set");
  assert.equal(blocked.expectUnfetchable, true);
  assert.equal(blocked.expect[0].want, "not-created-live");
});

test("the contamination names are asserted absent, not merely unexpected", () => {
  const xl = AFFECTED.find((c) => c.id === "dronesworldmag-xluuv");
  const absent = xl.expect.filter((e) => e.want === "absent").map((e) => e.name).sort();
  assert.deepEqual(absent, ["Chaparral", "DroneSentry-X Mk2", "FUSE", "Mission Master SP"]);
});
