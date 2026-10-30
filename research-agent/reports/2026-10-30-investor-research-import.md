# European defence investor research — imported and exposed

**Date:** 2026-10-30 · **Source:** `research-agent/data/2026-10-30-european-defence-investors.json`
("European Defence & UAV Investor Research", `research-1`, as of 2026-10-30).
**Commits:** news repo — this one · catalogue repo — `7d91efa`.
**How to reproduce:** `research-agent/imports/README-investor-research.md`.

---

## 1. Counts

| | Records | Locations | Sources | Country associations | Country reviews |
|---|---|---|---|---|---|
| **Imported** | **106** | **41** | **202** | **124** | **32** |
| Updated | 0 | 0 | 0 | 0 | 0 |
| Skipped | 0 | 0 | 0 | 0 | 0 |

All 106 records in the dataset were imported; none was skipped and none needed updating,
because this is the first load. The 202 source rows carry **149 unique URLs** — the
dataset's own figure — across record-level and location-level evidence.

**Idempotent, and proven so.** Every loader is guarded with `is distinct from`, and a
replay of a record, a location, a source and a country association each returned
`0 touched`. The dedupe, validation and promotion statements likewise match 0 rows on a
second run.

**Deduplicated against the 200 investors already in the catalogue.** 12 of the 106 are the
same organisation as an existing row:

Accel · Archangel · Baillie Gifford · Day One Capital · Freedom Fund VC · Front Ventures ·
Greenoaks · Iron Wolf Capital · Lakestar · SmartCap · Speedinvest · Vsquared Ventures

The match is recorded as a link (`matched_investor_id`), **not a merge**. The existing row
keeps its identity, its name, its type and its sources; nothing about it was rewritten.
Matching is exact on a normalised name, so near-misses stay separate — `Freedom Fund` and
`Freedom Fund VC` are two records, and so are `Tiger Global` and `Tiger Global Management`.
That is deliberate: collapsing them is an editorial judgement, not an import step.

Nothing outside the staging layer changed. `investors` is still **200** rows, live
companies still **2,447**, the landscape still **567**.

## 2. Ready for the map, and the blockers

**21 of 21 validated. No blockers.**

The dataset flags 21 records `map_ready`. Rather than trust the flag, the import
recomputes it: a candidate needs a published city-level location with coordinates, at
least one evidence URL, a review date, a non-empty name, and an evidence status that is a
**confirmed deal or a stated mandate**. All 21 pass, and no record outside the 21 passes —
the two definitions agree exactly.

Those 21 carry **38 locations** across 12 deals and 9 mandates. They are now
`publication_status = 'approved'` and are the only rows the export publishes.

**The 3 records that have a location but are not candidates** are held, correctly:
Investinor, METU70 / ODTU70 and NewSpace Capital are all `adjacent`. An ecosystem
relationship is not an investment, so their locations stay in staging.

**Classifications are kept apart, not flattened.** The 85 unapproved records are
39 mandates… minus the 21 promoted, plus: **16 adjacent** investors, **4 watchlist**
candidates needing primary confirmation, and **3 financial programmes** (EIF Defence
Equity Facility, Brave1, HBOR defence lending). A programme is an LP instrument or a
lending line, not a venture fund, and the schema's `evidence_status` check constraint keeps
all five classes distinct so no report can quietly promote one into another.

### One real gap

`investor_research_vehicles` is **empty**. The dataset deliberately nests fund vehicles in
prose — "Definvest and Fonds Innovation Défense are distinct vehicles, not two managers",
"Primo Space 1 and Space 2 are distinct vehicles", "Hyperion Fund FCR managed by Singular
AM" — and extracting entity names from those sentences would be invention, not import. The
table exists, with its manager foreign key, so the distinction has a home as soon as the
vehicle names are researched. **This is the one requirement the data cannot currently
satisfy.**

## 3. Export path and response schema

The investor data rides the **existing landscape pipeline** —
`scripts/lib/landscape.mjs`, built by `generate-supabase.mjs`, deployed by the same
workflow — but lands in its own file so the map payload does not grow for consumers that
only want companies.

**Export path:** `https://xsonomy.com/data/landscape-investors.json` (live, HTTP 200).
**Discovery:** `https://xsonomy.com/data/landscape.json` now carries an `investors`
pointer — `{ count, locations, url, membership }` — so a consumer of the existing endpoint
finds it without downloading it.
**Database projection:** `v_landscape_investors`, `v_landscape_investor_locations`,
`v_investor_country_reviews` (approved rows only, read-only).

