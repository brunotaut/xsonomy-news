// Re-apply the CURRENT maker rules to evidence that was already extracted, with
// no model calls and no refetching. Reads `articles.entity_evidence`, writes
// `articles.entity_evidence`, touches nothing else.
//
//   node scripts/replay-maker-rules.mjs --dry     # report only, no writes
//   node scripts/replay-maker-rules.mjs           # apply
//
// WHY THIS IS ADDITIVE-ONLY
//
// The maker decision is made from the model's `makerQuote`, and until
// 2026-11-02 that span was not stored on the row — only the product-mention
// `quote` was. So for every row written before then, the evidence the rule
// actually judged is gone, and all a replay can offer the rule is `quote`.
//
// That is enough to ADD a maker the old rules missed, because a relationship
// stated inside `quote` is a relationship stated in the article. It is NOT
// enough to REMOVE one: 38 of the 411 makers currently stored have a `quote`
// that never names the maker at all, which means they were accepted on a
// makerQuote this replay cannot see. Clearing them would delete good data on
// the strength of evidence that was simply not saved.
//
// So: a null maker may become a maker. An existing maker is only ever cleared
// when the row carries the makerQuote it was decided from AND the current rules
// reject that very span — the one case where the replay sees what the original
// decision saw. Rows written from 2026-11-02 onwards carry makerQuote and are
// therefore fully replayable in both directions.

import { loadDotenv } from "./lib/http.mjs";
import { sbConfig, sbFetch } from "./lib/supabase.mjs";
import { makerRelationship, isMakerCue } from "./lib/identity.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");

// The verdict for one stored evidence row under today's rules.
//
// `decided` is the span the maker decision can be made from: the stored
// makerQuote when the row has one, otherwise the product quote. `replayable`
// says which of those it was, because that is what decides whether a removal
// is honest.
export function replayRow(e) {
  const claimed = e.makerClaimed ?? e.maker ?? null;
  if (!claimed) return { change: null };
  const decided = e.makerQuote || e.quote || "";
  const haveMakerQuote = Boolean(e.makerQuote);
  const cue = makerRelationship(decided, e.name, claimed);
  const ok = isMakerCue(cue);

  if (!e.maker && ok) return { change: "add", maker: claimed, cue };
  if (e.maker && !ok) {
    // Only a row that carries the span its maker was decided from can have that
    // maker taken away: anything else is a removal on absent evidence.
    if (!haveMakerQuote) return { change: null, blocked: "no_maker_quote_stored", cue };
    return { change: "clear", maker: null, cue };
  }
  // Already agrees. Refresh the cue anyway when the rules now name it
  // differently, so the audit trail matches the rules that produced it.
  if (e.makerCue !== cue) return { change: "cue", maker: e.maker, cue };
  return { change: null, cue };
}

export function replayEvidence(evidence) {
  const changes = [];
  const next = (evidence || []).map((e) => {
    const r = replayRow(e);
    if (!r.change) {
      if (r.blocked) changes.push({ ...r, name: e.name, maker: e.maker });
      return e;
    }
    changes.push({ ...r, name: e.name, was: e.maker, wasCue: e.makerCue });
    return { ...e, maker: r.change === "clear" ? null : r.maker, makerCue: r.cue };
  });
  return { next, changes };
}

async function fetchEvidencePage(offset, limit) {
  const { url, serviceKey, anonKey } = sbConfig();
  const key = serviceKey || anonKey;
  if (!key) throw new Error("Need SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY to read.");
  const q = new URL(`${url}/rest/v1/articles`);
  q.searchParams.set("select", "url,entity_evidence");
  q.searchParams.set("entity_evidence", "not.is.null");
  q.searchParams.set("order", "url.asc");
  q.searchParams.set("offset", String(offset));
  q.searchParams.set("limit", String(limit));
  const res = await sbFetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Supabase read ${res.status}: ${await res.text()}`);
  return res.json();
}

async function writeEvidence(articleUrl, evidence) {
  const { url, serviceKey } = sbConfig();
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY is required for writes.");
  const q = new URL(`${url}/rest/v1/articles`);
  q.searchParams.set("url", `eq.${articleUrl}`);
  const res = await sbFetch(q, {
    method: "PATCH",
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify({ entity_evidence: evidence }),
  });
  if (!res.ok) throw new Error(`Supabase write ${res.status}: ${await res.text()}`);
}

async function main() {
  await loadDotenv();
  console.log(`Maker-rule replay over stored evidence${DRY ? "  [DRY — no writes]" : ""}`);

  const stats = { articles: 0, rows: 0, added: 0, cleared: 0, cueOnly: 0, blocked: 0, written: 0, writeErr: 0 };
  const examples = { added: [], cleared: [] };

  for (let offset = 0; ; offset += 200) {
    const page = await fetchEvidencePage(offset, 200);
    for (const a of page) {
      stats.articles++;
      stats.rows += (a.entity_evidence || []).length;
      const { next, changes } = replayEvidence(a.entity_evidence);
      let touched = false;
      for (const c of changes) {
        if (c.blocked) { stats.blocked++; continue; }
        touched = true;
        if (c.change === "add") {
          stats.added++;
          if (examples.added.length < 20) examples.added.push(`${c.maker} -> ${c.name}  [${c.cue}]`);
        } else if (c.change === "clear") {
          stats.cleared++;
          if (examples.cleared.length < 20) examples.cleared.push(`${c.was} -/-> ${c.name}  (was ${c.wasCue}, now ${c.cue || "no stated relation"})`);
        } else stats.cueOnly++;
      }
      if (touched && !DRY) {
        try { await writeEvidence(a.url, next); stats.written++; }
        catch (e) { stats.writeErr++; console.log(`  WARN write ${a.url}: ${e.message}`); }
      } else if (touched) stats.written++;
    }
    if (page.length < 200) break;
  }

  console.log(`\narticles ${stats.articles}  evidence rows ${stats.rows}`);
  console.log(`makers ADDED        ${stats.added}`);
  console.log(`makers CLEARED      ${stats.cleared}`);
  console.log(`cue corrected only  ${stats.cueOnly}`);
  console.log(`removals refused because the row has no stored makerQuote: ${stats.blocked}`);
  console.log(`articles ${DRY ? "that would be written" : "written"} ${stats.written}  writeErr ${stats.writeErr}`);
  if (examples.added.length) console.log(`\n--- added (first ${examples.added.length}) ---\n ` + examples.added.join("\n "));
  if (examples.cleared.length) console.log(`\n--- cleared (first ${examples.cleared.length}) ---\n ` + examples.cleared.join("\n "));
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
