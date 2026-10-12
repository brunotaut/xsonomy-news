// Offline tests for the unsubscribe link and page. No network.
// Run: node scripts/test-unsubscribe.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unsubscribeLinkFor, buildHtml } from "./digest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const TOKEN = "be3f23af-112a-406b-b951-c1368b644eb1";

// --- the link ---------------------------------------------------------------
const withToken = unsubscribeLinkFor({ email: "a@b.com", unsub_token: TOKEN }, "https://uav360.xyz");
assert.equal(withToken, `https://uav360.xyz/unsubscribe/?t=${TOKEN}`,
  "a subscriber gets a self-service https link, not a mailto");
assert.ok(!withToken.startsWith("mailto:"), "no mailto for someone who can be unsubscribed automatically");

// recipients.json / DIGEST_TO entries have no row, so they keep the mailto.
const noToken = unsubscribeLinkFor({ email: "a@b.com" }, "https://uav360.xyz", "news@uav360.xyz");
assert.ok(noToken.startsWith("mailto:news@uav360.xyz"), "no token falls back to mailto");
assert.ok(noToken.includes(encodeURIComponent("Unsubscribe a@b.com")), "mailto names the address");
assert.equal(unsubscribeLinkFor(null, "https://uav360.xyz").startsWith("mailto:"), true, "null recipient is safe");

// --- the email renders it ----------------------------------------------------
const sample = [{ url: "https://x/a", title: "Army awards C-UAS contract", summary: "x",
  source: "Breaking Defense", published_at: "2026-10-01T09:00:00Z", tags: ["counter-uas"] }];
const mail = buildHtml(sample, "day", { email: "a@b.com", unsubscribeUrl: withToken });
assert.ok(mail.includes(`href="${withToken}"`), "the footer links to the token URL");
assert.ok(mail.includes(">Unsubscribe</a>"), "the link is labelled Unsubscribe");

// --- the one-click header must not be advertised -----------------------------
// RFC 8058 one-click requires a URL that accepts POST. /unsubscribe/ is a static
// page, so claiming one-click makes Gmail and Yahoo POST into a 404.
const digestSrc = read("scripts/digest.mjs");
assert.ok(digestSrc.includes('"List-Unsubscribe": `<${unsubscribeUrl}>`'), "List-Unsubscribe is sent");
// Match the header being SET (an object key), not the comment explaining why
// it is absent.
assert.ok(!/"List-Unsubscribe-Post"\s*:/.test(digestSrc),
  "one-click POST is NOT advertised — the page cannot accept a POST");

// --- the page ----------------------------------------------------------------
const page = read("src/unsubscribe.html");
assert.ok(page.includes("rpc/unsubscribe"), "the page calls the unsubscribe function");
assert.ok(page.includes("__SUPABASE_ANON__"), "the key is injected at build time, not hard-coded");
assert.ok(/\{36\}/.test(page), "the token is shape-checked before any request");
assert.ok(page.includes('name="robots" content="noindex"'), "an unsubscribe page should not be indexed");
assert.ok(page.includes("__FOOTER__") && page.includes("__CSSV__"), "page carries site chrome and the CSS version");

const gen = read("scripts/generate.mjs");
assert.ok(gen.includes('join(OUT, "unsubscribe", "index.html")'), "the build publishes /unsubscribe/");
assert.ok(gen.includes("__SUPABASE_ANON__"), "the build injects the publishable key");

console.log("✓ all unsubscribe checks passed");
