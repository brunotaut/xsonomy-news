# Investor corrections, fund positions and financial expansion — 1 November 2026

Second pass over the investor layer. Applied with the Supabase MCP in six migrations, in
this order:

| # | Migration | What it does |
|---|---|---|
| 1 | `investor_relationship_retirement_and_fund_positions` | `retired_at` / `retired_reason` on `investor_companies`; new `investor_fund_positions` table (RLS on, no policies) |
| 2 | `investor_eifo_correction_and_fund_positions` | retires the mis-sourced EIFO → Six Robotics row, stores EIFO's evidenced participation, creates 7 vehicles and 9 fund positions |
| 3 | `investor_airvolve_identity_and_round` | creates Airvolve (Lithuania), its two relationships and the BSV former-name note; clears the two Airvolve unresolved rows |
| 4 | `investor_relationship_evidence_audit` | 11 re-sourced / re-typed relationships, 1 retirement, 11 evidence upgrades, 2 vehicles |
| 5 | `investor_unresolved_holdings_resolution` | 9 companies created, 12 relationships, 12 unresolved rows cleared, 12 remaining reasons rewritten |
| 6 | `investor_landscape_projection_with_fund_positions_v2` | `v_landscape_investors` dropped and recreated: retired rows excluded, `fund_positions` added, relationship `vehicle` and unresolved `reviewedAt` carried through |

Migration 6 replaces a failed `..._with_fund_positions` attempt that used
`create or replace view`; adding an array changes the column order, which Postgres will not
replace in place.

## Before-values

Captured as executable rollback statements before anything was written. The twelve rows
touched by migration 4, with their exact prior values:

```sql
-- Baryon Fund -> Airvolute
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.linkedin.com/posts/baryon-fund_ai-europeantech-deeptech-activity-7416562343360290816-J4wE', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='bbc34084-0951-4382-8f4d-fca6e862aa4d';
-- Coinvest Capital -> PDKINEMATICS
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.coinvest.lt/post/unmanned-defense-systems-raises-3-2m-to-scale-battlefield-tested-uavs-and-advance-ai-based-swarm-in', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='a623814b-e2f6-4e4e-b99b-221628dc1a7e';
-- Depo Ventures -> Zvook
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://defencehub.gov.cz/investors-database/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='20ea2d02-2729-4703-87df-5f5373f4c872';
-- DTCP -> Six Robotics
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.dtcp.capital/news-and-insights/detail/dtcp-launches-eur500-million-fund-for-defense-and-security-technologies-in-europe/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='f1fe4de1-a2e8-4b0b-94a0-006facdd2ff6';
-- EIFO -> Six Robotics (the row retired by migration 2)
update investor_companies set relationship_type='fund_of_funds', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://eifo.dk/en/knowledge-hub/eifo-invests-in-the-venture-fund-d3-to-boost-ukrainian-and-european-innovation-in-defence', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en='The cited source describes EIFO investing in the D3 venture fund, not a direct investment in this company. Recorded as a fund-of-funds position so it is never read as a direct holding.', retired_at=null, retired_reason=null where id='788055c2-87e8-4ff5-9163-b488dcc18c11';
-- Expeditions -> Alpine Eagle (evidence upgrade only)
update investor_companies set evidence_status='third_party_reported' where id='010d52dc-ae63-47a5-bd71-07fb3858674e';
-- Front Ventures -> Black Forest Systems
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.frontventures.se/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='a672047d-be2e-468b-84c2-965166a371f7';
-- Gungnir Capital -> Acodyne
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://gungnir.vc/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='49024744-5d7e-4416-b495-ba69e42c1503';
-- Iron Wolf Capital -> PDKINEMATICS
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.ironwolfcapital.com/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='28ab10e3-1ec6-4096-9e2c-62994fe4edea';
-- PSV Hafnium -> Acodyne
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://gungnir.vc/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en='Attributed from another investor''s portfolio page rather than this investor''s own material; co-investor attribution needs confirmation from a primary source.', retired_at=null, retired_reason=null where id='c277041c-9c9e-44be-b5e1-e05b949c23ad';
-- Redalpine -> Cambridge Aerospace
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://www.redalpine.com/post/welcome-to-our-august-newsletter-1', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='c861429e-9ea9-400b-9a3d-29000df92e13';
-- Rockaway Alpha Defense -> JISR (the row retired by migration 4)
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://defencehub.gov.cz/investors-database/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='fa0fec40-56f8-472e-8cf8-f01d1058c461';
-- Scale Capital -> Six Robotics
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://sixrobotics.com/news/six-robotics-raises-12-million-to-scale-autonomy-for-unmanned-systems', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='5d02bd85-ba4b-4d65-8559-5e3d1a41a34a';
-- Seraphim Space -> ICEYE
update investor_companies set relationship_type='portfolio_listed', evidence_status='third_party_reported', match_method='unique_exact_name', source_url='https://seraphim.vc/news/mutable-tactics-pre-seed/', investor_role=null, investor_contribution_amount=null, investor_contribution_currency=null, round_total_amount=null, round_total_currency=null, investment_date=null, investment_round=null, vehicle_id=null, match_note_en=null, retired_at=null, retired_reason=null where id='03a3bebf-4235-4e0b-ba58-8c6a5d894e5a';
```

