# European Counter-UAS Landscape 2026 — Coverage Gap Analysis

2026-10-22. Research and discovery only. **Nothing was imported, nothing was classified.**

Question: *which relevant European Counter-UAS companies are missing entirely from UAV360?*

Answer, in one line: **not many of the obvious ones, and the gaps are specific** — acoustic
detection, command-and-control, and the French supplier base.

---

## 1. Methodology

1. Nine independent discovery routes (§2), chosen so no single list could dominate the result.
2. Every company found was recorded whether or not it was already in UAV360 — otherwise the
   coverage percentage would only measure how well I picked sources.
3. Each was matched against UAV360 with the **Session 2 matching rules** (`lib/company-match.mjs`):
   normalised company name, aliases, website by registrable domain, and product names. The SQL
   used here mirrors that library.
4. Each was then bucketed A / B / C / D (§5).
5. Only companies with a **verified website and a credible C-UAS-specific source** were proposed
   for import.

**Inclusion rule, applied strictly:** a company is only counted if there is public evidence
connecting it *to counter-UAS*. Being a defence, drone, radar, RF or EW company was not enough.
In practice the evidence was a C-UAS-specific catalogue, a C-UAS product, or C-UAS trade coverage.

## 2. Sources searched

| # | Route | Source used | Discovered | New (C/D) |
|---|---|---|---|---|
| 1 | Market directory | Drone Intelligence, 46-vendor C-UAS list | 20 | **0** |
| 2 | Startup directory | FieldFaster, European C-UAS startups | 14 | 1 |
| 3 | **National association** | **GICAT Counter-UAS catalogue (France), 2026 PDF** | 15 | **8** |
| 4 | Exhibition coverage | Eurosatory 2026 trade press | 6 | 2 |
| 5 | Specialist research | Osinto acoustic drone detection report | 12 | 5 |
| 6 | Funding coverage | Tech.eu, Vestbee, Dealroom, AeroMorning | 5 | 0 |
| 7 | Technology search | interceptors, directed energy | 2 | 1 |
| 8 | Technology search | C2 / sensor fusion software | 5 | 2 |
| 9 | Country search | Poland | 3 | 1 |

Also attempted without usable results: DSEI and Enforce Tac exhibitor lists (no public list found),
and dedicated Czech / Greek / Turkish searches (nothing beyond what other routes already had).

## 3. Total discovered

**82 companies.**

## 4. Already known and tagged — A

**54 (66%).** Every European company on the main industry vendor list was already in UAV360 and
already carried a C-UAS tag. That route produced **zero** new names.

## 5. In UAV360 but not C-UAS tagged — B

**8.** These need no import, only classification. They are already in the Session 2 candidate set.

| Company | Country | Apparent capability |
|---|---|---|
| Aerix Systems | France | Interceptor UAV |
| Exosens | France | EO/IR *(held as "Photonis Netherlands (Exosens)")* |
| Harmattan AI | France | Interceptor UAV |
| Helsing | Germany | Sensor Fusion, AI / Computer Vision |
| John Cockerill Defense | Belgium | Kinetic *(held as "John Cockerill")* |
| Nuances Technologies | France | EO/IR |
| Polska Grupa Zbrojeniowa | Poland | Integrated |
| Vyriy | Ukraine | Interceptor UAV |

## 6. Missing entirely — C

**19.** Full table for review in §11.

## 7. Ambiguous — D

**1. Fly4Future (Czech Republic).** The algorithm called it missing, but UAV360 already holds
**EAGLE.ONE** as a *company*, and EAGLE.ONE is Fly4Future's net-capture interceptor product.
Importing Fly4Future would create a near-duplicate of a record that is itself a product
masquerading as a company. Needs a human decision: rename the existing record, or import the
parent and link them with `company_relationships`.

Worth noting the matcher could not have caught this — the names share nothing.

## 8. Coverage by country

