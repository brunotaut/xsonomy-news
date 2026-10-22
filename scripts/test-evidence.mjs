// Validation is the whole safety mechanism for extract-evidence.mjs: the model
// publishes without review, so anything it returns that validateRow() lets through
// goes straight onto a public page. These cases are the ways it can go wrong.
//
//   node scripts/test-evidence.mjs

import { validateRow, parseRows } from "./lib/evidence.mjs";

const ARTICLES = [
  { url: "https://ex.com/a", title: "Firm wins MoD order", published_at: "2026-05-02T00:00:00Z" },
  { url: "https://ex.com/b", title: "Trials begin",        published_at: "2024-01-15T00:00:00Z" },
  { url: "https://ex.com/c", title: "Line opens",          published_at: null },
];

let failed = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`  FAIL ${label}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};
const ok    = (label, raw) => { const r = validateRow(raw, ARTICLES);
  if (!r.ok) { failed++; console.error(`  FAIL ${label}: rejected — ${r.why}`); } };
const rejects = (label, raw, hint) => { const r = validateRow(raw, ARTICLES);
  if (r.ok) { failed++; console.error(`  FAIL ${label}: accepted, should reject`); }
  else if (hint && !r.why.includes(hint)) { failed++; console.error(`  FAIL ${label}: rejected for "${r.why}", expected "${hint}"`); } };

const base = { article: 1, kind: "contract", counterparty: "UK MoD", summary: "Won an order." };

// --- the source URL always comes from our data, never the model ---------------
{
  const r = validateRow({ ...base, source_url: "https://evil.example/made-up" }, ARTICLES);
  if (!r.ok) { failed++; console.error("  FAIL source: rejected unexpectedly"); }
  else if (r.row.source_url !== "https://ex.com/a") {
    failed++; console.error(`  FAIL source: model's URL leaked through — ${r.row.source_url}`);
  }
}
// A citation pointing nowhere cannot resolve, so it cannot be published.
rejects("article index 0", { ...base, article: 0 }, "out of range");
rejects("article index 99", { ...base, article: 99 }, "out of range");
rejects("article not a number", { ...base, article: "the first one" }, "out of range");
rejects("article missing", { ...base, article: undefined }, "out of range");

// --- vocabulary ---------------------------------------------------------------
rejects("unknown kind", { ...base, kind: "acquisition" }, "unknown kind");
rejects("empty kind", { ...base, kind: "" }, "unknown kind");
ok("kind is case-insensitive", { ...base, kind: "CONTRACT" });

// --- a counterparty, where the kind is meaningless without one ------------------
rejects("contract with no counterparty", { ...base, counterparty: null }, "needs a counterparty");
rejects("customer with blank counterparty", { ...base, kind: "customer", counterparty: "   " }, "needs a counterparty");
ok("production needs no counterparty", { article: 3, kind: "production", summary: "Serial production started." });
ok("demonstration needs no counterparty", { article: 2, kind: "demonstration", summary: "Flew at a trial." });

// --- a row has to say something -------------------------------------------------
rejects("no summary", { ...base, summary: "" }, "no summary");

// --- dates the article cannot support -------------------------------------------
rejects("year after publication", { ...base, occurred_year: 2030 }, "after the article");
rejects("absurd year", { ...base, occurred_year: 12 }, "implausible");
{
  const r = validateRow({ ...base, occurred_year: null }, ARTICLES);
  check("undated row falls back to the publication year", r.ok && r.row.occurred_year, 2026);
  const s = validateRow({ ...base, article: 2, occurred_year: 2023 }, ARTICLES);
  check("an earlier year is kept", s.ok && s.row.occurred_year, 2023);
  const t = validateRow({ article: 3, kind: "production", summary: "x", occurred_year: null }, ARTICLES);
  check("no article date leaves the year null", t.ok && t.row.occurred_year, null);
}

// --- money ----------------------------------------------------------------------
{
  const r = validateRow({ ...base, value_amount: 4500000, value_currency: "gbp" }, ARTICLES);
  check("currency is upper-cased", r.ok && r.row.value_currency, "GBP");
  const s = validateRow({ ...base, value_amount: "about 5 million" }, ARTICLES);
  check("unparseable amount is dropped", s.ok && s.row.value_amount, null);
  const t = validateRow({ ...base, value_amount: -5 }, ARTICLES);
  check("negative amount is dropped", t.ok && t.row.value_amount, null);
  const u = validateRow({ ...base, value_currency: "GBP" }, ARTICLES);
  check("currency without an amount is dropped", u.ok && u.row.value_currency, null);
  const v = validateRow({ ...base, value_amount: 100, value_currency: "pounds" }, ARTICLES);
  check("non-ISO currency is dropped", v.ok && v.row.value_currency, null);
}

// --- confidence -------------------------------------------------------------------
{
  const r = validateRow({ ...base, confidence: "certain" }, ARTICLES);
  check("unknown confidence falls back to medium", r.ok && r.row.confidence, "medium");
  const s = validateRow({ ...base, confidence: "HIGH" }, ARTICLES);
  check("confidence is case-insensitive", s.ok && s.row.confidence, "high");
}

// --- junk ---------------------------------------------------------------------------
rejects("null row", null, "not an object");
rejects("string row", "contract with the MoD", "not an object");

// --- parsing the model's reply ------------------------------------------------------
check("plain JSON", parseRows('{"rows":[{"article":1}]}')?.length, 1);
check("fenced JSON", parseRows('```json\n{"rows":[{"article":1}]}\n```')?.length, 1);
check("JSON after prose", parseRows('Here is what I found:\n{"rows":[]}')?.length, 0);
check("no JSON at all", parseRows("I could not find any evidence."), null);
check("malformed JSON", parseRows('{"rows":[}'), null);
check("JSON without rows", parseRows('{"evidence":[]}'), null);
check("empty input", parseRows(""), null);

console.log(failed ? `\n${failed} failing.` : "evidence validation: all checks passed");
if (failed) process.exit(1);
