// Render one digest issue as a PAGE ON THE SITE (dark, site chrome, site CSS).
//
// Deliberately separate from the email renderer in digest.mjs. The email has to
// survive Gmail and Outlook, so it is table-based with inline styles on a light
// background; the website is a dark themed page with a sticky header. Trying to
// serve one HTML file as both gave a dark header sitting on top of a light email
// card. Same data, two renderers.

import { siteFooter, analyticsTag } from "./chrome.mjs";

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

const delta = (change) => {
  if (!change) return `<span class="d flat">—</span>`;
  return change > 0
    ? `<span class="d up">▲ ${change}</span>`
    : `<span class="d down">▼ ${Math.abs(change)}</span>`;
};

const nameList = (rows, withDelta = false) => rows
  .map((r) => `<span>${esc(r.name)} <em>${r.current}</em>${withDelta ? " " + delta(r.change) : ""}</span>`)
  .join("");

function numbersHtml(trends, unit) {
  if (!trends || trends.isEmpty) return "";
  const v = trends.volume;
  const c = trends.companies;

  let headline = `<strong>${v.current}</strong> stories this ${unit}`;
  if (v.previous) {
    const dir = v.change === 0 ? "level with" : v.change > 0 ? "up from" : "down from";
    headline += `, ${dir} <strong>${v.previous}</strong> the ${unit} before`;
    if (v.pct !== null && v.change !== 0) headline += ` (${v.pct > 0 ? "+" : ""}${v.pct}%)`;
  }
  headline += ".";

  const block = (label, body) => body
    ? `<div class="nblock"><h3>${esc(label)}</h3><div class="names">${body}</div></div>` : "";

  const movers = c.rising.length
    ? `<div class="nblock"><h3>Most talked about</h3><table class="movers">${
        c.rising.map((r) => `<tr><td>${esc(r.name)}</td><td class="n">${r.current} <em>/ ${r.previous}</em></td><td class="n">${delta(r.change)}</td></tr>`).join("")
      }</table></div>`
    : "";

  return `<section class="numbers">
    <h2>The numbers</h2>
    <p class="vol">${headline}</p>
    ${trends.baselineNote ? `<p class="caveat">${esc(trends.baselineNote)}</p>` : ""}
    ${movers}
    ${block(`New names this ${unit}`, c.newcomers.length ? nameList(c.newcomers) : "")}
    ${block("Gone quiet", c.falling.length ? nameList(c.falling, true) : "")}
    ${block("Theme mix", trends.themes.slice(0, 5)
      .map((t) => `<span>${esc(t.label)} <em>${t.current}</em> ${delta(t.change)}</span>`).join(""))}
  </section>`;
}

function topicHtml(t, n) {
  const others = t.sources.filter((s) => s !== t.source).slice(0, 4);
  return `<li class="topic">
    <span class="rank">${n}</span>
    <div class="t-body">
      <div class="t-meta"><span class="src">${esc(t.source)}</span>
        <span>${esc(fmtDate(t.published_at))}</span><span>${esc(t.reason)}</span></div>
      <h3><a href="${esc(t.url)}" target="_blank" rel="noopener nofollow">${esc(t.title)}</a></h3>
      ${t.summary ? `<p>${esc(t.summary)}</p>` : ""}
      ${t.companies.length ? `<div class="t-co">${t.companies.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
      ${others.length ? `<div class="t-also">Also in ${esc(others.join(", "))}</div>` : ""}
    </div>
  </li>`;
}

/**
 * Full standalone page for one issue, matching the rest of the site.
 * Paths are relative to /digest/<slug>/, which is where it gets published.
 */
export function buildIssuePage({
  period = "month", title = "", slug = "", siteUrl = "", totalCount = 0,
  trends = null, narrative = [], topics = [],
} = {}) {
  const unit = period === "month" ? "month" : "week";
  const label = period === "month" ? "Monthly digest" : "Weekly digest";
  const description = `UAV and counter-drone ${label.toLowerCase()} for ${title}: ${totalCount} defence stories, distilled to the ${topics.length} the most outlets carried.`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  ${analyticsTag()}
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — UAV360 ${esc(label)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)} — UAV360 ${esc(label)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:site_name" content="UAV360" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(siteUrl)}/digest/${esc(slug)}/" />
  <link rel="canonical" href="${esc(siteUrl)}/digest/${esc(slug)}/" />
  <link rel="stylesheet" href="../../assets/styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
</head>
<body>
  <header class="site-head">
    <div class="wrap">
      <a class="brand" href="../../">UAV &amp; Counter-Drone News</a>
      <nav>
        <a href="../../">News</a>
        <a href="../" aria-current="page">Monthly Digest</a>
      </nav>
    </div>
  </header>

  <main class="wrap issue-page">
    <nav class="crumbs"><a href="../">← All monthly digests</a></nav>
    <h1>${esc(title)}</h1>
    <p class="issue-sub">${esc(label)} · ${totalCount} defence stories, distilled to the ${topics.length} that mattered</p>

    ${narrative.length ? `<section class="lead-para"><h2>What happened</h2><p>${narrative.map(esc).join(" ")}</p></section>` : ""}
    ${numbersHtml(trends, unit)}

    ${topics.length ? `<section class="topics">
      <h2>Top ${topics.length} of the ${unit}</h2>
      <p class="hint">Ranked by how many outlets covered each story.</p>
      <ol class="topic-list">${topics.map((t, i) => topicHtml(t, i + 1)).join("")}</ol>
    </section>` : ""}
  </main>

  ${siteFooter()}
</body>
</html>
`;
}
