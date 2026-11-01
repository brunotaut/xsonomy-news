# Non-aerial products, batch 2 — APPLIED. 1 November 2026

**Status:** applied to production, deployed, verified live · **43 rows changed**

Deliverables: [SQL as executed](2026-11-01-non-aerial-product-batch-2-applied.sql) ·
[manifest](2026-11-01-non-aerial-product-batch-2-applied-manifest.csv) ·
[rollback](2026-11-01-non-aerial-product-batch-2-applied-rollback.sql)

Authorises and supersedes the execution plan in
[the batch 2 review](2026-11-01-non-aerial-product-batch-2.md), which is now kept as the
research record only. Held work went to
[the retirement proposal](2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md).

---

## 1. What was applied, and what the prepared plan would have done differently

Three transactions, **not** the prepared three. The differences are the whole point:

| Prepared | Applied | Why |
|---|---|---|
| TX A — move **three** records | **TX A′** — move **two** | LUNA-2 excluded from the authorisation |
| — | **+ Ghost Shark's maker corrected** | prepared plan deliberately held this |
| TX B — move MMCM, rMCM, XLUUV | **not run** | went to a retirement proposal instead |
| TX T — 26 notes + 5 upgrades | **TX T, unchanged** | — |
| — | **+ TX C: Exail A27 → draft** | prepared plan deliberately held this |

**TX A was not run as written.** Running it would have moved LUNA-2, which is excluded.

### Order mattered, and it was not obvious

TX T's first statement rewrites every note containing `not an aerial system` on a record no
longer categorised UAV. Ghost Shark carries exactly that note and was being moved out of
UAV. **Had TX A′ run first, Ghost Shark would have been swept into that generic rewrite**
and lost the note written for it, including the record of the maker correction.

So TX T ran **first**, while Ghost Shark was still UAV and therefore out of its reach. The
dependency runs the opposite way to the obvious reading, where the category fix looks like
the prerequisite for the note cleanup.

## 2. Dire WOLF and Ghost Shark

| | Dire WOLF | Ghost Shark |
|---|---|---|
| ID | `d77e3215-00e6-4bde-88cd-2aa49c294522` | `0c420e85-28c1-4c88-acab-436348b91ec3` |
| Category | UAV → **Other** | UAV → **Other** |
| URL | `/uav/dire-wolf/` → `/other/dire-wolf/` | `/uav/ghost-shark/` → `/other/ghost-shark/` |
| Old URL | redirect created | redirect created |
| Taxonomy | **4 of 5** rows upgraded to `web`/`high` | domain note rewritten |
| Maker | — | **Albacore → Anduril** |

**Dire WOLF's fifth row was not upgraded.** `control = semi-autonomous-human-on-the-loop`
keeps its model-knowledge seed, because no source states the control mode. Four rows
(`domain`, `propulsion`, `mission_military`, `origin`) are corroborated: a BLADE (formerly
HDT Global) six-wheeled diesel-electric hybrid UGV for autonomous battlefield resupply,
derived from the WOLF-X, selected for the U.S. Army's Project Sustainment effort in July
2026 — hdtglobal.com, armyrecognition.com, defence-blog.com.

### The maker correction, and how the error got in

Albacore's own site **names exactly one vehicle: Ghostfin.** `albacore.inc` carries no
other product name — the Periscope, Propulsion, Battery and Payload entries on it are
Ghostfin subsystems. Ghost Shark is Anduril's XL-AUV, co-developed with the Royal Australian
Navy and DSTG, under a production contract from September 2025.

The record's **17 article links** corroborate it independently and unanimously — *"Australia
expands Ghost Shark payload capabilities as Anduril ramps up navy deliveries"* among them.

**And the record's own single `source_urls` entry explains the error.** It is
`dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia` — an article
about **Albacore's Ghostfin**. The record was seeded from a piece about a different vehicle
with a similar name, and the company came along with it.

