# European UAV & Counter-UAS Landscape — Dataset V1

Built from [the verification and correction pass](EUROPEAN_UAV_VERIFICATION_CORRECTION_REPORT.md).
No new external research was performed.

---

## Snapshot

| | |
|---|---|
| Snapshot slug | **`europe-uav-cuas-2026-v1`** |
| Snapshot ID | `5ed19c7f-b035-4642-ad73-494f5513dfc3` |
| Taken / published | **2026-10-23 23:26:04 UTC** |
| Total verified companies | **273** |
| Scope | 32 countries, from `countries.is_landscape_scope` |
| Working edition it was cut from | `europe-uav-cuas-2026` (left in place, still mutable) |

### Where it lives

The architecture doc already specified this schema (`CUAS_LANDSCAPE_IMPLEMENTATION.md` §8.3),
so V1 implements that design rather than inventing a new one:

- **`landscape_snapshots`** — slug, title, `scope` jsonb, `taken_at`, `published_at`, notes.
- **`landscape_entries`** — one frozen row per company: company ID, name, country, category
  slugs **and** category UUIDs, website, the union of company and sector-assignment source
  URLs, publication status and confidence as they stood, maturity, evidence count and
  product count.

`landscape_entries` is denormalised on purpose. A snapshot is a publication: what it says must
not change when a company is re-categorised next month. The copied name, country and
categories are the point, not redundancy.

**Immutability is enforced, not asserted.** Triggers block `UPDATE` and `DELETE` on
`landscape_entries`, and block any change to a snapshot's slug, scope or `taken_at`. This was
tested: an attempted tamper-update and an attempted delete were both rejected and all 273
entries survived unchanged. Corrections become a new snapshot — which is the whole point.

### Why 273 and not 274

The previous report projected 274. Recalculating from the database gives **273**. Three
separate changes, which happen to net out to −1:

1. **Scope: 946 → 944 (−2).** The previous pass used a hand-written 34-country list that also
   carried Serbia and Iceland. The authoritative list is `countries.is_landscape_scope`, which
   holds exactly the 32 countries in the brief. Tern Systems (Iceland) and Jugoimport SDPR
   (Serbia) left the European working set. **Neither was classified, so neither was in V1** —
   this moved the universe, not the dataset.
2. **OSIRIS AI removed from V1 (−1).** See §4.
3. Nothing else moved. The four companies moved to draft stayed in V1, because publication
   status is not an inclusion criterion.

Full accounting: **944 = 273 verified + 81 unresolved classified + 589 unclassified + 1 excluded.**

---

## Composition

| | Count |
|---|---|
| **Total verified** | **273** |
| UAV only | 97 |
| Counter-UAS only | 166 |
| UAV + Counter-UAS | 10 |

UAV taxonomy depth, for the 107 companies carrying any UAV-side tag:

| | Count |
|---|---|
| Platform companies (fixed-wing, multirotor, VTOL, loitering munition, heavy-lift) | 4 |
| Mission-related (`uav-*` leaves) | 0 |
| Ecosystem suppliers (`eco-*` leaves) | 17 |
| **Bare `uav` root only** | **86** |

**86 of 107 UAV-side companies carry nothing more specific than the root tag**, and the mission
layer is entirely empty. This is a real weakness and it is stated rather than papered over: the
expansion pass could only map a Landscape-layer string to a leaf where the string named a role,
and most did not. These companies are correctly in V1 — their identity, country and UAV
relevance are all evidenced — they are simply coarsely classified. Deepening the UAV taxonomy
is the obvious enrichment target after V1, and per the brief it does not block the snapshot.

By publication status: **206 live, 67 draft.** Verification and publication are separate
concepts, exactly as specified — a quarter of Dataset V1 is not public.

---

## Geography

All 32 scope countries, zero-counts included.

| Country | n | | Country | n |
|---|---|---|---|---|
| Ukraine | 46 | | Turkey | 5 |
| United Kingdom | 41 | | Austria | 4 |
| France | 31 | | Belgium | 4 |
| Poland | 26 | | Finland | 3 |
| Germany | 23 | | Lithuania | 2 |
| Italy | 11 | | Bulgaria | 1 |
| Norway | 10 | | Greece | 1 |
| Czech Republic | 9 | | Hungary | 1 |
| Estonia | 9 | | Slovenia | 1 |
| Netherlands | 8 | | Croatia | 0 |
| Denmark | 7 | | Cyprus | 0 |
| Latvia | 6 | | Ireland | 0 |
| Romania | 6 | | Luxembourg | 0 |
| Spain | 6 | | Malta | 0 |
| Sweden | 6 | | Portugal | 0 |
| Switzerland | 6 | | Slovakia | 0 |

Five countries carry 63% of the dataset. Seven have nothing at all — a coverage gap, not
necessarily an absence of companies.

---

## C-UAS capability distribution

All 13 leaves. A company can appear in several.