```jsonc
{
  "edition": "european-defence-investors",
  "generatedAt": "2026-10-30T22:46:26.988Z",
  "membership": "Approved investor research records: a confirmed deal or a stated mandate, with a published city-level location, an evidence URL and a review date.",
  "caveats": {
    "countryAssociations": "Research index: … not a verified HQ field.",
    "coordinates": "Approximate city centroids, not exact office locations.",
    "locationKinds": "Published offices, contact addresses, meeting locations and legal registrations are distinct and are not interchangeable.",
    "tickets": "Published investment or financing ranges; not a guarantee of available capital.",
    "fundSizes": "Deliberately omitted: targets, commitments and AUM are not comparable.",
    "emptyFields": "An absent value means not established, never zero.",
    "classification": "Adjacent investors, unverified candidates and financial programmes are classified separately … and are not approved here."
  },
  "countryReviews": [
    { "country": "CY", "name": "Cyprus", "status": "gap",
      "note": "A separate search did not find sufficient confirmation…",
      "reviewedAt": "2026-10-30", "recordCount": 0 }          // 32 entries, gaps included
  ],
  "investors": [{
    "id": "uuid", "slug": "keen-venture-partners", "name": "Keen Venture Partners",
    "entityType": "VC",
    "evidenceStatus": "deal",                                  // deal | mandate (approved only)
    "evidenceStatusLabel": "Confirmed investment",             // English
    "evidenceBasis": "primary_or_transaction_party",
    "uavReviewPriority": "high",                               // high | standard
    "stages": ["Pre-seed–B"], "focus": ["Defence", "UAV", "C-UAS", "Autonomy"],
    "selectedPortfolio": ["Kelluu"], "investmentGeography": [],
    "ticket": null,                                            // or { currency, minimum, maximum, basis, source }
    "legalDomicile": null,                                     // or { country, precision, note } — its own fact
    "countryAssociations": ["GB", "NL"],                       // an index. NOT hq, domicile or eligibility
    "researchNote": "Offices in Amsterdam and London verified; one manager, two map locations.",
    "missingFields": ["Current deployment / intake status", "Complete vehicle and manager identity"],
    "verifiedAsOf": "2026-10-30",                              // retrieval date, not a transaction date
    "matchedInvestorId": null,                                 // link to an existing investor, never a merge
    "sources": [{ "url": "…", "title": "…", "accessedAt": "2026-10-30" }],
    "locations": [{
      "city": "London", "country": "GB", "latitude": 51.5074, "longitude": -0.1278,
      "kind": "published_office_or_contact_city",               // or published_meeting_location,
                                                               // operational_office, legal_registration
      "precision": "approximate_city_centroid",
      "sources": [{ "url": "…", "title": "…", "accessedAt": "2026-10-30" }]
    }]
  }]
}
```

Deployed payload: **21 investors, 38 locations**, 35 office/contact cities and
**3 meeting locations** (BSV Ventures' Vilnius, Tallinn and Helsinki — places it meets
founders, not offices it occupies), all 38 at centroid precision; 2 records with a ticket
range, 3 with a legal domicile, 2 linked to an existing investor.

An approved record with no location **fails the build** rather than shipping. Non-web
source URLs are dropped. Four unit tests cover the caveats, the location-kind distinction,
the domicile/office/association separation, and both failure modes; the suite is **22/22**.

## 4. Commits

- Catalogue (`brunotaut/xSonomy`): **`7d91efa`** — "Export approved investor research
  through the landscape pipeline". Deployed and verified live.
- News (`brunotaut/xsonomy-news`): this commit — source dataset, preparation script,
  import README and this report.
- Database: six migrations, `20261030222722` … `20261030224259`.

## Requirements, line by line

| Requirement | Status |
|---|---|
| All public content in English; official names preserved | Done. The only Ukrainian strings were 5 status labels and 32 country names and notes; all translated. Organisation names untouched — `METU70 / ODTU70`, `IVC / Ilavska Vuillermoz Capital` and the rest are verbatim. English country names come from the project's own `countries` table, not a fresh translation |
| All 106 into a research/staging layer, preserving source URLs, evidence status, research notes, review dates | Done. 106 records, 202 source rows, every `research_note` and `verified_as_of` kept |
| Deduplicate against existing investors; idempotent | Done. 12 links, 0 merges; replay touches 0 rows |
| Investors/managers, fund vehicles and locations distinct | Schema separates all three. Vehicles table intentionally empty — see the gap above |
| `country_associations` not HQ, domicile or eligibility | Separate table, caveat stored per record and republished. No `country` or `hqCountry` field exists on an investor record, and a test asserts that |
| Offices, contact locations, meeting locations and legal registration distinct | `location_kind` with a check constraint; `legal_domicile_*` is separate from any location |
| Coordinates are approximate city centres | `precision` column, defaulted and constrained; stated in the export caveats |
| 21 `map_ready` treated as candidates, validated before exposure | Done. Revalidated from the data; 21/21 pass, 0 blockers |
| Adjacent, unverified and programmes separately classified | Five-value `evidence_status`; only deal/mandate can be approved |
| Do not overwrite or reclassify existing UAV/C-UAS companies | No write outside the staging layer. 2,447 live companies, 567 landscape, unchanged |
| Expose approved records and locations through the existing landscape API/export | Done. Same pipeline, own file, pointer in `landscape.json` |
| No frontend redesign | None. The new file is not read by any page |

## A judgement worth flagging

The dataset's own methodology says map-ready means "minimum evidence for a city-level
candidate, **not completed editorial approval**". This import promotes the 21 validated
candidates to `approved` so there is something to expose, because the instruction asked for
approved records and locations to be exposed in this task. If you would rather they sat at
`review` until you have read them, it is one statement:

```sql
update investor_research set publication_status = 'review', approved_at = null
where publication_status = 'approved';
```

The next build would then publish an empty investor list, and nothing else would change.
