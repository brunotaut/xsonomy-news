# Hub catalogue matches now link to the profiles they point at

**Date:** 2026-11-01 · **Status:** APPLIED AND DEPLOYED · **Next actor:** ChatGPT

The hub export carried each catalogue match as a raw foreign key, and the landscape page
could not turn either kind into a profile link. DLR and MITS Capital were both confirmed
matches rendered as plain text.

---

## 1. Two different root causes, not one

The page resolved a match by searching the payloads it already had. That could never work,
for two separate reasons.

| | Stored as | Why the page could not resolve it |
|---|---|---|
| **DLR** (`DLR National Experimental Test Center for UAS`) | `hub_research.matched_company_id` → `companies.id` `a738c1ae…` | The page searched `landscape.json`'s company array, which holds only the **567 landscape members**. DLR is a `research_institute`, counted as a research & academic organisation **outside** that list — so its id was never in the array to find. Its profile existed the whole time: `/companies/dlr-german-aerospace-center/` returns 200. |
| **MITS Capital** (`MITS Accelerator`) | `hub_research.matched_investor_id` → **`investors.id`** `d9a3a6ad…` | A different table. The published investor records are `investor_research` rows, keyed on their own ids — MITS Capital's is `51ea94a6…`. The page compared the hub's legacy `investors` id against research ids, so **no investor match could ever resolve**. `investor_research.matched_investor_id` is the bridge between the two tables, and for MITS it was null. |

The foreign key is not wrong in either case; the resolution step was simply missing.

## 2. What was changed

**Migration `hub_matched_profile_slugs`** — `v_landscape_hubs` now resolves both stored
ids to a published profile slug, in SQL, by id:

- `matched_company_slug` — `companies.slug` where that row is `publication_status='live'`
  with a non-empty slug. That is exactly the condition under which the generator writes
  `/companies/<slug>/`: `for (const c of companies) { if (!c.slug) continue; … }` over a
  fetch gated on `live`.
- `matched_investor_slug` — the `investor_research.slug` of the `approved` record whose
  `matched_investor_id` equals the hub's, i.e. the published record for the same
  organisation. `approved` is the same gate the investor export uses.

**No name matching and no slug construction anywhere.** A null slug means "no published
profile exists for this id", whatever the reason — draft, slugless, or no published
research record. The view was dropped and recreated because adding columns changes the
column order and `create or replace` refuses that; both consumers select `*`.

**One data write: the missing MITS bridge.**

```sql
update investor_research set matched_investor_id = 'd9a3a6ad-7ad7-4a27-a6f7-c326343fbf0e'
 where id = '51ea94a6-1aee-4f49-9255-11fb92d0055f'
   and slug = 'mits-capital-lightning-fund'
   and publication_status = 'approved'
   and matched_investor_id is null;
```

Rollback: `update investor_research set matched_investor_id = null where id =
'51ea94a6-1aee-4f49-9255-11fb92d0055f' and matched_investor_id =
'd9a3a6ad-7ad7-4a27-a6f7-c326343fbf0e';`

**Why that link is a finding and not a name guess.** The names differ — legacy
`MITS Capital` versus research `MITS Capital / Lightning Fund` — which is exactly why the
resolver's exact-name rule had not made the link (all 12 pre-existing
`matched_investor_id` links are exact name equalities: Iron Wolf Capital, SmartCap,
Lakestar, Accel…). The evidence is the manager's **own domain**, which is also the
published record's own ticket source, `https://mits.capital/mits-lightning-fund/`:

- the page reads *"MITS Lightning Fund is a U.S.-based early-stage venture fund backing
  Ukrainian defense tech companies from pre-seed to Series A"* — matching the research
  record's name, its US domicile and its `$500K–$3M` ticket;
- it heads its holdings **"MITS Capital Portfolio"**, so MITS Capital is the manager of
  the Lightning Fund — one organisation, which is what the composite research name
  bundles;
- and it carries **"MITS ACCELERATOR — A growth acceleration program and tailored support
  services for Ukrainian defense startups"**, which independently confirms the hub's own
  `related_organisation_different_function` note: the accelerator is the same group's
  programme, a different function from the fund.

Checked for duplicates first: no `matched_investor_id` value is used by more than one
research record, before or after.