| Group | Capability | Companies |
|---|---|---|
| **DETECTION** | RF Detection | 27 |
| | Radar | 31 |
| | EO/IR | 22 |
| | Acoustic Detection | 17 |
| **TRACK / IDENTIFY** | Sensor Fusion | 13 |
| | AI / Computer Vision | 15 |
| | Command & Control | 26 |
| **DEFEAT** | RF Jamming | 25 |
| | GNSS Jamming / Spoofing | **3** |
| | Interceptor UAV | 30 |
| | Kinetic | 22 |
| | Directed Energy | 10 |
| **INTEGRATED** | Integrated / Multi-Layer C-UAS | 53 |

GNSS jamming/spoofing at 3 is conspicuously thin next to RF jamming at 25. That is far more
likely an under-tagging artefact than a real market shape, and it is worth a targeted check.

---

## Publication changes

| Company | Country | Decision | Applied |
|---|---|---|---|
| ALX Systems | Belgium | → **draft** | yes |
| Delian Alliance Industries | Greece | → **draft** | yes |
| Qognifly | Romania | → **draft** | yes |
| Sensrad | Sweden | → **draft** | yes |
| OVES Enterprise | Romania | unchanged (live) | — |
| EGIDE | France | unchanged (live) | — |
| OSIRIS AI | Ukraine | unchanged (live), flagged | — |

Only `publication_status` changed on the four. Verified afterwards: aliases, source URLs,
sector assignments, products, provenance and landscape rows are all intact, and `updated_at`
on OVES Enterprise, EGIDE and OSIRIS AI is untouched since 2026-10-22.

**OSIRIS AI** is flagged `NEEDS_PUBLICATION_REVIEW` in its landscape screening note and its
publication status was deliberately not touched. It is **held out of Dataset V1** — not as a
publication decision, but because inclusion criterion 3 requires a sufficiently established
company identity, and the evidence establishes the OSIRIS UEB-1 *product* without sourcing the
company-to-product link. The consequence is worth naming plainly: **OSIRIS AI is live on the
site but excluded from the verified dataset.** Resolving the entity link settles both at once.

---

## Excluded from V1

| Reason | Count |
|---|---|
| Classified but directory evidence only | 76 |
| Identity review | 5 |
| European, no UAV/C-UAS classification | 589 |
| Explicit scope exclusion (maritime) | 1 |

Nothing was deleted. Every one of these remains in the database and in the
`europe-uav-cuas-2026` working edition as research backlog.

The single scope exclusion is **Hard Cat** — river and maritime unmanned surface vessels, not
aerial. It stays in UAV360, which covers unmanned systems more broadly than this Landscape.

---

## Research backlog

### Unclassified queue — `data/research/europe-uav-unclassified-2026.csv`

**589 companies**, 15 columns, 589 unique IDs.

| Priority | Count | Share |
|---|---|---|
| HIGH | **430** | 73% |
| MEDIUM | 59 | 10% |
| LOW | 100 | 17% |

Priority comes only from existing database signals — company description, overview, product
names and summaries, existing sector tags, and linked article titles and summaries — matched
with word-boundary patterns. Nothing was classified on the basis of these keywords.

**A caveat on HIGH.** At 430 of 589 it is a weak discriminator, and that is expected: UAV360 is
a drone catalogue, so most company text mentions drones somewhere. HIGH here means "worth
looking at", not "certainly a UAV company". The sharper signal in this file is the **100 LOW**
rows, which are genuinely more likely to be out of scope.

### Unresolved classified queue — `data/research/europe-uav-unresolved-2026.csv`

**81 companies**, kept deliberately separate from the 589 because the work is different: these
already have a classification and need their *identity* established, not their relevance.

| Status | Count |
|---|---|
| Directory evidence only | 76 |
| Identity review | 5 |

The previous report counted 80. It is 81 because OSIRIS AI moved into identity review during
this pass. Each row carries its current classification, current evidence, confidence, status,
why it is unresolved, and a specific recommended research action.

---

## QA

Every check run against the frozen snapshot after all mutations.

| Check | Result |
|---|---|
| Duplicate company IDs in V1 | **0** |
| Duplicate snapshot membership rows | **0** |
| Excluded company in V1 | **0** |
| Directory-only unresolved company in V1 | **0** |
| Identity-review company in V1 | **0** |
| Non-European company in V1 | **0** |
| V1 entry with no UAV/C-UAS category | **0** |
| Hard Cat in V1 | **0** — excluded |
| Project Eagle as an independent European company | **0** — merged into Perennial Autonomy |
| MEROPS as an independent European company | **0** — merged; product owned by Perennial Autonomy |
| ETER as an independent company | **0** — now a product of Falcons |
| MaXon as a separate company | **0** — represented by MaXon Systems |
| MaXon Systems in V1 with interceptor capability | **1** ✓ |
| Falcons in V1 with RF detection | **1** ✓ |
| C-UAS assignments preserved | **475** before, **475** after |
| Companies made live by snapshot creation | **0** |
| Publication changes | **exactly 4**, the approved companies |
| Historical edition `europe-cuas-2026` intact | **807 rows**, untouched |
| Snapshot immutability | **enforced** — tamper-update and delete both rejected, 273 entries intact |

---

EUROPEAN UAV & COUNTER-UAS DATASET V1: FROZEN

NEXT RESEARCH TARGET: 589 UNCLASSIFIED EUROPEAN COMPANIES
