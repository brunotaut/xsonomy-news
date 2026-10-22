// Build company_evidence rows from the news articles already linked to each company.
//
// Evidence is what the UAV360 maturity classification is derived from: a dated,
// sourced claim that somebody bought, used, funded or partnered on something. See
// docs/DATA-MODEL.md §5.
//
//   node scripts/extract-evidence.mjs --max 25 --dry-run
//   node scripts/extract-evidence.mjs --max 25
//
// Flags
//   --max N          companies this run (default 25)
//   --concurrency N  parallel LLM calls (default 3)
//   --dry-run        print what would be written, write nothing
//   --company NAME   one company by name, for spot-checking
//
// WHY THE LINKS CANNOT BE TRUSTED
//
// article_companies comes from LLM entity extraction over article text, and it is
// frequently wrong. Lockheed Martin's four most recent linked articles, checked by
// hand on 2026-10-22, were: a Ukrainian medevac hexacopter, a UK policy question,
// Boeing's MQ-25, and the same medevac story again. None mention Lockheed doing
// anything. Four out of four.
//
// So the model is told to treat the link as a guess and to reject articles that are
// not actually about this company. Most articles yield nothing, and that is the
// correct outcome — this job is expected to return few rows per company.
//
// WHY THE SOURCES CANNOT BE INVENTED
//
// The model never writes a URL. It cites an article by its number in the list it was
// shown, and validateRow() substitutes that article's real URL from our database. A
// fabricated citation cannot survive, because there is nothing for it to resolve to.
//
// Resumable: companies.evidence_scanned_at is stamped whether or not anything was
// found, so "looked, found nothing" is not re-read on the next run.

import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch, fetchAllRows, insertRows } from "./lib/supabase.mjs";
import { anthropicComplete, hasApiKey } from "./lib/analyze.mjs";
import { validateRow, parseRows, EVIDENCE_KINDS } from "./lib/evidence.mjs";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const MAX = Number(flag("max", 25));
const CONCURRENCY = Number(flag("concurrency", 3));
const DRY = args.includes("--dry-run");
const ONLY = flag("company", null);

// Articles per company. Enough to catch a contract among routine coverage, few
// enough to keep the judgement sharp and the call cheap.
const ARTICLES_PER_COMPANY = 14;

// Deliberately not the repo default (Haiku). This job publishes to a public
// catalogue with no human review, and its hard part is refusing off-topic
// articles — exactly where cheaper models have failed on this project before.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You extract evidence of real-world commercial and operational activity from news articles, for a reference catalogue of uncrewed-systems companies.

You are given one company and a numbered list of news articles. The articles were linked to the company by an automatic entity extractor THAT IS OFTEN WRONG. Treat every link as a guess you must check.

Return one row per piece of evidence, as JSON:

{"rows":[{"article":3,"kind":"contract","counterparty":"UK Ministry of Defence","counterparty_country":"United Kingdom","summary":"Awarded a GBP 4.5m contract to supply 20 systems.","occurred_year":2026,"value_amount":4500000,"value_currency":"GBP","confidence":"high"}]}

"kind" is one of: ${EVIDENCE_KINDS.join(", ")}.
  customer       a named organisation is using or has bought from this company
  contract       a named award, order or framework
  deployment     confirmed operational use by a named user — not a trial
  partnership    a named joint programme, teaming or reseller agreement
  funding        a named investor or a disclosed round
  demonstration  a public demo, trial, exercise or test event
  production     serial production, delivery volumes or capacity

RULES

1. Only report what the article states about THIS company. If the article is about a different company, or mentions this company only in passing, or is general industry commentary, produce no row for it. Most articles produce no rows. An empty list is a correct and common answer.
2. "counterparty" is the other side — the customer, partner, investor or operator. It must be a NAMED organisation, unit or force as written in the article. Never "undisclosed", "a customer", "the government" or "various".
3. Never guess numbers. Omit value_amount unless the article states a figure.
4. Never use knowledge from outside the articles. If you know the company well, that still does not count as evidence here.
5. "article" is the number of the article the claim comes from. One row cites exactly one article.
6. confidence: "high" when the article states it plainly about this company; "medium" when it is clear but secondhand or partial; "low" when it is implied. Do not report anything weaker than that — leave it out.

