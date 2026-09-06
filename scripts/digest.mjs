// Email digest of newly-ingested UAV/C-UAS items, grouped by theme, sent via Resend.
//
//   node scripts/digest.mjs --period day       # last 24h  (daily digest)
//   node scripts/digest.mjs --period week      # last 7 days (Monday roundup)
//   node scripts/digest.mjs --period month     # last 30 days (monthly digest)
//   node scripts/digest.mjs --period day --dry # render HTML to ./public/_digest.html, no send
//
// Weekly and monthly issues are a defence / counter-UAV digest, not a headline
// list. They open with a written lead ("what happened", in sentences), then the
// trends numbers, then a ranked shortlist of topics. Consumer and civil-mobility
// coverage is filtered out first (see lib/relevance.mjs). Each issue is archived
// as a permanent page under archive/digests/, which generate.mjs publishes at
// SITE_URL/digest/<slug>/.
//
// Env: SUPABASE_URL + (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY) to read,
//      RESEND_API_KEY to send, DIGEST_TO (comma-separated), DIGEST_FROM, SITE_URL.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenv } from "./lib/http.mjs";
import {
  fetchSince, fetchSubscribers, fetchArticlesBetween, fetchEntityMentions, fetchEntityLinks,
} from "./lib/supabase.mjs";
import { buildTrends, buildNarrative, issueSlug, issueTitle } from "./lib/trends.mjs";
import { rankTopics } from "./lib/topics.mjs";
import { splitByRelevance, withoutConsumerCompanies } from "./lib/relevance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PERIOD = args.includes("--month") ? "month" : getArg("--period", "day");  // "day" | "week" | "month"
const DRY = args.includes("--dry");
// Roundups run in two passes in CI: write the archive page, publish the site,
// then send the email — so the "read this online" link is live before it lands.
const SKIP_SEND = args.includes("--skip-send");
const SKIP_ARCHIVE = args.includes("--skip-archive");
// Backfill a specific calendar month, e.g. --month 2026-07. Compared against the
// month before it, and archived under that month's slug.
const MONTH_ARG = getArg("--month", null);
const PERIOD_HOURS = { day: 24, week: 24 * 7, month: 24 * 30 };
const HOURS = PERIOD_HOURS[PERIOD] || 24;
// A digest is a shortlist, not an archive. A week carries ~200 stories and a
// month ~850; nobody reads that. Roundups lead with ranked TOPICS instead, and
// the permanent archive page carries a longer list than the email.
const TOPICS_EMAIL = { week: 10, month: 20 };
const TOPICS_ARCHIVE = { week: 20, month: 40 };
// Only the longer issues get analytics and a permanent archive page.
const IS_ROUNDUP = PERIOD === "week" || PERIOD === "month";

const SITE_URL = (process.env.SITE_URL || "https://uav360.xyz").replace(/\/+$/, "");
const FROM = process.env.DIGEST_FROM || "UAV360 News <news@uav360.xyz>";
// mailto used for unsubscribe (no subscription DB — removal is manual via recipients.json)
const UNSUB_ADDR = process.env.DIGEST_UNSUBSCRIBE || "news@uav360.xyz";

// Recipients with optional per-person tag filters.
// Priority: recipients.json  >  DIGEST_RECIPIENTS env (JSON)  >  DIGEST_TO env (all tags).
async function loadRecipients() {
  let base = [];
  const file = join(ROOT, "recipients.json");
  if (existsSync(file)) {
    const j = JSON.parse(await readFile(file, "utf8"));
    base = normaliseRecipients(j.recipients || j);
  } else if (process.env.DIGEST_RECIPIENTS) {
    const j = JSON.parse(process.env.DIGEST_RECIPIENTS);
    base = normaliseRecipients(j.recipients || j);
  } else {
    const list = (process.env.DIGEST_TO || "brntaut@gmail.com").split(",").map((s) => s.trim()).filter(Boolean);
    base = list.map((email) => ({ email, tags: [] }));
  }
  // Merge website sign-ups from the Supabase `subscribers` table. They have no
  // tag filter, so they receive every theme. Deduped against base (base wins).
  let subs = [];
  try {
    subs = normaliseRecipients(await fetchSubscribers());
  } catch (e) {
    console.error(`Could not load Supabase subscribers (${e.message}); using base recipients only.`);
  }
  const seen = new Set(base.map((r) => r.email.toLowerCase()));
  const merged = [...base];
  for (const s of subs) {
    const k = (s.email || "").toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); merged.push(s); }
  }
  console.log(`Recipients: ${base.length} base + ${merged.length - base.length} subscriber(s) = ${merged.length}.`);
  return merged;
}
function normaliseRecipients(arr) {
  return (arr || [])
    .map((r) => (typeof r === "string" ? { email: r, tags: [] } : { email: r.email, tags: Array.isArray(r.tags) ? r.tags : [] }))
    .filter((r) => r.email);
}
// Keep items matching a recipient's tag filter ([] / missing = everything).
export function filterForRecipient(items, tags) {
  if (!tags || !tags.length) return items;
  const want = new Set(tags);
  return items.filter((a) => (a.tags || []).some((t) => want.has(t)));
}