| Country | Found | Known (A) | Untagged (B) | **Missing** |
|---|---|---|---|---|
| France | 19 | 8 | 4 | **7** |
| Germany | 11 | 8 | 1 | **2** |
| United Kingdom | 8 | 6 | 0 | **2** |
| Ukraine | 6 | 3 | 1 | **2** |
| Poland | 5 | 3 | 1 | **1** |
| Netherlands | 4 | 3 | 0 | **1** |
| Sweden | 4 | 4 | 0 | 0 |
| Estonia | 4 | 4 | 0 | 0 |
| Belgium | 3 | 2 | 1 | 0 |
| Spain | 2 | 1 | 0 | **1** |
| Denmark | 2 | 1 | 0 | **1** |
| Czech Republic | 2 | 1 | 0 | **1** (the ambiguous one) |
| Norway, Romania | 2 each | 2 | 0 | 0 |
| Finland, Italy, Turkey, Latvia, Greece | 1 each | 1 | 0 | 0 |
| Switzerland | 1 | 0 | 0 | **1** |
| *(country not stated)* | 1 | 0 | 0 | **1** |

## 9. Coverage by capability

| Capability | Found | Known (A) | Untagged (B) | **Missing** |
|---|---|---|---|---|
| Integrated / Multi-Layer | 18 | 13 | 1 | **4** |
| Interceptor UAV | 17 | 11 | 3 | **3** |
| **Acoustic Detection** | 13 | 8 | 0 | **5** |
| RF Detection | 10 | 9 | 0 | **1** |
| **Radar** | 7 | 7 | 0 | **0** |
| Kinetic | 7 | 4 | 1 | **2** |
| EO/IR | 7 | 4 | 2 | **1** |
| Sensor Fusion | 5 | 2 | 1 | **2** |
| **Command & Control** | 5 | 2 | 0 | **3** |
| Directed Energy | 4 | 3 | 0 | **1** |
| **RF Jamming** | 3 | 3 | 0 | **0** |
| AI / Computer Vision | 2 | 1 | 1 | **0** |

## 10. Gaps and biases — what the numbers actually support

**Radar and RF jamming are fully covered.** 7 of 7 and 3 of 3 found were already known. Those
are the categories the mainstream directories index well, and UAV360 has absorbed them.

**Acoustic detection is the weakest capability.** 5 of 13 missing — the worst ratio of any
category, and all five came from a single specialist report that no general directory carried.
Acoustic is a young, fragmented segment of small firms, which is exactly what market directories
under-report.

**Command & Control is thin.** 3 of 5 missing. The sample is small, so this is a signal rather
than a finding — but C2 and sensor fusion together are 4 missing out of 10, and software firms
appear far less in equipment catalogues than hardware firms do.

**France is the largest country gap: 7 missing of 19 found.** This is almost entirely an artefact
of method, and an instructive one — the French gap appeared only because France has a national
defence-industry association that publishes a counter-UAS catalogue, and I read it. **Germany,
Italy, Spain, Turkey and the UK have equivalent associations that were not searched.** The
honest reading is not "France is under-covered" but *"the one country whose association
directory we read produced eight new companies, so the others probably would too."*

**Directory quality varies enormously.** The 46-vendor market list produced **zero** new names.
The national association catalogue produced **eight**. Market directories track the well-known;
association directories track membership, which is where the small suppliers are.

**The seeded catalogue did its job.** 66% of everything discovered was already present and
already tagged, including every major prime and every well-known specialist.

### A source-reliability note

The acoustic report placed **Askalon Industries** in France. Its own website places it in
**Lausanne, Switzerland**. The research file carries the corrected country. Two other companies
from the same report, **Airspeed Electronics** and **Bionic System Solutions**, could not be
confirmed to exist at all by a follow-up search — they are recorded but **not proposed for
import**.

## 11. The missing companies — for manual review