Return only the JSON object.`;

function userPrompt(company, articles) {
  const where = [company.hq_country, company.company_type].filter(Boolean).join(", ");
  const about = company.description ? `\n${String(company.description).slice(0, 400)}` : "";
  const list = articles.map((a, i) =>
    `${i + 1}. [${a.published_at ? String(a.published_at).slice(0, 10) : "undated"} · ${a.source || "?"}] ` +
    `${a.title}\n   ${(a.summary || "").slice(0, 320)}`).join("\n\n");
  return `COMPANY: ${company.name}${where ? ` (${where})` : ""}${about}\n\nARTICLES:\n\n${list}`;
}

async function fetchBatch() {
  const [companies, links, articles] = await Promise.all([
    fetchAllRows("companies", "id,name,hq_country,company_type,description,evidence_scanned_at"),
    fetchAllRows("article_companies", "company_id,article_id"),
    fetchAllRows("articles", "id,title,summary,url,source,published_at"),
  ]);

  const byId = new Map(articles.map((a) => [a.id, a]));
  const linked = new Map();
  for (const l of links) {
    const a = byId.get(l.article_id);
    if (!a || !a.url || !a.title) continue;
    const arr = linked.get(l.company_id) || [];
    arr.push(a);
    linked.set(l.company_id, arr);
  }

  let pool = companies.filter((c) => linked.has(c.id));
  pool = ONLY
    ? pool.filter((c) => c.name.toLowerCase().includes(ONLY.toLowerCase()))
    : pool.filter((c) => !c.evidence_scanned_at);

  // Most-covered companies first: they carry the most evidence per call.
  pool.sort((a, b) => (linked.get(b.id).length - linked.get(a.id).length));

  return pool.slice(0, MAX).map((c) => ({
    company: c,
    articles: linked.get(c.id)
      .sort((x, y) => String(y.published_at || "").localeCompare(String(x.published_at || "")))
      .slice(0, ARTICLES_PER_COMPANY),
  }));
}

async function stampScanned(id) {
  const { url, serviceKey } = sbConfig();
  const res = await sbFetch(`${url}/rest/v1/companies?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify({ evidence_scanned_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`stamp ${id} ${res.status}: ${await res.text()}`);
}

async function handle({ company, articles }, stats) {
  const text = await anthropicComplete({
    system: SYSTEM,
    user: userPrompt(company, articles),
    maxTokens: 2000,
    model: MODEL,
  });

  const raw = parseRows(text);
  if (raw == null) {
    stats.unparsable++;
    console.error(`  ${company.name}: could not parse a response, leaving unscanned`);
    return;
  }

  const rows = [];
  for (const r of raw) {
    const v = validateRow(r, articles);
    if (!v.ok) { stats.rejected.push(`${company.name}: ${v.why}`); continue; }
    rows.push({ company_id: company.id, ...v.row });
  }

  stats.companies++;
  stats.rows += rows.length;
  if (!rows.length) {
    console.log(`  ${company.name}: nothing (${articles.length} articles)`);
  } else {
    for (const r of rows) {
      console.log(`  ${company.name}: ${r.kind} — ${r.counterparty || "—"}` +
        `${r.occurred_year ? ` (${r.occurred_year})` : ""}\n      ${r.summary}\n      ${r.source_url}`);
    }
  }

  if (DRY) return;
  if (rows.length) {
    await insertRows("company_evidence", rows, {
      onConflict: "company_id,kind,source_url,counterparty",
      ignoreDuplicates: true,
    });
  }
  await stampScanned(company.id);
}

async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

async function main() {
  await loadDotenv();
  sbConfig();
  if (!hasApiKey()) throw new Error("ANTHROPIC_API_KEY is required.");

  console.log(`Model ${MODEL}${DRY ? "  (dry run — nothing will be written)" : ""}`);
  const batch = await fetchBatch();
  if (!batch.length) { console.log("Nothing to scan."); return; }
  console.log(`${batch.length} companies, ${batch.reduce((n, b) => n + b.articles.length, 0)} articles\n`);

  const stats = { companies: 0, rows: 0, unparsable: 0, rejected: [] };
  await pool(batch, CONCURRENCY, (item) =>
    handle(item, stats).catch((e) => console.error(`  ${item.company.name}: ${e.message}`)));

  console.log(`\n${stats.companies} companies scanned, ${stats.rows} evidence rows` +
    `${DRY ? " (not written)" : ""}.`);
  if (stats.rejected.length) {
    console.log(`\n${stats.rejected.length} rows rejected by validation:`);
    stats.rejected.slice(0, 20).forEach((r) => console.log(`  ${r}`));
  }
  if (stats.unparsable) console.log(`${stats.unparsable} unparsable responses — those companies stay unscanned.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