// theme tag -> human label, in priority order (each item lands in its top theme)
const THEMES = [
  ["counter-uas", "Counter-UAS"],
  ["critical-infra", "Critical infrastructure"],
  ["eu-regulatory", "EU & regulatory"],
  ["c2-sensors", "C2 / sensors"],
  ["contract-intel", "Contracts & industry"],
  ["ukraine", "Ukraine / front line"],
  ["swarm", "Swarms"],
  ["maritime", "Maritime"],
];

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (s) => { if (!s) return ""; const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };

function groupByTheme(items) {
  const buckets = new Map(THEMES.map(([id, label]) => [id, { label, items: [] }]));
  buckets.set("other", { label: "Other", items: [] });
  for (const a of items) {
    const tags = a.tags || [];
    const theme = THEMES.find(([id]) => tags.includes(id));
    buckets.get(theme ? theme[0] : "other").items.push(a);
  }
  return [...buckets.values()].filter((b) => b.items.length);
}

function itemHtml(a) {
  // Text-only — no images in the email.
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #eef2f7;">
    <div style="font:600 12px/1.4 Arial,sans-serif;color:#2563eb;">${esc(a.source)} <span style="color:#94a3b8;font-weight:400;">· ${fmtDate(a.published_at)}</span></div>
    <a href="${esc(a.url)}" style="font:700 15px/1.35 Arial,sans-serif;color:#0f172a;text-decoration:none;">${esc(a.title)}</a>
    ${a.summary ? `<div style="font:400 13px/1.5 Arial,sans-serif;color:#475569;margin-top:3px;">${esc(a.summary)}</div>` : ""}
  </td></tr>`;
}

const themeLabel = (id) => (THEMES.find(([t]) => t === id) || [id, id])[1];

// ---------------------------------------------------------------------------
// Trends block (weekly / monthly only). Table-based and inline-styled so it
// survives Gmail/Outlook, which strip <style> blocks and most modern CSS.
// ---------------------------------------------------------------------------

// "▲ 12" green / "▼ 5" red / "—" grey. Arrows are geometric shapes, not emoji,
// which render consistently across mail clients.
function deltaHtml(change) {
  if (!change) return `<span style="color:#94a3b8;">—</span>`;
  const up = change > 0;
  return `<span style="color:${up ? "#059669" : "#dc2626"};font-weight:700;">${up ? "▲" : "▼"} ${Math.abs(change)}</span>`;
}

function moverRows(rows) {
  return rows.map((r) => `<tr>
    <td style="padding:5px 0;font:600 13px/1.4 Arial,sans-serif;color:#0f172a;">${esc(r.name)}</td>
    <td style="padding:5px 0;text-align:right;font:400 13px/1.4 Arial,sans-serif;color:#475569;white-space:nowrap;">${r.current}<span style="color:#cbd5e1;"> / ${r.previous}</span></td>
    <td style="padding:5px 0 5px 12px;text-align:right;font:400 13px/1.4 Arial,sans-serif;white-space:nowrap;">${deltaHtml(r.change)}</td>
  </tr>`).join("");
}

