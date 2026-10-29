# Draft product corrections — source-backed package

**Date:** 2026-10-29
**Scope:** the 36 draft products belonging to the 162 newly published landscape companies.
**Status:** read-only. No database record was changed, no product was published.
**Manifest:** `research-agent/reports/2026-10-29-draft-product-corrections.csv`
**Supersedes:** `research-agent/reports/2026-10-29-draft-product-review.md` (same 36 IDs, verified identical).

---

## What this pass did differently

The earlier review checked that evidence URLs returned HTTP 200. This pass read the pages.
Reading them changed the answer on nine rows, including all three holds and two of the ten
previously marked ready to publish.

| | Earlier review | After reading the sources |
|---|---|---|
| Ready to publish | 10 | — |
| Needs correction | 23 | 27 require a change |
| Hold | 3 | **0** |
| Publishable after the package is applied | 33 | **36** |

Nine rows need no correction to be publishable; enrichment is offered for them and marked
`optional` in the manifest. Twenty-seven need a change first, marked `required`.

---

## The three holds all fall

None of the three was a missing product. Two were wrong URL guesses and one was an
unrecorded source.

**RP-24 (HADES Defense Systems).** Held because `hadesdefense.eu/system/rp-24/` returns 404.
The page exists at `/system/rp-mlrs-24/` (HTTP 200), linked from the ML-HADS page, with a full
specification table: 57 mm modified S-5 rocket, air-burst fragmentation warhead on a
time-programmable fuse, 3,000 m effective range, ~20 m lethal radius, 24+ rockets per pod,
150–300 kg unloaded. The ML-HADS page independently names RP-24 as its hard-kill layer.

**C4PER (JISR Institute).** Held because `/solutions/c4per` returns 404. The page is nested one
level deeper, at `/solutions/andromeda/c4per` (HTTP 200), and describes the product in full:
sensor and effector management, data fusion, automated effector control, geo-fencing, and
support for SAPIENT, Link-16, Asterix and JREAP-C.

**Shield X SkyBlock (Shield Systems).** Held because the record had an empty `source_urls`
array — no source at all. The manufacturer's site is live and SkyBlock is its featured product,
with bands (300–1020 MHz in seven sub-bands, 2100–2400, 2400–2700, 5725–5850 MHz),
250 m suppression, under 5 minutes to deploy, a 25.6 V 4,500 Wh LiFePO4 battery good for at
least 60 minutes, 1100 × 760 × 230 mm and 20 kg. The evidence was never absent, only unrecorded.

---

## Two rows previously marked ready are not

Both passed the earlier review because their summaries read plausibly. Reading the cited pages
shows the text is not in them.

**Spectre (Robotto).** The cited source is a NATO DIANA announcement that names Spectre once and
describes nothing about it. The summary on file — "Vision-based, GPS-free, EW-resilient onboard
autonomy module" — is not supported by it. Robotto's own defence page does describe Spectre and
lists its features, so the fix is a source repoint plus a summary drawn from that page.

**Spectre-1 (Spectre Solutions).** The summary claims "surveillance, threat detection and light
cargo". The official Polish directory states only the VTOL configuration, the 25 kg MTOW and the
hybrid and all-electric versions. The 150 km figure on that page is for the company's
medium-range drones generally, not this aircraft, and a Warsaw University of Technology sheet on
the same airframe (PW Chimera) cites payloads up to 3 kg. The proposed text drops everything the
source does not carry.

---

## The descriptions of two Twist Robotics products are swapped

The clearest defect found. The manufacturer's own solutions list makes **OBRIY** the UAV mission
simulator and **STEZHKA** the video and data transmission module. The catalogue has each one
carrying the other's description:

| Product | Catalogue summary | What the manufacturer says it is |
|---|---|---|
| OBRIY | "UAV communications product." | Mission simulator — terrain, weather, comms constraints |
| STEZHKA | "UAV simulation product." | Transmission module — digitises analogue video, secure link >30 km |

This also settles the category doubt the earlier review raised. OBRIY and OSCAR are software and
stay there. **STEZHKA moves Software → Other**, because a radio transmission module is where the
catalogue files radios. It is the only category change in this package.

