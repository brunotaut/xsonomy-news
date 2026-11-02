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

// --- rule 3: the relationship, not just the co-mention ------------------------
//
// NAMING BOTH SIDES IS NOT ENOUGH, and this was a real defect in the first
// version of this module. Given the dronexl passage as a single span —
//
//   "Anduril's Ghost Shark went from concept to a A$1.7 billion contract …
//    Albacore is aiming much smaller and much cheaper"
//
// — a both-names test accepts ALBACORE as Ghost Shark's maker, which is the
// exact error the module exists to prevent. It only appeared to work because a
// sentence splitter happened to cut between them. "The Navy ordered the Ghost
// Shark" passed too, making a customer into a manufacturer.
//
// So the span must express a MAKING relationship between the two names: they
// must be close together, and the text between them must read as manufacture
// rather than comparison, purchase, operation or partnership.

const MAX_BRIDGE = 120;   // chars allowed between the two names

// Phrases that, sitting between the two names, mean this is NOT a maker claim.
const NOT_A_MAKER_RELATION = new RegExp(
  "\\b(unlike|versus|vs|compared|comparison|rival|rivals|competitor|competitors|" +
  "competing|instead of|rather than|whereas|than|" +
  "ordered|orders|ordering|bought|buys|purchased|purchases|procured|" +
  "acquired|acquires|operates|operated|operator|operators|customer|customers|" +
  "fielded|fields|deployed by|selected|awarded to|" +
  "partner|partners|partnered|partnership|teamed|joint venture|" +
  "alongside|together with|in collaboration with|in partnership with|" +
  "integrated with|carries|carried|launched from|equipped with|" +
  // the same frames in the other languages the feed carries, so a positive
  // cue cannot sneak past a customer or comparison in French/German/Italian
  "command\u00e9e?s?|commande|achet\u00e9e?s?|acquis|client|utilisateur|exploitant|" +
  "contrairement|par rapport|concurrent|concurrente|rival|" +
  "bestellt|gekauft|beschafft|kunde|betreiber|im vergleich|konkurrent|" +
  "ordinat[oaie]|acquistat[oaie]|cliente|rispetto a|concorrente|" +
  "encargad[oa]s?|comprad[oa]s?)\\b", "i");

// maker FIRST: "Anduril's Ghost Shark", "Albacore … its Ghostfin",
// "Baykar builds the TB2", or bare adjacency "Anduril Ghost Shark".
// Each alternative is ANCHORED at both ends, so the cue has to bind THESE two
// names and not something sitting between them. Before anchoring,
// "Boeing's Orca and Anduril's Ghost Shark" reported Boeing as Ghost Shark's
// maker: the bridge began with a possessive, and the possessive belonged to the
// intervening product. A test caught it.
const DET = "(?:the\\s+|a\\s+|an\\s+|its\\s+|new\\s+|latest\\s+|first\\s+)*";
const MAKER_VERB = "(?:builds?|built|makes?|made|manufactures?|manufactured|produces?|" +
  "produced|develops?|developed|designs?|designed|unveiled|unveils|launched|" +
  "launches|delivers?|delivered|supplies|supplied|is building|are building|will build)";
const MAKER_FIRST_OK = new RegExp(
  "^(?:" +
    "\\s{0,2}" +                                              // adjacency
    "|\\s*'?s'?\\s*" + DET +                                 // "Anduril's <product>"
    "|\\s*(?:has |have |had )?(?:been )?(?:awarded|won)\\s+[^.,;]{0,40}?\\bits\\s*" + DET +
    "|\\s*(?:has |have |had )?(?:been )?" + MAKER_VERB + "\\s*" + DET +
  ")$", "i");

