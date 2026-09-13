// Offline tests for the Supabase retry wrapper. Stubs global fetch; no network.
// Run: SB_RETRY_BASE_MS=1 node scripts/test-retry.mjs   (the harness sets it)
import assert from "node:assert/strict";

process.env.SB_RETRY_BASE_MS = "1";   // keep backoff instant under test
process.env.SB_RETRIES = "3";
const { sbFetch } = await import("./lib/supabase.mjs");

const realFetch = globalThis.fetch;
const realError = console.error;
const quiet = () => { console.error = () => {}; };
const loud = () => { console.error = realError; };

// Script a sequence of outcomes; each is a status number or an Error to throw.
function scripted(outcomes) {
  let i = 0;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push((init.method || "GET").toUpperCase());
    const o = outcomes[Math.min(i++, outcomes.length - 1)];
    if (o instanceof Error) throw o;
    return { ok: o < 400, status: o, text: async () => `status ${o}` };
  };
  return calls;
}

quiet();
try {
  // --- the exact failure from the first live weekly ------------------------
  let calls = scripted([504, 504, 200]);
  let res = await sbFetch("https://x/rest/v1/articles?select=id");
  assert.equal(res.status, 200, "two 504s then success → success");
  assert.equal(calls.length, 3, "made three attempts");

  // --- gives up after the configured retries -----------------------------
  calls = scripted([504]);
  res = await sbFetch("https://x/rest/v1/articles");
  assert.equal(res.status, 504, "a persistent 504 is surfaced, not swallowed");
  assert.equal(calls.length, 4, "1 attempt + 3 retries");

  // --- network errors retry regardless of method -------------------------
  calls = scripted([new Error("ECONNRESET"), 201]);
  res = await sbFetch("https://x/rest/v1/articles", { method: "POST" });
  assert.equal(res.status, 201, "a write retries when the request never got out");
  assert.equal(calls.length, 2);

  // --- but a 5xx on a write is NOT retried --------------------------------
  // The server may have committed; a blind retry of a plain INSERT could
  // duplicate. That ambiguity has to reach the caller.
  calls = scripted([504, 201]);
  res = await sbFetch("https://x/rest/v1/articles", { method: "POST" });
  assert.equal(res.status, 504, "a 504 on a write surfaces on the first attempt");
  assert.equal(calls.length, 1, "no retry of a write on 5xx");

  calls = scripted([503, 200]);
  res = await sbFetch("https://x/rest/v1/articles", { method: "PATCH" });
  assert.equal(calls.length, 1, "PATCH is not retried on 5xx either");

  // --- non-gateway errors are never retried --------------------------------
  calls = scripted([400, 200]);
  res = await sbFetch("https://x/rest/v1/articles");
  assert.equal(res.status, 400, "a 400 is the caller's problem, not a blip");
  assert.equal(calls.length, 1);

  calls = scripted([401, 200]);
  res = await sbFetch("https://x/rest/v1/articles");
  assert.equal(calls.length, 1, "401 is not retried");

  // --- HEAD counts as idempotent -------------------------------------------
  calls = scripted([502, 200]);
  res = await sbFetch("https://x/rest/v1/articles", { method: "HEAD" });
  assert.equal(res.status, 200, "HEAD retries on 502");

  // --- a network error that never clears is thrown -------------------------
  calls = scripted([new Error("ENOTFOUND")]);
  await assert.rejects(() => sbFetch("https://x/rest/v1/articles"), /ENOTFOUND/,
    "persistent network failure is thrown after retries");
  assert.equal(calls.length, 4);
} finally {
  globalThis.fetch = realFetch;
  loud();
}

console.log("✓ all retry checks passed");
