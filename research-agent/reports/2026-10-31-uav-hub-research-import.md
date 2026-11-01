# European UAV & Counter-UAS hub research — import, review and public export

**Date:** 2026-10-31 · **Status:** imported, reviewed, exported, deployed and verified live
**Dataset:** `research-agent/data/2026-10-31-european-uav-hubs.json` — *European UAV and
Counter-UAS Hubs Research*, version `research-1`, as of 2026-10-31
**Reproduce:** `research-agent/imports/README-uav-hubs.md`

Scope: import, review and the public data export. **Frontend integration is the next task**
and nothing in the map UI was changed.

---

## 1. Counts, derived not copied

Every figure below was computed from the file and from the database, never taken from the
dataset's header. They happen to agree with it, which is itself worth knowing.

| | Dataset header | Derived from the file | In the database |
|---|---:|---:|---:|
| Research records | 61 | **61** | **61** |
| Unique `research_id` | — | 61 | 61 |
| Countries reviewed | 32 | **32** | **32** |
| Map candidates (recommended) | 40 | **40** | **40** |
| Candidate locality points | 43 | **43** | **43** |
| Unique evidence URLs | 110 | **110** | **110** |
| Record units | — | 58 organisation / 1 site / 2 programme | same |

| Import outcome | |
|---|---:|
| Imported | **61** records, **43** locations, **111** source rows, **4** relationships, **32** country reviews |
| Updated | 0 (first import) |
| Skipped | 0 |
| Blocked by validation | **0** — the prepare script exited clean |
| Matched to existing records | **5** linked, **1** false positive recorded |
| **Approved hub organisations** | **37** |
| **Approved site records** | **1** (not counted as an organisation) |
| Approved programmes | 0 |
| **Approved locations** | **40** |
| Approved countries | 25 |
| Held in research staging | **23** |

Replay creates nothing: all five loaders returned **0** rows changed when the database's own
content was fed back through them, with row counts unchanged (61 / 43 / 111 / 4 / 32).

## 2. The review — 40 recommended, 38 approved

`map_candidate=true` was treated as a research recommendation only. On top of it the review
required documented evidence, a relevant UAV or C-UAS function, a public locality with a
coordinate, and a web source.

All 40 recommended records were `documented`, so the planned, historical, candidate,
location-pending and in-development records never reached the question — they are all
non-candidates and all stay in staging, which is what was asked.

**Two recommended records were not approved**, and they are the same case:

> **Palladion Defence Accelerator** (DE) and **Tehnopol / NATO DIANA Estonian Accelerator**
> (EE). Both are documented, both were recommended for the map, and **neither carries a UAV
> or C-UAS term in its technology focus** — Palladion is "Defence, Dual-use, Deep tech",
> Tehnopol is "Dual-use, Robotics, AI, Deep tech". Each record's own research note says so:
> *"dedicated UAV or C-UAS facilities not established here"* and *"NATO affiliation does not
> prove UAV-specific test infrastructure"*. This is exactly the rule that NATO affiliation
> alone is not a UAV/C-UAS capability. Held in staging with the reason recorded.

Tehnopol also **mislabelled its two localities**: the dataset marks Tallinn and Tartu as
`published_campus_or_test_locality`, but the record describes *one accelerator programme
delivered from two cities*. Both were relabelled `programme_delivery_city` during review so
the staging row is not misleading if it is revisited. That is 3 of the 43 recommended points
withheld (1 for Palladion, 2 for Tehnopol), leaving 40.

### What is held in staging, and why

| Evidence status | Records | Why |
|---|---:|---|
| `documented`, recommended | 2 | No UAV/C-UAS focus (the two above) |
| `documented`, not recommended | 6 | No public locality that can carry a centroid — Brave1, Defence Builder, Miltech Sandbox, Selonia, EPFL LIS, ETH D-FaLL |
| `location_pending` | 5 | No verified locality. A ministry, procurement-agency or operator contact address is not a facility |
| `candidate` | 4 | Directory entry, announcement or MoU, not an operator description of an operating facility |
| `planned` | 3 | Announced development, not an operating facility — including the Selija centre |
| `historical_evidence` | 2 | Dated drone-specific evidence — Cranfield 2023, ZalaZONE 2022 |
| `in_development` | 1 | Commissioning not established — Sofia Tech Park |

Every one of the 23 carries its reason in `map_validation_errors`; none is blank.

## 3. The distinctions, as implemented

Each was asked for, and each is enforced somewhere a reader can check rather than left to a
caveat string.

