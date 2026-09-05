// Turn a period's articles into a ranked list of TOPICS.
//
// A digest is not a list of headlines. 200 headlines a week is not something
// anyone reads. What matters is: which stories did the industry actually pay
// attention to, and who was involved.
//
// The ranking signal is DISTINCT OUTLETS, not article count. Measured against the
// live data, DJI drew 32 mentions in a week from just 2 outlets (one publisher
// with a house interest), while Anduril drew 10 across 7 outlets. The second is a
// story; the first is a blog's editorial habit. Counting articles would put DJI
// on top every week forever.
//
// Pure functions — no network, no env.

// --- text similarity --------------------------------------------------------
// A JS approximation of Postgres pg_trgm, which is what the clustering threshold
// was tuned against: each word padded with two leading spaces and one trailing,
// cut into 3-grams, then Jaccard overlap.

function normalise(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trigrams(s) {
  const set = new Set();
  for (const word of normalise(s).split(" ")) {
    if (!word) continue;
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) set.add(padded.slice(i, i + 3));
  }
  return set;
}

export function similarityOf(a, b) {
  let inter = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of small) if (large.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export function similarity(a, b) {
  const A = trigrams(a), B = trigrams(b);
  if (!A.size || !B.size) return 0;
  return similarityOf(A, B);
}

// --- clustering -------------------------------------------------------------

// Prefer resolver-normalised names when the caller supplies them: the raw
// articles.companies array lists "AV" and "AeroVironment" as different firms.
const companiesOf = (a) => (a.resolved_companies || a.companies || []).filter(Boolean);

// Union-find over two passes.
//
// Pass 1 — near-duplicate titles. Syndicated copy and light rewrites of one
// story collapse into a single topic.
//
// Pass 2 — the same story told differently. Two articles that name a company in
// common AND share some wording are almost always one story: measured on live
// data, "U.S. Army awards AV $464.8 million laser weapon deal" and "Army awards
// AeroVironment nearly $500M contract for laser weapons" score 0.261, while
// genuinely separate stories sharing a company sit at 0.05-0.13. The shared-name
// requirement is what makes the lower threshold safe — without it, every
// "Army awards X contract" headline would collapse into one.
function cluster(items, threshold, relatedThreshold) {
  const grams = items.map((a) => trigrams(a.title));
  const names = items.map((a) => new Set(companiesOf(a)));
  const parent = items.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (i, j) => { const a = find(i), b = find(j); if (a !== b) parent[a] = b; };

  const sharesName = (i, j) => {
    const [small, large] = names[i].size <= names[j].size ? [names[i], names[j]] : [names[j], names[i]];
    for (const n of small) if (large.has(n)) return true;
    return false;
  };

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = similarityOf(grams[i], grams[j]);
      if (sim >= threshold || (sim >= relatedThreshold && sharesName(i, j))) union(i, j);
    }
  }

  const groups = new Map();
  items.forEach((_, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  });
  return { groups: [...groups.values()], grams };
}

// Pick the headline that best represents a cluster: the one most similar to all
// the others. For a lone article that is simply its own title.
function representative(members, grams) {
  if (members.length === 1) return members[0];
  let best = members[0], bestScore = -1;
  for (const i of members) {
    let score = 0;
    for (const j of members) if (i !== j) score += similarityOf(grams[i], grams[j]);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// How many distinct outlets wrote about each company across the whole period.
// This is what lifts a single-outlet story into the digest when it concerns a
// company the rest of the industry is also covering.
export function companyReach(items) {
  const reach = new Map();
  for (const a of items) {
    for (const name of companiesOf(a)) {
      if (!reach.has(name)) reach.set(name, new Set());
      reach.get(name).add(a.source);
    }
  }
  return new Map([...reach].map(([name, outlets]) => [name, outlets.size]));
}

/**
 * Rank a period's articles into topics.
 *
 * Returns [{ title, url, source, summary, published_at, outlets, sources,
 *            articles, companies, reason, score }], best first.
 *
 * `reason` explains in plain English why the topic made the cut, so the digest
 * can show its working rather than presenting a black-box ranking.
 */
export function rankTopics(items, {
  threshold = 0.42, relatedThreshold = 0.22, limit = 10, momentum = new Map(),
} = {}) {
  if (!items || !items.length) return [];
  const { groups, grams } = cluster(items, threshold, relatedThreshold);
  const reach = companyReach(items);

  const topics = groups.map((members) => {
    const lead = items[representative(members, grams)];
    const articles = members.map((i) => items[i]);
    const sources = [...new Set(articles.map((a) => a.source).filter(Boolean))];

    // Companies named across the cluster, most-mentioned first.
    const counts = new Map();
    for (const a of articles) {
      for (const name of companiesOf(a)) counts.set(name, (counts.get(name) || 0) + 1);
    }
    const companies = [...counts.entries()]
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .map(([name]) => name);

    // Prominence of the most-covered company in this topic, across the period.
    const prominence = companies.reduce((max, name) => Math.max(max, reach.get(name) || 0), 0);

    // Momentum: how much more this topic's companies are being written about
    // than in the previous period. This is what stops the shortlist filling up
    // with "another story mentioning a big prime" — a firm whose coverage jumped
    // outranks one that is simply always in the news.
    let mover = null, moverGain = 0;
    for (const name of companies) {
      const gain = momentum.get(name) || 0;
      if (gain > moverGain) { moverGain = gain; mover = name; }
    }

    const reason = sources.length > 1
      ? `${sources.length} outlets covered this`
      : mover
        ? `${mover} — coverage up ${moverGain} on the previous period`
        : companies.length && prominence > 1
          ? `${companies[0]} — ${prominence} outlets covering them this period`
          : "single report";

    return {
      title: lead.title,
      url: lead.url,
      source: lead.source,
      summary: lead.summary,
      published_at: lead.published_at,
      outlets: sources.length,
      sources,
      articles,
      companies: companies.slice(0, 4),
      reason,
      mover,
      moverGain,
      // Outlet spread dominates — that is the difference between the industry
      // talking and one publisher's house interest. Among single-outlet stories,
      // rising coverage outranks steady background presence.
      score: sources.length * 1000 + articles.length * 100 + moverGain * 5 + prominence,
    };
  });

  return topics
    .sort((a, b) =>
      b.score - a.score ||
      new Date(b.published_at || 0) - new Date(a.published_at || 0) ||
      a.title.localeCompare(b.title))
    .slice(0, limit);
}
