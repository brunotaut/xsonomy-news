// Maturity assessments publish unreviewed under the UAV360 name, so these are the
// ways a bad one could reach a public page.
//
//   node scripts/test-maturity.mjs

import { validateAssessment, rollUp, parseAssessment, MATURITY, RANK } from "./lib/maturity.mjs";

const SOURCES = [
  { url: "https://ex.com/1" }, { url: "https://ex.com/2" }, { url: "https://ex.com/3" },
];
const RATIONALE = "Fielded with the Royal Netherlands Army since 2024 per the cited report.";

let failed = 0;
const fail = (m) => { failed++; console.error(`  FAIL ${m}`); };
const accepts = (label, raw, then) => {
  const r = validateAssessment(raw, SOURCES);
  if (!r.ok) return fail(`${label}: rejected — ${r.why}`);
  if (then) then(r.value, (m) => fail(`${label}: ${m}`));
};
const rejects = (label, raw, hint) => {
  const r = validateAssessment(raw, SOURCES);
  if (r.ok) return fail(`${label}: accepted, should reject`);
  if (hint && !r.why.includes(hint)) fail(`${label}: rejected for "${r.why}", wanted "${hint}"`);
};

const base = { maturity: "deployed", sources: [1], rationale: RATIONALE };

// --- the source URL is ours, never the model's ---------------------------------
accepts("sources resolve to our URLs", base, (v, f) => {
  if (v.maturity_source_urls[0] !== "https://ex.com/1") f(`got ${v.maturity_source_urls[0]}`);
});
accepts("a model-supplied url is ignored",
  { ...base, maturity_source_urls: ["https://evil.example/x"], url: "https://evil.example/y" },
  (v, f) => { if (JSON.stringify(v.maturity_source_urls) !== '["https://ex.com/1"]')
    f(`leaked: ${JSON.stringify(v.maturity_source_urls)}`); });
rejects("citation out of range", { ...base, sources: [9] }, "out of range");
rejects("citation zero", { ...base, sources: [0] }, "out of range");
rejects("non-numeric citation", { ...base, sources: ["the first"] }, "out of range");
rejects("no citations at all", { ...base, sources: [] }, "cites no source");
rejects("citations missing", { maturity: "deployed", rationale: RATIONALE }, "cites no source");

// --- "scaled" means multiple, so one source cannot establish it ------------------
rejects("scaled from a single source", { ...base, maturity: "scaled", sources: [1] },
  "needs 2 distinct sources");
rejects("scaled from the same source twice", { ...base, maturity: "scaled", sources: [2, 2] },
  "needs 2 distinct sources");
accepts("scaled from two distinct sources", { ...base, maturity: "scaled", sources: [1, 3] },
  (v, f) => { if (v.maturity_source_urls.length !== 2) f("deduped too far"); });
accepts("deployed needs only one", { ...base, maturity: "deployed", sources: [2] });

// --- vocabulary -------------------------------------------------------------------
for (const m of MATURITY) {
  accepts(`accepts "${m}"`, { ...base, maturity: m, sources: m === "scaled" ? [1, 2] : [1] });
}
rejects("invented level", { ...base, maturity: "mature" }, "unknown maturity");
rejects("numeric level", { ...base, maturity: 4 }, "unknown maturity");
accepts("case-insensitive", { ...base, maturity: "DEPLOYED" },
  (v, f) => { if (v.maturity !== "deployed") f(v.maturity); });

// --- declining is a valid answer, and the common one -------------------------------
for (const [label, raw] of [
  ["null maturity", { maturity: null }],
  ["absent maturity", { rationale: "nothing here" }],
  ['the string "none"', { maturity: "none" }],
  ['the string "null"', { maturity: "null" }],
]) {
  const r = validateAssessment(raw, SOURCES);
  if (!r.ok) fail(`${label}: rejected — ${r.why}`);
  else if (r.value !== null) fail(`${label}: should be null, got ${JSON.stringify(r.value)}`);
}

// --- a judgement has to be explained -----------------------------------------------
rejects("no rationale", { ...base, rationale: "" }, "too thin");
rejects("one-word rationale", { ...base, rationale: "Deployed." }, "too thin");
rejects("whitespace rationale", { ...base, rationale: "        " }, "too thin");
accepts("long rationale is truncated", { ...base, rationale: "x".repeat(900) },
  (v, f) => { if (v.maturity_rationale.length > 600) f(`${v.maturity_rationale.length} chars`); });

// --- provenance is always stamped ----------------------------------------------------
accepts("stamps assessor and date", base, (v, f) => {
  if (v.maturity_assessed_by !== "llm") f(`assessed_by ${v.maturity_assessed_by}`);
  if (!v.maturity_assessed_at) f("no assessed_at");
  // The database refuses a maturity without both of these; make sure we always send them.
  if (!v.maturity_source_urls.length) f("no sources — the DB CHECK would reject this");
});
accepts("unknown confidence becomes medium", { ...base, confidence: "certain" },
  (v, f) => { if (v.maturity_confidence !== "medium") f(v.maturity_confidence); });

// --- junk -----------------------------------------------------------------------------
rejects("null", null, "not an object");
rejects("a sentence", "I think it is deployed", "not an object");

// --- the roll-up takes the strongest ----------------------------------------------------
const eq = (label, got, want) => { if (got !== want) fail(`${label}: got ${got}, want ${want}`); };
eq("roll-up picks the highest", rollUp(["emerging", "deployed", "commercial"]), "deployed");
eq("roll-up ignores junk", rollUp(["emerging", "banana", null, undefined]), "emerging");
eq("roll-up of nothing is null", rollUp([]), null);
eq("roll-up of only junk is null", rollUp(["banana"]), null);
eq("scaled outranks deployed", rollUp(["deployed", "scaled"]), "scaled");
eq("rank order", MATURITY.map((m) => RANK[m]).join(","), "1,2,3,4,5");

// --- parsing -------------------------------------------------------------------------
eq("plain JSON", parseAssessment('{"maturity":"deployed"}')?.maturity, "deployed");
eq("fenced JSON", parseAssessment('```json\n{"maturity":"scaled"}\n```')?.maturity, "scaled");
eq("JSON after prose", parseAssessment('Here:\n{"maturity":null}')?.maturity, null);
eq("no JSON", parseAssessment("I cannot tell."), null);
eq("malformed", parseAssessment('{"maturity":}'), null);
eq("empty", parseAssessment(""), null);

console.log(failed ? `\n${failed} failing.` : "maturity validation: all checks passed");
if (failed) process.exit(1);
