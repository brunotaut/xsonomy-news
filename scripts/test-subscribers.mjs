// Offline tests for per-subscriber frequency preferences. No network, no env.
// Run: node scripts/test-subscribers.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { wantsPeriod } from "./digest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- who gets which issue ---------------------------------------------------
const all = { email: "all@x.com", daily: true, weekly: true, monthly: true };
const weeklyOnly = { email: "w@x.com", daily: false, weekly: true, monthly: false };
const monthlyOnly = { email: "m@x.com", daily: false, weekly: false, monthly: true };

assert.equal(wantsPeriod(all, "day"), true);
assert.equal(wantsPeriod(all, "week"), true);
assert.equal(wantsPeriod(all, "month"), true);

assert.equal(wantsPeriod(weeklyOnly, "day"), false, "weekly-only gets no daily");
assert.equal(wantsPeriod(weeklyOnly, "week"), true);
assert.equal(wantsPeriod(weeklyOnly, "month"), false);

assert.equal(wantsPeriod(monthlyOnly, "month"), true);
assert.equal(wantsPeriod(monthlyOnly, "day"), false);

// Anyone predating the choice — no flags at all — keeps receiving everything.
// This is what makes every existing subscriber subscribed to all three.
const legacy = { email: "old@x.com" };
for (const p of ["day", "week", "month"]) {
  assert.equal(wantsPeriod(legacy, p), true, `a recipient with no preferences still gets ${p}`);
}
// An explicit false is the ONLY thing that opts someone out.
assert.equal(wantsPeriod({ email: "x", daily: undefined }, "day"), true);
assert.equal(wantsPeriod({ email: "x", daily: false }, "day"), false);

// --- the form offers the three choices, all pre-ticked ----------------------
const html = readFileSync(join(ROOT, "src/index.html"), "utf8");
for (const id of ["sub-daily", "sub-weekly", "sub-monthly"]) {
  assert.ok(html.includes(`id="${id}"`), `form has ${id}`);
}
const boxes = html.match(/<input type="checkbox"[^>]*>/g) || [];
assert.equal(boxes.length, 3, "exactly three checkboxes");
assert.ok(boxes.every((b) => b.includes("checked")), "all three default to ticked");
assert.ok(html.includes("By pressing Subscribe, you agree to receive newsletters from UAV360"),
  "consent line is present");

// --- the form script sends the preferences ----------------------------------
const js = readFileSync(join(ROOT, "src/assets/subscribe.js"), "utf8");
for (const id of ["sub-daily", "sub-weekly", "sub-monthly"]) {
  assert.ok(js.includes(id), `script reads ${id}`);
}
assert.ok(/Pick at least one/.test(js), "refuses an empty selection");
assert.ok(/\.\.\.prefs/.test(js), "sends the preferences with the row");

console.log("✓ all subscriber preference checks passed");
