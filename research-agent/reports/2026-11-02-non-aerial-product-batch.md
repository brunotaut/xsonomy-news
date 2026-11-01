# Non-aerial products still categorised UAV — review, PREPARED NOT APPLIED

**Date:** 2026-11-01 · **Status:** APPLIED — the 28 only · **Next actor:** ChatGPT

Prepared under an authorisation for preparation only, then **applied on Nazar's go-ahead
("1-yes") to decision 1 of §8**: the 28 ready corrections and the 3 taxonomy changes. The
8 held records are untouched, and decisions 2 to 4 of §8 remain open.

Applied after re-checking the guard for drift (28 of 28 still matched). Result: products
categorised UAV **1,444 → 1,416**, Other **382 → 410**, live products unchanged at 3,522,
redirect rows **65 → 93**, flagged notes **24 → 21**, Katana still UAV with its domain row
corrected to *Aerial (UAV/UAS)*, and all 8 held records still UAV.

Everything below was written before the apply and is left as the review that supported it.
The dry-run figures it reports are the pre-apply state.

Deliverables: [manifest](2026-11-02-non-aerial-product-manifest.csv) ·
[SQL](2026-11-02-non-aerial-product-batch.sql) ·
[rollback](2026-11-02-non-aerial-product-rollback.sql)

---

## 1. The candidate set is 36, not 19

The previous report named 19, and said to treat that as a starting point. It was built by
matching one **note phrasing** — `"filed under category UAV but is not an aerial system"`.
Defining the set from the taxonomy's own **`domain` facet** instead finds **36**:

| How the set is defined | Candidates |
|---|---:|
| The previous note phrasing | 19 |
| …plus records whose note reads *"filed under UAV — verify category"* | 25 |
| **Live, category UAV, every `domain` row non-aerial** | **36** |

The eleven the note filter missed carry a non-aerial domain row and **no such note at all**:
ARES, Dire WOLF, Dot, GULL, K3 Scout, K5 Kraken, K7 Sabre, Lionfish, Mako, SEASTRIKE,
Surveyor. The definition used here is the data, not a sentence someone typed.

**Verdict: 28 ready, 8 held.**

## 2. Katana — the flag itself was wrong

`7a1ed9b6` **Katana** (Avidrone Aerospace) carries `domain = Surface (USV)`. That is false.
Katana is a **single-main-rotor helicopter drone** that won DARPA's Lift Challenge at the
National Museum of the US Air Force in August 2026, carrying a 51 kg payload on a 13.3 kg
airframe for a 3.84:1 ratio.

Its own taxonomy says so and contradicts itself: `airframe = "Single-rotor / helicopter"`,
**web-sourced, high confidence**, sitting beside a `domain` row that is a
**knowledge-seeded, medium-confidence** guess.

That contradiction is detectable, so it was run against the whole catalogue: a product
carrying an **airframe** row — which only aerial vehicles have — while every `domain` row
says non-aerial. **Katana is the only such record in the live catalogue.** One false
positive out of 36, found twice independently, which is what makes the other 28 credible.

Katana stays UAV. Step 3 of the prepared SQL corrects its `domain` row to
*Aerial (UAV/UAS)* with the DARPA evidence, rather than leaving a known-false row in place.

## 3. Ready to apply — 28

Full evidence, per-product issues, current and proposed URLs and collision results are in
the manifest. Summary by basis:

| Evidence basis | Products |
|---|---|
| **Web-sourced, high-confidence** taxonomy row | FireAnt, Ghostfin, Kuryer, Max1 |
| **Primary research in this pass** | Ascento Guard *(Zurich two-wheeled ground patrol robot)*, Hunter WOLF *(BLADE six-wheeled UGV, 2,800 lb, US Army Last Tactical Mile)*, Lightfish *(Seasats 11 ft solar USV, Taiwan Strait transit)* |
| **Record's own summary + multiple sources** | Dot, K3 Scout, Lionfish, MAGURA V5, Saildrone Spectre, Saronic Corsair, Sea Baby, Surveyor, Sub Sea Baby |
| **Maker builds nothing else** (Saildrone, Kraken Technology Group, BlackSea, Uforce, ARMMO) | ARES, GULL, K5 Kraken, K7 Sabre, Mako, Saildrone Explorer, SEASTRIKE |
| **Established product family** | Gavia *(Teledyne AUV)*, Hugin *(Kongsberg AUV)*, REMUS 100, REMUS 130 |
| **Same platform either way** | WOLF-X |

### URLs

Each page moves from `/uav/<slug>/` to `/other/<slug>/`. Checked for all 28 before
preparing: **every slug is free in `/other/`**, and **no namesake is left behind in
`/uav/`**, so nothing inherits a vacated slug and none lands on a `-2` suffix. The old
URLs are preserved by 28 `slug_redirects` rows carrying `from_section='uav'` — the
mechanism added in the Exail pass, without which a same-slug stub is written on top of the
live page it points at.

## 4. Held — 8, with the reason

