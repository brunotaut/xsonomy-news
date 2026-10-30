# 19 entity-extraction errors removed from the catalogue

**Date:** 2026-10-30 · **Asked for by:** Nazar · **Logged under:** rule 4 of CLAUDE.md
**Manifest:** `research-agent/reports/2026-10-30-entity-error-removal-manifest.csv`
**Rollback:** `research-agent/reports/2026-10-30-entity-error-removal-rollback.sql`

---

## There was no list of 21

"Roughly 21 entity-extraction errors" has been carried in STATE and three reports since Batch 15.
It was always an estimate; no enumerated list existed. The first job was to build one.

Reconstructing it from the reconciliation history of all seventeen batches gave **23 candidates**
excluded with a reason naming an entity type. Reading them, **four are not extraction errors at
all** — they are real companies excluded on merits, and a company catalogue should keep them:

| Kept | Why it is not an extraction error |
|---|---|
| ams OSRAM | A real semiconductor maker. Excluded because its sensors are general-purpose. |
| Aston Harald Composite | A real Swedish composites company. Excluded on supplier scope. |
| JFG Composites | A real Polish composites company. Excluded for no UAV-specific product. |
| Klaveness | A real Norwegian shipping group. Excluded because an article association is not evidence. |

That leaves **19**. The estimate was close but not exact, and it was never the same thing as a list.

## What was removed

All 19 were `live` in the public catalogue and `excluded` from the landscape.

| Entity kind | Records |
|---|---|
| Publication | Unmanned Airspace, Oboronka, Calibre Defence |
| University | Rzeszów University of Technology, University of Porto |
| Research institute | TUBITAK UZAY, Laser Zentrum Hannover |
| Composite slash-name label | OHB Italia / Leonardo, TUBITAK UZAY / ASELSAN, Thales Alenia Space Italia / e-GEOS |
| Procurement platform | DotChain |
| Industry cluster | Odense Robotics |
| Accelerator / fund | Defence Builder |
| Membership association | FPV UK |
| NGO | Aerorozvidka |
| Recruiter | Ex-Mil Recruitment |
| Acquisition vehicle | SMOT Acquisition |
| Voluntary project | Droneflykart |
| Product line | Bullspike |

## How, and why not deletion

**Unpublished, not deleted.** `publication_status` moved `live → draft`; `updated_at` followed.
No row was deleted and no other field was touched, so the research provenance survives and the
rollback is one statement. Deleting would also have orphaned the attached products, making the
966-ownerless-product defect worse rather than better.

**Seven artefact products went with their owners** — the GOKTURK-3, IMECE/GOKTURK, PRISMA and
COSMO-SkyMed satellite records, DOT-Chain Defence, Droneflykart and Bullspike. Unpublishing a
company while leaving its products live would have put seven more ownerless products on the public
site, which is the opposite of cleaning up.

The update was guarded: it only touched rows that were `live` **and** reconciled as `excluded`, so
it could not have caught a verified company, and a rerun matches nothing.

## Verified on the deployed site

Build `2026-10-30T00:31:41.383Z`.

| | before | after |
|---|---|---|
| companies live | 2,466 | **2,447** |
| products live | 3,528 | **3,521** |
| landscape companies | 567 | **567** |
| verified companies still published | 567 | **567** |
| the 36 products published yesterday | 36 | **36** |

- All **19 company pages return 404**, and all 19 are gone from `companies.json`.
- All **7 artefact products** are gone from the category data.
- The four kept companies still return 200.
- **The real entities behind the removed labels survive**: ASELSAN, Leonardo and Thales all still
  return 200, as does INLEAP Photonics, the verified spinout that owns Laser Zentrum Hannover's
  product. This was the main risk in removing composite labels and institutes, and it did not bite.

No redirects were created. A `slug_redirects` row sends a reader to a replacement page; there is no
correct replacement for a record that should never have existed, so 404 is the right answer. No
existing redirect pointed at any of the nineteen slugs.

---

## The pattern is much wider than nineteen

This is the finding worth acting on next, and it is a question rather than a task.

A sweep of the live catalogue, beyond the European landscape work that produced the nineteen:

- **22 live composite slash-name records.** Only three were caught, because only Europe was
  screened. Others include `Northrop Grumman / IAI`, `Shahed Aviation Industries / HESA`,
  `CASC / China Academy of Aerospace Aerodynamics`, `Chengdu Aircraft Industry Group (CAIG) / AVIC`
  and `MIT Lincoln Laboratory / U.S. DoD Strategic Capabilities Office`. **Not all are errors** —
  `Thales / Elbit Systems (U-TacS joint venture)` is a real legal entity, and
  `Brolis Semiconductors / Brolis Defence`, `IAI (Tamam / MALAT)` and `Spotter Global / SpotterRF`
  are single organisations written with a slash. Each needs reading, not a pattern match.
- **About 40 live universities and research institutes**, including Harvard, Duke, Yale School of
  Public Health, University of Tokyo, Peking University, Delft (MAVLab), DLR, TNO and
  Fraunhofer IDMT.

Removing Rzeszów, Porto, TUBITAK UZAY and Laser Zentrum Hannover while Harvard and DLR stay live
is inconsistent. The inconsistency is not new — it exists because only European records were
screened — but this removal makes it visible.

**The open question for Nazar:** does a university or a non-profit research institute belong in a
company catalogue at all? Answer that and the ~40 resolve as a rule rather than one at a time. The
composite labels need a separate read, record by record, because some are real.

Neither was done here. This removal was scoped to the nineteen that the research record had
already identified with evidence.
