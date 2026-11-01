// Identity rules for entity extraction: what a name IS, and whether a source
// actually says so.
//
// WHY THIS EXISTS. Five bad catalogue rows in August 2026 all came through one
// path — the LLM gate in resolve.mjs, `decision=created, reason=llm` — and all
// five share one cause. The gate's instruction was "judge from the name and the
// article titles it appeared in", and `articles` has no body column, so by the
// time the gate ran the article text was gone. From a name and a headline:
//
//   • "MMCM" and "rMCM" are procurement PROGRAMMES, indistinguishable from
//     model designations.
//   • "XLUUV" is a US Navy size CLASS, indistinguishable from a model name.
//   • "Exail A27" is a product no source names at all — nothing to check it
//     against, so a plausible-looking name was taken at face value.
//   • "Ghost Shark" was extracted from an article about Albacore's Ghostfin.
//     The gate was asked for a `maker` and the only company in that batch was
//     Albacore, so CO-OCCURRENCE BECAME OWNERSHIP. (The decision cache proves
//     it: Ghost Shark, Ghostfin and Albacore share one timestamp,
//     2026-08-28 17:12:28.084217+00 — one batched call, one article.)
//
// So the fix is not a list of those five names. It is three general rules,
// enforced here in code rather than requested in a prompt:
//
//   1. POSITIVE CLASSIFICATION. A name is only a product if something says it
//      is one. `kind` must be exactly "product"; programme, class, family,
//      contract, organisation and unclear are all not-a-product, and the
//      default for an absent or unrecognised kind is not-a-product.
//   2. QUOTE VERIFICATION. A claim must be supported by text that is actually
//      in the article. The model returns a span; we check the span is really
//      there. A fabricated name has no span to find.
//   3. JOINT EVIDENCE FOR A RELATIONSHIP. A maker is accepted only when ONE
//      span names both the product and the maker. Two names in the same
//      article is not a relationship.
//
// Everything that fails a rule stays reviewable instead of being published or
// thrown away — see decideIdentity's "review" outcome.

export const IDENTITY_KINDS = [
  "product",       // a distinct named model you could field or buy
  "programme",     // a procurement or development programme (MMCM, rMCM)
  "class",         // a size/capability class or generic designator (XLUUV)
  "family",        // a product family or range rather than one model
  "contract",      // a contract, framework or lot
  "organisation",  // a company, agency, navy, consortium
  "unclear",       // the article does not settle what this name is
];

// Only this one creates a catalogue product. Anything else — including a kind
// we do not recognise, or no kind at all — does not.
export const PRODUCT_KIND = "product";

export const isProductKind = (kind) => kind === PRODUCT_KIND;

// Corporate decoration that must not carry a name match on its own: "Systems"
// appearing somewhere must never be what ties a product to BAE Systems.
const WEAK_TOKENS = new Set([
  "industries", "industry", "systems", "system", "technologies", "technology",
  "group", "holding", "holdings", "company", "corporation", "corp", "inc",
  "llc", "ltd", "limited", "plc", "gmbh", "sarl", "spa", "sas", "bv", "nv",
  "ab", "as", "oy", "aps", "defense", "defence", "aerospace", "solutions",
  "international", "global", "the", "and", "for",
]);

// Normalise for comparison: one case, one kind of dash, one kind of quote, no
// stray punctuation, single spaces. Model designations keep their digits and
// internal hyphens, which is what distinguishes A-18M from A27.
export function normText(s) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[‐-―−]/g, "-")        // dashes → hyphen
    .replace(/[‘’‛′]/g, "'")   // curly → straight
    .replace(/[“”‟″]/g, '"')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-'" ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Does `haystack` actually contain `quote`? Rule 2. A quote the model invented
// will not be found, which is the whole point.
export function quoteSupports(quote, haystack) {
  const q = normText(quote);
  const h = normText(haystack);
  if (!q || !h) return false;
  if (q.length < 12) return false;          // too short to evidence anything
  return h.includes(q);
}