## 3. The link rule, in one place

It was previously duplicated: the export emitted the ids, and `atlas.js` held its own
`ASSERTED_MATCH` list of roles. That copy is deleted. The export now decides once, and the
panel renders what it is given — which is why the two could drift apart in the first place.

A profile link requires **both** conditions, and they are deliberately independent:

1. **the relationship is a reviewed conclusion** — `same_organisation`,
   `facility_of_matched_organisation` or `related_organisation_different_function`. The
   third is a conclusion, not a doubt: it says the two are definitely related and
   definitely not the same organisation.
2. **the target has a published profile** — a non-null resolved slug.

`needs_review` and `rejected_false_positive` never link. **Bofors Test Center is why the
two conditions have to be kept apart:** its matched company `bofors` *is* published and
`/companies/bofors/` returns 200, but the match is only `needs_review`. The export
withholds the slug and url, so no link exists at any layer, and the panel says *"A
possible match, not confirmed. No shared identity is asserted and no relationship is
published, so this is deliberately not a link."* A rejected match gets its own wording.
**Bofors Test Center → BAE Systems Bofors was not turned into a confirmed relationship.**

New export fields: `matchConfirmed`, `matchedCompanySlug`, `matchedCompanyUrl`,
`matchedCompanyName`, `matchedInvestorSlug`, `matchedInvestorName`, plus a
`caveats.matchLinks` sentence stating the rule.

**The name had to travel too, and the first pass missed it.** With only the slug emitted,
the panel still looked the *label* up in the landscape company payload — the very lookup
that cannot find a research institute — so the deployed DLR link read
*"dlr-german-aerospace-center — company profile"*. Caught by checking the rendered page
rather than the export. Migration `hub_matched_profile_names` adds
`matched_company_name` / `matched_investor_name` to the same view, resolved from the same
row, and the panel now depends on no payload lookup at all for either the link or its
label. The slug remains the fallback label if a name is ever missing. The raw ids
and the match note still travel, so an unlinked match can still be shown as text.

An investor has no standalone page — the landscape panel opens it — so only the slug is
emitted there, matching the existing `data-investor` convention. A company gets the full
url, built from the generator's own `/companies/<slug>/` route.

## 4. Results

| Hub record | Role | Outcome |
|---|---|---|
| **DLR National Experimental Test Center for UAS** | `facility_of_matched_organisation` | **Linked** → `/companies/dlr-german-aerospace-center/` |
| **MITS Accelerator** | `related_organisation_different_function` | **Linked** → investor record `mits-capital-lightning-fund` |
| Bofors Test Center | `needs_review` | **Text**, with its reason. Target published but the match is unconfirmed. |
| Systematic Hub Drones / CEDIF | `rejected_false_positive` | **Text.** A confirmed non-match, and it carries no ids at all. |

Those are all four hub records that carry a match; the other 34 have none.

## 5. Verification

| Check | Result |
|---|---|
| View resolves by id | DLR → `dlr-german-aerospace-center`, MITS → `mits-capital-lightning-fund`, Bofors → `bofors` (withheld later by role) |
| `/companies/dlr-german-aerospace-center/` | 200, `<h1>DLR (German Aerospace Center)</h1>` — the intended organisation |
| MITS investor record | `approved`, slug `mits-capital-lightning-fund`, present in the published investor payload |
| Investor records still approved | 118, unchanged; `matched_investor_id` links 12 → 13 |
| Duplicate `matched_investor_id` | none, before or after |
| Dry run of the data write (`begin … rollback`) | resolved as predicted, then confirmed unwritten |
| Tests | **65/65** |

Hub eligibility, map counts and filters are untouched: the change adds fields and
resolves ids. No hub record, location, approval or count was altered.

## 6. Left alone

- The other 11 `investor_research` rows with no `matched_investor_id` are not investigated
  here. They are only needed when something points at the legacy `investors` row.
- The legacy `investors` table still has no public profile of its own; it is reachable
  only through the research record that bridges to it. That is the shape the data has, not
  something this change introduces.
- `hub_research.matched_investor_id`'s foreign key still targets `investors`. Repointing it
  at `investor_research` would be cleaner but is a schema change to a reviewed research
  table, and the bridge makes it unnecessary.
