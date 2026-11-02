// READ-ONLY real-model evaluation of the extraction pipeline.
//
//   node scripts/eval-extraction.mjs --affected          # the historical failures
//   node scripts/eval-extraction.mjs --sample 20         # recent pending articles
//   node scripts/eval-extraction.mjs --affected --sample 12
//   node scripts/eval-extraction.mjs --urls a,b,c
//   node scripts/eval-extraction.mjs --affected --out results.json
//
// WRITES NOTHING to the database or to any article. It calls the extraction
// model and prints what the production rules decide. It never inserts a
// product, never touches article links, never patches an article, and never
// prints a credential. There is no --apply.
//
// Exit status is the point of this script:
//   0  every required case PASSED
//   1  at least one required case FAILED       (wrong answer)
//   2  the evaluation could not run at all     (no API key)
//   3  at least one required case was BLOCKED  (never actually tested)
// BLOCKED is not PASS. An article whose body could not be fetched, or whose
// reply could not be parsed, has not been tested — and a green run that hid
// exactly that is why this file was rewritten.
//
// Env: ANTHROPIC_API_KEY (required), SUPABASE_URL + a read key (for --sample).

import { writeFileSync } from "node:fs";
import { loadDotenv } from "./lib/http.mjs";
import { analyzeArticle, fetchBody, hasApiKey } from "./lib/analyze.mjs";
import { fetchAllRows } from "./lib/supabase.mjs";
import { OUTCOMES, SUPPLY_ONLY, decideIdentity, QUALIFIED_PARTY } from "./lib/identity.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const flagVal = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };

// --- what a required case asserts -------------------------------------------
//
// product   the name must survive as a creatable product
// rejected  the name must NOT be created (programme / class / contract)
// maker     the name must be created AND carry exactly this maker
// absent    the name must not be extracted at all — a contamination check
//
// `notMaker` is an additional precision assertion: whatever else happens, the
// maker must not be this company. It is what pins the historical Ghost Shark
// error without also demanding a particular right answer.
const AFFECTED = [
  {
    id: "opex360-mmcm-rmcm",
    url: "https://opex360.com/2026/08/04/guerre-des-mines-le-ministere-des-armees-commande-davantage-de-drones-navals-et-affrete-des-navires-civils-pour-les-deployer",
    lang: "fr",
    note: "French, evidence-heavy: the article that returned 'unparseable response'.",
    expect: [
      { name: "MMCM", want: "rejected" },
      { name: "rMCM", want: "rejected" },
    ],
  },
  {
    id: "dronexl-ghostfin",
    url: "https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia",
    lang: "en",
    note: "Ghost Shark must not acquire Albacore (the historical error) and must keep Anduril.",
    expect: [
      // Anduril is the valid positive result: the article says "Anduril's Ghost
      // Shark". A missing maker here prevents the old error but is NOT a pass —
      // it is a recall failure, and this assertion says so.
      { name: "Ghost Shark", want: "maker", maker: "Anduril", notMaker: "Albacore" },
      // Ghostfin is Albacore's, but this article never says so in one span: the
      // link is carried across sentences ("The company is Albacore" + "is
      // building weaponized undersea drones"). The one-span rule is what stops
      // Albacore being attached to Ghost Shark, so the honest assertion is that
      // the PRODUCT survives and no WRONG owner is attached. Whether the maker
      // is found is measured in maker recall below, not hidden in a pass.
      { name: "Ghostfin", want: "product", makerIn: ["Albacore", null] },
    ],
  },
  {
    id: "dronesworldmag-xluuv",
    url: "https://dronesworldmag.com/kongsberg-and-oceaneering-team-selected-by-us-dow-to-support-diu-camp-program-for-xluuv",
    lang: "en",
    note: "XLUUV is a class, not a model. The four 'absent' names are a leading rail of OTHER headlines on the same page.",
    expect: [
      { name: "XLUUV", want: "rejected" },
      { name: "DroneSentry-X Mk2", want: "absent" },
      { name: "Mission Master SP", want: "absent" },
      { name: "FUSE", want: "absent" },
      { name: "Chaparral", want: "absent" },
    ],
  },
  {
    id: "defence-blog-dire-wolf",
    url: "https://defence-blog.com/blade-picked-for-u-s-armys-autonomous-logistics-program",
    lang: "en",
    // A legitimate product that must survive the new rules.
    //
    // CORRECTION: this host 403s non-browser clients from SOME networks — it
    // refuses plain curl from a local machine — but it answers normally from
    // the CI runner, where the pipeline actually runs. An earlier note here
    // claimed the body "has never been available"; that was wrong, concluded
    // from a local 403 alone. The production run fetched 6,480 characters.
    //
    // So the assertion is the original intent, with a fallback for the case
    // where a run really cannot fetch it: then the testable property is safe
    // degradation rather than extraction quality.
    note: "A legitimate product that must survive. 403s from some networks; falls back to asserting safe degradation.",
    expect: [{ name: "Dire WOLF", want: "product" }],
    ifUnfetchable: [{ name: "Dire WOLF", want: "not-created-live" }],
  },
];

