// Every page the site serves must carry the same chrome: the analytics tag, the
// footer with its credit, and the header nav. There are three separate builders
// (two static templates + issuepage.mjs), so this is the check that stops a new
// page type shipping without them. No network, no env.
// Run: node scripts/test-site.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyticsTag, siteFooter, consentBanner, GA_MEASUREMENT_ID, LINKEDIN_URL, CONSENT_KEY } from "./lib/chrome.mjs";
import { buildIssuePage } from "./lib/issuepage.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

// --- the tag itself ---------------------------------------------------------
const tag = analyticsTag();
assert.ok(tag.includes("googletagmanager.com/gtag/js?id=G-WG7PSZKB78"), "loads gtag.js for the property");
assert.ok(tag.includes("gtag('config', 'G-WG7PSZKB78')"), "configures the property");
assert.ok(tag.includes("window.dataLayer = window.dataLayer || []"), "initialises dataLayer");
assert.ok(tag.includes("<script async"), "loads asynchronously, so it cannot block rendering");
assert.equal(GA_MEASUREMENT_ID, "G-WG7PSZKB78");

// Opting out has to be possible without editing code.
assert.equal(analyticsTag(""), "", "an empty measurement id disables analytics entirely");

// --- consent gating ---------------------------------------------------------
// The banner only means something if storage is denied BEFORE gtag.js decides
// what to write, so assert the ordering, not just the presence of the words.
assert.ok(tag.includes("analytics_storage: 'denied'"), "analytics storage starts denied");
assert.ok(tag.includes("ad_storage: 'denied'"), "ad storage starts denied");
assert.ok(tag.indexOf("'consent', 'default'") < tag.indexOf("gtag('config'"),
  "consent defaults are set before the property is configured");
assert.ok(tag.includes(`localStorage.getItem('${CONSENT_KEY}')`), "a previous grant is restored");
assert.ok(tag.indexOf("'consent', 'update'") < tag.indexOf("gtag('config'"),
  "a returning visitor is granted before config, so their first pageview counts");

const banner = consentBanner();
assert.ok(banner.includes('id="consent-yes"') && banner.includes('id="consent-no"'),
  "the visitor can accept or decline");
assert.ok(banner.includes("hidden"), "starts hidden until the script decides to show it");
assert.ok(banner.includes('role="dialog"') && banner.includes("aria-label"), "announced to screen readers");
assert.ok(banner.includes("gtag('consent', 'update', { analytics_storage: 'granted' })"),
  "accepting turns analytics storage on without a reload");
assert.ok(/if \(stored\) return;/.test(banner), "asks once, not on every page");
assert.equal(consentBanner(""), "", "no analytics means no banner to show");

// --- the static templates carry a slot for it -------------------------------
for (const f of ["src/index.html", "src/digest.html"]) {
  const html = read(f);
  assert.ok(html.includes("__ANALYTICS__"), `${f} has the analytics slot`);
  assert.ok(html.includes("__FOOTER__"), `${f} has the footer slot`);
  assert.ok(html.includes("__CONSENT__"), `${f} has the consent slot`);
  assert.ok(html.indexOf("__CONSENT__") < html.indexOf("</body>"), `${f}: banner sits in <body>`);
  // The slot must be inside <head>, before </head>.
  assert.ok(html.indexOf("__ANALYTICS__") < html.indexOf("</head>"), `${f}: tag sits in <head>`);
}

// --- and generate.mjs actually fills them ------------------------------------
const gen = read("scripts/generate.mjs");
assert.equal((gen.match(/__ANALYTICS__/g) || []).length, 2, "both templates get the tag substituted");
assert.equal((gen.match(/__FOOTER__/g) || []).length, 2, "both templates get the footer substituted");

// --- issue pages build it in directly ---------------------------------------
const page = buildIssuePage({
  period: "month", title: "August 2026", slug: "2026-08",
  siteUrl: "https://uav360.xyz", totalCount: 782,
  trends: null, narrative: [], topics: [],
});
assert.ok(page.includes("googletagmanager.com/gtag/js?id=G-WG7PSZKB78"), "issue page carries the tag");
assert.ok(page.indexOf("gtag/js") < page.indexOf("</head>"), "issue page: tag sits in <head>");
assert.ok(page.includes(LINKEDIN_URL), "issue page carries the footer credit");
assert.ok(page.includes('class="site-head"'), "issue page carries the site header");
assert.ok(page.includes('id="consent"'), "issue page carries the consent banner");
assert.ok(page.includes("analytics_storage: 'denied'"), "issue page denies storage by default");
assert.ok(siteFooter().includes(LINKEDIN_URL), "footer carries the credit link");

// --- the committed archive pages were regenerated with it -------------------
for (const slug of ["2026-06", "2026-07", "2026-08"]) {
  const html = read(`archive/digests/${slug}.html`);
  assert.ok(html.includes("gtag/js?id=G-WG7PSZKB78"), `${slug} archive page has the tag`);
  assert.ok(html.includes(LINKEDIN_URL), `${slug} archive page has the credit`);
  assert.ok(html.includes('id="consent"'), `${slug} archive page has the consent banner`);
}

console.log("✓ all site chrome checks passed");
