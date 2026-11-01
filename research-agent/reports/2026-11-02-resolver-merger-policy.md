# Entity resolver: a retired company no longer captures matches

**Date:** 2026-11-01 · **Status:** APPLIED AND ACTIVE · **Commit:** `55a95f1`

The 2026-11-01 Exail merge moved ECA Group's aliases to Exail and retired the duplicate
to `draft`. That was not enough, and the merge review said so at the time: the retired
record's own **name** stayed an exact key in the resolver's index.

---

## 1. What was broken

`resolve-entities.mjs` fetched companies with **no publication-status filter**, and
`buildCompanyIndex`'s exact map was **first-write-wins**:

```js
if (map === exact) { if (!exact.has(key)) exact.set(key, val); return; }
```

So an article mentioning *"ECA Group / Infotron"* relinked to a draft company with no
public page — and when two records could answer a key, **which one won depended on the
order the rows came back from the database**. That is not a theoretical concern: the same
`arr[0]` pattern in the prefix and fuzzy paths sent the tag *"EOS Defence Systems"* to an
unrelated Ukrainian draft record called **EOS**, which is the exact false-link family the
existing test file was written to document.

Proven, not asserted — the same tag, the same code, two row orders:

| Tag | Old code, order A | Old code, order B | New code |
|---|---|---|---|
| `Teledyne FLIR OEM` | Teledyne FLIR | **Teledyne FLIR Defense** | Teledyne FLIR, either way |
| `EOS Defence Systems` | EOS Defence | **EOS (Ukrainian draft)** | EOS Defence, either way |

## 2. The policy, applied the same way on every lookup path

**A company retired into another receives no new matches.** "Retired" is precise: it is
the **source** of a `merged_with` edge **and** no longer live. Where one unambiguous edge
names a live successor, the tag resolves to the successor instead; where it does not, the
retired record owns no index key at all and the tag goes to the LLM gate.

Chains are followed (A → B → C resolves to C) and cycles terminate with a verdict rather
than a hang. A missing successor row, a self-merge and a non-`merged_with` relationship
type are all no-ops.

**A live `merged_with` source is deliberately untouched.** Five of the seven edges in the
database have a live source — *EADS (now Airbus Defence and Space)*, *BlueHalo
(AeroVironment)*, *AAI Corporation (Textron Systems)*, *WB Electronics* — which are
published records with their own pages, where `merged_with` records corporate history,
not a retirement. Only two sources are drafts.

**Ordinary drafts still resolve.** Nothing excludes drafts as a class; only merged-away
ones. `ABX Dynamics` is a live draft and still matches, because the discovery pipeline
depends on it.

**Row order is gone everywhere else too**, under one rule used by the normalized, prefix
and fuzzy paths alike:

1. A company's own **name** outranks another company's **alias**. `KNDS France` is both,
   and the company of that name is the better answer.
2. Otherwise the candidate whose raw name is **closest to the raw tag** wins.
3. A genuine tie between two different companies is **refused**, not broken.

And `AMBIGUOUS`: two companies claiming one exact string at the same rank refuses the key
outright. That fires on no current data — there are **zero** same-rank exact collisions in
2,539 companies and 351 aliases — so it is a guard against future data, not a change to
today's.

## 3. A crash found on the way

`matchProduct` called the confidence gate with an **undeclared variable**:

```js
if (hit) return gate(tag, { id: hit, reason: "exact" }, index, context);   // `context` undefined here
```

Every **exact product-name match threw a ReferenceError** and aborted the resolve run.
Only the cache hid it: a tag already decided never reaches this line, so the error fired
on new tags only. The gate had no business there anyway — it exists for ambiguous *company*
names, and the normalized branch below it never used it. Removed, with a test.

## 4. Comparison against current data, before activation

The key space was enumerated in SQL rather than sampled. Across every company name and
alias, **exactly four normalised keys are claimed by two companies** — `eos`, `kara dag`,
`teledyne flir`, `knds france` — and every other key maps to one company, where old and
new behave identically by construction. With the two retired records, that is the complete
set of places the two versions can differ.

Running every live cached tag from those families through both versions: **4 of 23 resolve
differently, and all four are corrections.**

| Tag | Was | Now |
|---|---|---|
| `ECA Group / Infotron` | the retired ECA draft | **Exail** |
| `DefSecIntel · Origin Robotics` | the retired draft | **unresolved** — two live successors, nothing picks |
| `EOS Defence Systems` | **EOS**, an unrelated Ukrainian draft | **EOS Defence** |
| `Kara Dag Tech` | Kara Dag | **Kara Dag Technologies** |

No cached decision is rewritten and no historical article link is touched, per the
authorisation. Both retired records were checked and carry **0** cached tag decisions, so
nothing in the cache changes. One pre-existing cached row, `Teledyne FLIR OEM → Teledyne
FLIR Defense`, differs from what the new code would decide (`Teledyne FLIR`); it stays
cached and would only change if that one row were healed. **That is the single decision
this part leaves for Nazar** — and it is cosmetic either way.

ECA's one remaining `article_companies` link is also left alone; the merge review
established that the same article is already linked to Exail.

## 5. Tests and activation

**35/35 pass**, including 14 new cases in `scripts/test/resolve-mergers.test.mjs`: the
three ECA tags resolving to Exail; a live `merged_with` source keeping its identity; an
ordinary unmerged draft; a retired company with no live successor; one whose successor row
is gone; the two-successor DefSecIntel case; a chain; a cycle; a self-merge; name-over-alias
precedence in both row orders; same-rank name and alias collisions; a missing
`publication_status`; and every non-`merged_with` relationship type.

Activation: the fix is on `main`, so the daily `ingest-and-deploy.yml` run uses it. The two
new reads were validated against the live REST API first — `companies?select=…,publication_status`
and `company_relationships?select=source_company_id,target_company_id,type` both return
200, while a deliberately bogus column returns 400, which is what makes those 200s mean
the columns resolve.
