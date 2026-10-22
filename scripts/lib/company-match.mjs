// Matching a researched company against what is already in the database.
//
// The job is to NOT create duplicates. Entity resolution has already produced pairs
// like DroneShield/Drone Shield, Smart Shooter/SmartShooter and Harmattan/Harmattan AI,
// all of which had to be merged by hand; an import path that adds more of them is worse
// than no import path.
//
// Three keys, checked in order of reliability:
//   1. domain   — two companies on the same registrable domain are the same company
//   2. name     — normalised: case, punctuation and legal suffixes removed
//   3. alias    — the same normalisation over company_aliases
//
// Everything here is pure so it can be tested without a database.

// Legal forms and corporate noise that should not distinguish two records. Written
// without punctuation, because nameKey strips punctuation before matching these, and
// longest first so "gmbh and co kg" wins over the bare "kg" inside it.
const SUFFIXES = [
  "gmbh and co kg", "gmbh und co kg", "ag and co kg", "and co kg", "sp z o o", "sp z oo",
  "incorporated", "corporation", "limited", "holdings", "holding", "company", "group",
  "gmbh", "mbh", "sarl", "srl", "spa", "s p a", "sas", "plc", "ltd", "llc", "inc", "corp",
  "oyj", "kft", "doo", "zoo", "a s", "b v", "n v", "s a", "ag", "ab", "as", "oy", "bv",
  "nv", "sa", "kg", "ou", "co",
];

/**
 * Normalised name key: lowercase, no punctuation, no legal suffix.
 * "AirRobot GmbH & Co. KG" and "AirRobot" both become "airrobot".
 */
export function nameKey(raw) {
  let s = String(raw == null ? "" : raw).toLowerCase();
  s = s.replace(/[\u2018\u2019\u201c\u201d]/g, "");
  s = s.replace(/&/g, " and ");
  // Drop a trailing parenthesised owner — "Aveillant (Thales)" is Aveillant.
  s = s.replace(/\s*\([^)]*\)\s*$/, " ");
  // Punctuation becomes space BEFORE suffixes are matched, so "Co." and "A/S" are
  // seen as the words they are rather than as unmatched literals.
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  // Peel suffixes off the end until none match; a name may carry several.
  for (let i = 0; i < 4; i++) {
    const before = s;
    for (const suf of SUFFIXES) {
      if (s.endsWith(" " + suf)) { s = s.slice(0, -(suf.length + 1)).trim(); break; }
    }
    if (s === before) break;
  }
  return s.replace(/[^a-z0-9]/g, "");
}

/** Registrable-ish domain from a URL or bare host; null when there is nothing usable. */
export function domainKey(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^www\./, "");
  s = s.split(/[/?#]/)[0].split("@").pop();
  if (!s || !s.includes(".")) return null;
  const parts = s.split(".").filter(Boolean);
  if (parts.length < 2) return null;
  // keep three labels for the likes of co.uk, com.au, gov.pl
  const twoLevel = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);
  const take = parts.length >= 3 && twoLevel.has(parts[parts.length - 2]) ? 3 : 2;
  return parts.slice(-take).join(".");
}

/**
 * Build the lookup used by the importer.
 * @param {{id,name,website}[]} companies
 * @param {{company_id,alias}[]} aliases
 * @param {{name,company_id}[]} products  product names catch "EAGLE.ONE" style entries
 */
export function buildIndex(companies, aliases = [], products = []) {
  const byName = new Map(), byDomain = new Map(), byAlias = new Map(), byProduct = new Map();
  const nameOf = new Map(companies.map((c) => [c.id, c.name]));
  for (const c of companies) {
    const n = nameKey(c.name);
    if (n && !byName.has(n)) byName.set(n, c);
    const d = domainKey(c.website);
    if (d && !byDomain.has(d)) byDomain.set(d, c);
  }
  for (const a of aliases) {
    const n = nameKey(a.alias);
    if (n && !byName.has(n) && !byAlias.has(n)) {
      byAlias.set(n, { id: a.company_id, name: nameOf.get(a.company_id) || a.alias, via: a.alias });
    }
  }
  for (const p of products) {
    const n = nameKey(p.name);
    if (n && !byProduct.has(n)) byProduct.set(n, p);
  }
  return { byName, byDomain, byAlias, byProduct };
}

/**
 * @returns {{match: null} | {match: 'domain'|'name'|'alias'|'product', existing: object, why: string}}
 */
export function findExisting(entry, index) {
  const d = domainKey(entry.website);
  if (d && index.byDomain.has(d)) {
    const e = index.byDomain.get(d);
    return { match: "domain", existing: e, why: `same domain ${d} as "${e.name}"` };
  }
  const n = nameKey(entry.name);
  if (!n) return { match: null };
  if (index.byName.has(n)) {
    const e = index.byName.get(n);
    return { match: "name", existing: e, why: `name matches "${e.name}"` };
  }
  if (index.byAlias.has(n)) {
    const e = index.byAlias.get(n);
    return { match: "alias", existing: e, why: `matches alias "${e.via}" of "${e.name}"` };
  }
  if (index.byProduct.has(n)) {
    const e = index.byProduct.get(n);
    return { match: "product", existing: e, why: `matches product "${e.name}" — check it is not the maker` };
  }
  return { match: null };
}

/** An entry has to name itself, say where it is, and cite something. */
export function validateEntry(e) {
  if (!e || typeof e !== "object") return "not an object";
  if (!e.name || !String(e.name).trim()) return "no name";
  if (!e.hq_country || !String(e.hq_country).trim()) return "no hq_country";
  if (!Array.isArray(e.source_urls) || !e.source_urls.length) return "no source_urls";
  if (e.source_urls.some((u) => !/^https?:\/\//i.test(String(u)))) return "a source_url is not a URL";
  return null;
}

export function slugify(name) {
  return String(name).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "company";
}