## And one proposed category change is withdrawn

**ArkeLink** was proposed to move Software → Other on the reasoning that a mesh datalink is a
radio. The evidence does not support it. Arke Telekom describes ArkeLink as a software-defined
radio mesh networking solution, and its product catalogue is waveforms and simulation software,
not radio hardware. The category stays Software.

---

## BOMBUS and WireDO: the source is dead

Both rows cite `https://beeta.tech/ua/home`. That domain has **no DNS A record** as of
2026-10-29 — Cloudflare nameservers are delegated but no address record is published, for the
apex or for `www`. Nobody can read the cited page. The company record's website field points at
the same dead domain, which is a company-level problem outside this scope and is flagged, not
changed.

The replacement is a German defence trade report carrying the manufacturer's own specification
block for both products, including NATO stock numbers (BOMBUS NSN 1550-61-018-3612, WireDO
NSN 5895-61-018-3591). That is the same class of independent trade source already accepted in
this catalogue for Falcons Eter (Janes), so both rows are recommended for publication rather
than held — with the caveat that the primary site is offline.

**Company-name mismatch, resolved.** The record reads **BeetechUA**; the summary said "BeeTA
Technologies". Neither string appears in any source found. The manufacturer trades as **BeeTA**,
in its own showcase material and in trade press. The proposed product summaries drop the company
name entirely. Renaming the company record from BeetechUA to BeeTA is a company-level change and
is proposed to Nazar separately, not made here.

## UKROPTER Drone: designation resolved

There is no product called "UKROPTER Drone". The manufacturer's page names **«КОМПЛЕКС
ukropter»** — the Ukropter complex — containing a bomber UAV (precision strike, up to 2 kg) and
a reconnaissance UAV (90× zoom), supplied with a ground control station, two navigation beacons,
two controllers, three 6S4P batteries and a transport case. The summary on file was right about
the two configurations; only the name was a placeholder built from the company name. Proposed
name: **Ukropter Complex**. The slug is unchanged, per rule 3 of CLAUDE.md.

---

## What the package changes

| Field | Rows affected |
|---|---|
| `summary` | 36 (27 required, 9 optional enrichment) |
| `source_urls` | 15 |
| `country` | 8 — all Ukrainian rows with a null country their company has |
| `name` | 2 — UKROPTER Drone → Ukropter Complex; Argonian DOME → Argonian Dome (casing) |
| `category` | 1 — STEZHKA Software → Other |
| `slug` | **0** — no slug is touched |
| `publication_status` | **0** — nothing published |

The eight null countries are BOMBUS, WireDO, LAURUS FPV, Shield X SkyBlock, OBRIY, OSCAR,
STEZHKA and UKROPTER Drone.

---

## Coverage gaps noticed while reading

Not acted on; recorded because the sources made them visible. These are products of already
published companies that the catalogue does not hold: HADES EAGLE and CONDOR radar families and
its passive RF sensor; BZB UAS BX4 and BX8; Twist Robotics DZHERELO, CYCLOP, SNODE and CBPH;
Ukropter BLACK CAT and RETRIX DRONE; Argonian Flux; Robotto Strike; and twelve further VirtuaLabs
radars. Adding any of them is a separate discovery decision.

## Smaller flags, not changed

- **Celebra LLC** trades as **Celebra Tech**; its own site blocks the standard fetcher but
  serves normally to a browser user-agent, which is why the earlier pass could not read it.
- **Fenix** is described by its maker as still in development; the proposed summary says so.
- **TUNDRA 2**'s UAF label claim is confirmed — but on the product page, not the home page that
  was cited. The claim was true and the citation was not.

---

## Totals

- 36 products reviewed against their actual source content.
- 27 require a correction before publication; 9 are publishable as they stand.
- 3 holds lifted; **0 remain on hold**.
- 2 rows previously marked ready found to be unsupported by their cited source.
- 1 swapped pair of product descriptions found.
- 1 proposed category change confirmed, 1 withdrawn.
- 1 dead source domain found.
- 0 database records changed. 0 products published.

Publishing any of these 36 remains an unmade decision for Nazar under rule 4 of CLAUDE.md.