| Distinction | How it is kept |
|---|---|
| Contact offices and delivery cities are not flight-test sites | `location_kind`, 8 values, CHECK-constrained. Malta Drone Centre's Attard is `contact_office_city`; Andøya's Andenes is `operator_contact_city`; MITS Kyiv is `programme_delivery_city` |
| Research laboratories are not regional clusters | `hub_type` carries the research type; Cyprus Institute's Nicosia point is `research_lab_city`. `caveats.classification` states it |
| National programmes without a site get no pin | `record_unit='programme'`; Brave1 and Miltech Sandbox have no location and are not approved |
| Centroids are not facility coordinates | `precision` on every point, `coordinate_basis` spelling it out, and the prepare script **rejects** a centroid with more than two decimals |
| Documented ≠ bookable | `operational_status` and `access_model` on every record, plus `caveats.availability` |
| NATO affiliation is not a capability | The two records above are unapproved on exactly this ground |
| Planned BVLOS ≠ available BVLOS | `bvlos_status` carries the source's own wording. **No boolean exists** that could collapse it — a test asserts that. Unmanned Valley reads `planned_2027_per_operator_not_current` |
| Sites must not inflate the organisation count | `counts.organisations` (37) excludes `record_unit='site'`; `counts.records` (38) includes it. Reported separately, never summed |

## 4. The five relationship cases

All four dataset relationships were loaded, plus the fifth case handled through matching.

| Case | How it is modelled |
|---|---|
| **ATLAS ALPHA and BRAVO** | **One** hub record with **two** site localities (Villacarrillo, Beas de Segura), not two records. `operated_by → CATEC`, which is still in staging, so the relationship is exported with `published: false` — a consumer can show it without linking to a record that is not there |
| **AIRlabs Austria and Steinalpl** | Two records, `site_of`. The network office in Graz is `network_office_city`; Steinalpl is `record_unit='site'` so it does **not** add to the organisation count. Austria therefore contributes 1 organisation and 1 site |
| **NaviSpot and PSNC** | Two records, two operators, `shares_geographic_campus`. Both approved, both at Kąkolewo (identical coordinates), and NaviHub additionally holds Poznań as `simulation_lab_city`. The shared locality is not a shared identity |
| **Selonia and the planned Selija centre** | `relationship_to_resolve`. The existing facility is `documented` with no site point; the EU centre is `planned`. **Both held in staging**, separately, so neither is published and they cannot be double counted |
| **MITS accelerator and MITS Capital** | The hub is linked to the existing investor `d9a3a6ad-…` with `match_role='related_organisation_different_function'`. Related organisation, different function, two records, no double count |

## 5. Matching — curated, because automation was wrong

The automated pass found **nothing**: an exact normalised-name match (`investor_name_key`,
the function the investor layer already uses) between all 61 hub names and every company,
company alias and investor returned **zero** rows. Hub names are facility names, catalogue
names are organisation names.

A substring pass was run and **deliberately discarded**. It produced matches that would have
been actively wrong:

- **Systematic** → the Danish software company *Systematic A/S*. The hub is *Systematic Paris
  Region*, a French cluster. Recorded as `rejected_false_positive` so nobody makes it later.
- **INTA** → the startup *iNTACT*. **ATLAS** → *Atlas Dynamics*. **MITS** → *MITS Industries*,
  *Mitsubishi Electric*, *Mitsubishi Heavy Industries*, *Mitsui Fudosan*.

The five links that were made, each with a stated role:

| Hub | Links to | Role |
|---|---|---|
| CATEC research centre | company `b09d94cc-…` CATEC | `same_organisation` |
| DLR National Experimental Test Center | company `a738c1ae-…` DLR | `facility_of_matched_organisation` |
| MITS Accelerator | investor `d9a3a6ad-…` MITS Capital | `related_organisation_different_function` |
| Bofors Test Center | company `97ddc40d-…` Bofors | `needs_review` |
| ETH D-FaLL Flying Arena | company `ac4b7cbb-…` ASL ETH Zurich | `needs_review` |

The two `needs_review` links are honest about doubt. The catalogue's "Bofors" is the **BAE
Systems artillery business** (website `baesystems.com`); the hub publishes at
`testcenter.se` and is most likely the separate *Bofors Test Center*. D-FaLL is a **different
ETH Zurich laboratory** from ASL — same university, not the same lab. Neither is asserted as
the same organisation.

## 6. The public export

**URL:** https://xsonomy.com/data/landscape-hubs.json
**Pointer:** https://xsonomy.com/data/landscape.json → `hubs`