// product FIRST: "Ghost Shark, built by Anduril", "the TB2 from Baykar".
//
// MULTILINGUAL ON PURPOSE. The feed is not English-only — opex360 is French,
// esut.de German, analisidifesa.it Italian — and an English-only rule silently
// drops the maker for every one of those sources. A counterexample test caught
// exactly that: "deux drones de surface Inspector 125 fournis par Exail" was
// rejected, losing a perfectly good maker relationship.
const PRODUCT_FIRST_OK = new RegExp(
  // English
  "\\b(?:built|made|manufactured|produced|developed|designed|supplied|delivered)\\s+by\\b|" +
  "^\\s*,?\\s*(?:a|an|the)?\\s*(?:new\\s+)?from\\b|^\\s*from\\b|" +
  // French
  "\\b(?:fournis?|fournies?|fabriqu\u00e9e?s?|construits?|construites?|d\u00e9velopp\u00e9e?s?|" +
  "developpee?s?|con\u00e7ue?s?|concue?s?|produits?|produites?|livr\u00e9e?s?)\\s+par\\b|" +
  // Italian
  "\\b(?:fornit[oaie]|prodott[oaie]|costruit[oaie]|svilupat[oaie]|sviluppat[oaie])\\s+da\\b|" +
  // Spanish / Portuguese
  "\\b(?:fabricad[oa]s?|producid[oa]s?|construid[oa]s?|desarrollad[oa]s?|fornecid[oa]s?)\\s+por\\b|" +
  // German: "… von Rheinmetall gebaut/entwickelt/hergestellt/geliefert"
  "\\bvon\\b[^.]{0,40}?\\b(?:gebaut|entwickelt|hergestellt|geliefert|gefertigt)\\b|" +
  "\\bvon\\s*$", "i");

