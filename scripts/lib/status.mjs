// Normalising free-text production status.
//
// `products.specs['UAV · Production status']` holds about 160 spellings of six
// ideas, written by hand and by the LLM enrichment pass over many months. This
// turns them into the vocabulary the catalogue filters on.
//
// Ported verbatim from xSonomy/scripts/generate-supabase.mjs, where the same
// rules have been running at build time, so moving the values into the database
// changes nothing a visitor sees.
//
// Order matters:
//   1. OVERRIDE wins anywhere in the string. "Cancelled / demonstrator only" is
//      cancelled, not a prototype; "Consumer (legacy)" is discontinued, not in
//      production. Without this pass the later rules get them backwards.
//   2. Prefix match — what the string leads with is what it mostly means.
//   3. Substring match.
//   4. WEAK substrings last, so "Developed / in use" stays in_production while a
//      bare "Developed" lands in development rather than unknown.

export const STATUS_VALUES = [
  "in_production", "discontinued", "prototype", "development", "cancelled", "unknown",
];

const STATUS_OVERRIDE = [
  ["cancelled",    ["cancel"]],
  ["discontinued", ["discontinu", "out of production", "retired", "superseded",
                    "predecessor model", "legacy"]],
];
const STATUS_BUCKETS = [
  ["in_production", ["in production", "in service", "production", "produced", "serial", "active",
                     "operational", "commercial", "consumer", "catalogue", "marketed", "available",
                     "fielded", "in use", "in operation", "mature", "export offering",
                     "limited production"]],
  ["prototype",     ["prototype", "demonstrator", "experimental", "research"]],
  ["development",   ["development", "in development", "concept", "project", "testing", "test",
                     "trials", "flight", "announced", "export development", "limited", "tested"]],
];
const STATUS_WEAK = [["development", ["developed"]]];

export function normaliseStatus(raw) {
  const s = String(raw == null ? "" : raw).trim().toLowerCase();
  if (!s) return "unknown";
  for (const [b, keys] of STATUS_OVERRIDE) for (const k of keys) if (s.includes(k)) return b;
  for (const [b, keys] of STATUS_BUCKETS) for (const k of keys) if (s.startsWith(k)) return b;
  for (const [b, keys] of STATUS_BUCKETS) for (const k of keys) if (s.includes(k)) return b;
  for (const [b, keys] of STATUS_WEAK) for (const k of keys) if (s.includes(k)) return b;
  return "unknown";
}
