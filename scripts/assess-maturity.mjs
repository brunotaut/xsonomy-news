// Assign the UAV360 Maturity Classification to products, then roll it up to companies.
//
// Levels, ordered by the strength of real-world evidence — emerging, demonstrated,
// commercial, deployed, scaled. NOT a ladder: a munition used in combat but never
// offered for sale is `deployed` and was never `commercial`. See docs/DATA-MODEL.md §4.
//
//   node scripts/assess-maturity.mjs --max 40 --dry-run
//   node scripts/assess-maturity.mjs --max 40
//   node scripts/assess-maturity.mjs --rollup           # companies only
//
// Flags
//   --max N          products this run (default 40)
//   --concurrency N  parallel LLM calls (default 3)
//   --dry-run        print judgements, write nothing
//   --product NAME   one product by name, for spot-checks
//   --rollup         skip the product pass, only recompute company maturity
//
// EVIDENCE FIRST
//
// A product is only considered once there is something to judge it on: evidence rows
// for its company, or news articles linked to the product itself. Judging maturity
// without those means judging from the model's memory of the product, which is the
// one thing this classification is not meant to be.
//
// As with the evidence extractor, the model never writes a URL — it cites sources by
// number and the caller substitutes the real ones. The database independently refuses
// any maturity row that arrives without a source and a date.
//
// Resumable: products that already carry a maturity are skipped, so a re-run moves on.
// Human judgements are never overwritten — a product whose maturity_assessed_by is not
// 'llm', or a company with maturity_is_override, is left alone.

import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch, fetchAllRows } from "./lib/supabase.mjs";
import { anthropicComplete, hasApiKey } from "./lib/analyze.mjs";
import { validateAssessment, parseAssessment, rollUp, MATURITY } from "./lib/maturity.mjs";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const MAX = Number(flag("max", 40));
const CONCURRENCY = Number(flag("concurrency", 3));
const DRY = args.includes("--dry-run");
const ROLLUP_ONLY = args.includes("--rollup");
const ONLY = flag("product", null);

const ARTICLES_PER_PRODUCT = 10;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You assign a maturity level to products in a catalogue of uncrewed systems and counter-drone equipment. This is the "UAV360 Maturity Classification": an editorial reading of the evidence in front of you, published under our name. It is not a vendor claim and not a measure of quality.

LEVELS, by the strength of real-world evidence:

  emerging      announced, a prototype shown, or a startup with a stated product. Vendor-only evidence.
  demonstrated  a public demonstration, trial, exercise or test event, witnessed by someone other than the vendor.
  commercial    can be bought — a price, ordering information, a distributor, a catalogue listing.
  deployed      confirmed operational use by a NAMED user: a unit, agency, force or operator. Not a trial.
  scaled        several of: multiple named customers, multi-year or multi-unit contracts, serial production figures, separate deployments.

This is a RANKING, NOT A LADDER. A level does not require the ones below it. A loitering munition used in combat but never sold is "deployed" and was never "commercial". Judge what the evidence shows, not what stage a product "should" have passed through.

Reply as JSON:

{"maturity":"deployed","sources":[2,5],"rationale":"In service with the Royal Netherlands Army since 2024; the 2026 report describes continued operational use.","confidence":"high"}

RULES

1. Use ONLY the evidence and articles given. Never your own knowledge of the product, however well you know it. If what you are shown does not establish a level, answer {"maturity":null}. That is a normal and frequent answer.
2. "sources" are the numbers of the items that support your choice. Cite only items that genuinely do.
3. "scaled" requires at least two separate sources showing multiplicity. One big contract is not "scaled".
4. "deployed" requires a named user. "In service with the military" is not enough; "in service with the Polish Border Guard" is.
5. Production status tells you whether it is still made, not whether anyone uses it. A discontinued product can be "deployed"; a product in production can be "emerging".
6. rationale: one or two sentences saying what the evidence shows. It is published next to the level, so write it for a reader.
7. confidence: "high" when the evidence is direct and plain, "medium" when partial or secondhand, "low" when inferred.

