// Read-only consistency check for RULE-DERIVED taxonomy rows.
//
// WHY. 1,009 of the catalogue's 1,055 `domain` rows are not observations about
// the product at all: they are `source='rule'` with `note='category=UAV'`, a
// mechanical copy of `products.category` made by a one-off backfill. The copy
// is one-way and nothing re-runs it, so when a category is later corrected the
// derived row stays behind asserting the old basis. Cassio S and DA 15-N.ISS
// are exactly that: a piloted light aircraft and a servo actuator still tagged
// as uncrewed aerial systems because they used to be filed as UAVs.
//
// Same shape as the editorial-flag count that "kept lying": a derived value
// outliving the thing it was derived from.
//
// This module only ever REPORTS. It does not delete, and it does not touch an
// observed row (`source` of 'web' or 'knowledge'), because an observed row is
// evidence and a category is not grounds to overrule it.

// A derived row records its basis in the note, as `category=<X>`.
const BASIS_RE = /^category=(.+)$/i;

export const derivedBasis = (row) => {
  if (!row || row.source !== "rule") return null;
  const m = BASIS_RE.exec(String(row.note || "").trim());
  return m ? m[1].trim() : null;
};

// rows: [{ product_id, product_name, category, facet, option, source, note }]
// Returns the rows whose recorded basis contradicts the product's category now.
//
// Deliberately NOT flagged:
//   • observed rows — `source` 'web' or 'knowledge' — whatever the category;
//   • derived rows whose basis still matches the category;
//   • rows with no parseable basis, which are reported separately as
//     `unparseable` rather than silently treated as consistent.
export function findStaleDerivations(rows = []) {
  const stale = [];
  const unparseable = [];
  for (const r of rows) {
    if (!r || r.source !== "rule") continue;
    const basis = derivedBasis(r);
    if (basis === null) { unparseable.push(r); continue; }
    if (String(basis) !== String(r.category)) {
      stale.push({ ...r, basis, reason: `derived from category=${basis}, product is now ${r.category}` });
    }
  }
  return { stale, unparseable };
}

// A product legitimately holding more than one domain is NOT an inconsistency.
// HALIA is amphibious float-and-fly and holds a surface row alongside an aerial
// one; both are observed, and the check must leave it alone.
export function multiDomainProducts(rows = []) {
  const byProduct = new Map();
  for (const r of rows) {
    if (r.facet !== "domain") continue;
    const arr = byProduct.get(r.product_id) || [];
    arr.push(r);
    byProduct.set(r.product_id, arr);
  }
  return [...byProduct.entries()]
    .filter(([, rs]) => new Set(rs.map((r) => r.option)).size > 1)
    .map(([product_id, rs]) => ({
      product_id, product_name: rs[0].product_name,
      options: rs.map((r) => r.option).sort(),
      allObserved: rs.every((r) => r.source !== "rule"),
    }));
}

// The SQL a validation job should run. Kept here next to the logic it mirrors
// so the two cannot drift apart silently.
export const STALE_DERIVATION_SQL = `
select p.id as product_id, p.name as product_name, p.category, p.publication_status,
       f.slug as facet, o.slug as option, pt.source, pt.note
  from product_taxonomy pt
  join products p on p.id = pt.product_id
  join taxonomy_options o on o.id = pt.option_id
  join taxonomy_facets f on f.id = o.facet_id
 where pt.source = 'rule'
   and pt.note ~ '^category='
   and substring(pt.note from '^category=(.*)$') <> p.category
 order by p.name`;
