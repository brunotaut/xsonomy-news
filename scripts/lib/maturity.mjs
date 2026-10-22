// Validation for UAV360 maturity assessments.
//
// The database already refuses a maturity with no source and no date. This adds the
// rules a CHECK constraint cannot express, and is testable without a key or a DB.
//
// Same principle as the evidence extractor: the model never supplies a URL. It cites
// sources by their number in the list it was shown, and the caller substitutes the
// real URLs. See docs/DATA-MODEL.md §4.

export const MATURITY = ["emerging", "demonstrated", "commercial", "deployed", "scaled"];
export const RANK = Object.fromEntries(MATURITY.map((m, i) => [m, i + 1]));
const CONFIDENCE = ["low", "medium", "high"];

// `scaled` means "multiple customers / contracts / deployments". One article cannot
// establish that, whatever the model writes in the rationale, so the claim needs at
// least two distinct sources behind it. This is the only level with a structural
// requirement, because it is the only one defined in terms of multiplicity.
const MIN_SOURCES = { scaled: 2 };

const MIN_RATIONALE = 25;

/**
 * @param {object} raw      the model's assessment
 * @param {object[]} sources  what it was shown, in order; each needs a .url
 * @returns {{ok: true, value: object} | {ok: false, why: string}}
 */
export function validateAssessment(raw, sources) {
  if (!raw || typeof raw !== "object") return { ok: false, why: "not an object" };

  // Declining is a valid, expected answer: most products have coverage that does not
  // establish anything about how far along they are.
  const m = raw.maturity == null ? null : String(raw.maturity).trim().toLowerCase();
  if (!m || m === "none" || m === "null") return { ok: true, value: null };
  if (!MATURITY.includes(m)) return { ok: false, why: `unknown maturity "${raw.maturity}"` };

  const cited = Array.isArray(raw.sources) ? raw.sources : [];
  const urls = [];
  for (const c of cited) {
    const i = Number(c);
    if (!Number.isInteger(i) || i < 1 || i > sources.length) {
      return { ok: false, why: `source ${c} out of range 1..${sources.length}` };
    }
    const url = sources[i - 1] && sources[i - 1].url;
    if (!url) return { ok: false, why: `source ${i} has no url` };
    if (!urls.includes(url)) urls.push(url);
  }
  if (!urls.length) return { ok: false, why: `${m} cites no source` };

  const need = MIN_SOURCES[m] || 1;
  if (urls.length < need) {
    return { ok: false, why: `${m} needs ${need} distinct sources, got ${urls.length}` };
  }

  const rationale = String(raw.rationale || "").replace(/\s+/g, " ").trim();
  if (rationale.length < MIN_RATIONALE) {
    return { ok: false, why: `rationale too thin (${rationale.length} chars)` };
  }

  const confidence = CONFIDENCE.includes(String(raw.confidence || "").toLowerCase())
    ? String(raw.confidence).toLowerCase() : "medium";

  return {
    ok: true,
    value: {
      maturity: m,
      maturity_rationale: rationale.length > 600 ? rationale.slice(0, 599) + "…" : rationale,
      maturity_source_urls: urls,
      maturity_assessed_at: new Date().toISOString(),
      maturity_assessed_by: "llm",
      maturity_confidence: confidence,
    },
  };
}

// Highest maturity among a company's assessed products. Returns null when none are.
export function rollUp(productMaturities) {
  let best = null;
  for (const m of productMaturities) {
    if (!RANK[m]) continue;
    if (!best || RANK[m] > RANK[best]) best = m;
  }
  return best;
}

export function parseAssessment(text) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
