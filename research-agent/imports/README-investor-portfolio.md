# Investor portfolio reconciliation and financial metrics — import and rollback

**Inputs** (all from `brunotaut/xSonomy`, which is read-only against the database):
`docs/investor-portfolio-reconciliation.json` (87 edges) ·
`scripts/lib/investor-directory.json` (118 records, now deleted) ·
`scripts/lib/investor-profiles.mjs` (build-time matcher, now deleted) ·
`docs/INVESTOR_DIRECTORY_EXPANSION.md`

**Report:** `research-agent/reports/2026-11-01-investor-portfolio-reconciliation.md`

## What now lives where

| Fact | Before | Now |
|---|---|---|
| Portfolio link | computed at build time by unique exact name match against **published** companies | `investor_companies`, one row per relationship with its own evidence |
| Unresolvable holding | silently dropped from the link list | `investor_portfolio_unresolved`, with the reason |
| Fund size / AUM / ticket | a `financialMetrics` array in a committed JSON file | `investor_financial_metrics`, one typed row per observation |
| Fund vehicle | not modelled | `investor_research_vehicles` (existed, was empty) |
| Ukraine linkage | `ukraineRelated` in the supplement | `investor_research.ukraine_related` |
| Workbook row | `sourceReference` in the supplement | `investor_research.source_reference` |
| The 12 workbook additions | supplement-only | `investor_research` rows, `evidence_status='watchlist'` |

## Reproducing the import

The 87-edge payload is **stored in the database** rather than re-pasted, so a replay costs
nothing and always uses the same input:

```sql
select investor_companies_load(payload)
  from investor_portfolio_import_payload
 where dataset = 'investor-portfolio-reconciliation-2026-10-31';
```

It returns the number of rows it changed. On a replay that is **0**. Verified twice.

The loader resolves each holding name against **all** companies — including drafts — by name,
then alias, then legal name. A name matching more than one company is left unresolved rather
than guessed at. A name matching an unpublished company resolves normally and the
relationship is stored; only the public profile URL is withheld.

Two things it deliberately will not do:

- **It never overwrites a verified relationship.** The loader writes a generic
  `portfolio_listed` row. If a relationship has since been typed more precisely
  (`direct_investment`, `fund_of_funds`) with disclosed amounts, the loader skips it
  entirely, and on conflict refreshes only `match_method`. An import cannot downgrade an
  editorial judgement back to a bare listing.
- **It never infers an amount.** `investor_contribution_*` and `round_total_*` are separate
  nullable pairs with a CHECK that a contribution cannot exceed its round. A round total is
  never copied into the contribution.

## Migrations, in order

| Name | What it does |
|---|---|
| `investor_portfolio_and_financial_metrics_schema` | `investor_companies`, `investor_portfolio_unresolved`, `investor_financial_metrics`; `ukraine_related` and `source_reference` on `investor_research` |
| `investor_financial_metrics_import` | `display_en`; 5 fund vehicles; 11 of the 14 metrics |
| `investor_directory_supplement_migration` | the 12 workbook records, their country associations, the Ukraine flags, and the projection broadened from 21 to 118 |
| `investor_companies_loader` → `..._dedupe_methods` → `..._unresolved_fix` → `..._respect_verified_upgrades` | the loader, arrived at in four steps |
| `investor_portfolio_company_creation` | the 16 verified companies |
| `investor_landscape_projection_with_portfolio_and_metrics` | `v_landscape_investors` rebuilt with portfolio, unresolved holdings and metrics |

## Rollback

In reverse order. Nothing here cascades into companies, products or the landscape.

```sql
-- 1. The relationships, the unresolved list and the metrics. Dropping the tables removes
--    everything this import created in them; no other table references them.
drop view if exists v_landscape_investors;          -- recreate from the previous migration
drop table if exists investor_companies;
drop table if exists investor_portfolio_unresolved;
drop table if exists investor_financial_metrics;
drop table if exists investor_portfolio_import_payload;
delete from investor_research_vehicles;             -- 5 rows, all created here
drop function if exists investor_companies_load(jsonb);

-- 2. The directory migration. Returns the projection to the 21 deal/mandate records that
--    had a city location, and removes the 12 workbook additions.
update investor_research set publication_status = 'research_staging', approved_at = null
 where slug not in (select slug from investor_research
                     where evidence_status in ('deal','mandate')
                       and exists (select 1 from investor_research_locations l where l.investor_id = id));
delete from investor_research where source_dataset = 'Ukraine defence technology investor workbook (supplied)';
alter table investor_research drop column if exists ukraine_related,
                              drop column if exists source_reference;

-- 3. The 16 created companies. Guarded on discovery_source so nothing else is touched.
delete from company_aliases where alias in ('Unmanned Defense Systems','Milvus');
delete from companies where discovery_source = 'external_research'
   and slug::text in ('babayte','claymore-industries','kara-dag-technologies','teletactica',
     'unmanned-defence-systems','hive-robotics','turgis-gaillard','airvolute','gutsee-health',
     'fernride','hyimpulse','liveeo','valarian','milvus-advanced','spherea','tiberius-aerospace');
```

Rolling back step 2 or 3 also requires restoring `scripts/lib/investor-directory.json`,
`scripts/lib/investor-profiles.mjs` and `scripts/test/investor-profiles.test.mjs` in the
catalogue repo — they are in git history at commit `6b2db2d^`.

## Tests

In the catalogue repo, `npm test` (41 passing). The investor export tests cover: a record
placed only by country association is published rather than rejected; a portfolio holding
keeps its company id while an unpublished company gets no URL; contribution and round total
stay distinct and either may be null; a non-web relationship source is dropped; unresolved
holdings travel with their reason; and all twelve metric types stay distinct, with counts
carrying no money fields and a `minimum` bound never rendering as exact.

Checked directly against the database, not only in unit tests:

- **duplicate prevention** — 0 duplicate normalised company names across all 2,455 live
  companies after creating 16; every insert guarded on the normalised name.
- **ambiguous matches** — a second company named "Helsing" was inserted, the loader re-run,
  and it created **0** links to it, recorded all 7 affected investors as unresolved with the
  ambiguity reason, and left the 7 pre-existing Helsing relationships intact. Then rolled back.
- **unpublished-company links** — Marathon VC → Delian Alliance Industries resolves to a
  draft company: relationship stored, `url` null, `published` false, `match_method`
  `draft_company`.
- **idempotency** — the loader returns 0 on replay, twice, with all three verified
  relationship upgrades preserved.
