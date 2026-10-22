// Import companies found by research, from a JSON file committed to this repository.
//
//   node scripts/import-companies.mjs data/company-imports/2026-q4-europe-cuas.json
//   node scripts/import-companies.mjs <file> --write
//
// Dry run by default. Nothing is written until --write.
//
// WHY A FILE AND NOT A FORM
//
// The file is the audit trail. Who added what, when, and citing which source is a git
// diff, reviewable before anything reaches the database. That is the whole mechanism —
// no submission system, no second company table. An imported row is an ordinary
// `companies` row from the moment it lands, and goes through the same evidence and
// maturity pipeline as everything else.
//
// WHY THE DEDUPLICATION MATTERS
//
// Entity resolution has already produced DroneShield/Drone Shield, Smart Shooter/
// SmartShooter, Leonardo/Leonardo S.p.A. and a dozen more, each of which had to be
// merged by hand. An import path that adds more of them is worse than no import path,
// so every entry is checked against company names, aliases, websites by domain, and
// product names before it can be inserted. The matching rules are in
// lib/company-match.mjs and are covered by test-company-match.mjs.
//
// FILE FORMAT
//
// [
//   {
//     "name": "Sensrad",                         // required
//     "hq_country": "Sweden",                    // required, must resolve in `countries`
//     "source_urls": ["https://..."],            // required, at least one
//     "website": "https://sensrad.com",          // optional, but it is the best dedup key
//     "company_type": "sme",                     // optional
//     "description": "...",                      // optional
//     "suggested_categories": ["cuas-det-radar"] // optional; recorded, NOT applied —
//   }                                            //   classification is a later session
// ]

import { readFile } from "node:fs/promises";
import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch, fetchAllRows, insertRows } from "./lib/supabase.mjs";
import { buildIndex, findExisting, validateEntry, slugify, nameKey } from "./lib/company-match.mjs";

const args = process.argv.slice(2);
const FILE = args.find((a) => !a.startsWith("--"));
const WRITE = args.includes("--write");
const LANDSCAPE = (() => { const i = args.indexOf("--landscape"); return i >= 0 ? args[i + 1] : "europe-cuas-2026"; })();

async function uniqueSlug(base, taken) {
  let slug = base, n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

async function main() {
  await loadDotenv();
  sbConfig();
  if (!FILE) throw new Error("Usage: node scripts/import-companies.mjs <file.json> [--write]");

  const entries = JSON.parse(await readFile(FILE, "utf8"));
  if (!Array.isArray(entries)) throw new Error("The file must contain a JSON array.");
  console.log(`${entries.length} entries from ${FILE}${WRITE ? "" : "   (dry run — nothing will be written)"}\n`);

  const [companies, aliases, products, countries] = await Promise.all([
    fetchAllRows("companies", "id,name,slug,website"),
    fetchAllRows("company_aliases", "company_id,alias"),
    fetchAllRows("products", "name,company_id"),
    fetchAllRows("countries", "code,name,aliases"),
  ]);

  const index = buildIndex(companies, aliases, products);
  const taken = new Set(companies.map((c) => String(c.slug)));
  const countryOk = new Set();
  for (const c of countries) {
    countryOk.add(c.name.toLowerCase());
    for (const a of c.aliases || []) countryOk.add(String(a).toLowerCase());
  }

  const toInsert = [];
  const skipped = [];
  const invalid = [];
  const seenInFile = new Map();

  for (const e of entries) {
    const bad = validateEntry(e);
    if (bad) { invalid.push(`${e && e.name ? e.name : "(unnamed)"}: ${bad}`); continue; }

    // An unknown country would make the company invisible to every geographic filter,
    // which is the failure that hid Dedrone for months.
    if (!countryOk.has(String(e.hq_country).trim().toLowerCase())) {
      invalid.push(`${e.name}: hq_country "${e.hq_country}" is not in the countries table`);
      continue;
    }

    // Duplicates inside the file itself, before touching the database.
    const k = nameKey(e.name);
    if (seenInFile.has(k)) { skipped.push(`${e.name}: duplicate of "${seenInFile.get(k)}" in this same file`); continue; }
    seenInFile.set(k, e.name);

    const hit = findExisting(e, index);
    if (hit.match) { skipped.push(`${e.name}: ${hit.why} [${hit.match}]`); continue; }

    toInsert.push({
      slug: await uniqueSlug(slugify(e.name), taken),
      name: String(e.name).trim(),
      hq_country: String(e.hq_country).trim(),
      website: e.website || null,
      company_type: e.company_type || null,
      description: e.description || null,
      publication_status: "live",
      confidence: "medium",
      enrichment_status: "web",
      discovery_source: "external_research",
      source_urls: e.source_urls,
      last_reviewed_at: new Date().toISOString(),
      __suggested: e.suggested_categories || [],
    });
  }

  for (const r of toInsert) {
    console.log(`  NEW   ${r.name} [${r.hq_country}]${r.__suggested.length ? `  suggested: ${r.__suggested.join(", ")}` : ""}`);
  }
  for (const s of skipped) console.log(`  SKIP  ${s}`);
  for (const i of invalid) console.error(`  BAD   ${i}`);

  console.log(`\n${toInsert.length} to insert, ${skipped.length} already present, ${invalid.length} rejected.`);
  if (!WRITE) { console.log("Re-run with --write to apply."); return; }
  if (!toInsert.length) return;
  if (invalid.length) {
    console.error("\nRefusing to write while entries are rejected — fix the file first.");
    process.exit(1);
  }

  const rows = toInsert.map(({ __suggested, ...r }) => r);
  const created = await insertRows("companies", rows, { onConflict: "slug", ignoreDuplicates: true, returning: true });
  console.log(`Inserted ${created?.length ?? rows.length}.`);

  // Imported companies join the candidate set with their origin recorded. Their
  // suggested categories are NOT applied — classification is its own step, with its
  // own evidence.
  if (created && created.length) {
    const { url, serviceKey } = sbConfig();
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY is required to write.");
    const cands = created.map((c) => ({ landscape_slug: LANDSCAPE, company_id: c.id, priority: 3 }));
    await insertRows("landscape_candidates", cands, { onConflict: "landscape_slug,company_id", ignoreDuplicates: true });
    await insertRows("landscape_candidate_reasons",
      created.map((c) => ({ landscape_slug: LANDSCAPE, company_id: c.id, reason: "external_research",
                            source_ref: (rows.find((r) => r.slug === c.slug)?.source_urls || []).join(", ").slice(0, 500) })),
      { onConflict: "landscape_slug,company_id,reason", ignoreDuplicates: true });
    console.log(`Added ${created.length} to landscape_candidates (${LANDSCAPE}).`);
    void url;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