// Does this text name this entity? Full name, or a distinctive token of it, so
// "Anduril" in the text matches an "Anduril Industries" record.
//
// MATCHING IS ON WORD BOUNDARIES, and that is not a detail. A plain substring
// test makes "Ghostfin" match the name "Ghost Shark" through the shared
// "ghost" — which is the very error this module exists to stop, reproduced
// inside the fix for it. A counterexample test caught it; boundaries fix it.
//
// The token floor is 3, not 4, because real makers are called BAE and MBDA.
// Weak corporate decoration never matches alone, so "the Systems integration
// work" is not evidence of BAE Systems.
const wordRe = (w) => new RegExp(`(?:^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^\\p{L}\\p{N}])`, "u");

export function mentionsName(text, name) {
  const t = normText(text);
  const n = normText(name);
  if (!t || !n) return false;
  if (wordRe(n).test(t)) return true;
  const tokens = n.split(" ").filter((w) => w.length >= 3 && !WEAK_TOKENS.has(w));
  return tokens.length > 0 && tokens.some((w) => wordRe(w).test(t));
}

// Rule 3. A maker is evidenced only when ONE span names BOTH sides, and that
// span is really in the article. Returns the maker name or null — never a
// guess, and never a name that merely appeared nearby.
export function makerFromEvidence({ name, maker, makerQuote } = {}, articleText = "") {
  if (!maker || !makerQuote) return null;
  if (!quoteSupports(makerQuote, articleText)) return null;
  if (!mentionsName(makerQuote, name)) return null;     // the span must be about THIS product
  if (!mentionsName(makerQuote, maker)) return null;    // and must actually name the maker
  return maker;
}

// Was this name mentioned at all? A name with no verifiable span is either a
// fabrication or came from page furniture, and either way nothing is known
// about it.
export function hasVerifiedMention({ quote } = {}, articleText = "") {
  return quoteSupports(quote, articleText);
}

export const OUTCOMES = { CREATE: "create", REVIEW: "review", REJECT: "reject" };

// The whole decision for one extracted product name.
//
//   create  — classified a product, mention verified. Published as usual.
//             `maker` is set only when rule 3 is satisfied.
//   review  — might be a product, but something is unverified. Created as
//             publication_status='review' so a human sees it and the pipeline
//             does not have to throw away a possibly-good candidate.
//   reject  — positively classified as not-a-product.
//
// Nothing here matches on a specific name, so a new programme or class term
// the pipeline has never seen is handled the same way as MMCM was.
export function decideIdentity(evidence, articleText = "", { haveArticleText = true } = {}) {
  const ev = evidence || {};
  const kind = ev.kind;

  // Rule 1, and note the direction: anything not positively a product is out.
  if (kind && IDENTITY_KINDS.includes(kind) && !isProductKind(kind)) {
    return { outcome: OUTCOMES.REJECT, reason: `classified_${kind}`, maker: null };
  }
  if (!isProductKind(kind)) {
    // No kind, or a kind we do not recognise. Not a rejection — we simply do
    // not know — so it stays reviewable rather than being published or lost.
    return { outcome: OUTCOMES.REVIEW, reason: "kind_missing_or_unrecognised", maker: null };
  }

  // Rule 2. Without the article text we cannot verify anything; that is a
  // reason to review, not a reason to trust.
  if (!haveArticleText) {
    return { outcome: OUTCOMES.REVIEW, reason: "no_article_text_to_verify", maker: null };
  }
  if (!hasVerifiedMention(ev, articleText)) {
    return { outcome: OUTCOMES.REVIEW, reason: "mention_not_found_in_source", maker: null };
  }

  // Rule 3. A product with an unevidenced maker is still a product — it is the
  // ownership claim that is dropped, not the row.
  const maker = makerFromEvidence(ev, articleText);
  return {
    outcome: OUTCOMES.CREATE,
    reason: maker ? "verified_with_maker" : "verified_no_maker_evidence",
    maker,
  };
}

