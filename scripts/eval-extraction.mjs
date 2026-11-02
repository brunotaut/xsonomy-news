// READ-ONLY real-model evaluation of the extraction identity rules.
//
//   node scripts/eval-extraction.mjs --affected        # the four known-bad sources
//   node scripts/eval-extraction.mjs --sample 20       # recent pending articles
//   node scripts/eval-extraction.mjs --urls a,b,c
//
// WRITES NOTHING. It calls the extraction model and prints what the rules would
// decide. It never inserts a product, never touches article links, never
// patches an article, and never prints a credential. There is no --apply.
//
// Env: ANTHROPIC_API_KEY (required), SUPABASE_URL + a read key (for --sample).

import { loadDotenv } from "./lib/http.mjs";
import { analyzeArticle, hasApiKey } from "./lib/analyze.mjs";
import { fetchAllRows } from "./lib/supabase.mjs";
import { OUTCOMES } from "./lib/identity.mjs";

const args = process.argv.slice(2);
const flagVal = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };

// The four sources behind the known failures, so a run says plainly whether
// each historical error is now prevented.
const AFFECTED = [
  { url: "https://opex360.com/2026/08/04/guerre-des-mines-le-ministere-des-armees-commande-davantage-de-drones-navals-et-affrete-des-navires-civils-pour-les-deployer",
    expect: { MMCM: "not-a-product", "rMCM": "not-a-product" } },
  { url: "https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia",
    expect: { "Ghost Shark": "no-maker-Albacore", Ghostfin: "maker-Albacore" } },
  { url: "https://dronesworldmag.com/kongsberg-and-oceaneering-team-selected-by-us-dow-to-support-diu-camp-program-for-xluuv",
    expect: { XLUUV: "not-a-product" } },
  { url: "https://defence-blog.com/blade-picked-for-u-s-armys-autonomous-logistics-program",
    expect: { "Dire WOLF": "product" } },
];

// Published Haiku 4.5 rates, USD per million tokens. Used for an ESTIMATE only;
// the real figure is whatever the API bills.
const USD_IN = 1.0, USD_OUT = 5.0;
const estimate = (chars) => (chars / 4 / 1e6) * USD_IN + (900 / 1e6) * USD_OUT;

async function main() {
  await loadDotenv();
  if (!hasApiKey()) {
    console.error("BLOCKED: ANTHROPIC_API_KEY is not set. This evaluation calls the real");
    console.error("model, so it can only run where that secret exists (CI). Nothing was run.");
    process.exit(2);
  }

  let targets = [];
  if (args.includes("--affected")) targets = AFFECTED;
  else if (args.includes("--urls")) targets = String(flagVal("--urls", "")).split(",").filter(Boolean).map((url) => ({ url }));
  else {
    const n = Number(flagVal("--sample", 20));
    const rows = await fetchAllRows("articles", "url,title,products,analyzed_at,entities_resolved_at");
    targets = rows
      .filter((r) => r.analyzed_at && !r.entities_resolved_at && (r.products || []).length)
      .slice(0, n).map((r) => ({ url: r.url }));
  }
  if (!targets.length) { console.log("Nothing to evaluate."); return; }

  console.log(`READ-ONLY evaluation of ${targets.length} article(s). No writes of any kind.\n`);
  const totals = { create: 0, review: 0, reject: 0, makersKept: 0, makersDropped: 0, noBody: 0, errors: 0 };
  let chars = 0;

  for (const t of targets) {
    let res;
    try { res = await analyzeArticle({ url: t.url }); }
    catch (e) { totals.errors++; console.log(`✗ ${t.url}\n    ERROR ${e.message}`); continue; }
    if (!res.ok) { totals.errors++; console.log(`✗ ${t.url}\n    ${res.error}`); continue; }
    if (!res.usedBody) totals.noBody++;
    chars += (res.verifiedAgainst || "").length;

    console.log(`${res.usedBody ? "●" : "○"} ${t.url}`);
    for (const e of res.evidence || []) {
      if (totals[e.outcome] !== undefined) totals[e.outcome]++;
      if (e.outcome === OUTCOMES.CREATE) { if (e.maker) totals.makersKept++; else if (e.makerClaimed) totals.makersDropped++; }
      const maker = e.maker ? `maker=${e.maker} (${e.makerCue})`
        : e.makerClaimed ? `maker DROPPED (claimed ${e.makerClaimed})` : "no maker";
      console.log(`    ${e.outcome.toUpperCase().padEnd(6)} ${String(e.name).padEnd(24)} kind=${String(e.kind).padEnd(12)} ${maker}`);
      console.log(`           reason: ${e.reason}`);
    }
    if (t.expect) {
      for (const [name, want] of Object.entries(t.expect)) {
        const got = (res.evidence || []).find((e) => e.name.toLowerCase() === name.toLowerCase());
        const verdict = !got ? "NOT EXTRACTED"
          : want === "not-a-product" ? (got.outcome !== OUTCOMES.CREATE ? "PREVENTED" : "*** NOT PREVENTED ***")
          : want.startsWith("no-maker-") ? (got.maker === null ? "PREVENTED" : `*** maker=${got.maker} ***`)
          : want.startsWith("maker-") ? (got.maker ? `maker kept (${got.maker})` : "maker dropped")
          : got.outcome === OUTCOMES.CREATE ? "retained" : `held (${got.reason})`;
        console.log(`      expect ${name} → ${want}: ${verdict}`);
      }
    }
    console.log("");
  }

  console.log("── totals ──");
  console.log(`  create ${totals.create}  review ${totals.review}  reject ${totals.reject}`);
  console.log(`  makers kept ${totals.makersKept}  makers dropped ${totals.makersDropped}`);
  console.log(`  articles with no body ${totals.noBody}  errors ${totals.errors}`);
  console.log(`  estimated model cost: $${estimate(chars).toFixed(4)} (${targets.length} calls, ~${Math.round(chars / 4)} input tokens)`);
  console.log("  NOTE: an estimate from published rates, not a billed figure.");
}

main().catch((e) => { console.error(e); process.exit(1); });
