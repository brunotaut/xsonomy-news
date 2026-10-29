# Review of the 36 draft products belonging to the newly published companies

Date: 2026-10-29. Read-only. **No product was published and no database record was changed.**
Manifest: `research-agent/reports/2026-10-29-draft-product-review-manifest.csv` (36 rows, one per product).

**10 ready to publish · 23 need correction · 3 hold.**

## Count rechecked

The database confirms the figure carried in STATE. Of the 162 companies published on 2026-10-29,
**26 own products — 37 rows, of which 36 are `draft` and 1 is already live.** The 36 drafts belong
to **25 companies** (the 26th owns the single live row). Every product ID in the manifest was read
from the live database today, not copied from an earlier report.

## Ownership: nothing is misfiled

**All 36 products sit under the correct company.** This is worth stating plainly, because the
company-level review a few hours earlier found five products filed under the wrong owner. That
class of error does not appear here.

Three names collide with something else in the catalogue, and all three are genuine distinct
products, not conflicts:

| Name | This cohort | Also in the catalogue | Verdict |
|---|---|---|---|
| ANDROMEDA | JISR Institute (CZ), C-UAS suite | High Lander (US), airspace-security software, live | Different companies, distinct slugs |
| Komodo | Bionic System Solutions (DK), C-UAS | DOK-ING (HR), ground machine, live | Different companies, distinct slugs |
| HAWK | HADES Defense Systems (BG), C-UAS | **an ownerless HAWK**, Effector, live | Not a conflict, but the live HAWK has no company at all |

That ownerless HAWK is one of the 966 products with no company already flagged as a catalogue-wide
defect. It is not part of this cohort and was not touched.

## The dominant defect: company text pasted onto individual products

**Nine of the 36 products carry a summary that describes the company's portfolio, not the product**,
and in each case the identical string is repeated across every product that company owns:

- **HADES Defense Systems** — all four products (HAWK, ML-HADS, RP-24, SKADS) share
  *"Explicit multi-layer soft/hard-kill C-UAS portfolio."*
- **TrackDeep** — all three (CityDOME, FoxHUNTER, Observer) share
  *"Autonomous C-UAS detection/tracking; FoxHUNTER deliveries planned 2027."* — which **names one
  product and is attached to the other two.**
- **JISR Institute** — both (ANDROMEDA, C4PER) share
  *"Explicit modular multi-layer C-UAS suite; NSPA framework holder."*

Six of those nine also cite **a source page for a different product**: all four HADES rows point at
`/system/ml-hads/`, and both JISR rows point at `/solutions/andromeda`.

I checked whether the missing per-product pages exist. Most do:

| Page | Status |
|---|---|
| `hadesdefense.eu/system/hawk/` | **200** — use this for HAWK |
| `hadesdefense.eu/system/skads/` | **200** — use this for SKADS |
| `hadesdefense.eu/system/ml-hads/` | 200 — already correct |
| `hadesdefense.eu/system/rp-24/` | **404** |
| `jisr-institute.org/solutions/andromeda` | 200 — already correct |
| `jisr-institute.org/solutions/c4per` | **404** |
| `trackdeep.ai/citydome`, `/foxhunter`, `/observer` | **200 each** |

So seven of the nine can be fixed by pointing at a page that already exists. **RP-24 and C4PER
cannot**, which is why they are held rather than corrected.

## A second pattern: reconciliation notes published as descriptions

Five summaries are verification notes that were written to justify admitting the company and then
left in the product's public-facing field. They would appear verbatim on the site:

- **KSEON-L** — "Manufacturer reports 2,500+ detectors sold."
- **Komodo** — "BSS-led consortium selected for NSPA C-UAS framework."
- **HILDR** — "HILDR pilot order from Swedish FMV; series development ongoing."
- **LANDAR-C** — "Company markets dedicated anti-drone radar products."
- **S.EN.T.IN.EL** — "Own RF detection system and C-UAS event/airshow services."

Each is true. None tells a reader what the product is.

A further eight are simply too thin to publish — between 19 and 31 characters, naming a category
rather than describing anything: GIEZ ("Loitering munition."), OSCAR, STEZHKA, OBRIY, VESPULA,
WireDO, ekoSKY, BOMBUS.

## The three holds

- **Shield X SkyBlock** (Shield Systems, Ukraine) — **the only product in the cohort with no source
  URL at all.** Empty `source_urls`, no confidence, no enrichment status, null country. Nothing
  about it can be verified from the record.
- **HADES RP-24** — shared portfolio summary, source points at another product, and no page of its
  own was found.
- **JISR C4PER** — same shape: shared summary, ANDROMEDA's page as its only source, no own page.

## Smaller findings

**Eight products have a null `country` while their company has one** — BOMBUS, WireDO, LAURUS FPV,
Shield X SkyBlock, OBRIY, OSCAR, STEZHKA, UKROPTER Drone. All eight are Ukrainian records from the
directory-import cohort. The generator only writes a country when the product carries one, so those
pages would show none.

**One category correction.** **ArkeLink** is filed as `Software` but is a frequency-hopping mesh
datalink — a radio. The live catalogue files radios under `Other` (AtlasRADIO, mesh repeaters).
`Software` → `Other`. Two more are doubtful rather than wrong: Twist Robotics' **OBRIY**
(communications) and **OSCAR** (navigation) are filed as `Software`, and their summaries are too
thin to justify it either way. **GIEZ** as `Effector` is consistent with how the catalogue already
files loitering munitions, so it needs no change.

**One likely placeholder name.** **"UKROPTER Drone"** reads as a name built from the company name
rather than a product designation.

**One entity-name mismatch.** BOMBUS's summary refers to "the BeeTA Technologies catalogue" while
the record is **BeetechUA**. Worth resolving before publishing either.

## Two things that look alarming and are not

**Every one of the 36 has an empty `description` column.** This does not matter: the generator
(`fetchProducts` and `reshape` in `generate-supabase.mjs`) never reads `description`. It publishes
`summary`. That is exactly why the summary problems above matter — those strings *are* the public
text.

**Every one has zero `specs` keys and no image.** So each product page would be a name, a one-line
summary, a category and a source link. That is thin but not wrong, and it is consistent with how
other recently added products look.

## Proposed corrections, grouped

1. **Write per-product summaries for the nine sharing company text** (HADES ×4, TrackDeep ×3,
   JISR ×2), and repoint the six whose source is another product's page. Seven of the nine have an
   existing page to cite; RP-24 and C4PER do not.
2. **Replace five reconciliation notes** with descriptions of the product.
3. **Expand eight stub summaries** that currently name a category.
4. **Backfill `country` on eight Ukrainian product rows** from their companies.
5. **Recategorise ArkeLink** `Software` → `Other`; revisit OBRIY and OSCAR once their summaries say
   what they are.
6. **Resolve the BeetechUA / BeeTA Technologies name** and the "UKROPTER Drone" placeholder.
7. **Leave the three holds unpublished** until product-specific evidence exists.

None of this has been applied. All seven items are proposals.

## Scope

Read-only throughout. No `publication_status` changed, no product created, edited or deleted, no
research or candidate status touched, no company record altered. V1 remains 273 and V2 remains 358.
The only external requests were HTTP status checks against manufacturer URLs already on file, to
establish whether the missing per-product pages exist.