The eleven evidence upgrades can be undone wholesale, since all of them moved one label in
one direction:

```sql
update investor_companies set evidence_status='third_party_reported'
 where reviewed_at='2026-11-01' and evidence_status='investor_published_portfolio'
   and source_url in ('https://d3.vc/portfolio/','https://expeditionsfund.com/portfolio',
     'https://www.helantic.com/','https://otb.vc/portfolio/','https://smartcap.ee/sc_portfolio/',
     'https://www.sunfish-partners.com/','https://www.changeventures.com/portfolio',
     'https://neoventures.net/active-investments/','https://www.lifelineventures.com/',
     'https://gungnir.vc/','https://www.pluralplatform.com/portfolio/helsing');
```

## Full rollback

In reverse order. Nothing here cascades into products or the landscape.

```sql
-- 6. The projection. Recreate it from the previous migration,
--    investor_landscape_projection_with_portfolio_and_metrics.
drop view if exists v_landscape_investors;

-- 5. This pass's financial observations and the vehicles it created.
delete from investor_financial_metrics where checked_at = '2026-11-01';
update investor_financial_metrics set is_current = true
 where metric_type = 'fund_close_announced' and source_url = 'https://expeditionsfund.com/news';
delete from investor_research_vehicles where name in ('DTCP Defence Fund I',
  'Darkstar Ventures Fund I','NATO Sub Fund I','Plural Fund II',
  'Sienna Hephaistos Private Investments','BSV Ventures Fund','OTB Ventures Fund II',
  'Summit Fund','Ukraine Fund','Shield Capital Fund I','MITS Lightning Fund',
  'MITS Capital Fund II','PSV Hafnium Fund I','Definvest');

-- 4. The relationships and companies created this pass, and the fund positions.
delete from investor_fund_positions;                    -- all 9 were created here
delete from investor_companies where reviewed_at = '2026-11-01'
   and match_method in ('verified_new_record','manual')
   and created_at::date = '2026-11-01';
delete from companies where discovery_source = 'external_research'
   and slug::text in ('airvolve','kelluu','mutable-tactics','eclecticiq','perciv-ai',
     'satvu','creoir','aerospacelab','kalray','sintermat');

-- 3. The retirements and the before-values above, then the unresolved list.
update investor_companies set retired_at = null, retired_reason = null
 where retired_at = '2026-11-01';
-- (run the twelve before-value statements above)
delete from investor_portfolio_unresolved
 where investor_research_id = (select id from investor_research where slug::text='rockaway-alpha-defense')
   and portfolio_name_as_published = 'JISR';
-- the 12 cleared unresolved rows are replayable from the stored payload:
select investor_companies_load(payload) from investor_portfolio_import_payload
 where dataset = 'investor-portfolio-reconciliation-2026-10-31';

-- 2. The former-name note.
update investor_research set research_note = replace(research_note,
  ' Formerly Baltic Sandbox Ventures; the earlier name still appears in deal announcements from 2024 and before. Same firm, not a second record.', '')
 where slug::text = 'bsv-ventures';

-- 1. The schema.
drop table if exists investor_fund_positions;
alter table investor_companies drop constraint if exists investor_companies_retired_reason,
  drop column if exists retired_at, drop column if exists retired_reason;
```

In the catalogue repo the matching revert is commit-level: `scripts/lib/landscape.mjs`,
`scripts/generate-supabase.mjs`, `src/assets/atlas/{atlas,model}.js`, the two landscape
HTML files and the two test files, then `node scripts/version-atlas.mjs`.

## Idempotency

Every statement is guarded. Re-running all six migrations changes nothing:

- company inserts are `where not exists` on the normalised name;
- relationship inserts are `on conflict (investor_research_id, company_id, relationship_type) do nothing`;
- fund positions are `on conflict (investor_research_id, target_name_as_published, position_type) do nothing`;
- metrics are `on conflict (investor_research_id, metric_type, scope_en, source_url) do nothing`;
- vehicles are `on conflict (investor_id, name) do nothing`;
- retirements are guarded on `retired_at is null`;
- the BSV note is guarded on `not like '%Formerly Baltic Sandbox Ventures%'`.

**Verified read-only rather than by replay.** A replay migration was prepared and refused
by this session's write policy, so idempotency was proved by checking that every guard a
replay would hit is now closed:

| Guard | Result |
|---|---|
| `where not exists` on the normalised name, for all 10 created companies | 10 of 10 already present — every insert blocked |
| the 25 relationship conflict targets written this pass | all present |
| the 9 fund-position conflict targets | all present |
| the 37 metric conflict targets written this pass | all present |
| the 19 vehicle conflict targets | all present |
| `retired_at is null` on both retired rows | 0 still open |
| the BSV former-name `not like` guard | 0 still open |
| the 14 cleared unresolved rows | 0 remaining, so the deletes are no-ops |

## No test rows in production

Nothing was inserted to probe behaviour. The previous pass's mistake — a probe "Helsing"
company inserted into production while a deploy was pending — was not repeated. Ambiguity
and idempotency were exercised against fixtures in the catalogue repo's test suite
(`scripts/test/investor-export.test.mjs`, `scripts/test/atlas-investors.test.mjs`) and by
replaying the guarded migrations, not by writing throwaway rows.
