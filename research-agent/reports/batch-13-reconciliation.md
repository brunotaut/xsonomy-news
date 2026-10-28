# Batch 13 reconciliation — European UAV & Counter-UAS Landscape

Reconciled 2026-10-28. Input: `research-agent/researched/batch-13-researched.csv` (40 rows,
enrichment only). Output: `research-agent/reconciled/batch-13-reconciliation.csv`.

**Verified 513 → 524.** Landscape rows 986 → 981 after five merges.

| | Batch 10 | Batch 11 | Batch 12 | Batch 13 |
|---|---:|---:|---:|---:|
| Admitted | 11 | 3 | 6 | **11** |
| Excluded | 14 | 21 | 23 | **19** |
| Held for review | 10 | 10 | 9 | **5** |
| Merged | 1 | 4 | 2 | **5** |

This was a different batch from the last three. The scoring queue reached a seam of large,
well-known companies with empty records — Ericsson, Deutsche Telekom, Eutelsat, Axis, Rotax,
ArianeGroup, Damen, Turkish Aerospace — and that forced a boundary question the landscape had not
had to answer in writing.

## The rule this batch needed

Most of the forty were not borderline on evidence. They were borderline on **what counts as a
supplier to this industry.** Seven of them are household-name companies whose products appear in
drones or counter-drone systems built by other people.

The rule applied, taken from what the landscape already does:

> **A named offering built for unmanned aircraft or counter-UAS counts. A general-purpose product
> that somebody else put into a drone does not.**

That is the line the verified component suppliers already sit on. Turkish Engine Industries builds
engines *for* UAVs. YellowScan builds LiDAR payloads *for* drones. Volz Servos builds UAV actuators.
Under the same test:

| Admitted | Excluded |
|---|---|
| **Ericsson** — Digital Airspace and Connected Drone Testing are drone-specific products | **Nordic Semiconductor** — a general wireless chip a third party put in a Remote ID device |
| **Deutsche Telekom** — the drone-protection shield is a sold, operating counter-drone service | **Axis Communications** — general network cameras used inside Dedrone installations |
| | **Rotax** — a light-aircraft engine used in UAVs, not built for them |
| | **Varjo** — general XR headsets; the counter-drone simulator on them is Australian |
| | **Eutelsat**, **OQ Technology** — general satellite connectivity, drone links demonstrated |

Admitting Nordic Semiconductor would eventually admit every chipmaker whose part reaches a drone.
The rule is written down now so the next batch does not re-litigate it.

Ericsson's ISAC network-sensing drone detection was deliberately **not** tagged as a detection
capability: it is demonstrated, not deployed.

## Five merges, three into companies that were already verified

| Duplicate | Merged into | State of the keeper |
|---|---|---|
| **Frankenberg Technologies** (United Kingdom) | **Frankenburg Technologies** (Estonia) | already verified, Mark I interceptor |
| **TUSAS** | **Turkish Aerospace (TAI)** | already verified, seven products |
| **Santa Bárbara Sistemas** | **GDELS-Santa Bárbara Sistemas** | already verified |
| **Qioptiq (Excelitas)** | **Teledyne Qioptiq** | stale owner name; Teledyne completed the purchase in February 2025 |
| **Eutelsat OneWeb** | **Eutelsat** | already excluded |

Frankenberg is the clearest case of the pattern that has now run for four batches: the same company
entered twice, once spelled wrong and filed under the wrong country, and the correct record was
verified all along.

## Two Baykar drones were filed under Turkish Aerospace

The TUSAS merge exposed an error on the keeper, which is a **verified, published** company.

Turkish Aerospace held product records for **Kızılelma** and **Akıncı**. Both are Baykar aircraft —
the Bayraktar Kızılelma and the Bayraktar Akıncı — and Baykar already had its own records for both.
Turkey's two rival drone makers had each other's aircraft on their catalogue pages. Both were
**reassigned to Baykar** and their sources folded into Baykar's existing records.

Turkish Aerospace keeps Anka, Anka-3, ANKA-S and Aksungur, which are genuinely its own.

**One thing worth a separate cleanup:** Baykar now holds fifteen product rows for roughly six
aircraft — `Akinci`, `Akıncı` and `Bayraktar Akinci`; four spellings of Kızılelma; `TB2` and
`Bayraktar TB2`. That duplication predates this batch and was not touched here.

## Admitted (11)

