# Non-aerial products, batch 2 — review. PREPARED, NOT APPLIED

**Date:** 2026-11-01 · **Status:** PREPARED — nothing applied · **Next actor:** Nazar

Deliverables: [manifest](2026-11-01-non-aerial-product-batch-2-manifest.csv) ·
[SQL](2026-11-01-non-aerial-product-batch-2.sql) ·
[rollback](2026-11-01-non-aerial-product-batch-2-rollback.sql)

Follows [batch 1](2026-11-02-non-aerial-product-batch.md), which moved 28 records and held 8.
This batch takes up the 8 it held — minus Katana, whose flag that pass disproved — and the
taxonomy debris the move left behind.

**Headline: 6 of the 7 remaining records are ready, 1 is held, and the flag count has been
lying.** A catalogue-wide search for the editorial flag returns **31 rows** when only **5**
are genuinely unresolved. The rest are rows that were already fixed and whose "corrected"
notes quote the instruction they retired — so they keep answering the query that finds
unfixed ones. The 2026-11-01 Exail pass introduced that defect on two rows and my own first
draft of this batch reproduced it on twenty-six more. The dry run caught it. Fixed below.

---

## 1. The set is 7, and nothing new has appeared

Re-queried from the taxonomy's own `domain` facet, which is how batch 1 defined the set:

| Definition | Count |
|---|---:|
| Live, categorised **UAV**, every `domain` row non-aerial | **7** |
| Live, categorised UAV, carrying the editorial flag | 4 |
| Carrying the flag in **any** category | 21 |
| Any `product_taxonomy` note containing the instruction `verify category` | 31 |
| Live, **not** UAV, yet carrying an **aerial** domain row | 2 |

The 7 are exactly batch 1's 8 holds minus Katana. **No new candidates have appeared** since,
and `UAV 1,416 / Other 410` still matches batch 1's applied figures, so nothing has drifted.

All 7 share a profile: `confidence = low`, one source URL, no summary, no specs. Every
taxonomy row on them is `source = knowledge, confidence = medium` — a bare model seed —
**except LUNA-2**, whose domain row is `web / high` with a real citation.

## 2. The seven, against primary sources

### Group A — identity settled, ready (3)

| Record | ID | What the sources establish |
|---|---|---|
| **Dire WOLF** | `d77e3215` | **Now fully sourced, and it was not before.** A six-wheeled diesel-electric hybrid UGV for autonomous battlefield resupply, built by **BLADE (formerly HDT Global)** and derived from its WOLF-X; put to the U.S. Army's Project Sustainment effort in July 2026, managed by the National Advanced Mobility Consortium. `ground-ugv` confirmed → **Other** |
| **Ghost Shark** | `0c420e85` | Anduril's **XL-AUV** for the Royal Australian Navy under Project SEA 1200; flooded hull, ~10 days endurance, depths to 6,000 m. Underwater beyond doubt → **Other** |
| **LUNA-2** | `8a28d7c5` | ASELSAN's **LoRa IoT nanosatellite**, launched by SpaceX on 30 March 2026, second after LUNA-1. Confirmed by ASELSAN's own announcement and four independent outlets. `space-orbital` → **Other** |

Two of these carry a second question that the category move does **not** touch and must not
be read as having answered:

- **Ghost Shark's maker is wrong in the record.** It is attributed to **Albacore**, whose
  own vehicle is **Ghostfin** — a separate record, already correctly in Other, sourced to
  `albacore.inc`. Ghost Shark is Anduril's. The category is settled under either reading,
  which is why the move is safe; **the ownership fix is held**, in line with the exclusion
  on ownership changes.
- **LUNA-2 is a satellite.** Whether satellites belong in a UAV and counter-UAS catalogue
  is an *inclusion* question, and it has the same answer whether the record sits in `/uav/`
  or `/other/`. It currently sits in `/uav/`, which is affirmatively wrong, so the move is
  an improvement under either answer. **The inclusion question stays open.**

### Group B — the category is certain, the identity is not (3)

These three are **not products**. That is batch 1's finding and the sources confirm it.
But the category fact is independent and settled: none of them is an aerial system.

| Record | ID | What it actually is |
|---|---|---|
| **MMCM** | `ccfd9d18` | The **FR/UK Maritime Mine Counter Measures programme**, run by OCCAR for the French DGA and the UK MOD, Thales leading an industrial team that includes BAE Systems and ECA. Eight uncrewed mine-hunting systems contracted in 2020; first serial system delivered to the French Navy in February 2025. A programme, which *fields* USVs |
| **rMCM** | `5d6c6ab3` | The **Belgian-Dutch replacement Mine CounterMeasures programme** — 12 City-class and Vlissingen-class vessels, contracted 2019 to Belgium Naval & Robotics (Naval Group + ECA Group, now Exail) |
| **XLUUV** | `9d80e014` | A **US Navy class term** for extra-large uncrewed undersea vehicles, above 84 inches in diameter. Boeing's **Orca** is the vehicle that fills it |