// Hosts known to publish in other languages. The sample deliberately reaches
// for these: an English-only sample cannot detect a rule that silently drops
// every French or German maker, which is a bug this pipeline has already had.
const NON_ENGLISH_HOSTS = ["opex360.com", "esut.de", "analisidifesa.it", "infodefensa.com", "hartpunkt.de"];

// Haiku 4.5 published rates, USD per million tokens. Applied to the usage the
// API actually reported, so this is a computed figure rather than a guess —
// but the billed amount is still whatever Anthropic bills.
const USD_IN = 1.0, USD_OUT = 5.0;

const host = (u) => { try { return new URL(u).host.replace(/^www\./, ""); } catch { return "?"; } };
const find = (ev, name) => (ev || []).find((e) => String(e.name).toLowerCase() === name.toLowerCase());
const sameCo = (a, b) => String(a || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  .includes(String(b || "").toLowerCase().replace(/[^a-z0-9]/g, "")) && Boolean(a) && Boolean(b);

// Judge one assertion against the evidence. Returns { verdict, reason }.
function judge(exp, res) {
  const got = find(res.evidence, exp.name);

  if (exp.want === "not-created-live") {
    // Only reachable when a declared-unfetchable body turned out to be
    // fetchable after all; then the ordinary rule applies.
    return !got || got.outcome !== OUTCOMES.CREATE
      ? { verdict: "PASS", reason: got ? `${got.outcome} (${got.reason})` : "not extracted" }
      : { verdict: "FAIL", reason: `created live (${got.reason})` };
  }
  if (exp.want === "absent") {
    return got
      ? { verdict: "FAIL", reason: `extracted anyway (outcome=${got.outcome}); page content leaked into the body` }
      : { verdict: "PASS", reason: "not extracted" };
  }
  if (!got) {
    // Not extracted at all. For a name we expect to be refused this is a weaker
    // but acceptable result; for one we expect to keep it is a failure.
    return exp.want === "rejected"
      ? { verdict: "PASS", reason: "not extracted at all, so never created" }
      : { verdict: "FAIL", reason: "not extracted — expected it to survive" };
  }
  if (exp.want === "rejected") {
    return got.outcome === OUTCOMES.CREATE
      ? { verdict: "FAIL", reason: `created as a product (kind=${got.kind}, reason=${got.reason})` }
      : { verdict: "PASS", reason: `${got.outcome} (${got.reason})` };
  }
  // From here the name must have survived.
  if (got.outcome !== OUTCOMES.CREATE) {
    return { verdict: "FAIL", reason: `held as ${got.outcome} (${got.reason}) — expected to survive` };
  }
  if (exp.notMaker && sameCo(got.maker, exp.notMaker)) {
    return { verdict: "FAIL", reason: `maker=${got.maker}, which is the historical error` };
  }
  if (exp.want === "maker") {
    if (!got.maker) {
      return { verdict: "FAIL", reason: `no maker assigned (claimed=${got.makerClaimed ?? "none"}, cue=${got.makerCue ?? "none"}) — prevents the old error but fails recall` };
    }
    return sameCo(got.maker, exp.maker)
      ? { verdict: "PASS", reason: `maker=${got.maker} via ${got.makerCue}` }
      : { verdict: "FAIL", reason: `maker=${got.maker}, expected ${exp.maker}` };
  }
  if (exp.makerIn) {
    const ok = exp.makerIn.some((m) => (m === null ? !got.maker : sameCo(got.maker, m)));
    return ok
      ? { verdict: "PASS", reason: got.maker ? `maker=${got.maker} via ${got.makerCue}` : `retained, maker unassigned (${got.makerCue ?? "no cue"})` }
      : { verdict: "FAIL", reason: `maker=${got.maker}, expected one of ${exp.makerIn.map((m) => m ?? "none").join(" / ")}` };
  }
  return { verdict: "PASS", reason: `created (${got.reason})` };
}

async function runOne(target) {
  const rec = { id: target.id || host(target.url), url: target.url, host: host(target.url), lang: target.lang || null, note: target.note || null };

  // Fetch and clean through the SAME production path the daily ingest uses, and
  // judge the body before spending a model call on it. An article whose body we
  // never obtained cannot be a passed test, so it is BLOCKED, not analysed.
  const body = await fetchBody(target.url, { expectTitle: target.title });
  rec.body = { chars: body.text.length, finalUrl: body.finalUrl, status: body.status, failure: body.failure || null, detail: body.detail || null };

  // A case with a declared fallback asserts DEGRADATION when its body cannot
  // be had: the assertion is deterministic and needs no model call, because
  // with no article text identity cannot be verified and every candidate must
  // come back REVIEW. Without such a fallback an unfetchable body is BLOCKED.
  if (body.failure && target.ifUnfetchable) {
    rec.degraded = true;
    const probe = decideIdentity(
      { name: target.ifUnfetchable[0].name, kind: "product", quote: "a quote that cannot be checked" },
      "", { haveArticleText: false });
    const safe = probe.outcome !== OUTCOMES.CREATE;
    rec.status = safe ? "PASS" : "FAIL";
    rec.reason = `body unavailable (${body.failure}: ${body.detail}); unverifiable candidate → ${probe.outcome} (${probe.reason})`;
    rec.cases = target.ifUnfetchable.map((e) => ({
      ...e,
      verdict: safe ? "PASS" : "FAIL",
      reason: safe ? `nothing created live: ${probe.outcome} (${probe.reason})`
                   : "would be created live despite no article body",
    }));
    return rec;
  }
  if (body.failure) {
    rec.status = "BLOCKED";
    rec.reason = `body unavailable: ${body.failure} (${body.detail})`;
    rec.cases = (target.expect || []).map((e) => ({ ...e, verdict: "BLOCKED", reason: "the article body was never obtained" }));
    return rec;
  }
  if (body.finalUrl && body.finalUrl !== target.url) rec.body.redirected = true;

  const res = await analyzeArticle({ url: target.url, title: target.title }, { prefetchedBody: body.text });
  rec.usage = res.usage || null;
  rec.attempts = res.attempts || [];
  if (!res.ok) {
    rec.status = "BLOCKED";
    rec.reason = `extraction failed: ${res.errorKind} — ${res.error}`;
    rec.cases = (target.expect || []).map((e) => ({ ...e, verdict: "BLOCKED", reason: `reply ${res.errorKind}` }));
    return rec;
  }

  rec.products = res.products;
  rec.evidence = (res.evidence || []).map((e) => ({
    name: e.name, kind: e.kind, outcome: e.outcome, reason: e.reason,
    maker: e.maker, makerClaimed: e.makerClaimed, makerCue: e.makerCue,
    quote: e.quote ? String(e.quote).slice(0, 200) : null,
  }));
  rec.cases = (target.expect || []).map((e) => ({ ...e, ...judge(e, res) }));
  rec.status = rec.cases.some((c) => c.verdict === "FAIL") ? "FAIL"
    : rec.cases.some((c) => c.verdict === "BLOCKED") ? "BLOCKED" : "PASS";
  return rec;
}

async function pickSample(n) {
  const rows = await fetchAllRows("articles", "url,title,products,analyzed_at,entities_resolved_at");
  const pending = rows.filter((r) => r.analyzed_at && !r.entities_resolved_at && (r.products || []).length);
  const foreign = pending.filter((r) => NON_ENGLISH_HOSTS.includes(host(r.url)));
  const rest = pending.filter((r) => !NON_ENGLISH_HOSTS.includes(host(r.url)));
  // Guarantee non-English coverage, then spread the remainder over hosts so the
  // sample is not one site repeated.
  const take = [];
  const want = Math.max(1, Math.floor(n / 4));
  take.push(...foreign.slice(0, want));
  const seen = new Map();
  for (const r of rest) {
    const h = host(r.url);
    const c = seen.get(h) || 0;
    if (c >= 2) continue;
    seen.set(h, c + 1);
    take.push(r);
    if (take.length >= n) break;
  }
  return take.slice(0, n).map((r) => ({ id: host(r.url), url: r.url, title: r.title, lang: NON_ENGLISH_HOSTS.includes(host(r.url)) ? "non-en" : "en" }));
}

async function main() {
  await loadDotenv();
  if (!hasApiKey()) {
    console.error("BLOCKED: ANTHROPIC_API_KEY is not set. This evaluation calls the real");
    console.error("model, so it can only run where that secret exists (CI). Nothing was run.");
    process.exit(2);
  }

  const required = [];
  const sample = [];
  if (has("--urls")) required.push(...String(flagVal("--urls", "")).split(",").filter(Boolean).map((url) => ({ id: host(url), url })));
  if (has("--affected") || (!has("--urls") && !has("--sample"))) required.push(...AFFECTED);
  if (has("--sample")) sample.push(...await pickSample(Number(flagVal("--sample", 20))));
  if (!required.length && !sample.length) { console.log("Nothing to evaluate."); return; }

  console.log(`READ-ONLY evaluation — ${required.length} required case(s), ${sample.length} sampled article(s).`);
  console.log("No database writes, no article edits, no product creation.\n");

  const results = [];
  for (const t of [...required, ...sample.map((s) => ({ ...s, sampled: true }))]) {
    const rec = await runOne(t);
    rec.sampled = Boolean(t.sampled);
    results.push(rec);

    const mark = rec.status === "PASS" ? "PASS " : rec.status === "FAIL" ? "FAIL " : "BLOCK";
    console.log(`[${mark}] ${rec.id}  (${rec.host}${rec.lang ? `, ${rec.lang}` : ""})`);
    console.log(`        ${rec.url}`);
    console.log(`        body: ${rec.body.chars} chars, HTTP ${rec.body.status}${rec.body.failure ? `, FAILURE ${rec.body.failure}` : ""}${rec.body.redirected ? `, redirected → ${rec.body.finalUrl}` : ""}`);
    for (const a of rec.attempts || []) console.log(`        parse attempt: ${a.failure}${a.detail ? ` (${a.detail})` : ""} stop_reason=${a.stopReason}`);
    if (rec.reason) console.log(`        ${rec.reason}`);
    for (const e of rec.evidence || []) {
      const maker = e.maker ? `maker=${e.maker} (${e.makerCue})`
        : e.makerClaimed ? `maker DROPPED — claimed ${e.makerClaimed}, cue ${e.makerCue ?? "none"}`
        : "no maker";
      console.log(`          ${String(e.outcome).toUpperCase().padEnd(6)} ${String(e.name).padEnd(22)} kind=${String(e.kind).padEnd(11)} ${maker}`);
    }
    for (const c of rec.cases || []) {
      console.log(`        ${c.verdict.padEnd(7)} ${String(c.name).padEnd(22)} want=${String(c.want).padEnd(9)} ${c.reason}`);
    }
    console.log("");
  }

  // --- metrics, separated on purpose ---------------------------------------
  // Product retention and maker precision/recall are different questions, and
  // a single "prevented" total let a missing valid maker hide inside a number
  // that looked like a safety win.
  const evAll = results.flatMap((r) => r.evidence || []);
  const retention = {
    extracted: evAll.length,
    created: evAll.filter((e) => e.outcome === OUTCOMES.CREATE).length,
    review: evAll.filter((e) => e.outcome === OUTCOMES.REVIEW).length,
    rejected: evAll.filter((e) => e.outcome === OUTCOMES.REJECT).length,
  };
  const claimed = evAll.filter((e) => e.makerClaimed);
  const maker = {
    claimedByModel: claimed.length,
    assigned: evAll.filter((e) => e.maker).length,
    droppedAmbiguousSupply: claimed.filter((e) => !e.maker && e.makerCue === SUPPLY_ONLY).length,
    // Its own column, not folded into "no stated relation": the span DID state
    // building, by a party the company was merely qualifying. Burying it would
    // be the same mistake as hiding missing makers inside a "prevented" total.
    droppedQualifiedParty: claimed.filter((e) => !e.maker && e.makerCue === QUALIFIED_PARTY).length,
    droppedNoRelation: claimed.filter((e) =>
      !e.maker && e.makerCue !== SUPPLY_ONLY && e.makerCue !== QUALIFIED_PARTY).length,
  };
  // Precision and recall over the REQUIRED maker assertions only, because only
  // those have a known right answer.
  const makerCases = results.flatMap((r) => (r.cases || []).filter((c) => c.want === "maker"));
  maker.requiredAssertions = makerCases.length;
  maker.requiredCorrect = makerCases.filter((c) => c.verdict === "PASS").length;
  maker.recall = makerCases.length ? maker.requiredCorrect / makerCases.length : null;
  const wrongMaker = results.flatMap((r) => (r.cases || []).filter((c) => c.verdict === "FAIL" && /^maker=/.test(c.reason || "")));
  maker.precisionErrors = wrongMaker.length;

  const usage = results.reduce((a, r) => ({
    input: a.input + (r.usage?.input_tokens || 0),
    output: a.output + (r.usage?.output_tokens || 0),
  }), { input: 0, output: 0 });
  const cost = (usage.input / 1e6) * USD_IN + (usage.output / 1e6) * USD_OUT;

  const reqResults = results.filter((r) => !r.sampled);
  const failures = reqResults.filter((r) => r.status === "FAIL");
  const blocked = reqResults.filter((r) => r.status === "BLOCKED");

  console.log("── required cases ──");
  for (const r of reqResults) console.log(`  ${r.status.padEnd(7)} ${r.id}${r.reason ? ` — ${r.reason}` : ""}`);
  console.log("\n── product retention ──");
  console.log(`  extracted ${retention.extracted}  created ${retention.created}  review ${retention.review}  rejected ${retention.rejected}`);
  console.log("── manufacturer attribution ──");
  console.log(`  model claimed ${maker.claimedByModel}  assigned ${maker.assigned}`);
  console.log(`  dropped as supply-only ${maker.droppedAmbiguousSupply}` +
    `  dropped as a qualified party ${maker.droppedQualifiedParty}` +
    `  dropped, no stated relation ${maker.droppedNoRelation}`);
  console.log(`  required maker assertions ${maker.requiredCorrect}/${maker.requiredAssertions} correct` +
    (maker.recall === null ? "" : ` (recall ${(maker.recall * 100).toFixed(0)}%)`) +
    `, wrong makers ${maker.precisionErrors}`);
  console.log("── cost ──");
  console.log(`  ${usage.input} input + ${usage.output} output tokens → $${cost.toFixed(4)} at published rates`);

  const out = flagVal("--out", "eval-results.json");
  const payload = {
    ranAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    model: process.env.ANTHROPIC_MODEL || "default",
    exitStatus: failures.length ? 1 : blocked.length ? 3 : 0,
    summary: {
      required: reqResults.length, passed: reqResults.filter((r) => r.status === "PASS").length,
      failed: failures.length, blocked: blocked.length, sampled: sample.length,
    },
    retention, maker, usage, costUsd: Number(cost.toFixed(4)),
    results,
  };
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`\nMachine-readable result written to ${out}`);

  if (failures.length) {
    console.error(`\nFAILED: ${failures.length} required case(s) gave the wrong answer: ${failures.map((r) => r.id).join(", ")}`);
    process.exit(1);
  }
  if (blocked.length) {
    console.error(`\nBLOCKED: ${blocked.length} required case(s) were never tested: ${blocked.map((r) => r.id).join(", ")}`);
    console.error("A blocked case is not a pass. Fix the cause and re-run.");
    process.exit(3);
  }
  console.log("\nAll required cases passed.");
}

// Exported so the verdict logic can be tested without spending a model call.
// BLOCKED-is-not-PASS and "no maker is not a positive result" are assertions
// about this function, and they are worth testing directly.
export { judge, AFFECTED };

// Run only when invoked as a script, so importing this file for tests is safe.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