// All positions at which `name` occurs, on word boundaries.
function occurrences(hay, name) {
  const n = normText(name);
  if (!n) return [];
  const out = [];
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?:$|[^\\p{L}\\p{N}])`, "giu");
  let m;
  while ((m = re.exec(hay)) !== null) {
    out.push({ start: m.index + m[0].indexOf(m[1]), end: m.index + m[0].indexOf(m[1]) + m[1].length });
    re.lastIndex = m.index + 1;
  }
  return out;
}

// Which tokens of a name can stand for it (same rule as mentionsName).
const nameVariants = (name) => {
  const n = normText(name);
  const toks = n.split(" ").filter((w) => w.length >= 3 && !WEAK_TOKENS.has(w));
  return [n, ...toks];
};

const allOccurrences = (hay, name) =>
  nameVariants(name).flatMap((v) => occurrences(hay, v))
    .sort((a, b) => a.start - b.start);

// Does this span actually say the maker MAKES the product? Returns the cue name
// or null, so a decision is auditable rather than a bare boolean.
export function makerRelationship(span, productName, makerName) {
  const t = normText(span);
  const prod = allOccurrences(t, productName);
  const mak = allOccurrences(t, makerName);
  if (!prod.length || !mak.length) return null;

  // Take the closest pairing; a distant mention is not the relationship.
  let best = null;
  for (const p of prod) {
    for (const m of mak) {
      const gap = p.start >= m.end ? p.start - m.end : m.start - p.end;
      if (gap < 0) continue;                       // overlapping: skip
      if (best === null || gap < best.gap) best = { p, m, gap, makerFirst: m.end <= p.start };
    }
  }
  if (!best || best.gap > MAX_BRIDGE) return null;

  const bridge = best.makerFirst
    ? t.slice(best.m.end, best.p.start)
    : t.slice(best.p.end, best.m.start);

  // A disqualifying frame beats any positive cue: "Anduril competitor X" is not
  // a maker claim however it is phrased.
  if (NOT_A_MAKER_RELATION.test(bridge)) return null;

  if (best.makerFirst && MAKER_FIRST_OK.test(bridge)) {
    return /\b(?:awarded|won)\b/i.test(bridge) ? "possessive_its"
      : /^\s{0,2}$/.test(bridge) ? "adjacent"
      : /'/.test(bridge) ? "possessive" : "maker_verb";
  }
  if (!best.makerFirst && PRODUCT_FIRST_OK.test(bridge)) return "made_by";
  return null;
}

// Rule 3. A maker is evidenced only when ONE span names both sides, that span
// is really in the article, AND the span states a making relationship between
// them. Returns the maker name or null — never a guess, never a name that
// merely appeared nearby, and never a customer or a competitor.
export function makerFromEvidence({ name, maker, makerQuote } = {}, articleText = "") {
  if (!maker || !makerQuote) return null;
  if (!quoteSupports(makerQuote, articleText)) return null;
  if (!mentionsName(makerQuote, name)) return null;     // the span must be about THIS product
  if (!mentionsName(makerQuote, maker)) return null;    // and must actually name the maker
  if (!makerRelationship(makerQuote, name, maker)) return null;   // and SAY it makes it
  return maker;
}

// Exported for reporting: why a maker was accepted.
export const makerCue = (ev = {}) =>
  ev.maker && ev.makerQuote ? makerRelationship(ev.makerQuote, ev.name, ev.maker) : null;

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
// `normProductKey` is looser than the index's: it also drops spaces and
// hyphens, so MMCM, M.M.C.M., "mm cm" and "m-m-c-m" collapse together.
//
// WHAT THIS DOES NOT DO, stated because an earlier report claimed otherwise.
// Collapsing punctuation does NOT equate an acronym with its expansion:
// "Maritime Mine Counter Measures" keys to "maritimeminecountermeasures" and
// does not match a retired "MMCM". That gap is closed separately, by
// `acronymOf` below, and the result is ROUTED TO REVIEW rather than refused —
// an acronym collision is a plausible identity, not a proven one.
export const normProductKey = (name) => normText(name).replace(/[\s\-'"]/g, "");

// Trailing words that describe a thing rather than name it. "MMCM programme"
// and "MMCM" are the same candidate for this purpose.
const TRAILING_DESCRIPTORS = /\s+(programme|program|project|system|systems|class|family|range|vehicle|variant|series|effort|initiative)$/i;
const stripDescriptor = (name) => normText(name).replace(TRAILING_DESCRIPTORS, "").trim();

// Connectives that do not contribute an initial: "Ministry of Defence" → MOD.
const ACRONYM_SKIP = new Set(["of", "the", "and", "for", "a", "an", "to", "in", "de", "la", "du"]);

// Is `short` the initials of `long`? "MMCM" ⇄ "Maritime Mine Counter Measures".
// Hyphens count as word breaks, so "Counter-Measures" contributes C and M.
export function acronymOf(short, long) {
  const sh = normText(short).replace(/[^\p{L}\p{N}]/gu, "");
  if (!sh || sh.length < 2 || sh.length > 8) return false;
  const all = normText(long).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (all.length < 2) return false;
  // Try it both ways: some acronyms drop the connectives ("Maritime Mine
  // Counter Measures" → MMCM) and some keep them ("Ministry of Defence" → MOD).
  const initials = (words) => words.map((w) => w[0]).join("");
  const kept = initials(all);
  const dropped = initials(all.filter((w) => !ACRONYM_SKIP.has(w)));
  return sh === kept || sh === dropped;
}

// NOT caught, and worth saying so rather than implying the guard is complete:
// a PHONETIC or irregular acronym. "XLUUV" stands for "extra-large uncrewed
// undersea vehicle", whose initials are ELUUV — the X is a sound, not a letter.
// This rule catches true initialisms only. Anything it misses falls through to
// the ordinary evidence rules, which is where a programme or class term is
// refused on its `kind` anyway.

// products: [{id, name, publication_status}]
// Keeps the full row list as well as the key map, so acronym comparisons can
// run against every retired name rather than only an exact key.
export function buildRetiredProductIndex(products = []) {
  const byKey = new Map();
  const rows = [];
  for (const p of products) {
    if (!p || p.publication_status === "live") continue;
    const row = { id: p.id, name: p.name, status: p.publication_status };
    rows.push(row);
    for (const key of new Set([normProductKey(p.name), normProductKey(stripDescriptor(p.name))])) {
      if (key && !byKey.has(key)) byKey.set(key, row);
    }
  }
  byKey.rows = rows;
  return byKey;
}

// Would creating `name` resurrect something retired? Returns the retired row
// with `how` saying which test fired, or null.
//
// Every hit routes to REVIEW, not refusal, and the two tests differ in
// strength on purpose:
//   • "key"     — same name once punctuation and spacing are removed. Near
//                 certain to be the same thing.
//   • "acronym" — one name is the initials of the other. Plausible, NOT
//                 proven: "CAMP" could be an unrelated product as easily as
//                 the expansion of a retired one. Exactly the kind of
//                 ambiguous identity that belongs in front of a person.
export function retiredMatch(name, retiredIndex) {
  if (!retiredIndex || !retiredIndex.size) return null;
  const direct = retiredIndex.get(normProductKey(name))
    || retiredIndex.get(normProductKey(stripDescriptor(name)));
  if (direct) return { ...direct, how: "key" };

  const bare = stripDescriptor(name);
  for (const row of retiredIndex.rows || []) {
    const retired = stripDescriptor(row.name);
    if (acronymOf(bare, retired) || acronymOf(retired, bare)) {
      return { ...row, how: "acronym" };
    }
  }
  return null;
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
