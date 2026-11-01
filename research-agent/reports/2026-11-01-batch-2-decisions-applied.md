# Batch 2 — the decisions, applied. 1 November 2026

**Status:** applied to production, deployed, verified live · **13 rows changed**

Deliverables: [SQL as executed](2026-11-01-batch-2-decisions-applied.sql) ·
[rollback](2026-11-01-batch-2-decisions-applied-rollback.sql)

Closes out [the applied batch](2026-11-01-non-aerial-product-batch-2-applied.md) and the
[retirement proposal](2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md). Four decisions
were taken: retire the three programmes, delete rMCM's false row, fix Ghost Shark's
sources, and LUNA-2 left to my judgement.

---

## 1. MMCM, rMCM and XLUUV retired

`publication_status` `live → draft` on all three. The prepared TX B, which would have
recategorised them to Other, is **not run and is now superseded.**

| Record | ID | Was |
|---|---|---|
| MMCM | `ccfd9d18-4029-4c1b-a46e-68e8de044f6b` | the FR/UK Maritime Mine Counter Measures **programme** |
| rMCM | `5d6c6ab3-6b4c-4552-9734-b6f7cff54903` | the Belgian-Dutch replacement MCM **programme** |
| XLUUV | `9d80e014-03aa-4342-9a91-1fcaa702fca2` | a US Navy **class term** |

**Nothing was deleted except rMCM's false row**, and that is not caution for its own sake:
five of the six foreign keys into `products` are `ON DELETE CASCADE`, so a hard delete
would have taken the three article links and seven taxonomy rows with it, silently.
Verified surviving after the change: **3 article links, XLUUV's 5 taxonomy rows**, and
`article_products` unchanged at 10,284 rows.

MMCM's and XLUUV's domain rows are **kept**, because both are correct — MMCM's deliverable
genuinely is a USV, and an extra-large uncrewed *undersea* vehicle is underwater by
definition. Only their flags were answered, with notes recording what each record turned
out to be. XLUUV's other four rows (control, mission_military, origin, range_class) are
bare seeds and were **left alone**: a retired record's seeds assert nothing publicly, and
removing them would be a change nobody has evidence for.

## 2. rMCM's false domain row deleted

`(5d6c6ab3…, option 9624877b surface-usv)`, gone. **This row was wrong, not merely
unsourced.** The rMCM programme delivers twelve **crewed** City-class and Vlissingen-class
mine countermeasures vessels, which *carry* uncrewed systems — two Exail Inspector 125
USVs, three A-18 AUVs and two Saab V200 Skeldar air vehicles apiece. The row asserted the
programme *is* a USV.

rMCM now carries **no domain assertion at all**, which is the honest state. That is also
why this was worth doing independently of the retirement: a false claim is worth removing
whether or not the record is published.

## 3. Ghost Shark's sources corrected

```
before  dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia
after   anduril.com/news/first-ghost-shark-debuts-in-australia
        defence.gov.au/news-events/news/2022-12-14/ghost-shark-stealthy-game-changer
```

**That single before-value is the whole explanation of the original error.** The record's
only source was an article about **Albacore's Ghostfin** — a different vehicle with a
similar name — so when the record was seeded, the company came along with it. The maker was
corrected to Anduril earlier today; leaving the source pointing at Ghostfin would have left
the record internally contradictory.

Replaced with the two sources the maker correction actually rests on. The taxonomy note was
updated in the same transaction to drop its "NOT changed here" warning and instead record
the sequence: that the wrong source is how the error got in, and that it was replaced.

## 4. LUNA-2 — my call, and what decided it

**Moved to Other. Kept published.** Two facts settled it, and both are checks rather than
opinions:

1. **LUNA-2 is the only `space-orbital` record in the entire catalogue.** So this was never
   a scope policy affecting a class of records — it was one record to place. A guard in the
   SQL asserts that count is 1 and **aborts if it is not**, because if more satellites have
   arrived, the question really is a class question and deserves a real answer rather than
   this statement.
2. **Dot, the sidewalk delivery robot that raised the identical doubt in batch 1, is
   already `Other` / `live`.** The house answer exists; this follows it.

