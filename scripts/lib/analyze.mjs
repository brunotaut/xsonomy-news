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

import { fetchPage } from "./http.mjs";
import { decodeEntities } from "./feed.mjs";
import { IDENTITY_KINDS, decideIdentity, makerCue } from "./identity.mjs";

// Overridable so the evaluation can be exercised end-to-end against a local
// mock before it is pointed at the real model. Deliberately NOT named
// ANTHROPIC_BASE_URL: that variable is commonly already set in a developer's
// shell for other Anthropic tooling, and inheriting it here would silently
// retarget a local ingest run. Unset in CI and in production.
const API_URL = `${process.env.XSONOMY_ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

const MAX_BODY_CHARS = 12000;   // plenty for entity extraction; keeps tokens low
const MAX_ITEMS = 40;           // hard cap per field, defensive
const MAX_ITEM_LEN = 80;        // a single name shouldn't exceed this

// Output budget. This was 1024, which truncated the model mid-JSON on
// evidence-heavy articles: one French opex360 story with ~8 products needed
// roughly 900-1200 output tokens for its evidence array alone, and a truncated
// object fails JSON.parse and surfaced as the catch-all "unparseable response".
// A retry at the larger budget then costs nothing on the common case.
const MAX_OUTPUT_TOKENS = 4096;
const RETRY_OUTPUT_TOKENS = 8192;

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// --- HTML → readable text --------------------------------------------------

// Boilerplate HEADINGS that mark the end of the story and the start of
// related-links / recommended / comment sections. We cut the text here so
// entities from sidebars (e.g. a "More in Drones" rail) don't leak in.
//
// Matched ONLY at the start of a line, because that is what these are:
// headings and link labels. Matching them anywhere in the text truncated real
// articles — "Bill Merz, Senior Vice President of Aerospace and Defense
// Technologies for OCEANEERING, comments:" cut the XLUUV story at 2,292 of its
// 5,018 characters, discarding more than half the body mid-quote.
const CUT_MARKERS = [
  "related articles", "related stories", "related posts", "more like this",
  "more in", "more from", "latest in", "latest news", "most read", "most popular",
  "popular posts", "trending", "read more", "you may also", "you might also",
  "recommended", "post navigation", "previous post", "next post", "share this",
  "sign up", "subscribe to our", "newsletter", "leave a comment", "comments",
  "follow us", "about the author", "in this story", "©", "all rights reserved",
];
const CUT_MIN = 400;   // never cut before this much real text has accumulated

// Index of the first line at or after CUT_MIN that BEGINS with a boilerplate
// marker, or -1. A marker in mid-sentence is prose, not a heading.
function firstMarkerLine(s) {
  const lower = s.toLowerCase();
  let best = -1;
  for (const mk of CUT_MARKERS) {
    for (let from = 0; ; ) {
      const i = lower.indexOf(mk, from);
      if (i === -1) break;
      if ((i === 0 || lower[i - 1] === "\n") && i >= CUT_MIN) {
        if (best === -1 || i < best) best = i;
        break;
      }
      from = i + 1;
    }
  }
  return best;
}

// Isolate the story region. <article> when the page has exactly one, else
// <main>, else the longest <article> when there are several (index/rail pages),
// else the whole document.
//
// Spans are taken from the FIRST opening tag to the LAST matching close rather
// than by a non-greedy match, so a nested element of the same name cannot end
// the region early.
function selectRegion(html) {
  const opens = (html.match(/<article\b/gi) || []).length;
  const lower = html.toLowerCase();
  if (opens === 1) {
    const i = html.search(/<article\b/i);
    const j = lower.lastIndexOf("</article>");
    if (i !== -1 && j > i) return html.slice(i, j + "</article>".length);
  }
  const mi = html.search(/<main\b/i);
  if (mi !== -1) {
    const mj = lower.lastIndexOf("</main>");
    if (mj > mi) return html.slice(mi, mj + "</main>".length);
  }
  if (opens > 1) {
    const parts = html.match(/<article\b[\s\S]*?<\/article>/gi) || [];
    if (parts.length) return parts.reduce((a, b) => (b.length > a.length ? b : a));
  }
  return html;
}

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
  // Pick the story region BEFORE stripping junk containers. That strip is
  // single-level and non-greedy, so on a page with nested <div>s it can delete
  // an opening <article> tag and leave its </article> behind. That is exactly
  // what happened to the XLUUV story: <article> went 1 → 0 while </article>
  // stayed, region selection then found nothing, the whole page was kept, and a
  // leading rail of OTHER headlines (DroneSentry-X Mk2, Mission Master SP,
  // FUSE, Chaparral) was fed to the model as if it were the article.
  s = selectRegion(s);
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
  // Block tags → newlines so sentences don't run together.
  s = s.replace(/<\/(p|div|li|h[1-6]|br|tr|section)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  // Collapse whitespace; keep paragraph breaks.
  s = s.replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  // Truncate at the first boilerplate HEADING that starts a line after CUT_MIN
  // characters. Line-anchored on purpose — see CUT_MARKERS.
  const cut = firstMarkerLine(s);
  if (cut !== -1) s = s.slice(0, cut).trim();
  return s;
}

// Why a body could not be used. An article analysed without its body is not a
// tested article, and the evaluation has to be able to say which it was.
export const BODY_FAILURES = {
  FETCH: "fetch_failed",        // network error, 403/404, timeout
  SHORT: "body_too_short",      // block page, consent wall, JS-only shell
  MISMATCH: "body_mismatch",    // fetched page is not the article we asked for
};

const MIN_BODY_CHARS = 200;

// Fetch the article page and report what happened, not just the text.
// Returns { text, finalUrl, status, failure, detail }.
export async function fetchBody(url, { expectTitle } = {}) {
  let res;
  try {
    res = await fetchPage(url, { timeout: 15000, retries: 1 });
  } catch (e) {
    return { text: "", finalUrl: url, status: 0, failure: BODY_FAILURES.FETCH, detail: e.message.slice(0, 160) };
  }
  const text = htmlToText(res.html);
  if (text.length < MIN_BODY_CHARS) {
    return {
      text: "", finalUrl: res.finalUrl, status: res.status,
      failure: BODY_FAILURES.SHORT, detail: `${text.length} chars after cleanup`,
    };
  }
  // A redirect to a section front or a soft 404 returns a real page that is not
  // the story. When we know the expected headline, require some of it to
  // survive in the fetched text before trusting the body.
  if (expectTitle && !titleAgrees(expectTitle, text)) {
    return {
      text: "", finalUrl: res.finalUrl, status: res.status,
      failure: BODY_FAILURES.MISMATCH, detail: `fetched page does not contain the expected headline`,
    };
  }
  return { text, finalUrl: res.finalUrl, status: res.status, failure: null };
}

// Loose headline agreement: at least half of the headline's distinctive words
// appear in the fetched text. Deliberately tolerant — publishers rewrite
// headlines — but enough to catch a redirect to an unrelated page.
function titleAgrees(title, text) {
  const stop = new Set(["the","a","an","and","or","of","for","to","in","on","with","by","at","as","is","are","from","its","new","after","over","into"]);
  const words = String(title).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/).filter((w) => w.length >= 4 && !stop.has(w));
  if (words.length < 3) return true;          // too little to judge on
  const hay = text.toLowerCase();
  const hits = words.filter((w) => hay.includes(w)).length;
  return hits / words.length >= 0.5;
}

// Back-compat: text or "" — used where only the text matters.
export async function fetchBodyText(url) {
  return (await fetchBody(url)).text;
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
  "  - quote: a VERBATIM span of at least 12 and at most 200 characters, copied",
  "    exactly from the article text above, in which this name appears. Copy it",
  "    character for character; do not paraphrase, translate or tidy it. One",
  "    sentence is usually right; never copy a whole paragraph. If you cannot",
  "    find the name in the text, use null.",
  "  - maker: the organisation the ARTICLE states makes this product, or null.",
  "    Null is the correct answer whenever the article does not say. Do not use",
  "    your own knowledge here, and do not infer a maker from a company being",
  "    mentioned in the same article or from the names resembling each other.",
  "  - makerQuote: a VERBATIM span, copied exactly from the article, that names",
  "    BOTH this product and that maker and states the relationship. One span,",
  "    naming both. If no single span does that, both maker and makerQuote must",
  "    be null — an article that mentions a company and a product separately is",
  "    not evidence that the company makes it. Keep it under 200 characters.",
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
  "Keep the whole reply compact: no prose, no markdown, no code fence.",
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

// Why a reply could not be turned into entities. Kept distinct because the
// right response differs: truncation is worth another call at a bigger budget,
// invalid JSON is worth one re-ask, and a schema violation means the prompt has
// drifted and a human should look. Collapsing all of them into one
// "unparseable response" is what hid the opex360 failure.
export const PARSE_FAILURES = {
  EMPTY: "empty_reply",
  NO_OBJECT: "no_json_object",
  INVALID_JSON: "invalid_json",
  TRUNCATED: "truncated_json",
  SCHEMA: "schema_violation",
};

// Pull the first JSON object out of a model response and say what went wrong.
// Returns { value } or { failure, detail }.
export function parseJsonDetailed(text, { stopReason } = {}) {
  if (!text || !text.trim()) {
    return { failure: stopReason === "max_tokens" ? PARSE_FAILURES.TRUNCATED : PARSE_FAILURES.EMPTY };
  }
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1) return { failure: PARSE_FAILURES.NO_OBJECT, detail: raw.slice(0, 120) };
  // No closing brace, or the model stopped at the token ceiling: the object is
  // cut off rather than malformed. Say so, because it is recoverable.
  if (end < start || stopReason === "max_tokens") {
    return { failure: PARSE_FAILURES.TRUNCATED, detail: `stop_reason=${stopReason ?? "unknown"}` };
  }
  try {
    return { value: JSON.parse(raw.slice(start, end + 1)) };
  } catch (e) {
    return { failure: PARSE_FAILURES.INVALID_JSON, detail: e.message.slice(0, 160) };
  }
}

// Shape check. The parse succeeding says nothing about the object being the one
// we asked for, and a wrong shape must not become a confident empty answer.
export function validateEntities(obj) {
  const bad = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return ["reply is not a JSON object"];
  for (const f of ["companies", "products"]) {
    if (!Array.isArray(obj[f])) bad.push(`${f} is ${obj[f] === undefined ? "missing" : "not an array"}`);
  }
  if (obj.evidence !== undefined && !Array.isArray(obj.evidence)) bad.push("evidence is not an array");
  return bad;
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
export async function anthropicMessage({ system, user, maxTokens = 1024, retries = 4, model } = {}) {
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
        return {
          text: (data.content || []).map((b) => b.text || "").join(""),
          stopReason: data.stop_reason || null,
          usage: data.usage || null,
          model: data.model || null,
        };
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

// Text-only wrapper. Six callers (company enrichment, product enrichment,
// maturity assessment, evidence extraction, the resolver gate) want just the
// reply, so their signature is unchanged.
export async function anthropicComplete(opts) {
  return (await anthropicMessage(opts)).text;
}

// Back-compat: object-or-null parse, for callers that only branch on null.
export const parseJsonObject = (text) => parseJsonDetailed(text).value ?? null;

// One extraction call, with a bounded retry for the recoverable failures.
//
// Recoverable means the model produced something we could not use but a second
// call plausibly fixes: a truncated object (retry at a bigger budget) or
// invalid JSON (one re-ask). A schema violation is NOT retried — the prompt has
// drifted and repeating the call just spends money twice. Returns
// { parsed, attempts, usage } or { failure, detail, attempts, usage }.
async function extractEntities(userContent) {
  const attempts = [];
  let usage = null;
  let budget = MAX_OUTPUT_TOKENS;

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await anthropicMessage({
      system: SYSTEM,
      user: attempt === 0 ? userContent : `${userContent}\n\nReply with compact JSON only. Keep every quote under 200 characters.`,
      maxTokens: budget,
    });
    usage = reply.usage || usage;
    const got = parseJsonDetailed(reply.text, { stopReason: reply.stopReason });
    if (got.value) {
      const bad = validateEntities(got.value);
      if (!bad.length) return { parsed: got.value, attempts, usage };
      attempts.push({ failure: PARSE_FAILURES.SCHEMA, detail: bad.join("; "), stopReason: reply.stopReason });
      return { failure: PARSE_FAILURES.SCHEMA, detail: bad.join("; "), attempts, usage };
    }
    attempts.push({ failure: got.failure, detail: got.detail, stopReason: reply.stopReason });
    const recoverable = got.failure === PARSE_FAILURES.TRUNCATED || got.failure === PARSE_FAILURES.INVALID_JSON;
    if (!recoverable || attempt === 1) {
      return { failure: got.failure, detail: got.detail, attempts, usage };
    }
    if (got.failure === PARSE_FAILURES.TRUNCATED) budget = RETRY_OUTPUT_TOKENS;
  }
  // Unreachable: the loop always returns.
  return { failure: PARSE_FAILURES.EMPTY, attempts, usage };
}

// --- public API ------------------------------------------------------------

// Analyze one article. Returns { companies, products, ok, usedBody, error? }.
// `prefetchedBody` lets a caller pass text it already has (skips the fetch).
// `evidenceFor` restricts the evidence records to a given set of names instead
// of the names this call just extracted. The evidence backfill uses it to fill
// in evidence for products ALREADY stored on an article without touching the
// stored companies/products lists — adding what was missing rather than
// rewriting history.
export async function analyzeArticle({ url, title, summary }, { prefetchedBody, evidenceFor } = {}) {
  if (!hasApiKey()) return { companies: [], products: [], evidence: [], verifiedAgainst: "", ok: false, usedBody: false, error: "no ANTHROPIC_API_KEY", errorKind: "no_api_key" };

  let body = prefetchedBody || "";
  let bodyFailure = null, bodyDetail = null, finalUrl = url || null, status = null;
  if (!body && url) {
    const got = await fetchBody(url, { expectTitle: title });
    body = got.text;
    bodyFailure = got.failure;
    bodyDetail = got.detail || null;
    finalUrl = got.finalUrl;
    status = got.status;
  }
  const usedBody = body.length > 0;
  const bodyInfo = { usedBody, bodyFailure, bodyDetail, finalUrl, status, bodyChars: body.length };

  try {
    const got = await extractEntities(buildUserContent({ title, summary, body }));
    if (got.failure) {
      // A malformed or truncated reply is a FAILURE, never a confident empty
      // extraction. Returning ok:true with empty arrays here would have let
      // the opex360 article count as "analysed, nothing found".
      return {
        companies: [], products: [], evidence: [], verifiedAgainst: "",
        ok: false, ...bodyInfo,
        error: `${got.failure}${got.detail ? `: ${got.detail}` : ""}`,
        errorKind: got.failure, attempts: got.attempts, usage: got.usage,
      };
    }
    const parsed = got.parsed;
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
      // Only the real article body counts as article text. A headline and an
      // RSS summary are not the article: a quote "verified" against them is
      // verified against the one sentence the model was already shown, which
      // is how the gate used to judge identity from headlines alone. With no
      // body every candidate becomes REVIEW, which is where an unverifiable
      // product belongs — reviewable, not published.
      const d = decideIdentity(e, verifiedAgainst, { haveArticleText: usedBody });
      return {
        name: e.name,
        kind: e.kind,
        outcome: d.outcome,
        reason: d.reason,
        quote: e.quote,              // the span itself, so a reviewer can read it
        maker: d.maker,              // null unless a span SAYS the maker makes it
        // The cue is recorded even when no maker is assigned, so a relationship
        // we judged ambiguous (e.g. `supply_only`) is auditable rather than
        // indistinguishable from "the article said nothing".
        makerCue: makerCue(e),
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
      ...bodyInfo,
      attempts: got.attempts,
      usage: got.usage,
    };
  } catch (e) {
    return {
      companies: [], products: [], evidence: [], verifiedAgainst: "",
      ok: false, ...bodyInfo, error: e.message, errorKind: "api_failure",
    };
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
