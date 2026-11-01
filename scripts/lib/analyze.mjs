// LLM entity extraction: read an article, return the companies and products it
// mentions, as two string arrays. Used by the daily ingest to fill the
// articles.companies / articles.products columns.
//
// Design goals:
//   • Never throw. On any failure (no key, fetch blocked, bad JSON, API error)
//     return { companies: [], products: [], ok: false } so ingestion keeps going.
//   • Prefer the FULL article body; fall back to title + summary when the page
//     can't be fetched (some sites block bots / are JS-only).
//   • Cheap + deterministic: small model, temperature 0, capped input length.
//
// Env: ANTHROPIC_API_KEY (required to do anything), ANTHROPIC_MODEL (optional).

import { fetchText } from "./http.mjs";
import { decodeEntities } from "./feed.mjs";
import { IDENTITY_KINDS, decideIdentity } from "./identity.mjs";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_BODY_CHARS = 12000;   // plenty for entity extraction; keeps tokens low
const MAX_ITEMS = 40;           // hard cap per field, defensive
const MAX_ITEM_LEN = 80;        // a single name shouldn't exceed this

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// --- HTML → readable text --------------------------------------------------

// Boilerplate headings that mark the end of the story and the start of
// related-links / recommended / comment sections. We cut the text here so
// entities from sidebars (e.g. a "More in Drones" rail) don't leak in.
const CUT_MARKERS = [
  "related articles", "related stories", "related posts", "more like this",
  "more in", "more from", "latest in", "latest news", "most read", "most popular",
  "popular posts", "trending", "read more", "you may also", "you might also",
  "recommended", "post navigation", "previous post", "next post", "share this",
  "sign up", "subscribe to our", "newsletter", "leave a comment", "comments",
  "follow us", "about the author", "in this story", "©", "all rights reserved",
];
const CUT_MIN = 400;   // never cut before this much real text has accumulated

