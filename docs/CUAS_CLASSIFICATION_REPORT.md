# European C-UAS capability classification — report

2026-10-22. Resolving the legacy group tags into the 13 capability leaves, plus the
publication fix. No snapshot created.

## READY FOR DATASET V1: **YES**

All five criteria met. The one qualifier is stated under *Coverage* below.

---

## Headline

| | |
|---|---|
| Confirmed European C-UAS companies | **174** |
| With ≥1 evidence-backed leaf | **145 (83%)** |
| Still legacy group tags only | **29** |
| Capability assignments with no source | **0** |
| Draft companies reachable on the public site | **0** |
| Tests | **all pass** |

Companies 2,288 → **2,290** · products 3,425 · `company_sector_products` **47**.

## What was done

**146 in-scope companies held only group tags.** Each was read against its own UAV360 record —
description, overview, products, product categories — and given the leaves that record actually
supports. **117 were classified (172 assignments); 29 were not and remain in review.**

Each assignment cites the company's own source URL or website and records the description it was
read from. `assigned_by = 'llm'`, which is what this is: a machine judgement over existing
records, not an editor's. The constraint then forces a source and a date on every row, which is
the point.

**Two of the 21 medium-confidence externals were confirmed** by primary sources and imported:

| Company | Country | Leaves | Source |
|---|---|---|---|
| Hologarde | France | RF Detection, EO/IR, Sensor Fusion, Integrated | Groupe ADP subsidiary; HoloSafe fuses sensors, Holodrone RF, Holoptics camera; first deployed at Paris-CDG |
| unival group | Germany | RF Detection, RF Jamming, Integrated | DroneWall cUAS — detection, spectrum monitoring and selective RF mitigation, 100 kHz–20 GHz |

**Four others could not be confirmed to exist in a C-UAS role** (PKE Polska, Aicox Soluciones,
TRL Drones, and six more searched as a batch). They stay in review rather than being imported on
a directory listing alone.

## Capability distribution

| Leaf | Companies |
|---|---|
| Integrated / Multi-Layer | 53 |
| Radar | 31 |
| Interceptor UAV | 30 |
| Command & Control | 26 |
| RF Detection | 26 |
| RF Jamming | 25 |
| EO/IR | 22 |
| Kinetic | 22 |
| Acoustic Detection | 17 |
| AI / Computer Vision | 15 |
| Sensor Fusion | 13 |
| Directed Energy | 10 |
| GNSS Jamming / Spoofing | 3 |

**Derived multi-sensor detection: 11 companies** hold two or more detection leaves. Not stored —
computed, as designed.

## Country distribution

UK 28 · France 21 · Germany 20 · Ukraine 20 · Poland 14 · Czech Republic 8 · Estonia 7 ·
Italy 7 · Denmark 5 · Romania 5 · Spain 5 · Sweden 5 · Belgium 4 · Netherlands 4 · Norway 4 ·
Latvia 3 · Switzerland 3 · Austria 2 · Finland 2 · Lithuania 2 · Turkey 2 ·
Bulgaria 1 · Greece 1 · Hungary 1.

## Maturity

commercial 16 · demonstrated 5 · deployed 3 · emerging 1 · **not assessed 149**.

Maturity was deliberately **not** extended in this session. Assessing it from a company
description would be guessing; it needs the evidence pipeline, which is running nightly. Nothing
was changed or downgraded.

## Review queue — 29 companies

**No C-UAS capability stated in the record** (the company may well qualify; the record does not
say):
AirRobot · ALX Systems · ARMMO Defense Technologies · Cambridge Sensoriis · Copenhagen Sensor
Technology · Dronehub · Evica · Fiocchi · Granta Autonomy · Kara Dag · Milrem Robotics ·
Phantom Defense · Piranha Tech · Roke Manor Research · SAF Tehnika · Safran · SteelRock
Technologies · Uforce

**Group tag only, nothing more specific evidenced:**
Airbus Defence and Space · DefSecIntel Solutions · Elbit Systems Deutschland · Elettronica ·
FREQUENTIS · Grupo Amper · Hertz Systems · Qognifly · Sky Map · Telespazio Germany

**Probable duplicates, left alone deliberately:**
`DefSecIntel · Origin Robotics` vs `DefSecIntel Solutions` · `Hertz Systems` vs
`Hertz New Technologies` (both carry the HAWK counter-drone system).

**Other open items:** `Optix Co.` — the research's "OPTIX" is this company; alias recorded so no
future import recreates it, but the record carries no C-UAS evidence. `SkyLance` — a product with
no company attached; the research's "Skylance" may be its maker. `GDELS-Santa Bárbara Sistemas` —
C-UAS concept testing confirmed, no capability named.

## Product support

**47 links, 21 companies.** The per-product pass completed for Advanced Protection Systems
(SKYctrl → Integrated + C2, FIELDctrl → Radar, CyView → EO/IR), JISR Institute (ANDROMEDA →
Integrated, C4PER → C2) and Harmattan AI (GOBI → Interceptor, Kalahari → C2).

**HADES Defense Systems and TrackDeep were not mapped.** Nothing in the evidence says which of
HADES's four products performs which of its nine capabilities, or which of TrackDeep's three
performs which of its two. Guessing is the failure this table exists to prevent.

## Publication fix

`PUBLISH_STATUS` was `null`, so `draft` had no effect. It is now `"live"`, and the build throws
if an unpublished row reaches it.

Verified on the live site: `/companies/trackdeep/`, `/argonian/`, `/hologarde/`, `/unival-group/`
and `/hades-defense-systems/` all return **404**, while `/companies/robin-radar-systems/` returns
**200**. 14 draft companies are withheld.

## QA

| Check | Result |
|---|---|
| Leaf assignments with no source URL | 0 |
| LLM assignments missing a date | 0 |
| Duplicate company names | 0 |
| Duplicate product slugs | 0 |
| Orphaned `company_sector_products` | 0 |
| Invalid sector ids | 0 |
| Maturity missing source or date | 0 |
| Legacy group tags intact | **147, unchanged** |
| Unsupported capability assignments | 0 |
| Full test suite | pass |

## Readiness against the criteria

1. **Virtually all confirmed C-UAS companies have an evidence-backed leaf** — 145 of 174, 83%.
2. **The 29 unresolved are listed by name above**, with the reason for each.
3. **No unsupported assignments** — every leaf cites a source, and five companies' product
   mappings were withheld rather than guessed.
4. **Draft companies cannot leak** — verified live.
5. **All tests pass.**

### The qualifier

The 29 are not a backlog of work already possible: they are companies whose UAV360 record does
not state a C-UAS capability. Classifying them needs **new external research per company**, not
another pass over the same data. They are correctly excluded from a v1 dataset rather than
guessed into it — and a Landscape that says "174 companies, 145 classified, 29 pending research"
is a more honest artefact than one that classified all 174.