Return only the JSON object.`;

function userPrompt(p, items) {
  const bits = [
    `PRODUCT: ${p.name}`,
    p.company ? `MAKER: ${p.company}` : null,
    `CATEGORY: ${p.category}${p.subcategory ? ` / ${p.subcategory}` : ""}`,
    p.status_detail ? `PRODUCTION STATUS (whether it is still made, not whether it is used): ${p.status_detail}` : null,
    p.summary ? `CATALOGUE SUMMARY: ${String(p.summary).slice(0, 400)}` : null,
  ].filter(Boolean).join("\n");

  const list = items.map((it, i) => it.kind
    ? `${i + 1}. [EVIDENCE · ${it.kind}${it.occurred_year ? ` · ${it.occurred_year}` : ""}] ` +
      `${it.counterparty ? `${it.counterparty} — ` : ""}${it.summary}`
    : `${i + 1}. [ARTICLE · ${it.published_at ? String(it.published_at).slice(0, 10) : "undated"} · ${it.source || "?"}] ` +
      `${it.title}\n   ${(it.summary || "").slice(0, 280)}`).join("\n\n");

  return `${bits}\n\nEVIDENCE AND COVERAGE:\n\n${list}`;
}

async function fetchBatch() {
  const [products, companies, evidence, links, articles] = await Promise.all([
    fetchAllRows("products", "id,name,category,subcategory,summary,company_id,status_detail,maturity,maturity_assessed_by"),
    fetchAllRows("companies", "id,name"),
    fetchAllRows("company_evidence", "company_id,product_id,kind,counterparty,summary,occurred_year,source_url"),
    fetchAllRows("article_products", "product_id,article_id"),
    fetchAllRows("articles", "id,title,summary,url,source,published_at"),
  ]);

  const coName = new Map(companies.map((c) => [c.id, c.name]));
  const byArticle = new Map(articles.map((a) => [a.id, a]));

  const artByProduct = new Map();
  for (const l of links) {
    const a = byArticle.get(l.article_id);
    if (!a || !a.url || !a.title) continue;
    const arr = artByProduct.get(l.product_id) || [];
    arr.push(a); artByProduct.set(l.product_id, arr);
  }
  const evByCompany = new Map();
  for (const e of evidence) {
    if (!e.source_url) continue;
    const arr = evByCompany.get(e.company_id) || [];
    arr.push(e); evByCompany.set(e.company_id, arr);
  }

  // Never overwrite a human judgement — including under --product, which would
  // otherwise be the one path that could quietly undo an editor's decision.
  const mine = (p) => !p.maturity || p.maturity_assessed_by === "llm";
  let pool = products.filter((p) => mine(p) && (ONLY
    ? p.name.toLowerCase().includes(ONLY.toLowerCase())
    : !p.maturity));

  const out = [];
  for (const p of pool) {
    // Evidence about this exact product first, then its company's, then its own coverage.
    const ev = (evByCompany.get(p.company_id) || [])
      .sort((a, b) => (a.product_id === p.id ? -1 : 0) - (b.product_id === p.id ? -1 : 0))
      .slice(0, 8);
    const arts = (artByProduct.get(p.id) || [])
      .sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")))
      .slice(0, ARTICLES_PER_PRODUCT);
    const items = [...ev, ...arts];
    if (!items.length) continue;          // nothing to judge on — skip, do not guess
    out.push({ product: { ...p, company: coName.get(p.company_id) }, items });
    if (out.length >= MAX) break;
  }
  return out;
}

async function patch(table, id, fields) {
  const { url, serviceKey } = sbConfig();
  const res = await sbFetch(`${url}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`PATCH ${table} ${id} ${res.status}: ${await res.text()}`);
}

async function assess({ product, items }, stats) {
  const text = await anthropicComplete({
    system: SYSTEM, user: userPrompt(product, items), maxTokens: 700, model: MODEL,
  });
  const raw = parseAssessment(text);
  if (raw == null) { stats.unparsable++; console.error(`  ${product.name}: unparsable reply`); return; }

  const v = validateAssessment(raw, items.map((i) => ({ url: i.source_url || i.url })));
  if (!v.ok) { stats.rejected.push(`${product.name}: ${v.why}`); return; }
  if (v.value === null) { stats.declined++; console.log(`  ${product.name}: no call (${items.length} items)`); return; }

  stats.assessed++;
  stats.levels[v.value.maturity] = (stats.levels[v.value.maturity] || 0) + 1;
  console.log(`  ${product.name}: ${v.value.maturity.toUpperCase()} (${v.value.maturity_confidence})` +
    `\n      ${v.value.maturity_rationale}\n      ${v.value.maturity_source_urls.join("\n      ")}`);

  if (!DRY) await patch("products", product.id, v.value);
}

