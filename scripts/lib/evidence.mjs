// Validation for extracted evidence rows.
//
// Kept out of extract-evidence.mjs so it can be tested without an API key or a
// database. Everything the model returns passes through validateRow() before it
// reaches Supabase.
//
// The important rule: the model never supplies a URL. It cites an article by its
// position in the list it was shown, and the caller substitutes that article's real
// URL from our own database. A model cannot invent a source it was not given.

export const EVIDENCE_KINDS = [
  "customer", "contract", "deployment", "partnership", "funding", "demonstration", "production",
];
const CONFIDENCE = ["low", "medium", "high"];

// Kinds that are meaningless without someone on the other side. "A contract" with no
// counterparty is not evidence of anything; "production started" legitimately has none.
const NEEDS_COUNTERPARTY = new Set(["customer", "contract", "partnership", "funding"]);

const CURRENCY = /^[A-Z]{3}$/;

/**
 * @param {object} raw     one row as returned by the model
 * @param {object[]} articles  the articles the model was shown, in order
 * @returns {{ok: true, row: object} | {ok: false, why: string}}
 */
export function validateRow(raw, articles) {
  if (!raw || typeof raw !== "object") return { ok: false, why: "not an object" };

  const i = Number(raw.article);
  if (!Number.isInteger(i) || i < 1 || i > articles.length) {
    return { ok: false, why: `article index ${raw.article} out of range 1..${articles.length}` };
  }
  const article = articles[i - 1];
  if (!article || !article.url) return { ok: false, why: `article ${i} has no url` };

  const kind = String(raw.kind || "").trim().toLowerCase();
  if (!EVIDENCE_KINDS.includes(kind)) return { ok: false, why: `unknown kind "${raw.kind}"` };

  const counterparty = str(raw.counterparty, 200);
  if (NEEDS_COUNTERPARTY.has(kind) && !counterparty) {
    return { ok: false, why: `${kind} needs a counterparty` };
  }

  const summary = str(raw.summary, 400);
  if (!summary) return { ok: false, why: "no summary" };

  // A year the article cannot support is a guess. Allow the publication year and a
  // little either side — reporting about a contract signed last year is normal,
  // anything further back was not established by this article.
  let occurredYear = raw.occurred_year == null ? null : Number(raw.occurred_year);
  const pubYear = article.published_at ? new Date(article.published_at).getUTCFullYear() : null;
  if (occurredYear != null) {
    if (!Number.isInteger(occurredYear) || occurredYear < 1950 || occurredYear > 2100) {
      return { ok: false, why: `implausible year ${raw.occurred_year}` };
    }
    if (pubYear && occurredYear > pubYear) {
      return { ok: false, why: `year ${occurredYear} is after the article (${pubYear})` };
    }
  } else if (pubYear) {
    occurredYear = pubYear;
  }

  let amount = raw.value_amount == null ? null : Number(raw.value_amount);
  if (amount != null && (!Number.isFinite(amount) || amount < 0)) amount = null;
  let currency = raw.value_currency ? String(raw.value_currency).trim().toUpperCase() : null;
  if (currency && !CURRENCY.test(currency)) currency = null;
  if (amount == null) currency = null;

  const confidence = CONFIDENCE.includes(String(raw.confidence || "").toLowerCase())
    ? String(raw.confidence).toLowerCase() : "medium";

  return {
    ok: true,
    row: {
      kind,
      counterparty: counterparty || null,
      counterparty_country: str(raw.counterparty_country, 80) || null,
      summary,
      occurred_year: occurredYear,
      value_amount: amount,
      value_currency: currency,
      // Never from the model.
      source_url: article.url,
      source_title: str(article.title, 300) || null,
      confidence,
    },
  };
}

function str(v, max) {
  if (v == null) return "";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// The model is asked for JSON but sometimes wraps it in prose or a code fence.
export function parseRows(text) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let obj;
  try { obj = JSON.parse(m[0]); } catch { return null; }
  if (!obj || !Array.isArray(obj.rows)) return null;
  return obj.rows;
}