| Product | Why it is held |
|---|---|
| **Katana** `7a1ed9b6` | The flag is wrong; it is aerial. Keep UAV. See §2 |
| **Exail A27** `3515b298` | No source names this product anywhere. Its domain row is a bare LLM seed. Consistent with the 2026-11-01 decision; unpublishing is out of scope |
| **MMCM** `ccfd9d18` | A **programme**, appearing in French coverage as part of SLAM-F/MMCM — not a product |
| **rMCM** `5d6c6ab3` | The **Belgian-Dutch mine-countermeasures vessel programme** (Naval Group + Exail, six ships each, France joining under a design sub-licence) — not a product |
| **XLUUV** `9d80e014` | A **class term** for extra-large uncrewed undersea vehicles (e.g. Orca XLUUV) — not a product name |
| **LUNA-2** `8a28d7c5` | A **LoRa IoT nanosatellite** launched by SpaceX in March 2026 (ASELSAN, web/high). Not aerial, but not maritime or ground either: `Other` would be a placement decision, not a correction |
| **Ghost Shark** `0c420e85` | **Identity conflated.** Ghost Shark is *Anduril's* XL-AUV, under an A$1.7bn Australian contract. The record is attributed to **Albacore**, whose actual vehicle is **Ghostfin** — a separate record in this batch — and the source attached to this record is the Albacore/Ghostfin article. Both candidates are underwater, so the category is not the open question; the record's identity is. Deduplication and ownership changes are out of scope |
| **Dire WOLF** `d77e3215` | No company, no summary, one source, a bare knowledge seed, and a name in the same WOLF family as Hunter WOLF and WOLF-X. Resolve that cluster first |

Moving a programme name or a class term into `Other` would file a non-product as a
product, which is a worse error than leaving it mis-categorised.

## 5. The taxonomy review — narrower than expected

The eleven Exail products already moved to `Other` were reviewed for stale or incompatible
taxonomy fields. The answer is small and specific:

- **No specifications to preserve or strip.** None of the eleven carries any `specs` at
  all. The only Exail product with `UAV · *` spec fields is the **IT180 STH-U**, which is
  correctly a UAV and is untouched.
- **No incompatible taxonomy values.** Four of the eleven have taxonomy rows and all are
  domain-correct: A-18M and K-Ster → *Underwater (UUV/AUV)*, DriX and DriX O-16 →
  *Surface (USV)*. Seven carry no taxonomy at all.
- **Two stale notes.** DriX and DriX O-16 still carry the instruction *"…verify category"*
  on their `domain` rows. The category was corrected on 2026-11-01, so the note now
  describes a resolved problem and a reader cannot tell a settled record from an open one.
  Rewritten to state the conclusion, keeping the substantive evidence in the sentence.

**Proposed taxonomy changes in total: 3** — Katana's wrong domain row, and the two stale
notes. No value changed on any other record, and no specification touched anywhere.

Five already-`Other` products outside the Exail set carry the same stale instruction —
GhostFoiler, Pioneer, Sea Lancer, Sea Sabre, TEC800. They are **not** in this batch: they
were corrected by an earlier pass and tidying their notes is cosmetic. Listed here so the
next pass can sweep them.

## 6. Separate issues found, none acted on

| Issue | Products |
|---|---|
| **No company linked** | Gavia, Hugin, Hunter WOLF, Lightfish, MAGURA V5, REMUS 100, REMUS 130, Saronic Corsair, Sea Baby, Sub Sea Baby, WOLF-X, Dire WOLF. In several cases the maker is already in the catalogue — Kongsberg Discovery, HII, Seasats, Uforce — so these are link-ups, not new records |
| **Probable duplicate cluster** | Hunter WOLF / WOLF-X / Dire WOLF |
| **Identity conflation** | Ghost Shark vs Ghostfin (both Albacore) |
| **Weak naming** | `Ascento Guard Dori USA v1` (FCC-filing noise), `Surveyor` (should match its Saildrone siblings), `ARES` (collides conceptually with the unrelated *ARES Shield AI* company record) |
| **Questionable provenance** | Gavia and Hugin are both sourced to a Polish land-parade article that does not establish either product |
| **Scope** | `Dot` is a DoorDash sidewalk delivery robot; `LUNA-2` is a satellite |

## 7. Validation performed

| Check | Result |
|---|---|
| Candidate set re-derived from the live database | 36, from the `domain` facet rather than note text |
| Self-contradiction sweep (airframe row vs non-aerial domain) | 1 record — Katana — in the whole live catalogue |
| Slug free in `/other/` | **28 of 28** |
| Namesake left behind in `/uav/` | **0 of 28** |
| `from_section` column present | yes, added in the Exail pass |
| **Whole transaction executed and rolled back** | clean: corrected 28, Katana still UAV with domain *Aerial (UAV/UAS)*, 28 product redirects, 0 stale notes left, 8 held still UAV, UAV total would be 1,444 → 1,416 |
| Database after the dry run | **unchanged** — UAV 1,444, Other 382, redirects 65, Katana domain *Surface (USV)*, 24 flagged notes |

The dry run earned its keep: it caught a generated-SQL defect where a trailing comma sat
*inside* an `-- comment`, which silently truncated the `id in (…)` list and commented out
its closing bracket. `PREPARE` would not have shown that.

## 8. Decision needed from Nazar

1. **Apply the 28?** The SQL, rollback and manifest are ready and dry-run clean.
2. **LUNA-2 and Dot** — does a satellite and a food-delivery sidewalk robot belong in this
   catalogue at all? If not, the answer is removal, not recategorisation.
3. **MMCM, rMCM, XLUUV** — these are programmes and a class term. Retire them, convert
   them to something else, or leave them?
4. **The WOLF cluster and Ghost Shark/Ghostfin** — deduplication and ownership, both
   deliberately out of scope here.