**Why not retire it.** Unlike Exail A27, LUNA-2 demonstrably exists — ASELSAN's own
announcement, a SpaceX launch on 30 March 2026, and a `web`/`high` domain row with a real
citation. A27 was unpublished because nothing names it. Unpublishing a well-sourced real
product to dodge a scope question would trade a small ambiguity for a plain inaccuracy.

`/uav/luna-2/` is preserved by a redirect to `/other/luna-2/`. The note records the
reasoning **and** flags the live question for whoever comes next: if more satellites
arrive, the scope question returns.

## 5. Before and after

Baseline is the state after this morning's applied batch:

| | Before | After | Δ |
|---|---:|---:|---:|
| Live products, UAV | 1,413 | **1,409** | −4 |
| Live products, Other | 412 | **413** | +1 |
| Live products, total | 3,521 | **3,518** | −3 |
| Draft products | 111 | **115** | +4 |
| `product_taxonomy` rows | 11,133 | **11,132** | −1 |
| `slug_redirects` | 97 | **98** | +1 |
| Notes matching `verify category` | 4 | **0** | −4 |
| Notes matching `not an aerial system` | 3 | **0** | −3 |

UAV falls by **four**: three retired and one moved. Drafts rise by four across the whole
day — A27 this morning, these three now.

### The flag count is zero, and this time that is the honest number

| Point in the day | `verify category` notes |
|---|---:|
| Start | 31 |
| After the applied batch | 4 |
| **Now** | **0** |

It reached zero by every flagged record being **answered or retired** — not by a fix that
quoted the instruction it retired, which is the defect that kept the population at 31 while
26 of those rows were already correct. A search for either phrase now returns nothing.

## 6. Validation

**Dry run, forward and round trip, inside `begin … rollback` against live.** All 13
affected-row counts matched, and **every predicted figure matched this time** — the three
misses in the morning's pass were arithmetic of mine, not the SQL, and I recomputed from
the post-batch baseline rather than the pre-batch one.

Round trip, diffed against temp-table snapshots:

```
taxonomy rows differing from before      0
taxonomy rows missing vs before          0
taxonomy count now / before              11133 / 11133
products differing                       0      (including source_urls)
products missing                         0
product_companies differing              0
article_products differing               0
article_products missing                 0
redirects differing                      0
redirect count now / before              97 / 97
```

Two things this run proved that the morning's could not:

- **The taxonomy snapshot included `created_at`**, and the re-insert of rMCM's deleted row
  restored it exactly (`2026-09-05 16:56:47.583515+00`) — because that column takes its
  value from a default rather than a trigger. The batch 2 review claimed
  `product_taxonomy` had "no timestamp at all"; it was wrong, and this is where it mattered.
- **`article_products` was snapshotted and diffed**, so the claim that retirement preserves
  article links is measured rather than asserted.

Database confirmed unchanged after the dry run, before anything was applied.

**Tests:** catalogue **75/75**, news **48/48**. No code changed.

**One limit, stated.** `products` carries a `BEFORE UPDATE set_updated_at` trigger, so a
reversal cannot restore `updated_at` on the four products rows. Literal previous values are
in the rollback file. Ghost Shark's was already unrecoverable from the morning's pass and
moves again here.

## 7. Verified live

Measured on `https://xsonomy.com` after the rebuild:

| Check | Result |
|---|---|
| `/other/luna-2/` | **200** |
| `/uav/luna-2/` | **200**, stub redirects to `/other/luna-2/` |
| `/uav/mmcm/` · `/uav/rmcm/` · `/uav/xluuv/` | **404** · **404** · **404** |
| `/uav/exail-a27/` | **404** (this morning's) |
| Sitemap: `mmcm`, `rmcm`, `xluuv`, `exail-a27` | **0 occurrences each** |
| Sitemap: `luna-2` | under `/other/` only |
| `/other/dire-wolf/` · `/other/ghost-shark/` · `/other/ghostfin/` | **200** each |
| `/companies/anduril/` · `/companies/albacore/` · `/companies/exail/` | **200** each |
| Ghost Shark, company | **Anduril** |
| Ghost Shark, `Source URLs` in `/data/other.json` | **anduril.com** and **defence.gov.au** |
| `/data/uav.json` · `/data/other.json` | **1,409** · **413**, matching the database |
| `/landscape/` | **200** |

**One thing to note about the source fix, so it is not mistaken for a failure.** The
corrected URLs do **not** appear on the product page, and that is deliberate generator
behaviour, not a lost change: `"Source URLs"` is in `generate-supabase.mjs`'s `HIDDEN` set,
kept off the spec tables and surfaced only through the data feed and the "analyst note"
path. The data feed carries both new URLs and the corrected company. I verified this in the
generator rather than concluding the deploy had failed when the page still showed a
`dronexl.co` link — which turned out to be a *different*, correct dronexl article about
Anduril's Ghost Shark.

**The database closure is stronger than the flag count.** Live UAV products whose every
`domain` row is non-aerial: **0**. That is the condition the batch existed to fix, measured
directly rather than through the flag text. The only remaining domain/category mismatches
are the two reverse cases in §8. Investor and landscape layer untouched: 118 projected
investors, 207 current observations, 100 live holdings, 104 vehicles, 2,462 live companies.

### A residual limb of the Ghost Shark error, found while verifying the fix

Chasing that `dronexl.co` link turned up something the morning's pass missed. The
*original* wrong source — `dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia`,
"Navy Buys Attack Drone Subs Built in a Philly Marble Showroom" — is still attached to
Ghost Shark as a **news link**, and to two other products:

| Linked product | Company | Verdict |
|---|---|---|
| **Ghostfin** | Albacore | **correct** — it is Albacore's article |
| **Ghost Shark** | Anduril | **spurious** — the same name confusion, in the article links |
| **MAGURA V7** | Uforce | **doubtful** — a Ukrainian USV; not obviously in scope for this piece |

So the misattribution had two limbs: `company_id` plus `source_urls`, which are fixed, and
an **article link**, which is not. Removing it was not authorised — the standing instruction
has been to preserve historical article links — so it is reported, not changed. The fix when
you want it:

```sql
delete from article_products
 where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and article_id = (select id from articles
                      where url = 'https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia');
-- expect 1. Leaves Ghostfin's correct link intact. MAGURA V7 needs reading the article first.
```

This also says something about the earlier count: Ghost Shark's "17 article links, which
corroborate Anduril unanimously" was **16 that corroborate it and 1 that caused the
problem.** The conclusion stands; the arithmetic was too generous.

## 8. What is left open

| Item | Status |
|---|---|
| **Cassio S** `6fb1094b` and **DA 15-N.ISS** `c0fca03f` | Not answered, and not touched. Two `Other` records holding **aerial** domain rows: a *piloted* light aircraft and a servo *actuator*. Needs a ruling on whether a domain row describes what a product **is** or what it **flies on** — a taxonomy-semantics question affecting more than two records |
| **Satellites, if a second one arrives** | The LUNA-2 note says so, and the SQL guard enforces it: the next pass to touch a `space-orbital` row will abort rather than assume |
| **Dire WOLF's company link** | BLADE is live as `hdt-global`; a name match on "BLADE" also finds **`Blade (Horizon Hobby)`**, an unrelated hobby brand |
| **The two retired programmes as reference entries** | OCCAR, Thales, Naval Group and Exail are all candidate links if these ever return as something other than product records |
| **Exail's parent relationships, iXblue, DORCUS, renames, deduplication** | excluded throughout, untouched |
| **The Albacore/Ghostfin article still linked to Ghost Shark** | §7. One statement, ready. Not authorised, so not run — and **MAGURA V7** carries the same doubtful link |

## 9. The finding worth keeping

**One article produced three bad records.** MMCM, rMCM and **Exail A27** all came from the
same opex360 piece of 2026-08-04 about French mine-warfare drone orders — two programme
names and one invented product, from a single extraction. XLUUV is the same failure in its
other form: a **class term** read as a model name, from an article about a DIU programme
*for* XLUUVs. And Ghost Shark's misattribution came from being seeded off an article about
a **different vehicle with a similar name**.

All four are the same failure mode: an article that names several programmes, vendors and
vehicles in one breath, read as if each name were a product. That is a property of the
source shape, not of these records — worth knowing before the next extraction pass rather
than after.