// Company maturity is the highest among its products, except where an editor has
// taken the decision themselves.
async function rollUpCompanies(stats) {
  const [products, companies] = await Promise.all([
    fetchAllRows("products", "id,company_id,maturity"),
    fetchAllRows("companies", "id,name,maturity,maturity_is_override"),
  ]);
  const byCompany = new Map();
  for (const p of products) {
    if (!p.company_id || !p.maturity) continue;
    const arr = byCompany.get(p.company_id) || [];
    arr.push(p.maturity); byCompany.set(p.company_id, arr);
  }
  for (const c of companies) {
    if (c.maturity_is_override) continue;
    const best = rollUp(byCompany.get(c.id) || []);
    if (!best || best === c.maturity) continue;
    const urls = await sourcesFor(c.id);
    // The database refuses a maturity with no source. A product cannot have one
    // without sources either, so an empty list here means something is off — skip
    // rather than send a row that will be rejected.
    if (!urls.length) { console.error(`  ${c.name}: skipped, no inherited sources`); continue; }
    stats.rolled++;
    console.log(`  ${c.name}: ${c.maturity || "—"} -> ${best}`);
    if (DRY) continue;
    await patch("companies", c.id, {
      maturity: best,
      maturity_rationale: `Highest maturity among this company's assessed products.`,
      // The company inherits its products' sources, so the DB's evidence rule is met
      // by the same links that justified the product.
      maturity_source_urls: urls,
      maturity_assessed_at: new Date().toISOString(),
      maturity_assessed_by: "llm",
      maturity_confidence: "medium",
    });
  }
}

let _srcCache = null;
async function sourcesFor(companyId) {
  if (!_srcCache) {
    const rows = await fetchAllRows("products", "company_id,maturity,maturity_source_urls");
    _srcCache = new Map();
    for (const r of rows) {
      if (!r.company_id || !r.maturity) continue;
      const got = _srcCache.get(r.company_id) || [];
      for (const u of r.maturity_source_urls || []) if (!got.includes(u)) got.push(u);
      _srcCache.set(r.company_id, got);
    }
  }
  return (_srcCache.get(companyId) || []).slice(0, 6);
}

async function pool(items, n, fn) {
  const q = [...items];
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => {
    while (q.length) await fn(q.shift());
  }));
}

async function main() {
  await loadDotenv();
  sbConfig();
  const stats = { assessed: 0, declined: 0, unparsable: 0, rolled: 0, rejected: [], levels: {} };

  if (!ROLLUP_ONLY) {
    if (!hasApiKey()) throw new Error("ANTHROPIC_API_KEY is required.");
    console.log(`Model ${MODEL}${DRY ? "  (dry run — nothing will be written)" : ""}`);
    const batch = await fetchBatch();
    if (!batch.length) {
      console.log("No products with evidence or coverage left to assess.");
    } else {
      console.log(`${batch.length} products\n`);
      await pool(batch, CONCURRENCY, (b) =>
        assess(b, stats).catch((e) => console.error(`  ${b.product.name}: ${e.message}`)));
      console.log(`\n${stats.assessed} assessed, ${stats.declined} declined` +
        `${stats.unparsable ? `, ${stats.unparsable} unparsable` : ""}.`);
      if (Object.keys(stats.levels).length) {
        console.log("  " + MATURITY.filter((m) => stats.levels[m])
          .map((m) => `${m} ${stats.levels[m]}`).join(" · "));
      }
      if (stats.rejected.length) {
        console.log(`\n${stats.rejected.length} rejected by validation:`);
        stats.rejected.slice(0, 20).forEach((r) => console.log(`  ${r}`));
      }
    }
  }

  console.log("\nRolling up to companies…");
  await rollUpCompanies(stats);
  console.log(`${stats.rolled} companies updated${DRY ? " (not written)" : ""}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
