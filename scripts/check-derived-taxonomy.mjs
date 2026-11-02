// Read-only validation: find rule-derived taxonomy rows whose recorded basis
// no longer matches the product's category.
//
//   node scripts/check-derived-taxonomy.mjs           # report, exit 0
//   node scripts/check-derived-taxonomy.mjs --strict  # exit 1 if any are found
//
// REPORTS ONLY. It never deletes a row, never touches an observed row
// (source 'web' or 'knowledge'), and never infers a category change. A derived
// row that has gone stale is a question for a person, not something to clean up
// automatically — the observed rows are research, and a category is not grounds
// to overrule them.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY (read-only).

import { loadDotenv } from "./lib/http.mjs";
import { fetchAllRows } from "./lib/supabase.mjs";
import { findStaleDerivations, multiDomainProducts } from "./lib/derived-taxonomy.mjs";

const STRICT = process.argv.includes("--strict");

async function main() {
  await loadDotenv();

  const [pt, options, facets, products] = await Promise.all([
    fetchAllRows("product_taxonomy", "product_id,option_id,source,confidence,note"),
    fetchAllRows("taxonomy_options", "id,slug,facet_id"),
    fetchAllRows("taxonomy_facets", "id,slug"),
    fetchAllRows("products", "id,name,category,publication_status"),
  ]);

  const facetById = new Map(facets.map((f) => [f.id, f.slug]));
  const optById = new Map(options.map((o) => [o.id, { slug: o.slug, facet: facetById.get(o.facet_id) }]));
  const prodById = new Map(products.map((p) => [p.id, p]));

  const rows = pt.map((r) => {
    const o = optById.get(r.option_id) || {};
    const p = prodById.get(r.product_id) || {};
    return {
      product_id: r.product_id, product_name: p.name, category: p.category,
      publication_status: p.publication_status,
      facet: o.facet, option: o.slug, source: r.source, note: r.note,
    };
  }).filter((r) => r.product_name);

  const { stale, unparseable } = findStaleDerivations(rows);
  const derived = rows.filter((r) => r.source === "rule").length;

  console.log(`Derived-taxonomy check: ${rows.length} taxonomy row(s), ${derived} rule-derived.`);

  if (stale.length) {
    console.log(`\n⚠ ${stale.length} STALE DERIVATION(S) — the recorded basis contradicts the current category:`);
    for (const r of stale) {
      console.log(`  - ${r.product_name} [${r.product_id}] ${r.facet}=${r.option}`);
      console.log(`      ${r.reason}  (publication_status=${r.publication_status})`);
    }
    console.log(`\n  These are FLAGGED FOR REVIEW, not corrected here. A derived row whose`);
    console.log(`  basis is gone may need deleting, or the category may be the thing that is`);
    console.log(`  wrong — that is a judgement, and observed rows must never be deleted on`);
    console.log(`  the strength of a category.`);
  } else {
    console.log("✓ No stale derivations.");
  }

  if (unparseable.length) {
    console.log(`\nℹ ${unparseable.length} rule row(s) state no checkable basis:`);
    for (const r of unparseable.slice(0, 10)) {
      console.log(`  - ${r.product_name} ${r.facet}=${r.option}  note=${JSON.stringify(r.note)}`);
    }
    if (unparseable.length > 10) console.log(`  … and ${unparseable.length - 10} more`);
  }

  // Reported for contrast, never as a problem: a product may legitimately hold
  // more than one domain. HALIA is amphibious float-and-fly and holds both.
  const multi = multiDomainProducts(rows);
  if (multi.length) {
    console.log(`\nℹ ${multi.length} product(s) hold more than one domain — legitimate, listed for context:`);
    for (const m of multi) {
      console.log(`  - ${m.product_name}: ${m.options.join(" + ")}` +
        `${m.allObserved ? "  (all observed)" : "  (includes a derived row — see above if stale)"}`);
    }
  }

  if (STRICT && stale.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