```
{ edition: "european-uav-cuas-hubs",
  generatedAt, membership,
  counts:   { organisations: 37, sites: 1, programmes: 0,
              records: 38, locations: 40, countries: 25 },
  caveats:  { approval, coordinates, locationKinds, availability, bvlos, cuas,
              affiliation, recordUnits, classification, locationEvidence,
              matches, emptyFields, completeness },
  countryReviews: [ { country, name, researchRecords, mapCandidates,
                      approvedRecords, approvedLocations, note, reviewedAt } ],   // 32
  hubs: [ { id, researchId, slug, name, country, countryName, localityText,
            hubType, recordUnit, evidenceStatus, technologyFocus[],
            summary, researchNote, operationalStatus, accessModel,
            bvlosStatus, cuasEvidence, reviewedAt,
            matchedCompanyId, matchedInvestorId, matchRole, matchNote,
            relationships: [ { kind, direction, researchId, name, published, note } ],
            sources:       [ { url, title, accessedAt } ],
            locations:     [ { locality, country, latitude, longitude,
                               kind, precision, coordinateBasis } ] } ]           // 38
}
```

The `landscape.json` pointer repeats the six counts plus `url` and `membership`, so a
consumer can size the layer without fetching it. 75 KB, 15 hub types, 8 location kinds, 37
focus terms, 77 source rows, 5 relationship edges. All 32 country reviews are carried,
including the **7 countries where nothing was approved** — a reviewed country with no hub is
a finding, not a gap.

## 7. Checks performed

| Check | Result |
|---|---|
| Prepare-script validation (enums, ids, coordinates, URLs, English fields, cross-references) | 0 errors |
| Derived counts vs dataset header | match on all 6 figures |
| Country review sums reconcile to records / candidates | 61 / 40 ✓ |
| Replay of all five loaders from stored content | **0, 0, 0, 0, 0**; counts unchanged |
| Hubs with no source / candidates with no location / non-candidates with a location | 0 / 0 / 0 |
| Staging rows with no recorded reason | 0 |
| Approved hub with no approved location | 0 |
| Approved location on an unapproved hub | 0 |
| RLS on all five staging tables | enabled, 0 policies — deny by default, same as `investor_research*` |
| Test suite | **40/40** (32 before, +8 new in `scripts/test/hub-export.test.mjs`) |
| Live export and pointer | verified on xsonomy.com |
| **Untouched:** live companies / investors / approved investor research / landscape | **2,447 / 200 / 21 / 567** |

The 8 new tests assert the things that would otherwise rot quietly: sites never counted as
organisations, all 8 location kinds surviving the projection, no BVLOS availability boolean,
unpublished relationship counterparts flagged rather than hidden, an approved hub without a
location or web source failing loudly, original source titles untranslated, country reviews
keeping zero-approval countries, and a match staying a link with a role.

## 8. Decisions taken

1. **38 of 40 recommended records approved.** The two NATO DIANA accelerators are held for
   want of a UAV/C-UAS function, not for want of evidence.
2. **Tehnopol's two localities relabelled** `programme_delivery_city`. The dataset's own
   labelling was wrong against its own note.
3. **Location-level sources not stored** — identical to record-level in all 43 cases, so
   they carry no information. The column remains for a wave where they differ.
4. **`hub_research_sources` got a real uniqueness key**, unlike the investor equivalent.
5. **Country names taken from the catalogue**, not the dataset: *Czech Republic* over
   *Czechia*, *Turkey* over *Türkiye*.
6. **Matching curated, not automated.** Substring matching was tried and rejected.
7. **CEOM approved** on `Uncrewed systems` plus documented aerial participation in REPMUS,
   though it is maritime-led. Its summary says so, and that is a judgement worth revisiting.

## 9. Unresolved, carried forward

1. **`catec-research-centre` is in staging while ATLAS, which it operates, is published.**
   Resolving CATEC's office/site identity would let the operator appear too. Its link to the
   existing CATEC company row is already recorded.
2. **Two `needs_review` matches** — Bofors Test Center vs BAE Systems Bofors, and D-FaLL vs
   ASL ETH Zurich. Both need a human decision on legal identity.
3. **Drone Center Sweden and Västervik Drone Science Park** — the research note asks for
   entity matching before either merging or adding a second record. Not done; no second
   record was created.
4. **Swiss Drone Base Camp** is a related project label at Lodrino whose relationship needs
   checking before a separate record exists.
5. **The 23 staging records** each name what would unblock them. The five `location_pending`
   ones need only a verified locality.
6. **`investor_research_sources` replay hazard** (see the README). Not fixed here — it is the
   investor layer's bug, and fixing it means adding a unique index to a populated table.
7. **No frontend consumes the export yet**, by design.

## Sources

The dataset's own 110 evidence URLs, stored per record in `hub_research_sources` with their
original titles. The dataset and its companion report are committed under
`research-agent/data/`.