Both ends of the attribution moved together — `products.company_id` and the one
`product_companies` row, role unchanged at `manufacturer`. Guards asserted before the
update that Ghost Shark had exactly one company link, that it was Albacore's, that **no
Anduril link already existed** (which would have made the update collide instead of move),
that Anduril's record was live, and that **Ghostfin was still Albacore's live record**.

Preserved: all 17 article links, Ghostfin as a separate record, and every unrelated
relationship. Albacore keeps a product and therefore a page.

### One thing deliberately left, and it is in the data

`source_urls` still cites the Ghostfin article. Changing it was not authorised, so it was
not changed — but a record attributed to Anduril whose only source is an article about
Albacore's vehicle is actively misleading, so **the taxonomy note says so in as many
words.** The fix is one statement when you want it:

```sql
update products
   set source_urls = array['https://www.anduril.com/news/first-ghost-shark-debuts-in-australia',
                           'https://www.defence.gov.au/news-events/news/2022-12-14/ghost-shark-stealthy-game-changer']
 where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and source_urls = array['https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia'];
```

I also **dropped an unverified claim of my own.** The batch 2 review said Ghost Shark is
built "under Project SEA 1200". Searching Anduril's and the Australian Department of
Defence's own material did not confirm that programme number, so the note cites what the
sources do say — RAN/DSTG co-development and the September 2025 production contract — and
SEA 1200 appears nowhere in the data.

## 3. Taxonomy cleanup — 26 notes, 5 upgrades, 1 record deliberately untouched

| | Rows | What |
|---|---:|---|
| T1 | **17** | already moved out of UAV, note still carried the full flag text |
| T2 | **6** | same, shorter phrasing; sourced descriptions preserved, only the instruction stripped |
| T2b | **2** | DriX and DriX O-16 — the Exail pass's own "fix" quoted the instruction it retired |
| T3 | **1** | **HALIA**, and the answer is *leave it* |
| T5 | **5** | A-18M (3) and K-Ster (2) upgraded to `web`/`high` |

All 17 T1 before-images were **byte-identical and carried no sourced description** — a
guard asserted that before the wholesale replacement, so nothing was lost. The six T2 rows
*do* carry sourced descriptions (FireAnt, Ghostfin, Kuryer, Max1, Pioneer, TEC800), which
is why those took a regexp strip of the trailing instruction instead.

**HALIA (`4d80bcae`) is the one record in this batch where the correct action was to change
no data at all.** LeVanta Tech's HALIA is amphibious float-and-fly — 30+ days of sea
persistence between flights — and holds a surface row *and* an aerial row. Its category is
UAV and that is right. Only the note changed, to record that the flag was answered by
review rather than by a move.

**Three upgrades were refused:**

- A-18M `mission_military = isr` — the vehicle is for **mine countermeasures**, which is
  not ISR. Upgrading it would be the same class of error this batch exists to clear.
- K-Ster `control = tethered` — no reviewed source confirms a wire or fibre link, only
  remote operation.
- Dire WOLF `control` — as above.

### The flag count now means something

| | Before | After |
|---|---:|---:|
| Notes matching `verify category` | 31 | **4** |
| …of which genuinely open | 5 | **4** |

The four are **LUNA-2, MMCM, rMCM and XLUUV** — every one pending by instruction. A pending
record keeps its flag; that was explicit in the authorisation and it is why the number is
4 and not 0.

**The mechanism, restated because it is the reusable part.** A fix that quotes the
instruction it retires re-creates the searchable string, so the flag population can never
shrink and a later pass re-reviews work already done. The Exail pass did this to two rows;
my own first draft did it to twenty-six more and the dry run caught it. Every replacement
note written today contains **neither** phrase.

## 4. Exail A27 → draft

`3515b298-4a7d-4cff-a1f4-ec6a7bf24726`, `publication_status` `live` → `draft`.

