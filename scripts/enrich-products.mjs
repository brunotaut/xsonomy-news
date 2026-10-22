// Write catalogue summaries for products that have none, using ONLY the news
// articles already linked to them in `article_products`. No web access, no model
// recall — if the linked articles do not describe the product, the row is skipped
// and flagged instead of guessed at.
//
// Why the skip path matters: the article↔product links come from entity extraction
// and are sometimes wrong. In a hand-reviewed sample of ten, two were unusable —
// "ARCHER AI" whose articles were about other companies entirely, and "AS21 Redback",
// Hanwha's infantry fighting vehicle, filed under Counter-UAS. Writing a summary from
// those articles would have produced confident nonsense on a public page.
//
//   node scripts/enrich-products.mjs --max 60 --concurrency 3
//
// Flags
//   --max N          products this run (default 60)
//   --concurrency N  parallel LLM calls (default 3)
//   --dry-run        draft and print, write nothing
//
// Marks each row it touches via products.enrichment_status:
//   'news-derived'  summary written from the linked articles
//   'needs-review'  articles do not support a summary — a human should look
// Rows already carrying either value are not fetched again, so the job is resumable
// and will not re-spend tokens on the same products.

import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch } from "./lib/supabase.mjs";
import { anthropicComplete, hasApiKey } from "./lib/analyze.mjs";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const MAX = Number(flag("max", 60));
const CONCURRENCY = Number(flag("concurrency", 3));
const DRY = args.includes("--dry-run");

const SYSTEM = `You write one-paragraph catalogue entries for an unmanned-systems product directory.

You are given a product name and news headlines and extracts that an automated extractor
linked to that product. The links are usually right but sometimes wrong.

News reports EVENTS involving a product rather than describing it, so do not expect a
specification. You can normally still write a good entry: take how the article characterises
the thing in passing ("the MQ-9A Reaper, General Atomics' medium-altitude surveillance
drone"), plus what is happening to it — orders, operators, deployments, variants, figures.
That is exactly what a catalogue reader wants.

Refuse ONLY when the articles genuinely cannot support an entry:
- they are about a different product, or only about the parent company's other activities;
- the product name is an ordinary word and the articles use it in that ordinary sense
  (a "Hornet" article about an F/A-18 or an insect, a "Bullet" article about ammunition);
- nothing in them indicates what kind of thing this is.
A thin-but-consistent picture is enough. Having only passing mentions is NOT a reason to refuse.

Use ONLY what the extracts state. Never add specifications, history or purpose from your own
knowledge, even for products you recognise — and you will recognise many of these. If the
extracts do not give a figure, do not supply one.

Style: 1-2 sentences, 25-60 words, plain declarative prose, no marketing language, no
"according to reports". British spelling, and write "US" not "U.S.".

Reply with JSON only:
{"ok": true, "summary": "..."}            when you can write an entry
{"ok": false, "reason": "..."}            when you genuinely cannot (reason: under 15 words)`;

// Three plain reads joined here, rather than one nested PostgREST embed. The foreign
// keys exist so an embed would probably work, but this shape is already proven against
// this database by the catalogue generator and cannot be broken by a schema-cache or
// exposure change.
const PAGE = 1000;
async function sbSelect(path, params) {
  const { url, serviceKey } = sbConfig();
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = new URL(`${url}/rest/v1/${path}`);
    for (const [k, v] of Object.entries(params)) q.searchParams.set(k, v);
    q.searchParams.set("limit", String(PAGE));
    q.searchParams.set("offset", String(offset));
    const res = await sbFetch(q, { headers });
    if (!res.ok) throw new Error(`Supabase ${path} ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

async function fetchBatch(limit) {
  const candidates = await sbSelect("products", {
    select: "id,name,category,country,companies!products_company_id_fkey(name)",
    summary: "is.null",
    enrichment_status: "is.null",
    order: "name.asc,id.asc",
  });
  if (!candidates.length) return [];
  const byId = new Map(candidates.map((p) => [p.id, { ...p, article_products: [] }]));

  const links = await sbSelect("article_products", {
    select: "product_id,article_id,mention_type",
    order: "article_id.asc,product_id.asc",
  });
  const wanted = links.filter((l) => byId.has(l.product_id));
  if (!wanted.length) return [];

  const articles = await sbSelect("articles", {
    select: "id,title,summary,url,published_at",
    order: "id.asc",
  });
  const artById = new Map(articles.map((a) => [a.id, a]));
  for (const l of wanted) {
    const a = artById.get(l.article_id);
    if (a) byId.get(l.product_id).article_products.push({ mention_type: l.mention_type, articles: a });
  }
  // Only rows with source material are worth an LLM call; best-covered first, so the
  // early runs produce the strongest entries.
  return [...byId.values()]
    .filter((p) => p.article_products.length > 0)
    .sort((a, b) => b.article_products.length - a.article_products.length)
    .slice(0, limit);
}

async function patchProduct(id, fields) {
  const { url, serviceKey } = sbConfig();
  const q = new URL(`${url}/rest/v1/products`);
  q.searchParams.set("id", `eq.${id}`);
  const res = await sbFetch(q, {
    method: "PATCH",
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase patch ${res.status}: ${await res.text()}`);
}

