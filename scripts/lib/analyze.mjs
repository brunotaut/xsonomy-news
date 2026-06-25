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
  // Prefer the <article> region if present; it usually isolates the story.
  const art = s.match(/<article[\s\S]*?<\/article>/i);
  if (art) s = art[0];
  // Block tags → newlines so sentences don't run together.
  s = s.replace(/<\/(p|div|li|h[1-6]|br|tr|section)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  // Collapse whitespace; keep paragraph breaks.
  s = s.replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
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
  "Return ONLY the entities that actually appear in the text.",
  "",
  "companies: organisations that make, sell, fund, operate, or are otherwise named",
  "  in the article — manufacturers, defense firms, startups, integrators. If a",
  "  product is named but its maker is not, infer the maker ONLY when it is",
  "  unambiguous and well known (e.g. 'MQ-28 Ghost Bat' -> Boeing, 'M109A7",
  "  Paladin' -> BAE Systems, 'CROWS' -> Kongsberg). Include every company",
  "  mentioned, including adversary/third-party makers.",
  "products: named systems, platforms, drones, munitions, software, or weapon",
  "  systems mentioned — including adversary/competitor products mentioned in",
  "  passing (e.g. Shahed-136, Orlan-10).",
  "",
  "Exclude: government bodies/militaries (U.S. Army, Pentagon, NATO, ministries),",
  "  publications/media outlets, trade shows/exercises, people, and places.",
  "Normalise each name to a single canonical form; do not duplicate variants.",
  "Respond with a single JSON object and nothing else:",
  '{"companies": string[], "products": string[]}',
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

async function callClaude(userContent) {
  const key = process.env.ANTHROPIC_API_KEY;
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
        model: MODEL,
        max_tokens: 1024,
        temperature: 0,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    clearTimeout(t);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data.content || []).map((b) => b.text || "").join("");
  } finally {
    clearTimeout(t);
  }
}

// --- public API ------------------------------------------------------------

// Analyze one article. Returns { companies, products, ok, usedBody, error? }.
// `prefetchedBody` lets a caller pass text it already has (skips the fetch).
export async function analyzeArticle({ url, title, summary }, { prefetchedBody } = {}) {
  if (!hasApiKey()) return { companies: [], products: [], ok: false, usedBody: false, error: "no ANTHROPIC_API_KEY" };

  let body = prefetchedBody || "";
  if (!body && url) body = await fetchBodyText(url);
  const usedBody = body.length > 0;

  try {
    const reply = await callClaude(buildUserContent({ title, summary, body }));
    const parsed = parseEntities(reply);
    if (!parsed) return { companies: [], products: [], ok: false, usedBody, error: "unparseable response" };
    return {
      companies: cleanList(parsed.companies),
      products: cleanList(parsed.products),
      ok: true,
      usedBody,
    };
  } catch (e) {
    return { companies: [], products: [], ok: false, usedBody, error: e.message };
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