| Company | Country | Basis |
|---|---|---|
| **Roboneers** | Ukraine | WarDog UAV family, Bulldog multirotor |
| **GRIM Tech** | Ukraine | GRIM S FPV interceptor, fibre-optic GRIM 10 and GRIM 13 |
| **Vluchnyk** | Ukraine | Zorelit v4 interceptor marketed, v5 internally tested |
| **PREZIS** | Netherlands | Counter-UAS integrator |
| **OPTIX** | Bulgaria | Anti-Drone system: RF detection plus radio and GNSS disruption |
| **Transvaro** | Turkey | FEDAİ interceptor, DROKA detection and defence |
| **D-Flight** | Italy | The Italian national drone registration and U-space platform |
| **Droniq** | Germany | MyZone Detection and TraX, a DFS and Telekom joint venture |
| **Kitemill** | Norway | Kitewall tethered unmanned ISR platform |
| **Ericsson** | Sweden | Digital Airspace, Connected Drone Testing |
| **Deutsche Telekom** | Germany | Drone protection shield |

Eighteen products and seventeen taxonomy rows added, each with an evidence URL.

**GRIM Tech was admitted against a caution.** The research flagged that the legal entity might be a
charity rather than a company — the same signal that caught Aerorozvidka last batch. An independent
check found Defense News coverage of its jet-drone interceptor development and a trade-fair
exhibitor listing describing mass production. The concern was not borne out.

## Country: where the research had to be overridden

The Batch 13 queue asked researchers to confirm **the canonical parent headquarters**. That question
was answered correctly and was the wrong question — applying the answers literally would have moved
six European companies out of Europe:

| Company | Operating country | Parent country given | Applied |
|---|---|---|---|
| Teledyne Qioptiq | United Kingdom | United States | **United Kingdom** |
| PZL Mielec | Poland | United States (Lockheed Martin) | **Poland** |
| Santa Bárbara Sistemas | Spain | United States (General Dynamics) | **Spain** |
| Rotax | Austria | Canada (BRP) | **Austria** |
| Axis Communications | Sweden | Japan (Canon) | **Sweden** |
| Odin Defence | Estonia | United Kingdom (Thor Industries) | **Estonia** |

The landscape view only admits companies in a landscape-scope country, so the parent country is not
a neutral label — it decides membership. **The operating country is the right one**, with the parent
recorded in the description. Only one country was actually changed: Althimis, Germany → **United
States**, which is a genuine correction and the reason it was excluded.

The Batch 14 question has been rewritten to ask for the operating country and the parent separately,
rather than asking which is canonical.

## Other ownership calls

- **ArianeGroup** excluded: it sold its majority CILAS stake in 2022, and CILAS is already verified
  separately, so no counter-drone laser is attributable to it.
- **Boryszew** excluded again: an industrial investor; the product belongs to Hornet-Polskie Drony
  with ITWL.
- **SVOS** excluded: it makes the MARS 4x4 carrier; the air-defence system mounted on it is Saab's.
- **SNCF Réseau** excluded as an end user; the group's drone business is the separate Altametris.
- **Vertical Aerospace** excluded: the Valo is piloted and the defence variant is planned. Volocopter
  is verified because the VoloDrone is actually uncrewed — that is the difference.
- **EURENCO**: the research could not independently confirm the DEMON attribution. The existing
  product record does carry a French trade article specifically about EURENCO arming drones, so the
  attribution is better supported than the research pass concluded. Left as a candidate for the
  warhead decision regardless.

## Held for review (5)

GLEFA (entity unresolved), Dryad Networks (Silvaguard pilots stated for 2027), MP-SEC (the tethered
UAV shown with STRIX belongs to Elistair), QLM Technology (2021 flight trials, current availability
unresolved), Stemme (the Patroller is Safran's).

## QA gate

| Check | Result |
|---|---|
| `included` rows failing the eligibility rule | **0** |
| Publication status written by this batch | **none** |
| V1 frozen snapshot | **273** |
| V2 frozen snapshot | **358** |
| Redundant unevidenced parent sectors | **0** |
| Landscape rows | 986 → **981** (five merges) |

## The publication gap, now 229

**229 companies whose landscape status is `excluded` or `needs_review` are published on
xsonomy.com** — 143 after Batch 10, 174 after 11, 206 after 12, **229 now**.

Nothing has been changed. This remains Nazar's decision under rule 4 of `CLAUDE.md`.

## Where the backlog stands

Backlog **199** (was 238). Records with no description: **80**. Records with nothing at all: **9**.

Batch 13 was meant to clear all 19 blanks and cleared 10 — the five-per-country cap pushed the rest
out, because the blanks cluster in Ukraine. **Batch 14 exempts blanks from the country cap**, so all
nine remaining go in, plus 31 partial records across 12 countries.

After Batch 14, roughly **40 records with no description remain**, which is one more batch. The
enrichment phase of this loop ends there, and what follows has to be a different kind of work:
either verifying the 199-record backlog on its merits, or clearing the 229-record publication gap.

**Batch 14 is queued: `research-agent/queue/batch-14.csv`**, with two rewritten questions — operating
country and parent country as separate answers, and whether an offering is built *for* unmanned
aircraft or is a general-purpose product someone else put in one.