// --- retired-artefact guard ----------------------------------------------------

// A row that was retired as an extraction artefact must not come back, either
// republished or as a near-name duplicate. The catalogue index is keyed on the
// exact and normalised name, so "MMCM" would match the retired row — but
// "Maritime Mine Counter Measures" would not, and would create a second one.
//
// `normProductKey` is deliberately looser than the index's: it also drops
// spaces and hyphens, so MMCM, M.M.C.M. and "mm cm" collapse together.
export const normProductKey = (name) => normText(name).replace(/[\s\-'"]/g, "");

// products: [{id, name, publication_status}]
export function buildRetiredProductIndex(products = []) {
  const byKey = new Map();
  for (const p of products) {
    if (!p || p.publication_status === "live") continue;
    const key = normProductKey(p.name);
    if (key && !byKey.has(key)) byKey.set(key, { id: p.id, name: p.name, status: p.publication_status });
  }
  return byKey;
}

// Would creating `name` resurrect something that was retired? Returns the
// retired row, or null. The caller should route to review rather than create,
// so a genuine new product that happens to normalise alike is not lost.
export function retiredMatch(name, retiredIndex) {
  if (!retiredIndex || !retiredIndex.size) return null;
  return retiredIndex.get(normProductKey(name)) || null;
}

// --- combining evidence from several articles ----------------------------------

// The same name can be extracted from more than one article, and they can
// disagree: one piece calls MMCM a programme, another writes it like a model.
// Disagreement is information, not noise, so a conflict resolves to review —
// never to "create", and never to whichever article happened to be processed
// first. The result must not depend on row order, so this is commutative:
// merge(a, b) and merge(b, a) give the same outcome.
export function mergeEvidence(a, b) {
  if (!a) return b ? { ...b } : b;
  if (!b) return { ...a };

  const kinds = new Set([a.kind, b.kind].filter(Boolean));
  const saysProduct = [a, b].some((e) => isProductKind(e.kind));
  const saysOther = [a, b].some(
    (e) => e.kind && IDENTITY_KINDS.includes(e.kind) && !isProductKind(e.kind));

  // Explicit disagreement about what the thing IS.
  if (saysProduct && saysOther) {
    return {
      ...a,
      kind: "unclear",
      outcome: OUTCOMES.REVIEW,
      reason: `sources_disagree:${[...kinds].sort().join("|")}`,
      maker: null,
      conflictingSources: [a.articleUrl, b.articleUrl].filter(Boolean),
    };
  }

  // Agreement, or one side silent. Pick the better-evidenced record, and prefer
  // one that carries a verified maker — but only among records that agree.
  const rank = (e) => (e.outcome === OUTCOMES.CREATE ? 2 : e.outcome === OUTCOMES.REVIEW ? 1 : 0);
  let best = rank(a) === rank(b)
    // Deterministic tie-break that is not row order: a verified maker first,
    // then the longer reason string, then the lexically smaller article url.
    ? ([a, b].sort((x, y) =>
        Number(Boolean(y.maker)) - Number(Boolean(x.maker)) ||
        String(y.reason || "").length - String(x.reason || "").length ||
        String(x.articleUrl || "").localeCompare(String(y.articleUrl || "")))[0])
    : (rank(a) > rank(b) ? a : b);
  const maker = a.maker && b.maker && a.maker !== b.maker
    // Two articles, two different makers, both evidenced: that is a real
    // conflict about ownership and neither is published.
    ? null
    : (best.maker || a.maker || b.maker || null);
  return {
    ...best,
    maker,
    ...(a.maker && b.maker && a.maker !== b.maker
      ? { outcome: OUTCOMES.REVIEW, reason: `makers_disagree:${[a.maker, b.maker].sort().join("|")}` }
      : {}),
  };
}