// Strip boilerplate and pull the human-readable text out of an article page.
// Not a full readability port — just enough signal for entity extraction.
export function htmlToText(html) {
  if (!html) return "";
  let s = html;
  // Drop the obvious non-content regions wholesale.
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ")
       .replace(/<style[\s\S]*?<\/style>/gi, " ")
       .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
       .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
       .replace(/<header[\s\S]*?<\/header>/gi, " ")
       .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
       .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
       .replace(/<form[\s\S]*?<\/form>/gi, " ");
  // Drop containers whose class/id smells like chrome: related rails, sharing,
  // recommendations, comments, sidebars, newsletters, menus. Non-greedy and
  // single-level, but catches the common WordPress/news-CMS patterns.
  const JUNK = "related|recommend|share|social|newsletter|subscribe|comment|sidebar|" +
               "widget|promo|advert|read-?more|more-?(stories|posts|from|like)|popular|" +
               "trending|latest|footer|nav(bar|igation)?|menu|breadcrumb|tags?|author-?bio";
  const junkRe = new RegExp(
    `<(div|section|ul|ol|aside)[^>]*\\b(?:class|id)\\s*=\\s*["'][^"']*(?:${JUNK})[^"']*["'][^>]*>[\\s\\S]*?</\\1>`,
    "gi"
  );
  for (let i = 0; i < 3; i++) s = s.replace(junkRe, " ");   // a few passes for nesting
  // Remove list blocks that are mostly links (menus / related rails).
  s = s.replace(/<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi, (m) =>
    (m.match(/<a\b/gi) || []).length >= 3 ? " " : m);
  // Prefer the <main> region, then <article>; either usually isolates the story.
  const main = s.match(/<main[\s\S]*?<\/main>/i);
  if (main) s = main[0];
  else { const art = s.match(/<article[\s\S]*?<\/article>/i); if (art) s = art[0]; }
  // Block tags → newlines so sentences don't run together.
  s = s.replace(/<\/(p|div|li|h[1-6]|br|tr|section)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  // Collapse whitespace; keep paragraph breaks.
  s = s.replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  // Truncate at the first boilerplate marker that appears after CUT_MIN chars.
  const lower = s.toLowerCase();
  let cut = -1;
  for (const mk of CUT_MARKERS) {
    const idx = lower.indexOf(mk, CUT_MIN);
    if (idx !== -1 && (cut === -1 || idx < cut)) cut = idx;
  }
  if (cut !== -1) s = s.slice(0, cut).trim();
  return s;
}

// Fetch the article page and return clean text, or "" if it can't be had.
export async function fetchBodyText(url) {
  try {
    const html = await fetchText(url, { timeout: 15000, retries: 1 });
    const text = htmlToText(html);
    return text.length >= 200 ? text : "";   // too short = likely a block page
  } catch {
    return "";
  }
}

// --- LLM call --------------------------------------------------------------

const SYSTEM = [
  "You extract named entities from defense/UAV news articles.",
  "Return ONLY entities that actually appear in the article text. Do not invent",
  "entities and do not pull names from unrelated 'related articles' fragments.",
  "",
  "companies: commercial organisations that make, sell, fund, operate, or are",
  "  otherwise named in the article — manufacturers, defense firms, startups,",
  "  integrators, contractors. Include adversary/third-party makers. If a product",
  "  is named but its maker is not, infer the maker ONLY when it is unambiguous",
  "  and well known (e.g. 'MQ-28 Ghost Bat' -> Boeing, 'M109A7 Paladin' -> BAE",
  "  Systems, 'CROWS' -> Kongsberg, 'Bayraktar TB2' -> Baykar, 'Starlink' -> SpaceX).",
  "",
  "products: SPECIFIC named systems — proper-noun models of platforms, drones,",
  "  munitions, missiles, weapon systems, or named software. Include adversary/",
  "  competitor products mentioned in passing (e.g. Shahed-136, Orlan-10).",
  "",
  "evidence: one entry per name you put in `products`, carrying what the ARTICLE",
  "  says about it. This is the part that gets checked, so do not guess here.",
  "  - kind: what the name actually denotes, judged from this article:",
  "      'product'      a distinct named model you could field or buy",
  "      'programme'    a procurement or development programme, even when its",
  "                     acronym looks like a model designation",
  "      'class'        a size or capability class, or a generic designator,",
  "                     even when written as an acronym",
  "      'family'       a product range or family rather than one model",
  "      'contract'     a contract, framework agreement or lot",
  "      'organisation' a company, agency, service or consortium",
  "      'unclear'      the article does not settle which of these it is",
  "    If the article does not make the name a specific model, it is NOT",
  "    'product'. Prefer 'unclear' over guessing.",
  "  - quote: a VERBATIM span of at least 12 characters, copied exactly from the",
  "    article text above, in which this name appears. Copy it character for",
  "    character; do not paraphrase, translate or tidy it. If you cannot find",
  "    the name in the text, use null.",
  "  - maker: the organisation the ARTICLE states makes this product, or null.",
  "    Null is the correct answer whenever the article does not say. Do not use",
  "    your own knowledge here, and do not infer a maker from a company being",
  "    mentioned in the same article or from the names resembling each other.",
  "  - makerQuote: a VERBATIM span, copied exactly from the article, that names",
  "    BOTH this product and that maker and states the relationship. One span,",
  "    naming both. If no single span does that, both maker and makerQuote must",
  "    be null — an article that mentions a company and a product separately is",
  "    not evidence that the company makes it.",
  "",
  "STRICT EXCLUSIONS (never output these):",
  "  - Governments, militaries, agencies, programs, labs: U.S. Army, Navy, Air",
  "    Force, Pentagon, DoD, Department of War, DARPA, NATO, EU, ministries, DEVCOM.",
  "  - Media outlets, publications, and book publishers (e.g. TWZ, Knox Press).",
  "  - Universities, trade shows, exercises, conferences (Eurosatory, Valiant Shield).",
  "  - People and places (cities, countries, bases).",
  "  - GENERIC technology categories, NOT specific products. Exclude bare terms like",
  "    'radar', 'RF detection', 'electro-optical sensors', 'acoustic systems',",
  "    'jammer', 'drone', 'loitering munition', 'counter-UAS', 'AI', 'machine learning'.",
  "    A product must be a distinct branded/model name, not a capability or category.",
  "",
  "Normalise each name to a single canonical form; do not duplicate variants.",
  "If nothing qualifies for a field, return an empty array.",
  "Respond with a single JSON object and nothing else:",
  '{"companies": string[], "products": string[],',
  '  "evidence": [{"name": string, "kind": string, "quote": string|null,',
  '               "maker": string|null, "makerQuote": string|null}]}',
].join("\n");

function buildUserContent({ title, summary, body }) {
  const parts = [];
  if (title) parts.push(`TITLE: ${title}`);
  if (summary) parts.push(`SUMMARY: ${summary}`);
  parts.push("ARTICLE:");
  parts.push((body || summary || title || "").slice(0, MAX_BODY_CHARS));
  return parts.join("\n");
}

// Pull the first JSON object out of a model response, defensively.
function parseEntities(text) {
  if (!text) return null;
  let raw = text.trim();
  // Strip ```json fences if present.
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  // Isolate the outermost {...}.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanList(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    if (typeof v !== "string") continue;
    const name = v.trim().replace(/\s+/g, " ").slice(0, MAX_ITEM_LEN);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

// Evidence is only useful if it is shaped right, so it is normalised hard and
// anything malformed becomes absent rather than wrong. An unrecognised `kind`
// is kept verbatim: identity.mjs treats a kind it does not know as "unknown",
// which routes to review, and silently rewriting it to "unclear" here would
// hide a drifting prompt.
const MAX_QUOTE_LEN = 400;
function cleanEvidence(arr, productNames) {
  if (!Array.isArray(arr)) return [];
  const want = new Set(productNames.map((n) => n.toLowerCase()));
  const out = [];
  const seen = new Set();
  for (const e of arr) {
    if (!e || typeof e !== "object") continue;
    const name = typeof e.name === "string" ? e.name.trim().replace(/\s+/g, " ").slice(0, MAX_ITEM_LEN) : "";
    if (!name) continue;
    const key = name.toLowerCase();
    // Only keep evidence for names that actually made it into products[], so a
    // model cannot smuggle an extra entity in through this field.
    if (!want.has(key) || seen.has(key)) continue;
    seen.add(key);
    const str = (v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, MAX_QUOTE_LEN) : null);
    out.push({
      name,
      kind: typeof e.kind === "string" && e.kind.trim() ? e.kind.trim().toLowerCase().slice(0, 24) : null,
      quote: str(e.quote),
      maker: typeof e.maker === "string" && e.maker.trim() ? e.maker.trim().slice(0, MAX_ITEM_LEN) : null,
      makerQuote: str(e.makerQuote),
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

// Exported so a caller can tell a prompt that has drifted from one that is
// simply reporting uncertainty.
export const unknownKinds = (evidence) =>
  [...new Set((evidence || []).map((e) => e.kind).filter((k) => k && !IDENTITY_KINDS.includes(k)))];

const RETRY_STATUS = new Set([429, 500, 502, 503, 529]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Generic Anthropic Messages call with retry/backoff. Returns the text reply.
// Shared by the article entity pass and the company-enrichment pipeline.
// `model` lets a caller override the repo default per job: the entity pass is
// cheap and high-volume, while a judgement that gets published unreviewed is
// worth a stronger model.
export async function anthropicComplete({ system, user, maxTokens = 1024, retries = 4, model } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 40000);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "x-api-key": key,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model || MODEL,
          max_tokens: maxTokens,
          temperature: 0,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        return (data.content || []).map((b) => b.text || "").join("");
      }
      const detail = await res.text().catch(() => "");
      // Retry on rate limits / transient server errors, honoring Retry-After.
      if (RETRY_STATUS.has(res.status) && attempt < retries) {
        const ra = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(30000, 1000 * 2 ** attempt);
        await sleep(wait);
        lastErr = new Error(`Anthropic ${res.status}: ${detail.slice(0, 120)}`);
        continue;
      }
      throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 200)}`);
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      // Network/abort errors: back off and retry too.
      if (attempt < retries && (e.name === "AbortError" || e.name === "TypeError")) {
        await sleep(Math.min(30000, 1000 * 2 ** attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// Also export the defensive JSON-object parser so other pipelines can reuse it.
export { parseEntities as parseJsonObject };

const callClaude = (userContent) => anthropicComplete({ system: SYSTEM, user: userContent, maxTokens: 1024 });

// --- public API ------------------------------------------------------------

// Analyze one article. Returns { companies, products, ok, usedBody, error? }.
// `prefetchedBody` lets a caller pass text it already has (skips the fetch).
// `evidenceFor` restricts the evidence records to a given set of names instead
// of the names this call just extracted. The evidence backfill uses it to fill
// in evidence for products ALREADY stored on an article without touching the
// stored companies/products lists — adding what was missing rather than
// rewriting history.
export async function analyzeArticle({ url, title, summary }, { prefetchedBody, evidenceFor } = {}) {
  if (!hasApiKey()) return { companies: [], products: [], evidence: [], verifiedAgainst: "", ok: false, usedBody: false, error: "no ANTHROPIC_API_KEY" };

  let body = prefetchedBody || "";
  if (!body && url) body = await fetchBodyText(url);
  const usedBody = body.length > 0;

  try {
    const reply = await callClaude(buildUserContent({ title, summary, body }));
    const parsed = parseEntities(reply);
    if (!parsed) return { companies: [], products: [], ok: false, usedBody, error: "unparseable response" };
    const products = cleanList(parsed.products);
    // `verifiedAgainst` is the text the quotes were taken from, and it is the
    // only thing a quote can be checked against later. The article body is not
    // stored anywhere, so if this is not carried forward now it is gone: that
    // is exactly why the gate used to decide from headlines alone.
    const verifiedAgainst = body || [title, summary].filter(Boolean).join("\n");
    // Verify HERE, while the text is still in hand, and store only the verdict.
    // The alternative — carrying 12k of body text per article so a later stage
    // can check a quote — buys nothing and costs a column of article bodies.
    const evidenceNames = Array.isArray(evidenceFor) && evidenceFor.length ? evidenceFor : products;
    const evidence = cleanEvidence(parsed.evidence, evidenceNames).map((e) => {
      const d = decideIdentity(e, verifiedAgainst, { haveArticleText: Boolean(verifiedAgainst) });
      return {
        name: e.name,
        kind: e.kind,
        outcome: d.outcome,
        reason: d.reason,
        quote: e.quote,              // the span itself, so a reviewer can read it
        maker: d.maker,              // null unless ONE span named both sides
        makerClaimed: e.maker,       // what the model said, kept so a dropped
                                     // ownership claim is auditable rather than
                                     // silently vanishing
        quotedFromBody: usedBody,
      };
    });
    return {
      companies: cleanList(parsed.companies),
      products,
      evidence,
      verifiedAgainst,
      ok: true,
      usedBody,
    };
  } catch (e) {
    return { companies: [], products: [], evidence: [], verifiedAgainst: "", ok: false, usedBody, error: e.message };
  }
}

// Run analyzeArticle over many items with bounded concurrency. Calls onResult
// (if given) as each finishes, so callers can stream writes. Returns results[].
export async function analyzeBatch(items, { concurrency = 4, onResult } = {}) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      const r = await analyzeArticle(items[i]);
      results[i] = r;
      if (onResult) await onResult(items[i], r, i);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}