**rMCM carries a third error that the sources expose.** Its `surface-usv` domain row is
wrong, not merely unsourced: the rMCM programme delivers **crewed** mine countermeasures
vessels that *carry* uncrewed systems — two Exail Inspector 125 USVs, three A-18 AUVs and
two Saab V200 Skeldar air vehicles apiece. The row asserts the programme is a USV. The SQL
**deletes** it rather than re-wording it, which leaves the record with **no domain
assertion at all** — the honest state while the programme-vs-product question is open.
MMCM's `surface-usv` row is defensible on the same evidence, because MMCM's deliverable
genuinely is a USV.

I am recommending these three because the alternative is worse: leaving a programme and a
class term filed as aerial vehicles. **If you would rather retire them than move them, say
so and TX B is simply not run** — it is a separate transaction for exactly that reason.

### Group C — held (1)

**Exail A27**, `3515b298`. Searched again, specifically. Exail's AUV range is **A9-M,
A18-M, A6K-M and Ulyx**; its ultra-deepwater vehicle for the French Navy derives from Ulyx.
**No source names an A27.** The name looks like a plausible-but-invented member of the
A-series.

This is the one record where the category is **also** unsupported: its `underwater-uuv-auv`
row is a bare model seed, so moving it to Other would assert "this is a non-aerial system"
on no evidence either. It stays exactly where it is.

**Recommendation, for a later task: unpublish it.** This task excludes that, so it is
recorded and not acted on.

## 3. The flag count has been lying, and that is the more useful finding

Of **31** taxonomy rows matching the instruction `verify category`:

| | Rows | Status |
|---|---:|---|
| Already moved out of UAV, note still carries the full flag text | **17** | stale — the instruction was obeyed |
| Already moved, note carries the shorter `filed under UAV — verify category` | **6** | stale |
| DriX and DriX O-16, "corrected" by the Exail pass, whose replacement note **quotes** the retired instruction | **2** | stale, and self-inflicted |
| **HALIA**, still UAV — and **correctly** so | **1** | answered: leave it |
| Ghost Shark, LUNA-2, MMCM, rMCM, XLUUV | **5** | **genuinely open** — groups A and B resolve them |

So the honest number of open flags is 5, not 31. A pass that counts flags to size its work
would have re-reviewed 26 records whose category is already right.

**The mechanism matters more than the count.** A fix that quotes the instruction it retires
re-creates the searchable string, so the flag population can never shrink. Batch 1 did this
to DriX and DriX O-16; my first draft of TX T did it to all 26. The dry run reported
"17 stale rows remaining" after an update that had in fact run — which is how it surfaced.
Every replacement note in the final SQL contains **neither** `verify category` **nor**
`not an aerial system`, and the DriX pair is corrected here as part of the same fix.

After all three transactions, a catalogue-wide search for either phrase returns **zero**.

### HALIA is the opposite error, and worth naming

`4d80bcae` — LeVanta Tech's HALIA is an **amphibious float-and-fly** system: 30+ days of sea
persistence between flights. It holds a `surface-usv` row **and** an aerial row, which is
why it never appeared in the non-aerial candidate set. Its category is **UAV and that is
right**. The flag on it is answered by leaving it alone — a note-only change, and the one
record in this batch where the correct action is to do nothing to the data.

## 4. The Exail-11 taxonomy review, as asked

Batch 1 reported this as "narrower than expected". Re-checked, and it is narrower still in
one respect and wider in another:

- **No specifications to preserve.** Of Exail's 13 products now in Other, **0 carry any
  specs**. There is nothing to strip and nothing to protect. (The only Exail product with
  UAV-flavoured spec fields is the IT180 STH-U, which is correctly a UAV and untouched.)
- **No incompatible taxonomy values.** Every domain row on them is correct: A-18M and
  K-Ster underwater, DriX and DriX O-16 surface.
- **Four of the 13 carry notes, and two of those are upgradeable** — which batch 1 did not
  pick up. **A-18M** (`1de976af`) and **K-Ster** (`6efaadb9`) carry model-knowledge seeds
  that primary sources now corroborate:
  - A18-M is Exail's mid-size AUV for mine countermeasure missions → `domain`, `control`
    and `origin` upgraded to `web / high`. **`mission_military = isr` is NOT upgraded**:
    mine countermeasures is not ISR, and conflating them would be the same class of error
    as the category flags this batch is clearing.
  - K-STER C is an expendable, remotely operated underwater mine disposal vehicle with a
    tiltable shaped charge, deployable from USVs; NSPA ordered several hundred for the
    Belgian and Dutch navies under an ~€60m contract in August 2024 → `domain` and `origin`
    upgraded. **`control = tethered` is NOT upgraded**: no reviewed source confirms a wire
    or fibre link, only remote operation.
- **DriX and DriX O-16's notes are corrected** for the quoting defect above.

Same discipline on Dire WOLF: 4 of its 5 seed rows are upgraded;
`control = semi-autonomous-human-on-the-loop` is **not**, because no source states the
control mode. **Nine rows upgraded, three left as seeds, each named.**

## 5. Noted, not proposed: two records flagged the other way

Two live products are categorised **Other** yet carry an **aerial** domain row — the
reverse of this batch's error, and both are domain-row problems rather than category ones:

| Record | ID | The issue |
|---|---|---|
| **Cassio S** (Voltaero) | `6fb1094b` | VoltAero's Cassio is a **piloted** hybrid-electric light aircraft (330/480/600, one pilot plus passengers). The `aerial-uav-uas` row asserts an *uncrewed* aerial system. `Other` is defensible; the domain row is not. Also: "Cassio S" matches none of VoltAero's published designations |
| **DA 15-N.ISS** (Volz Servos) | `c0fca03f` | A brushless **servo actuator** — a component, flying on Textron's Aerosonde Mk4.7 since 2010. The `aerial-uav-uas` row asserts the product *is* an aerial system rather than a part fitted to one |

Neither is in the SQL. They need a decision about whether a domain row describes what a
product **is** or what it **flies on**, which is a taxonomy-semantics question affecting
more than two records.

## 6. URLs — every move checked in both directions

All six moves keep their slug and change section only, `/uav/<slug>/` → `/other/<slug>/`,
which is what `slug_redirects.from_section` exists to express.

| Slug | Free in `/other/` | Namesake left in `/uav/` | Existing redirect |
|---|---|---|---|
| dire-wolf, ghost-shark, luna-2, mmcm, rmcm, xluuv | **6 of 6 free** | **0 of 6** | **0 of 6** |

Six `slug_redirects` rows preserve the old URLs. Exail A27 is not moving, so `/uav/exail-a27/`
is unchanged.

## 7. Validation — three dry runs, and a proven rollback

Every transaction was run `begin … rollback` against the live database and returned exactly
the predicted values. **Nothing was applied**, and the database was confirmed unchanged
afterwards: UAV 1,416 · Other 410 · taxonomy 11,133 rows · redirects 95 · flagged 31.

| | TX A | TX B | TX T |
|---|---|---|---|
| Products moved to Other | 3 | 3 | 0 |
| Still UAV in the group | 0 | 0 | — |
| Redirects created | 3 | 3 | 0 |
| Open flags left on the group | 0 | 0 | — |
| Taxonomy rows upgraded | 4 | — | 5 |
| Rows deliberately left as seeds | 1 | 4 (XLUUV) | 2 |
| rMCM taxonomy rows after | — | **0** | — |
| Live UAV / Other after | 1413 / 413 | 1413 / 413 | 1416 / 410 (unmoved) |
| Live products total | 3522 | 3522 | 3522 |

TX T alone leaves **5** flagged rows — Ghost Shark, LUNA-2, MMCM, rMCM, XLUUV, named by the
dry run itself. A and B clear those five.

**The rollback was proven, not asserted.** All three transactions were applied forward and
then reversed inside one transaction, and the result compared row by row against a snapshot
taken before:

```
taxonomy rows differing from before        0
taxonomy rows missing vs before            0
taxonomy row count now / before            11133 / 11133
product categories differing               0
redirects differing                        0
redirect count now / before                95 / 95
```

That includes the two hardest reversals: the **regexp inverse** that restores the six
stripped-and-re-appended notes, and the **delete-and-re-insert** of rMCM's domain row with
its original `option_id`, `source`, `confidence` and note.

**One limit stands.** `products` carries a `BEFORE UPDATE set_updated_at` trigger, so a
reversal cannot restore the original `updated_at` on the six moved rows. `product_taxonomy`
has no surrogate key and no timestamp at all, so its statements are keyed on
`(product_id, option_id)` and guarded by expected current values instead.

## 8. Decisions for Nazar

1. **Apply TX A?** Three records whose identity is settled and sourced: Dire WOLF, Ghost
   Shark, LUNA-2. Dry-run clean, rollback proven.
2. **Apply TX B?** MMCM, rMCM and XLUUV — a programme, a programme and a class term. The
   category is certainly wrong today; the records themselves may deserve retirement rather
   than recategorisation. Moving them is reversible; retiring them is your call.
3. **Apply TX T?** Note hygiene only — no category, slug, redirect or publication change.
   It is what makes the flag count mean something again.
4. **Exail A27** — recommend unpublication. Nothing names this product anywhere.
5. **LUNA-2 and satellites** — does a LoRa IoT nanosatellite belong in this catalogue? Same
   question as Dot, the sidewalk delivery robot, from batch 1.
6. **Ghost Shark's maker** — reattribute from Albacore to Anduril? Held here as an
   ownership change.
7. **The WOLF cluster is not a duplicate problem.** Batch 1 flagged "the Hunter WOLF /
   WOLF-X / Dire WOLF cluster" for possible deduplication. The sources say these are
   **three distinct vehicles** from the same maker: Hunter WOLF in service with the 10th
   Mountain Division, the Marine Corps, Australia and Ukraine; WOLF-X the combat vehicle;
   Dire WOLF the logistics derivative. No deduplication is needed — that worry can be closed.
8. **Company link-ups available**, not done here: Dire WOLF has no company, and its maker
   **BLADE (formerly HDT Global)** is already live in the catalogue as `hdt-global`. A
   warning for whoever does it: a name match on "BLADE" will find
   **`Blade (Horizon Hobby)`**, an unrelated radio-control hobby brand.