Exail's AUV range is **A9-M, A18-M, A6K-M and Ulyx**; the ultra-deepwater vehicle for the
French Navy derives from Ulyx. **No source names an A27.** It is also the one record in the
batch whose *category* was unsupported too — its `underwater-uuv-auv` row is a bare model
seed — so moving it to Other would have asserted "this is a non-aerial system" on no
evidence either. Unpublishing answers both at once.

**Nothing was deleted.** Verified surviving after the change: the record, its **4 taxonomy
rows**, its **1 Exail link**, its **1 article link** and its `source_urls`.

**And a hard delete would have been destructive, which the schema states plainly.** Five of
the six foreign keys into `products` are `ON DELETE CASCADE` — `article_products`,
`product_taxonomy`, `product_companies`, `product_sectors`, `company_sector_products`. A
`delete from products` would have taken the article link and all four taxonomy rows with
it, silently.

**The site's established retirement behaviour, verified in the generator rather than
assumed.** `scripts/generate-supabase.mjs` filters at fetch
(`publication_status=eq.live`), so a draft record never enters the build: no page, no
sitemap entry, no listing row, and no contribution to Exail's product count. The whole
`public/` tree is uploaded as the Pages artifact, so the old page is gone, not stale.
`/uav/exail-a27/` now returns **404**, and **no redirect was invented** — there is no
product to redirect to. The generator also skips any redirect whose target is not live,
with a warning, so even a mistaken one could not have produced a dead stub.

## 5. Before and after, measured

Recalculated from today's live baseline, which matched the prepared batch's figures exactly
(so nothing had drifted under it):

| | Before | After | Δ |
|---|---:|---:|---:|
| Live products, UAV | 1,416 | **1,413** | −3 |
| Live products, Other | 410 | **412** | +2 |
| Live products, total | 3,522 | **3,521** | −1 |
| `product_taxonomy` rows | 11,133 | **11,133** | 0 |
| `slug_redirects` | 95 | **97** | +2 |
| Notes matching `verify category` | 31 | **4** | −27 |
| Notes matching `not an aerial system` | 21 | **3** | −18 |
| Anduril live products | 28 | **29** | +1 |
| Albacore live products | 2 | **1** | −1 |

UAV falls by **three**, not two: two moved to Other and A27 was unpublished from UAV. The
three `not an aerial system` notes remaining are MMCM, rMCM and XLUUV, held by instruction.

## 6. Validation

**Two dry runs, both inside `begin … rollback`, both against the live database.**

1. **Forward.** All three transactions with guards, and every affected-row count asserted.
   All 43 matched. Three of my *predictions* were wrong and the data was right: live UAV
   1413 not 1414 (I forgot A27 leaves the UAV count too), Anduril 29 not 30 (miscount —
   it held 28, not 29), and `not an aerial system` 3 not 0 (I forgot TX B was not running).
   The SQL needed no change; the predictions did.
2. **Round trip.** Applied forward, reversed with the rollback file, and diffed against
   temp-table snapshots taken before:

```
taxonomy rows differing from before      0
taxonomy rows missing vs before          0
taxonomy count now / before              11133 / 11133
products differing                       0
products missing                         0
product_companies differing              0
product_companies missing                0
redirects differing                      0
redirect count now / before              95 / 95
```

**Rollback proven, not asserted** — including its two hardest reversals: the regexp inverse
that restores the six stripped-and-re-appended notes, and the two-ended maker correction
across `products` and `product_companies`.

The database was confirmed **unchanged** after both dry runs, before anything was applied.

**One limit, stated.** `products` carries a `BEFORE UPDATE set_updated_at` trigger, so a
reversal cannot restore `updated_at` on the three products rows. The literal previous values
are recorded in the rollback file. `product_taxonomy` has no `updated_at` at all and no
surrogate key, so its statements are keyed on `(product_id, option_id)` or on exact text
and guarded by expected current values. (It *does* carry a `created_at`, set by a column
default rather than a trigger — the batch 2 review said otherwise and that was wrong. It
matters only for the retirement proposal, whose rollback re-inserts a row and now restores
that value explicitly.)