function subBlock(title, body) {
  if (!body) return "";
  return `<tr><td style="padding:12px 0 0;">
    <div style="font:700 11px/1.4 Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">${esc(title)}</div>
    <div style="font:400 13px/1.6 Arial,sans-serif;color:#334155;margin-top:3px;">${body}</div>
  </td></tr>`;
}

// The written lead — what happened, in sentences, before any table.
export function narrativeHtml(sentences) {
  if (!sentences || !sentences.length) return "";
  return `<tr><td style="padding:18px 0 2px;">
      <div style="font:700 13px/1 Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0ea5a3;">What happened</div>
    </td></tr>
    <tr><td style="padding:6px 0 2px;">
      <p style="font:400 15px/1.65 Georgia,'Times New Roman',serif;color:#1e293b;margin:0;">${sentences.map(esc).join(" ")}</p>
    </td></tr>`;
}

export function trendsHtml(trends, period = "week") {
  if (!trends || trends.isEmpty) return "";
  const unit = period === "month" ? "month" : "week";
  const v = trends.volume;

  // Headline sentence — plain English, no jargon.
  let headline = `<strong>${v.current}</strong> item${v.current === 1 ? "" : "s"} this ${unit}`;
  if (v.previous) {
    const dir = v.change === 0 ? "level with" : v.change > 0 ? "up from" : "down from";
    headline += `, ${dir} <strong>${v.previous}</strong> the ${unit} before`;
    if (v.pct !== null && v.change !== 0) headline += ` (${v.pct > 0 ? "+" : ""}${v.pct}%)`;
  }
  headline += ".";

  const c = trends.companies;
  const names = (rows) => rows.map((r) => `${esc(r.name)} <span style="color:#94a3b8;">(${r.current})</span>`).join(", ");
  // For decliners the size of the drop is the story, so show it.
  const namesWithDelta = (rows) =>
    rows.map((r) => `${esc(r.name)} <span style="color:#94a3b8;">(${r.current})</span> ${deltaHtml(r.change)}`).join(" &nbsp;·&nbsp; ");

  const movers = c.rising.length
    ? `<tr><td style="padding:10px 0 0;">
        <div style="font:700 11px/1.4 Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">Most talked about &mdash; this ${esc(unit)} / last</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:4px;">${moverRows(c.rising)}</table>
      </td></tr>`
    : "";

  const sections = [
    movers,
    subBlock("New names this " + unit, c.newcomers.length ? names(c.newcomers) : ""),
    subBlock("Gone quiet", c.falling.length ? namesWithDelta(c.falling) : ""),
    subBlock("Systems in the news", trends.products.top.length ? names(trends.products.top.slice(0, 5)) : ""),
    subBlock(
      "Theme mix",
      trends.themes.slice(0, 5)
        .map((t) => `${esc(t.label)} <span style="color:#94a3b8;">${t.current}</span> ${deltaHtml(t.change)}`)
        .join(" &nbsp;·&nbsp; ")
    ),
  ].join("");

  return `<tr><td style="padding:20px 0 4px;">
      <div style="font:700 13px/1 Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0ea5a3;">The numbers</div>
    </td></tr>
    <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font:400 13px/1.6 Arial,sans-serif;color:#334155;">${headline}</td></tr>
        ${trends.baselineNote ? `<tr><td style="padding:8px 0 0;font:400 12px/1.5 Arial,sans-serif;color:#94a3b8;">${esc(trends.baselineNote)}</td></tr>` : ""}
        ${sections}
      </table>
    </td></tr>`;
}

