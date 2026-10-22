// Move production status out of products.specs into products.status.
//
// 408 products carry a free-text `UAV · Production status` inside the specs JSONB —
// about 160 distinct spellings of six ideas ("In production", "in service",
// "Prototype/limited", "Cancelled (program ended 2018)", "Superseded by Orlan-3M").
// The catalogue has been normalising these on every build. This does it once:
//
//   products.status         the normalised value, which the site filters on
//   products.status_detail  the original text, which carries the detail the
//                           vocabulary cannot keep
//
// and then removes the key from specs. Nothing is lost — the raw string survives
// in status_detail.
//
//   node scripts/migrate-status.mjs --dry-run      # show the mapping, write nothing
//   node scripts/migrate-status.mjs                # apply
//
// Flags
//   --dry-run     print the full mapping and the bucket counts, write nothing
//   --limit N     stop after N products (default: all)
//   --quiet       bucket counts only, no per-row lines
//
// Resumable and idempotent: a migrated row no longer has the specs key, so a
// re-run simply finds nothing to do.
//
// The mapping lives in lib/status.mjs and is covered by scripts/test-status.mjs,
// which pins all 160 distinct spellings found in the database. Run that first.
//
// Requires the 2026-10-22_maturity_and_evidence.sql migration first — it adds
// status_detail and widens the products_status_check vocabulary.

import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch, fetchAllRows } from "./lib/supabase.mjs";
import { normaliseStatus } from "./lib/status.mjs";

loadDotenv();

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const DRY = args.includes("--dry-run");
const QUIET = args.includes("--quiet");
const LIMIT = Number(flag("limit", 0)) || Infinity;

const SPEC_KEY = "UAV · Production status";

async function patchProduct(id, fields) {
  const { url, serviceKey } = sbConfig();
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY is required to write.");
  const res = await sbFetch(`${url}/rest/v1/products?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`PATCH products ${id} ${res.status}: ${await res.text()}`);
}

async function main() {
  sbConfig();
  console.log(`Reading products…${DRY ? "  (dry run — nothing will be written)" : ""}`);
  const all = await fetchAllRows("products", "id,name,category,status,specs");

  const todo = all
    .filter((p) => p.specs && Object.prototype.hasOwnProperty.call(p.specs, SPEC_KEY))
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`  ${all.length} products, ${todo.length} carry "${SPEC_KEY}"\n`);
  if (!todo.length) {
    console.log("Nothing to migrate.");
    return;
  }

  const counts = {};
  const collisions = [];
  let done = 0, failed = 0;

  for (const p of todo) {
    const detail = String(p.specs[SPEC_KEY] ?? "").trim();
    const status = normaliseStatus(detail);
    counts[status] = (counts[status] || 0) + 1;

    // A row that already has a status is not overwritten silently — report it.
    if (p.status && p.status !== status) {
      collisions.push(`${p.name}: has "${p.status}", spec says "${detail}" -> ${status}`);
      continue;
    }

    if (!QUIET) console.log(`  ${status.padEnd(14)} ${detail.slice(0, 54).padEnd(56)} ${p.name}`);

    if (DRY) { done++; continue; }

    const specs = { ...p.specs };
    delete specs[SPEC_KEY];
    try {
      await patchProduct(p.id, { status, status_detail: detail || null, specs });
      done++;
    } catch (e) {
      failed++;
      console.error(`  FAILED ${p.name}: ${e.message}`);
    }
  }

  console.log("\nBuckets:");
  for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(14)} ${n}`);
  }
  if (counts.unknown) {
    console.log(`\n  ${counts.unknown} fell to "unknown" — worth reading those spec strings; ` +
      `a new keyword in STATUS_BUCKETS usually fixes a batch of them at once.`);
  }
  if (collisions.length) {
    console.log(`\nSkipped ${collisions.length} rows that already had a different status:`);
    collisions.forEach((c) => console.log(`  ${c}`));
  }
  console.log(`\n${DRY ? "Would migrate" : "Migrated"} ${done}${failed ? `, ${failed} failed` : ""}.`);
  if (DRY) console.log("Re-run without --dry-run to apply.");
}

main().catch((e) => { console.error(e); process.exit(1); });
