# What `domain` means — resolved by inspection. PREPARED, NOT APPLIED

**Date:** 2026-11-01 · **Status:** PREPARED — nothing changed · **Next actor:** Nazar

Manifest: [2026-11-01-domain-facet-manifest.csv](2026-11-01-domain-facet-manifest.csv) ·
[SQL](2026-11-01-domain-facet.sql) · [rollback](2026-11-01-domain-facet-rollback.sql)

---

## 1. The question, and why the premise was wrong

The question carried forward was: does `domain` mean what the product **is**, the
platform it **supports**, or an inconsistent mixture? Cassio S (a piloted light aircraft)
and DA 15-N.ISS (a servo actuator) both sit in `Other` yet hold an `aerial-uav-uas` row,
which looked like evidence of a mixture.

**Inspection says it is none of the three.** `domain` is, for 96% of its rows, not an
assertion about the product at all:

| `source` / `note` | Rows | On non-UAV products |
|---|---:|---:|
| `rule` / `category=UAV` | **1,009** | **2** |
| `knowledge` or `web` (observed) | 46 | 38 |
| **Total domain rows** | **1,055** | 40 |

`source='rule'`, `note='category=UAV'` says it outright: **the row was derived from
`products.category`.** It is a mechanical copy, not an observation. The 46 non-rule rows
are the genuinely observed ones, nearly all added by the non-aerial passes.

And the distribution confirms what it is used *for*:

| Category | Domain rows |
|---|---:|
| UAV | 1,012 |
| Other | 43 |
| Sensor, Counter-UAS, Effector, Software | **0** |

**Zero.** Not one sensor, effector, counter-UAS system or software product carries a domain
row. So components are not tagged with the platform they support — they are not tagged at
all.

## 2. The answer

**`domain` means what the product itself is, and the established convention for a
component is to carry no domain row.** That is consistent across 1,053 of 1,055 rows.

**Cassio S and DA 15-N.ISS are not a semantics problem. They are stale derivations.** Both
rows were derived when the product's category was `UAV`; a later pass corrected the
category to `Other`; the derived row did not follow. Their notes still say `category=UAV`
about products that are not UAVs.

This is the same failure shape as the editorial-flag count that "kept lying": **a derived
value outliving the thing it was derived from.**

## 3. Does this work for components as well as complete systems?

Yes, and it is the only one of the three candidate readings that does.

- *What the product is* — a complete uncrewed system gets its domain; a component gets
  none, because a servo is not an aerial vehicle. Matches all 1,053 consistent rows.
- *The platform it supports* — would require tagging every sensor, effector and software
  product. **1,010 rows would have to be added and zero exist today.** It also makes the
  facet useless for its actual purpose: a user filtering `Domain = Aerial` wants aircraft,
  not every servo and radar that happens to fly.
- *A mixture* — not supported by the data. There are exactly two exceptions, both
  explained by a one-way derivation, neither by a differing interpretation.

The honest gap in the "what it is" reading is that a component's domain-relevance becomes
invisible. That is a real cost, and the right place to carry it is a **separate facet**
(a "fitted to" or "host platform" dimension) if it is ever wanted — not by overloading
`domain`, which would silently change the meaning of 1,009 existing rows.

## 4. Cassio S — identity verified separately from the piloted question

As instructed, these are two different questions.

**Identity: not established, and my earlier claim was too strong.** The batch 2 review said
"Cassio S matches none of VoltAero's published designations". The record's only source is
`dronesworldmag.com/aura-aero-acquires-voltaero-and-accelerates-the-decarbonization-of-aviation`
— an article about **AURA AERO acquiring VoltAero**, not a product page. VoltAero's
published Cassio line is **Cassio 330 / 480 / 600**. "Cassio S" matches none of those, but
I have not found a source that positively rules it out either; it may be an article's
shorthand. Verdict: **unverified designation, source does not establish it.**

**Piloted/uncrewed: separate, and clear.** The VoltAero Cassio is a piloted hybrid-electric
light aircraft — one pilot plus passengers. Nothing describes it as uncrewed.

**These point to different actions**, which is why the brief was right to separate them:

- The *identity* problem is a naming question → excluded (no renames in this task).
- The *domain row* problem is a stale derivation → §5, and it is true whatever the
  designation turns out to be, because a piloted light aircraft is not a UAV/UAS under
  either name.

Note also: the record is **already** `category='Other'`, so the category is right. Only
the derived row is wrong.

## 5. Proposed changes — 2 rows, both deletions

| # | product_id | Product | Company | Change |
|---|---|---|---|---|
| 1 | `6fb1094b-2df0-405b-97c6-26c01211ea31` | Cassio S | Voltaero | delete the `aerial-uav-uas` domain row |
| 2 | `c0fca03f-7285-4e71-901b-2dc46c73ba5a` | DA 15-N.ISS | Volz Servos | delete the `aerial-uav-uas` domain row |

**Deletion, not re-tagging**, for three reasons: the rows assert something false (neither
product is an uncrewed aerial system); the catalogue's own convention for a component is no
domain row; and both rows are `source='rule'` derivations whose basis no longer holds, so
there is no observation to preserve.

Both products keep everything else — category, publication status, company, sources. After
this, `aerial-uav-uas` rows on non-UAV products: **0**.

**One consequence to be explicit about:** the aerial row is the **only** taxonomy row
either product has, so after the deletion both carry **no taxonomy at all**. That is
consistent — it is exactly the state of every other component in the catalogue — but it
means neither will appear under any taxonomy filter. The alternative is a row asserting
they are uncrewed aerial systems, which is false, so an empty facet set is the better of
the two.

**Not proposed:** no change to the facet's definition, no change to the other 1,053 rows,
no new facet, no renames. The semantics do not need changing — they need one stale
derivation cleaned up.

### Validation

Dry-run `begin … rollback` against live, then reversed inside the same transaction and
diffed against a snapshot:

```
deleted                            2
taxonomy rows after                11130  (from 11132)
aerial rows on non-UAV products    0      (from 2)
both products after                Other / live, unchanged
rollback re-inserted               2
rows differing from before         0      (created_at included)
rows missing vs before             0
count now / before                 11132 / 11132
```

The rollback's `created_at` values (`2026-09-05 16:52:03.652926+00`, shared because both
rows came from one backfill statement) were **read from the live rows**, not assumed. The
database was confirmed unchanged afterwards.

## 6. The process gap, which outlives these two records

**No live code writes `product_taxonomy`.** I checked the whole repo: the
`rule`/`category=UAV` rows came from a one-off SQL backfill, and nothing regenerates them.

That is good news and bad news. Good: these two rows will not come back, and there is no
derivation code to fix. Bad: **nothing keeps derived domain rows in step with a category
correction.** Every future category change can leave another one behind. Today the count is
2 because the non-aerial passes happened to replace the affected rows with observed ones.

The cheap guard is a standing check rather than code — a query that should always return
zero:

```sql
select p.id, p.name, p.category
  from product_taxonomy pt
  join products p on p.id = pt.product_id
  join taxonomy_options o on o.id = pt.option_id
  join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain'
 where pt.source = 'rule' and pt.note = 'category=UAV' and p.category <> 'UAV';
```

Worth adding to whatever runs after a category change. Recorded as a recommendation, not
implemented, since it is outside this task's code scope.

## 7. Decision for Nazar

**Apply the two deletions?** Dry-run and rollback are prepared. The interpretation itself
needs no decision — the data already settled it.