// ---------------------------------------------------------------------------
// Topics (weekly / monthly). A ranked shortlist of what the industry actually
// covered — NOT every headline. Each entry shows why it ranked, so the reader
// can see the working.
// ---------------------------------------------------------------------------
function topicHtml(t, n) {
  const others = t.sources.filter((s) => s !== t.source).slice(0, 4);
  const alsoIn = others.length
    ? `<div style="font:400 12px/1.5 Arial,sans-serif;color:#94a3b8;margin-top:4px;">Also in ${esc(others.join(", "))}</div>`
    : "";
  const who = t.companies.length
    ? `<div style="font:600 12px/1.5 Arial,sans-serif;color:#0ea5a3;margin-top:4px;">${t.companies.map(esc).join(" · ")}</div>`
    : "";
  return `<tr><td style="padding:14px 0;border-bottom:1px solid #eef2f7;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td width="30" valign="top" style="font:800 18px/1.2 Arial,sans-serif;color:#cbd5e1;">${n}</td>
      <td valign="top">
        <div style="font:600 12px/1.4 Arial,sans-serif;color:#2563eb;">${esc(t.source)}
          <span style="color:#94a3b8;font-weight:400;">· ${fmtDate(t.published_at)} · ${esc(t.reason)}</span></div>
        <a href="${esc(t.url)}" style="font:700 16px/1.35 Arial,sans-serif;color:#0f172a;text-decoration:none;">${esc(t.title)}</a>
        ${t.summary ? `<div style="font:400 13px/1.5 Arial,sans-serif;color:#475569;margin-top:4px;">${esc(t.summary)}</div>` : ""}
        ${who}
        ${alsoIn}
      </td>
    </tr></table>
  </td></tr>`;
}

export function topicsHtml(topics, period = "week") {
  if (!topics || !topics.length) return "";
  const heading = `Top ${topics.length} ${period === "month" ? "of the month" : "of the week"}`;
  return `<tr><td style="padding:22px 0 2px;">
      <div style="font:700 13px/1 Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0ea5a3;">${esc(heading)}</div>
      <div style="font:400 12px/1.5 Arial,sans-serif;color:#94a3b8;margin-top:3px;">Ranked by how many outlets covered each story.</div>
    </td></tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${topics.map((t, i) => topicHtml(t, i + 1)).join("")}
    </table></td></tr>`;
}

const PERIOD_LABELS = { day: "Daily digest", week: "Weekly roundup", month: "Monthly digest" };

