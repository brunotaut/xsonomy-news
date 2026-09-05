// Period-over-period analytics for the weekly / monthly digest.
//
// Everything here is pure: it takes two already-fetched windows of data (the
// current period and the one immediately before it) and returns plain numbers.
// No network, no env, no dates of its own — so it is cheap to unit-test.
//
// The interesting signal is ENTITY movement (which companies/products the press
// started or stopped writing about). Raw article volume barely moves week to
// week, so it is reported as a single headline number, not a trend.

// The eight curated themes, in priority order. `articles.tags` also contains raw
// per-outlet categories ("news", "featured", "drone-news-feeds", …) which are
// noise for analytics — anything not in this list is ignored.
export const CURATED_THEMES = [
  ["counter-uas", "Counter-UAS"],
  ["critical-infra", "Critical infrastructure"],
  ["eu-regulatory", "EU & regulatory"],
  ["c2-sensors", "C2 / sensors"],
  ["contract-intel", "Contracts & industry"],
  ["ukraine", "Ukraine / front line"],
  ["swarm", "Swarms"],
  ["maritime", "Maritime"],
];

const THEME_IDS = new Set(CURATED_THEMES.map(([id]) => id));
const themeLabel = (id) => (CURATED_THEMES.find(([t]) => t === id) || [id, id])[1];

// Count occurrences of each string in a list -> Map(name -> count).
export function tally(names) {
  const m = new Map();
  for (const n of names) {
    if (!n) continue;
    m.set(n, (m.get(n) || 0) + 1);
  }
  return m;
}

// Percentage change, guarding against divide-by-zero. Returns null when there is
// no previous figure to compare against (renders as "—" rather than "+Infinity%").
export function pctChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// Merge two tallies into one comparable list.
// min:   ignore anything mentioned fewer than this many times in the current
//        period — one-off mentions are noise, not a trend.
export function compare(currentTally, previousTally, { min = 1 } = {}) {
  const names = new Set([...currentTally.keys(), ...previousTally.keys()]);
  const rows = [];
  for (const name of names) {
    const current = currentTally.get(name) || 0;
    const previous = previousTally.get(name) || 0;
    if (current < min) continue;
    rows.push({
      name,
      current,
      previous,
      change: current - previous,
      pct: pctChange(current, previous),
      isNew: previous === 0 && current > 0,
    });
  }
  return rows;
}

// Most-mentioned, regardless of movement.
export function topBy(rows, limit = 8) {
  return [...rows].sort((a, b) => b.current - a.current || a.name.localeCompare(b.name)).slice(0, limit);
}

// Biggest climbers, excluding names that are brand new (those get their own
// section — "up from zero" is a different story from "up from twelve").
export function rising(rows, limit = 5) {
  return rows
    .filter((r) => r.change > 0 && !r.isNew)
    .sort((a, b) => b.change - a.change || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Names that appear this period and did not appear at all in the previous one.
export function newcomers(rows, limit = 5) {
  return rows
    .filter((r) => r.isNew)
    .sort((a, b) => b.current - a.current || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Biggest fallers — useful context ("Anduril went quiet") but rendered smaller.
export function falling(rows, limit = 3) {
  return rows
    .filter((r) => r.change < 0)
    .sort((a, b) => a.change - b.change || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Theme mix across a window of articles, curated tags only.
export function themeTally(items) {
  const names = [];
  for (const a of items) {
    for (const t of a.tags || []) if (THEME_IDS.has(t)) names.push(t);
  }
  return tally(names);
}

export function sourceTally(items) {
  return tally(items.map((a) => a.source));
}

/**
 * Assemble the full trends payload for one digest issue.
 *
 * current / previous are the two windows:
 *   items      – article rows (need `tags` and `source`)
 *   companies  – flat list of company names, one entry per article↔company link
 *   products   – flat list of product names, likewise
 *
 * Entity thresholds (min 3 for movers, min 2 for newcomers) keep single stray
 * mentions out of the report. They are deliberately conservative: a digest that
 * claims a trend off one article is worse than one that says nothing.
 */
export function buildTrends(current, previous) {
  const curCompanies = tally(current.companies || []);
  const prevCompanies = tally(previous.companies || []);
  const companyRows = compare(curCompanies, prevCompanies, { min: 2 });
  // "Gone quiet" needs rows the min-2 filter throws away: a firm that fell from
  // nine mentions to zero is the strongest decline there is, and `min` measures
  // the CURRENT period. Keep every row, then judge on the previous figure.
  const companyDeclines = compare(curCompanies, prevCompanies, { min: 0 })
    .filter((r) => r.previous >= 3);
  const productRows = compare(tally(current.products || []), tally(previous.products || []), { min: 2 });
  const themeRows = compare(themeTally(current.items || []), themeTally(previous.items || []));
  const sourceRows = compare(sourceTally(current.items || []), sourceTally(previous.items || []));

  const volumeCurrent = (current.items || []).length;
  const volumePrevious = (previous.items || []).length;

  return {
    volume: {
      current: volumeCurrent,
      previous: volumePrevious,
      change: volumeCurrent - volumePrevious,
      pct: pctChange(volumeCurrent, volumePrevious),
    },
    themes: themeRows
      .map((r) => ({ ...r, label: themeLabel(r.name) }))
      .sort((a, b) => b.current - a.current || a.name.localeCompare(b.name)),
    companies: {
      // Every comparable company row, for callers that need the full picture
      // (topic ranking uses it to find which firms gained coverage).
      all: companyRows,
      top: topBy(companyRows.filter((r) => r.current >= 3), 8),
      rising: rising(companyRows.filter((r) => r.current >= 3), 5),
      newcomers: newcomers(companyRows, 5),
      falling: falling(companyDeclines, 3),
    },
    products: {
      top: topBy(productRows.filter((r) => r.current >= 2), 6),
      rising: rising(productRows.filter((r) => r.current >= 2), 4),
      newcomers: newcomers(productRows, 4),
    },
    sources: topBy(sourceRows, 5),
    // True when there is genuinely nothing worth printing, so the caller can
    // omit the whole analytics block rather than render empty headings.
    isEmpty:
      !companyRows.length && !productRows.length && !themeRows.length,
  };
}

// ---------------------------------------------------------------------------
// Period helpers — the archive slug and the human label for an issue.
// ---------------------------------------------------------------------------

// ISO-8601 week number (weeks start Monday; week 1 contains the first Thursday).
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;          // Sunday = 7, not 0
  d.setUTCDate(d.getUTCDate() + 4 - day);  // shift to the Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

// Stable, sortable, URL-safe id for an issue: "2026-w36" or "2026-09".
export function issueSlug(period, date = new Date()) {
  if (period === "month") {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    // A monthly issue sent on the 1st reports on the month that just ended.
    d.setUTCMonth(d.getUTCMonth() - 1);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  const { year, week } = isoWeek(date);
  return `${year}-w${String(week).padStart(2, "0")}`;
}

// Human title for an issue, e.g. "Week 36, 2026" / "August 2026".
export function issueTitle(period, date = new Date()) {
  if (period === "month") {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const { year, week } = isoWeek(date);
  return `Week ${week}, ${year}`;
}