| Company | Country | Apparent capability | Evidence | Website | Confidence |
|---|---|---|---|---|---|
| **Askalon Industries** | Switzerland | Acoustic Detection | own site + acoustic report | askalonindustries.com | **High** |
| **BeephoniX** | Netherlands | Acoustic Detection | own site + acoustic report | defense.beephonix.com | **High** |
| **ATDI** | France | RF Detection | GICAT C-UAS catalogue | atdi-group.com | **High** |
| **Bertin Technologies** | France | EO/IR | GICAT + acoustic sensor partnership | bertin-technologies.com | **High** |
| **Daher** | France | Integrated | GICAT C-UAS catalogue | daher.com | **High** |
| **DIXI Microtechniques** | France | Kinetic | GICAT C-UAS catalogue | diximicrotechniques.com | **High** |
| **Flying Eye** | France | Integrated | GICAT C-UAS catalogue | flyingeye.fr | **High** |
| **Kontron** | Germany | C2 | GICAT C-UAS catalogue | kontron.com | **High** |
| **SAS Impact** | France | Integrated | GICAT C-UAS catalogue | sas-impact.fr | **High** |
| **SBG Systems** | France | Sensor Fusion | GICAT C-UAS catalogue | sbg-systems.com | **High** |
| Airspeed Electronics | United Kingdom | Acoustic Detection | acoustic report only | — | Low — unconfirmed |
| Bionic System Solutions | Denmark | Acoustic Detection | acoustic report only | — | Low — unconfirmed |
| Fenek | Ukraine | Acoustic Detection | acoustic report only | — | Medium |
| Dark River | Ukraine | Interceptor UAV | interceptor list only | — | Medium |
| Arondite | United Kingdom | C2 | C-UAS briefing; product is general autonomy C2 | — | Medium |
| GDELS | Spain | Directed Energy, Integrated | Eurosatory, Pandur GBAD with HELMA-P | — | Medium — a JV, name needs resolving |
| RWS | Germany | Kinetic | Eurosatory, urban drone-defence ammunition | — | Medium — ambiguous name, Beretta group brand |
| Bumech | Poland | Interceptor UAV | partnership with Nordic Air Defence | — | Medium |
| Stendr | *not stated* | C2, Sensor Fusion | funding roundup | — | **Low — no country, fails import validation** |
| *Fly4Future* | Czech Republic | Interceptor UAV | §7 — ambiguous, already present as EAGLE.ONE | — | **Review** |

## 12. Proposed imports

`data/company-imports/europe-cuas-coverage-2026.json` — **10 companies**, the High-confidence rows
above. Each has a valid in-scope country, a website, and at least one credible C-UAS source URL.

**Not applied.** Run the dry run first:

```bash
node scripts/import-companies.mjs data/company-imports/europe-cuas-coverage-2026.json
```

`suggested_categories` is recorded in the file as a **discovery hint only**. Nothing was written
to `company_sectors`, and nothing should be until the classification pipeline runs with its own
evidence.

## 13. Known limitations

1. **One association directory, not six.** GICAT alone produced 8 of the 20 new names. BDSV
   (Germany), AIAD (Italy), TEDAE (Spain), SSI (Turkey) and ADS (UK) were not searched and are
   the single highest-value next step.
2. **No exhibitor lists were obtained.** DSEI, Enforce Tac, Xponential Europe and UMEX publish
   exhibitor directories; I found only trade-press coverage of Eurosatory, not a list.
3. **No procurement data.** TED, national MoD award notices and EDF/EDA participant lists were
   not searched. They would be strong evidence and would also feed maturity.
4. **Capability tags here are reading comprehension, not analysis.** They come from how a source
   described the company, not from its own materials.
5. **Three companies could not be confirmed to exist** by a second source (§10).
6. **Small samples per capability.** C2 at 5 found and Directed Energy at 4 are too few to
   support strong claims; they are flagged as signals, not findings.
7. **No Israeli companies** — out of scope by decision, not by omission. Several significant
   C-UAS vendors are therefore absent by design, and the published Landscape should say so.
8. **The 82 are not a market census.** They are what nine routes surfaced in one session.