function buildUser(row) {
  // Rank the evidence: an article principally about the product beats a passing mention,
  // and one that names the product in its own text beats one that does not. Heavily
  // covered products (a Reaper has 34 articles) are mostly industry round-ups, so without
  // this the six chosen can all be ones that never characterise the thing.
  const needle = String(row.name || "").toLowerCase();
  const names = (ap) => `${ap.articles.title || ""} ${ap.articles.summary || ""}`.toLowerCase().includes(needle);
  const links = (row.article_products || [])
    .filter((ap) => ap.articles)
    .map((ap) => ({ ap, score: (ap.mention_type === "primary" ? 2 : 0) + (names(ap) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score ||
      String(b.ap.articles.published_at || "").localeCompare(String(a.ap.articles.published_at || "")))
    .slice(0, 8)
    .map((x) => x.ap);
  const arts = links.map((ap, i) => {
    const a = ap.articles;
    return `[${i + 1}] ${ap.mention_type === "primary" ? "(mainly about this product) " : ""}` +
      `${a.title}\n${(a.summary || "").slice(0, 400)}`;
  }).join("\n\n");
  return `Product: ${row.name}\n` +
    `Maker: ${row.companies?.name || "unknown"}\n` +
    `Country: ${row.country || "unknown"}\n` +
    `Catalogue category: ${row.category}\n\nArticles:\n\n${arts}`;
}

function parseReply(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function handle(row, stats) {
  const links = (row.article_products || []).filter((ap) => ap.articles);
  const urls = links.map((ap) => ap.articles.url).filter(Boolean).slice(0, 6);
  let reply;
  try {
    reply = parseReply(await anthropicComplete({ system: SYSTEM, user: buildUser(row), maxTokens: 400 }));
  } catch (e) {
    stats.errors++; console.error(`  ! ${row.name}: ${e.message}`); return;
  }
  if (!reply) { stats.errors++; console.error(`  ! ${row.name}: unparseable reply`); return; }

  if (reply.ok && typeof reply.summary === "string" && reply.summary.trim().length > 25) {
    const summary = reply.summary.trim();
    stats.written++;
    console.log(`  + ${row.name} — ${summary.slice(0, 70)}…`);
    if (!DRY) await patchProduct(row.id, { summary, source_urls: urls, enrichment_status: "news-derived" });
  } else {
    stats.skipped++;
    const reason = (reply.reason || "articles do not describe this product").slice(0, 120);
    console.log(`  - ${row.name} — skipped: ${reason}`);
    if (!DRY) await patchProduct(row.id, { enrichment_status: "needs-review" });
  }
}

async function main() {
  await loadDotenv();
  if (!hasApiKey()) throw new Error("ANTHROPIC_API_KEY is required.");
  sbConfig();
  const batch = await fetchBatch(MAX);
  console.log(`${batch.length} products with linked articles and no summary${DRY ? " (dry run)" : ""}`);
  if (!batch.length) { console.log("nothing to do"); return; }

  const stats = { written: 0, skipped: 0, errors: 0 };
  const queue = [...batch];
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await handle(queue.shift(), stats);
  }));

  console.log(`\nwritten ${stats.written} · skipped for review ${stats.skipped} · errors ${stats.errors}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Product summaries\n\n` +
      `- written: **${stats.written}**\n- skipped for review: **${stats.skipped}**\n- errors: ${stats.errors}\n\n` +
      `Skipped rows carry \`enrichment_status = 'needs-review'\`; they are usually a bad ` +
      `article↔product link from entity extraction rather than a bad product.\n`, { flag: "a" });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
