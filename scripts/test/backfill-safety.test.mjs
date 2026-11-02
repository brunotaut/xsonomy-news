// Safety guardrails for the evidence backfill and the read-only evaluation.
//
// These assert properties of the SOURCE, in the same spirit as the
// rollback-manifest test: the claims made about these two scripts are that they
// write one column and nothing else, and that dry mode writes nothing at all.
// A future edit that quietly widens either is what this catches.
//
//   node --test scripts/test/backfill-safety.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");
// Assert against CODE, not prose. A first version of this test failed because
// the eval script's own header says "There is no --apply" — the comment
// describing the absence tripped the check for the presence.
const code = (p) => read(p)
  .replace(/^\s*\/\/.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const supabase = read("scripts/lib/supabase.mjs");
const backfill = code("scripts/analyze-backfill.mjs");
const evalScript = code("scripts/eval-extraction.mjs");

test("patchEvidenceOnly sends entity_evidence and nothing else", () => {
  const fn = supabase.slice(supabase.indexOf("export async function patchEvidenceOnly"));
  const body = fn.slice(fn.indexOf("JSON.stringify("), fn.indexOf("});", fn.indexOf("JSON.stringify(")));
  assert.match(body, /entity_evidence/);
  for (const forbidden of ["companies", "products", "analyzed_at", "entities_resolved_at", "publication_status"]) {
    assert.doesNotMatch(body, new RegExp(forbidden), `must not write ${forbidden}`);
  }
});

test("the evidence backfill only ever calls the evidence-only writer", () => {
  const fn = backfill.slice(backfill.indexOf("async function backfillEvidence"));
  assert.match(fn, /patchEvidenceOnly/);
  // Not the full-analysis writer, and nothing that touches other tables.
  assert.doesNotMatch(fn, /patchAnalysis/, "must not rewrite companies/products/analyzed_at");
  for (const forbidden of ["insertRows", "deleteTagResolutions", "stampEntitiesResolved"]) {
    assert.doesNotMatch(fn, new RegExp(forbidden), `must not call ${forbidden}`);
  }
});

test("dry mode returns before the write, not after it", () => {
  const fn = backfill.slice(backfill.indexOf("async function backfillEvidence"));
  const dryIx = fn.indexOf("if (DRY)");
  const writeIx = fn.indexOf("patchEvidenceOnly");
  assert.ok(dryIx > 0 && writeIx > 0, "both present");
  assert.ok(dryIx < writeIx, "the DRY guard must come first");
  assert.match(fn.slice(dryIx, dryIx + 60), /return/, "and it must return, not fall through");
});

test("the backfill restricts evidence to names already stored on the article", () => {
  const fn = backfill.slice(backfill.indexOf("async function backfillEvidence"));
  assert.match(fn, /stored\.some/, "filters against the row's existing products[]");
  assert.match(fn, /byUrl\.get\(item\.url\)\?\.products/);
});

test("the evaluation script writes nothing and has no apply path", () => {
  for (const forbidden of ["patchAnalysis", "patchEvidenceOnly", "insertRows", "deleteTagResolutions",
                           "stampEntitiesResolved", "--apply"]) {
    assert.doesNotMatch(evalScript, new RegExp(forbidden.replace(/[-]/g, "\\-")), `must not contain ${forbidden}`);
  }
  // and the prose must still say so, checked against the uncommented file
  assert.match(read("scripts/eval-extraction.mjs"), /WRITES NOTHING/, "and must say so at the top");
});

test("the evaluation refuses to pretend when the key is absent", () => {
  assert.match(evalScript, /BLOCKED: ANTHROPIC_API_KEY is not set/);
  assert.match(evalScript, /process\.exit\(2\)/, "a distinct exit code for 'blocked', not 'passed'");
});

test("the derived-taxonomy check is read-only in both forms", () => {
  const checker = code("scripts/check-derived-taxonomy.mjs");
  for (const forbidden of ["insertRows", "patchAnalysis", "delete from", "update ", "deleteTagResolutions"]) {
    assert.doesNotMatch(checker, new RegExp(forbidden, "i"), `must not contain ${forbidden}`);
  }
  assert.match(read("scripts/check-derived-taxonomy.mjs"), /REPORTS ONLY/);
});

test("the validation workflow never resolves, publishes or clears caches", () => {
  const wf = read(".github/workflows/extraction-validate.yml");
  for (const forbidden of ["npm run resolve", "resolve-entities", "publication_status"]) {
    assert.doesNotMatch(wf, new RegExp(forbidden), `must not run ${forbidden}`);
  }
  assert.match(wf, /missing-evidence --dry/, "a dry mode must be offered");
  assert.match(wf, /npm test/, "tests gate the model and database modes");
});