export function buildHtml(items, period = "day", opts = {}) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const label = PERIOD_LABELS[period] || PERIOD_LABELS.day;
  const filterNote = opts.tags && opts.tags.length
    ? `Filtered to your topics: ${opts.tags.map(themeLabel).join(", ")}. `
    : "";
  const unsubscribeUrl = opts.unsubscribeUrl ||
    `mailto:${UNSUB_ADDR}?subject=${encodeURIComponent("Unsubscribe " + (opts.email || ""))}`;
  const leadBlock = narrativeHtml(opts.narrative);
  const trendsBlock = trendsHtml(opts.trends, period);
  const topics = opts.topics || [];
  // Roundups lead with ranked topics; the daily digest keeps its theme listing.
  const total = opts.totalCount || items.length;
  const countNote = topics.length
    ? `${total} stories, distilled to the ${topics.length} that mattered`
    : total > items.length
      ? `showing the ${items.length} most recent of ${total} stories`
      : `${items.length} new item${items.length === 1 ? "" : "s"}`;
  // The archived copy on the website: no unsubscribe furniture, and a link back
  // to the issue is pointless when you are already reading it.
  const forWeb = !!opts.forWeb;
  const archiveLink = !forWeb && opts.archiveUrl
    ? `<div style="font:400 12px/1.5 Arial,sans-serif;color:#94a3b8;margin-top:10px;">
         <a href="${esc(opts.archiveUrl)}" style="color:#64748b;">Read this issue on the web →</a>
       </div>`
    : "";
  // Roundups render ranked topics; the daily digest keeps its theme-grouped list.
  const themeSections = () => groupByTheme(items).map((g) => `
    <tr><td style="padding:22px 0 6px;">
      <div style="font:700 13px/1 Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0ea5a3;">${esc(g.label)} <span style="color:#cbd5e1;">(${g.items.length})</span></div>
    </td></tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${g.items.map(itemHtml).join("")}</table></td></tr>`).join("");
  const body = topics.length ? topicsHtml(topics, period) : themeSections();

  // The emailed copy stays head-less (mail clients ignore it); the archived copy
  // gets a real head so it is shareable and indexable.
  const head = forWeb
    ? `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.issueTitle || label)} — UAV360 ${esc(label)}</title>
<meta name="description" content="${esc(`UAV and counter-drone ${label.toLowerCase()}: ${total} stories, with the companies and themes that moved.`)}">
<link rel="canonical" href="${esc(opts.archiveUrl || SITE_URL)}">
</head>`
    : "";

  return `<!doctype html><html lang="en">${head}<body style="margin:0;background:#f1f5f9;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:24px 0;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:#0c0f14;padding:20px 24px;">
        <div style="font:800 20px/1 Arial,sans-serif;color:#ffffff;letter-spacing:.5px;">UAV360</div>
        <div style="font:600 13px/1.4 Arial,sans-serif;color:#7cf0c8;margin-top:4px;">UAV &amp; Counter-Drone — ${esc(label)}</div>
      </td></tr>
      <tr><td style="padding:18px 24px 0;">
        <div style="font:400 13px/1.5 Arial,sans-serif;color:#64748b;">${esc(opts.issueTitle || today)} · ${countNote}</div>
      </td></tr>
      ${leadBlock ? `<tr><td style="padding:0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${leadBlock}</table></td></tr>` : ""}
      ${trendsBlock ? `<tr><td style="padding:0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${trendsBlock}</table></td></tr>` : ""}
      <tr><td style="padding:0 24px 8px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table></td></tr>
      <tr><td style="padding:18px 24px 26px;">
        <a href="${esc(SITE_URL)}/" style="font:700 14px/1 Arial,sans-serif;color:#ffffff;background:#2563eb;text-decoration:none;padding:11px 20px;border-radius:8px;display:inline-block;">Open the full feed →</a>
        ${archiveLink}
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
        <div style="font:400 11px/1.5 Arial,sans-serif;color:#94a3b8;">${esc(filterNote)}Headlines aggregated from proven defence &amp; drone-industry media. Each link points to the original publisher. — UAV360</div>
        ${forWeb ? "" : `<div style="font:400 11px/1.5 Arial,sans-serif;color:#94a3b8;margin-top:8px;">
          You're receiving this because you're on the UAV360 news list.
          <a href="${esc(unsubscribeUrl)}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>.
        </div>`}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function sendResend(to, subject, html, unsubscribeUrl) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [to], subject, html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status} for ${to}: ${body}`);
  return body;
}

/**
 * Summary of an issue, written alongside its HTML as <slug>.json.
 *
 * generate.mjs builds the /digest/ catalogue from these, so anything the
 * catalogue cards show has to live here — the HTML page is never parsed.
 */
export function archiveMeta({ slug, title, period, count, topics = [], trends, generatedAt }) {
  const lead = topics[0];
  return {
    slug,
    title,
    period,
    count,                       // defence-relevant stories in the period
    topics: topics.length,       // how many made the shortlist
    outlets: trends?.volume?.outlets ?? null,
    lead: lead ? { title: lead.title, url: lead.url, outlets: lead.outlets } : null,
    themes: (trends?.themes || []).slice(0, 3).map((t) => ({ label: t.label, count: t.current })),
    movers: (trends?.companies?.rising || []).slice(0, 3).map((r) => r.name),
    newcomers: (trends?.companies?.newcomers || []).slice(0, 3).map((r) => r.name),
    generated_at: generatedAt,
  };
}

/**
 * The window an issue covers, plus the window before it for comparison.
 *
 * Normally that is "the last N hours" and "the N hours before those". With
 * --month YYYY-MM it is a specific calendar month compared against the one
 * before, which is what backfilling the archive needs.
 */
export function periodWindow(monthArg = MONTH_ARG, hours = HOURS, period = PERIOD, now = Date.now()) {
  if (monthArg) {
    const m = /^(\d{4})-(\d{2})$/.exec(monthArg);
    if (!m) throw new Error(`--month expects YYYY-MM, got "${monthArg}"`);
    const [, y, mm] = m.map(Number);
    if (mm < 1 || mm > 12) throw new Error(`--month has no month ${mm}`);
    const curStart = new Date(Date.UTC(y, mm - 1, 1));
    return {
      curStart: curStart.toISOString(),
      curEnd: new Date(Date.UTC(y, mm, 1)).toISOString(),
      prevStart: new Date(Date.UTC(y, mm - 2, 1)).toISOString(),
      slug: monthArg,
      title: curStart.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  }
  const ms = hours * 3600000;
  return {
    curStart: new Date(now - ms).toISOString(),
    curEnd: new Date(now).toISOString(),
    prevStart: new Date(now - ms * 2).toISOString(),
    slug: issueSlug(period, new Date(now)),
    title: issueTitle(period, new Date(now)),
  };
}

// Fetch this period and the one immediately before it, plus the entity mentions
// hanging off each, and reduce them to the trends payload. Read-only.
async function loadRoundup(bounds) {
  const currentAll = await fetchArticlesBetween(bounds.curStart, bounds.curEnd);
  const previousAll = await fetchArticlesBetween(bounds.prevStart, bounds.curStart);

  // Drop consumer and civil-mobility coverage before anything is measured, so
  // topics AND trends both reflect a defence / counter-UAV agenda.
  const cur = splitByRelevance(currentAll);
  const prev = splitByRelevance(previousAll);
  const current = cur.kept, previous = prev.kept;
  console.log(`Window: ${current.length} defence-relevant of ${currentAll.length} this period ` +
    `(${cur.dropped.length} consumer/civil dropped); ${previous.length} of ${previousAll.length} the period before.`);

  // Attach the resolver's normalised company names to each article, and collect
  // the flat mention lists the trends maths wants. Using resolved names rather
  // than the raw articles.companies array means "AV" and "AeroVironment" count
  // as one firm, in both the trends and the topic clustering.
  const window = async (items) => {
    const ids = items.map((a) => a.id);
    const companyLinks = await fetchEntityLinks(ids, "company");
    const byArticle = new Map();
    for (const l of companyLinks) {
      if (!byArticle.has(l.article_id)) byArticle.set(l.article_id, []);
      byArticle.get(l.article_id).push(l.name);
    }
    // Consumer-only firms are stripped from the highlighted names (see
    // relevance.mjs) so they cannot reach "most talked about" on volume alone.
    for (const a of items) a.resolved_companies = withoutConsumerCompanies(byArticle.get(a.id) || []);
    // Distinct outlets per company: the movers list is filtered on this so a
    // single prolific publisher cannot manufacture a "trend" on its own.
    const bySource = new Map(items.map((a) => [a.id, a.source]));
    const outlets = new Map();
    for (const l of companyLinks) {
      if (!outlets.has(l.name)) outlets.set(l.name, new Set());
      outlets.get(l.name).add(bySource.get(l.article_id));
    }
    return {
      items,
      outlets: new Set(items.map((a) => a.source).filter(Boolean)).size,
      companies: withoutConsumerCompanies(companyLinks.map((l) => l.name)),
      companyOutlets: new Map([...outlets].map(([n, set]) => [n, set.size])),
      products: await fetchEntityMentions(ids, "product"),
    };
  };

  const trends = buildTrends(await window(current), await window(previous));
  // Which firms gained coverage since last period — used to rank topics.
  const momentum = new Map(
    (trends.companies.all || []).filter((r) => r.change > 0).map((r) => [r.name, r.change])
  );
  return { items: current, trends, momentum, totalSeen: currentAll.length };
}

async function main() {
  await loadDotenv();
  const recipients = await loadRecipients();

  // Daily keeps its original behaviour (new since we last ingested). Roundups use
  // the news date so the trend windows line up with when things were published.
  const bounds = IS_ROUNDUP ? periodWindow() : null;
  if (bounds) console.log(`Issue ${bounds.slug}: ${bounds.curStart.slice(0, 10)} to ${bounds.curEnd.slice(0, 10)}.`);

  let items, trends = null, momentum = new Map(), narrative = [];
  if (IS_ROUNDUP) {
    ({ items, trends, momentum } = await loadRoundup(bounds));
  } else {
    const since = new Date(Date.now() - HOURS * 3600000).toISOString();
    items = await fetchSince(since, 600);
  }
  console.log(`${items.length} items for period=${PERIOD} (${HOURS}h). ${recipients.length} recipient(s).`);

  if (!items.length) {
    console.log("Nothing new — skipping all sends (no empty emails).");
    return;
  }

  // Rank the period into topics. Trends and topics both consider every story;
  // only the number shown differs between the email and the archive page.
  const totalCount = items.length;
  let emailTopics = [], archiveTopics = [];
  if (IS_ROUNDUP) {
    archiveTopics = rankTopics(items, { limit: TOPICS_ARCHIVE[PERIOD], momentum });
    emailTopics = archiveTopics.slice(0, TOPICS_EMAIL[PERIOD]);
    narrative = buildNarrative(trends, emailTopics, PERIOD);
    for (const line of narrative) console.log(`  » ${line}`);
    console.log(`Ranked ${totalCount} stories into topics: ${emailTopics.length} in the email, ${archiveTopics.length} on the archive page.`);
    for (const [i, t] of emailTopics.slice(0, 5).entries()) {
      console.log(`  ${i + 1}. [${t.outlets} outlet(s)] ${t.title.slice(0, 70)}`);
    }
  }

  // Archive page: the full, unfiltered issue, published at SITE_URL/digest/<slug>/.
  const slug = bounds ? bounds.slug : null;
  const title = bounds ? bounds.title : null;
  const archiveUrl = slug ? `${SITE_URL}/digest/${slug}/` : null;

  if (IS_ROUNDUP && !SKIP_ARCHIVE) {
    const page = buildHtml(items, PERIOD, {
      trends, narrative, forWeb: true, archiveUrl, issueTitle: title, totalCount, topics: archiveTopics,
    });
    if (DRY) {
      await mkdir(join(ROOT, "public"), { recursive: true });
      const out = join(ROOT, "public", `_digest_archive_${slug}.html`);
      await writeFile(out, page);
      console.log(`  archive page (dry) → ${out}`);
    } else {
      const dir = join(ROOT, "archive", "digests");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${slug}.html`), page);
      await writeFile(join(dir, `${slug}.json`),
        JSON.stringify(archiveMeta({
          slug, title, period: PERIOD, count: totalCount,
          topics: archiveTopics, trends, generatedAt: new Date().toISOString(),
        }), null, 2) + "\n");
      console.log(`  archive page → archive/digests/${slug}.html  (publishes at ${archiveUrl})`);
    }
  }

  if (SKIP_SEND) {
    console.log("--skip-send: archive written, no email sent.");
    return;
  }

  let sent = 0, skipped = 0;
  for (const r of recipients) {
    const mine = filterForRecipient(items, r.tags);
    if (!mine.length) { skipped++; console.log(`  – ${r.email}: 0 matching items, skipped`); continue; }
    const unsubscribeUrl = `mailto:${UNSUB_ADDR}?subject=${encodeURIComponent("Unsubscribe " + r.email)}`;
    // A recipient with tag filters gets their own subset, so the "of N" note
    // only makes sense for people taking the unfiltered issue.
    const filtered = !!(r.tags && r.tags.length);
    // A filtered recipient gets topics ranked within their own themes, not the
    // global shortlist — otherwise their digest would name stories they excluded.
    const theirTopics = !IS_ROUNDUP ? []
      : filtered ? rankTopics(mine, { limit: TOPICS_EMAIL[PERIOD], momentum })
      : emailTopics;
    const html = buildHtml(mine, PERIOD, {
      email: r.email, tags: r.tags, unsubscribeUrl, trends, narrative, archiveUrl, issueTitle: title,
      totalCount: filtered ? mine.length : totalCount, topics: theirTopics,
    });
    const kind = { day: "daily digest", week: "weekly roundup", month: "monthly digest" }[PERIOD];
    const subject = IS_ROUNDUP
      ? `UAV360 ${kind} — ${title}: ${theirTopics.length} topics that mattered`
      : `UAV360 ${kind} — ${mine.length} new`;

    if (DRY) {
      await mkdir(join(ROOT, "public"), { recursive: true });
      const safe = r.email.replace(/[^a-z0-9]+/gi, "_");
      await writeFile(join(ROOT, "public", `_digest_${safe}.html`), html);
      console.log(`  – ${r.email}: ${mine.length} items (dry, not sent)`);
      continue;
    }
    await sendResend(r.email, subject, html, unsubscribeUrl);
    sent++;
    console.log(`  ✓ ${r.email}: ${mine.length} items`);
  }
  if (!DRY) console.log(`Done. Sent ${sent}, skipped ${skipped} (no matching items).`);
}

// Only run when invoked directly (so tests can import buildHtml without sending).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