**Tests:** catalogue **75 of 75**, news **48 of 48**. No test changes were needed — nothing
in this batch touched code.

## 7. Deployment and live verification

See §8 for the measured live results. The build ran through the established workflow: a
push to the catalogue repo triggers `deploy.yml`, which rebuilds from Supabase with
`generate-supabase.mjs` and deploys `public/` to Pages. No catalogue code changed.

## 8. Verified live

Measured on `https://xsonomy.com` after the rebuild landed:

| Check | Result |
|---|---|
| `/other/dire-wolf/` · `/other/ghost-shark/` | **200** · **200** |
| `/uav/dire-wolf/` → `/other/dire-wolf/` | **200**, stub redirects correctly |
| `/uav/ghost-shark/` → `/other/ghost-shark/` | **200**, stub redirects correctly |
| `/uav/exail-a27/` | **404** |
| Ghost Shark page, manufacturer | **Anduril** — "Albacore" appears nowhere on it |
| `/companies/albacore/` | **200**, lists **Ghostfin only** |
| `/companies/anduril/` | **200**, Ghost Shark present |
| `/companies/exail/` | **200**, **no A27** |
| `/other/ghostfin/` | **200**, untouched |
| `/uav/luna-2/` · `/uav/mmcm/` · `/uav/rmcm/` · `/uav/xluuv/` | **200** each, all unchanged |
| Sitemap: `exail-a27` | **0 occurrences** |
| Sitemap: dire-wolf, ghost-shark | present under `/other/` only |
| `/data/uav.json` · `/data/other.json` | **1,413** · **412** — matching the database exactly |
| `/landscape/` | **200** |
| `/data/landscape-investors.json` | **118** investors, **102** with figures, **207** observations, **26** Ukraine-linked, **100** holdings — every figure identical to the verified baseline |

The last row is the one that matters for "unrelated work unaffected": the investor and
landscape layer went through this build untouched. Confirmed in the database too — 118
pool, 118 projected, 207 current metrics, 100 live holdings, 104 vehicles — and
`frozen_snapshots` V1=273 / V2=358 unchanged.

**Deployment:** news `c5c982a`, catalogue `6e3629b`. The catalogue commit was rebased over
concurrent UI work (`1328d50`, landscape menu) with no file overlap; tests re-run at
**75/75** after the pull.

## 9. Held, and why

| Item | Status |
|---|---|
| **LUNA-2** → Other | excluded from the authorisation; keeps its flag |
| **MMCM, rMCM, XLUUV** | [retirement proposal](2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md), prepared not applied |
| **rMCM's false `surface-usv` row** | in that proposal; it is false, not merely unsourced |
| **Ghost Shark's `source_urls`** | still the Ghostfin article. One statement, in §2 |
| **Satellite inclusion question** | open, and unaffected by anything here |
| **Cassio S / DA 15-N.ISS** | two `Other` records holding *aerial* domain rows. Needs a ruling on whether a domain row describes what a product **is** or what it **flies on** |
| **Dire WOLF's company link** | BLADE is live as `hdt-global`; a name match on "BLADE" will also find **`Blade (Horizon Hobby)`**, an unrelated hobby brand |
| **Exail's parent relationships, iXblue, DORCUS, renames, deduplication** | excluded by instruction, untouched |

## 10. What is worth carrying forward

**One article produced three bad records.** MMCM, rMCM and **Exail A27** all came from the
same opex360 piece of 2026-08-04 about French mine-warfare drone orders. Two programme
names and one invented product, from one extraction. XLUUV is the same failure in its other
form — a **class term** read as a model name, from an article about a DIU programme *for*
XLUUVs.

That is a property of the source shape, not of these four records: an article naming
several programmes, vendors and vehicles in one breath is where this class of error comes
from. Worth knowing before the next extraction pass, rather than after.
