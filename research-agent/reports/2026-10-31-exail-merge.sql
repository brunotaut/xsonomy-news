-- =============================================================================
-- Exail admission + ECA Group / Infotron merge.  PREPARED 2026-10-31.
-- NOT APPLIED. Authorised for preparation and read-only validation only.
-- Requires ChatGPT review, then Nazar's approval, before execution.
-- =============================================================================
--
-- One atomic transaction. Either all 14 steps land or none do.
--
-- Scope, and what is deliberately OUT of it:
--   OUT: product recategorisation and deduplication (the 12 mis-categorised UAV rows,
--        the 3 bare-designation duplicates, the 2 family-name records, Exail A27),
--        DORCUS ownership, iXblue, Exail Robotics, and the Groupe Gorgé /
--        Exail Technologies parent restructuring. None is touched here.
--
-- Verified against the live schema on 2026-10-31, not assumed from the earlier package:
--   * company_relationships uses source_company_id / target_company_id.
--     (The Tier B/C SQL in 2026-10-31-composite-merges-and-reassignments.sql still has
--     the wrong `source` / `target` names and will fail as written. Not fixed here.)
--   * product_companies PK is (product_id, company_id, role) -- three columns, not two.
--   * landscape_candidates PK is (landscape_slug, company_id); the note column is
--     screening_note, not note.
--   * company_sectors PK is (company_id, sector_id); assigned_by is constrained to
--     editor|llm|import|seed; confidence to low|medium|high.
--   * company_aliases.alias is citext with UNIQUE (company_id, alias) -- per company,
--     NOT globally unique. See step 8.
--   * slug_redirects PK is from_slug, with CHECK (from_slug <> to_slug) and
--     kind in (company, product).
--   * companies.publication_status is constrained to draft|review|live.
--   * landscape_candidates.status is constrained to
--     candidate|screening|included|excluded|needs_review.
--
-- Idempotency: every statement is guarded by its own WHERE or ON CONFLICT, so a second
-- run changes 0 rows. The guard block below checks identity invariants only -- things
-- that are equally true before and after the transaction -- so it does not fire on a
-- rerun. Mutable state is handled by the WHERE clauses.

begin;

-- -----------------------------------------------------------------------------
-- Step 0. Identity guard. Refuse to run against a drifted database.
-- -----------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from companies
   where (id, name) in (
     ('8517768e-5a14-4ac2-8296-692a39e2a0a0'::uuid, 'Exail'),
     ('92299e36-58f5-4c27-9486-20bae0ab2d26'::uuid, 'ECA Group / Infotron'));
  if n <> 2 then raise exception
    'Guard failed: the Exail and ECA Group / Infotron records are not both present under the reviewed ids and names (found %).', n; end if;

  select count(*) into n from sectors
   where (id, slug::text) in (
     ('157db255-fce0-48ca-bf3a-6724f67aba5d'::uuid, 'eco-navigation'),
     ('e73703e1-38b0-4bee-beea-ac1a3d8d2582'::uuid, 'eco-components'));
  if n <> 2 then raise exception
    'Guard failed: the Navigation / GNSS and Components sectors are not both present under the reviewed ids (found %).', n; end if;

  select count(*) into n from products
   where id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354' and name = 'IT180 STH-U';
  if n <> 1 then raise exception 'Guard failed: the IT180 STH-U product row is missing or renamed.'; end if;

  -- The destination slug must be unambiguous, because six redirect and alias targets
  -- point at it by name rather than by id.
  select count(*) into n from companies where slug::text = 'exail';
  if n <> 1 then raise exception 'Guard failed: slug "exail" is not held by exactly one company (found %).', n; end if;
end $$;

-- -----------------------------------------------------------------------------
-- Steps 1-2. Taxonomy. The real mechanical blocker: Exail has zero company_sectors
-- rows, and buildLandscape() skips any company with no explicit assignment
-- (`if (!explicit.length) continue;`), so flipping the verdict alone would leave the
-- site and the database disagreeing.
--
-- Both sectors sit under uav-ecosystem -> uav, so buildLandscape's domain() resolves
-- them to the `uav` root and they count for membership. Verified by precedent: SBG
-- Systems is `included` carrying these two rows and NO `uav` row.
--
-- Deliberately NOT adding the `uav` domain row that ECA carried. Exail is not an
-- aerial UAV OEM and the record must not imply it. The IT180's own product-level
-- taxonomy (14 product_taxonomy rows) is untouched and keeps it correctly classified.
-- -----------------------------------------------------------------------------
insert into company_sectors
  (company_id, sector_id, is_primary, confidence, source_urls, assigned_by, assigned_at, note)
values
  ('8517768e-5a14-4ac2-8296-692a39e2a0a0', '157db255-fce0-48ca-bf3a-6724f67aba5d', true,  'high',
   array['https://www.exail.com/news/exail-to-equip-airbus-sirtap-tactical-uas-with-advanced-inertial-navigation-technology',
         'https://www.exail.com/product-range'],
   'editor', now(),
   'Batch 16 Exail admission. UmiX-40 IMU selected for the navigation system of Airbus''s SIRTAP tactical UAS (12 May 2025); Defense product line "Land and air navigation & pointing" covers INS, IMUs and stabilised platforms. Mirrors SBG Systems.'),
  ('8517768e-5a14-4ac2-8296-692a39e2a0a0', 'e73703e1-38b0-4bee-beea-ac1a3d8d2582', false, 'high',
   array['https://www.exail.com/news/exail-to-equip-airbus-sirtap-tactical-uas-with-advanced-inertial-navigation-technology',
         'https://www.exail.com/product-range'],
   'editor', now(),
   'Batch 16 Exail admission. Inertial measurement units and navigation systems supplied into third-party airborne platforms.')
on conflict (company_id, sector_id) do nothing;

-- -----------------------------------------------------------------------------
-- Step 3. Exail's landscape verdict, with the reasoning and the sources in the note,
-- and worded so it can never later be read as a claim that Exail builds aircraft.
-- -----------------------------------------------------------------------------
update landscape_candidates set
  status = 'included',
  screening_note = 'Batch 16, 2026-10-31: admitted as a UAV-ecosystem supplier on the Navigation / GNSS limb, NOT as an aerial UAV OEM. Evidence: Exail and Grafinta were selected to supply the UmiX-40 IMU for the navigation system of Airbus''s SIRTAP tactical unmanned aerial system, for navigation in GNSS-denied conditions throughout all phases of flight (exail.com newsroom, 12 May 2025); Exail''s product range carries a Defense category "Land and air navigation & pointing" covering INS, IMUs and stabilised platforms. This reverses the Batch 01 exclusion, which applied an "is it an aerial UAV OEM" test the landscape does not apply to other ecosystem suppliers: SBG Systems (France, eco-navigation primary + eco-components) and Civitanavi Systems are both included on the same basis, and SBG carries no uav domain row either. What is NOT claimed: Exail builds no aerial platform - its product range has no UAV or aerial category - and the IT180 STH-U this record now holds is inherited Infotron lineage from the merged ECA Group / Infotron record, not a currently marketed Exail line.',
  screened_at = now(),
  updated_at = now()
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and status = 'excluded';

-- -----------------------------------------------------------------------------
-- Steps 4-5. Move the IT180 STH-U to Exail in BOTH places ownership is stored.
-- The generator reads products.company_id only, but product_companies is kept in step
-- so the two never disagree.
--
-- The public URL does not move: the generated product slug comes from the product NAME
-- (slugify(row.Name, bucket)), and neither the name nor the category changes, so
-- /uav/it180-sth-u/ is unaffected. The product keeps its 14 product_taxonomy rows,
-- its specs and its description, which carry the Infotron origin, the contra-rotating
-- coaxial rotors and the 1.8 m airframe - the only substantive description in the
-- cluster. Nothing about the row but its owner changes.
-- -----------------------------------------------------------------------------
update products set
  company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0',
  updated_at = now()
where id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26';

-- PK is (product_id, company_id, role), so this is an update of part of the key. The
-- NOT EXISTS makes it safe if a manufacturer row for Exail were ever added first.
update product_companies set
  company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
where product_id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and role = 'manufacturer'
  and not exists (
    select 1 from product_companies pc
     where pc.product_id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
       and pc.company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
       and pc.role = 'manufacturer');

-- -----------------------------------------------------------------------------
-- Steps 6-8. Aliases. These are MOVED, not copied, and that matters.
--
-- company_aliases is UNIQUE (company_id, alias) -- per company, not globally -- so the
-- same alias may legally sit on two companies. But resolve-entities.mjs fetches
-- companies and company_aliases with NO publication_status filter, and
-- buildCompanyIndex's exact map is first-write-wins (`if (!exact.has(key))`). If both
-- the retired ECA row and Exail held "ECA Group", future news mentioning ECA Group
-- would resolve to whichever alias row the fetch happened to return first - i.e.
-- non-deterministically, and possibly onto a draft record. So ECA's alias is deleted.
--
-- The audit trail does not depend on it: the ECA row itself survives, with its
-- landscape rows, its screening note, and the merged_with relationship in step 14.
-- An alias is a routing-table entry, not history.
-- -----------------------------------------------------------------------------
insert into company_aliases (company_id, alias, type) values
  ('8517768e-5a14-4ac2-8296-692a39e2a0a0', 'ECA Group', 'former_name'),
  ('8517768e-5a14-4ac2-8296-692a39e2a0a0', 'Infotron',  'former_name')
on conflict (company_id, alias) do nothing;

delete from company_aliases
 where company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
   and alias = 'ECA Group';

-- -----------------------------------------------------------------------------
-- Steps 9-10. Redirects, without building a chain.
--
-- `eca-group -> eca-group-infotron` already exists from the Batch 14 merge. Adding
-- `eca-group-infotron -> exail` on its own would leave eca-group pointing at a retired
-- slug via a second hop, and the generator emits a canonical + meta-refresh stub, not a
-- 301 - GitHub Pages cannot chain. So eca-group is repointed straight at exail first.
--
-- The eca-group-infotron stub is only safe because step 11 stops that company page
-- being built: the generator writes real pages first and skips any redirect whose
-- directory already holds an index.html. If ECA stayed live, this stub would be skipped
-- with a warning and the URL would keep serving the duplicate.
-- -----------------------------------------------------------------------------
update slug_redirects set to_slug = 'exail'
 where from_slug = 'eca-group' and to_slug = 'eca-group-infotron';

insert into slug_redirects (from_slug, to_slug, kind, reason) values
  ('eca-group-infotron', 'exail', 'company',
   'Batch 16: duplicate retired, merged into Exail')
on conflict (from_slug) do nothing;

-- -----------------------------------------------------------------------------
-- Steps 11-13. Retire the duplicate, preserving its history.
--
-- NOTE a deliberate divergence from section 7 of the re-screen report, which said
-- "Delete the ECA row". The instruction requires the audit history to be preserved, so
-- nothing is deleted: the company row goes to draft and both landscape rows go to
-- excluded with an explanatory note. Either change alone would drop it from the
-- landscape count (buildLandscape requires publication_status='live' AND status
-- 'included'); both are applied so the retirement is explicit in each place.
-- -----------------------------------------------------------------------------
update companies set
  publication_status = 'draft',
  updated_at = now()
where id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and publication_status = 'live';

update landscape_candidates set
  status = 'excluded',
  screening_note = 'Batch 16, 2026-10-31: retired as a duplicate and merged into Exail (8517768e-5a14-4ac2-8296-692a39e2a0a0). ECA Group joined iXblue to form Exail in 2022; Exail now carries the landscape verdict for this entity, admitted on the Navigation / GNSS limb. The IT180 STH-U moved to Exail in both products.company_id and product_companies; the ECA Group and Infotron aliases moved with it; slug_redirects sends both eca-group and eca-group-infotron to exail. This row and its history are kept deliberately for audit - publication_status is draft, so it no longer renders. Previous verdict: included (Batch 14).',
  screened_at = now(),
  updated_at = now()
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'included';

-- The second landscape edition. Not covered by the re-screen report, found during this
-- validation: all four cluster records carry an unscreened `candidate` row in
-- europe-cuas-2026. Left as `candidate`, this retired duplicate stays queued for a
-- future C-UAS screening pass and could be re-admitted. Excluded here with a pointer.
-- Exail's own europe-cuas-2026 candidate row is deliberately NOT touched: C-UAS
-- admission is a separate question on separate (and weaker) evidence.
update landscape_candidates set
  status = 'excluded',
  screening_note = 'Batch 16, 2026-10-31: retired as a duplicate, merged into Exail (8517768e-5a14-4ac2-8296-692a39e2a0a0). Was an unscreened candidate in this edition; excluded so the duplicate cannot be re-admitted by a later C-UAS pass. See the europe-uav-cuas-2026 row for the merge detail.',
  screened_at = now(),
  updated_at = now()
where landscape_slug = 'europe-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'candidate';

-- -----------------------------------------------------------------------------
-- Step 14. ADDED DURING PREPARATION, not in the original plan. Records the merge as
-- structured lineage instead of prose in a screening note. Invisible publicly -- the
-- catalogue generator reads neither company_relationships nor company_aliases.
-- Strike this step if unwanted; nothing else in the transaction depends on it.
-- -----------------------------------------------------------------------------
insert into company_relationships
  (source_company_id, target_company_id, type, started_year, note)
values
  ('92299e36-58f5-4c27-9486-20bae0ab2d26', '8517768e-5a14-4ac2-8296-692a39e2a0a0',
   'merged_with', 2022,
   'ECA Group merged with iXblue to form Exail in 2022. This catalogue record was retired as a duplicate in Batch 16 (2026-10-31) and its IT180 STH-U product, aliases and slug redirects moved to Exail.')
on conflict (source_company_id, target_company_id, type) do nothing;

-- -----------------------------------------------------------------------------
-- Verification. Expected on a first run, all on one row:
--   exail_sectors=2  exail_landscape=included  eca_publication=draft
--   eca_uav_landscape=excluded  eca_cuas_landscape=excluded
--   it180_owner=Exail  it180_pc=Exail  exail_aliases_added=2  eca_alias_left=0
--   eca_group_redirect=exail  eca_group_infotron_redirect=exail  merge_rel=1
--   landscape_count=567
-- -----------------------------------------------------------------------------
with recursive anc as (
  select id as sector_id, id as node, parent_id from sectors
  union all
  select a.sector_id, s.id, s.parent_id from anc a join sectors s on s.id = a.parent_id),
domained as (
  select distinct a.sector_id from anc a join sectors r on r.id=a.node
   where r.slug::text in ('uav','counter-uas'))
select
  (select count(*) from company_sectors where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0') as exail_sectors,
  (select status from landscape_candidates where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and landscape_slug='europe-uav-cuas-2026') as exail_landscape,
  (select publication_status from companies where id='92299e36-58f5-4c27-9486-20bae0ab2d26') as eca_publication,
  (select status from landscape_candidates where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and landscape_slug='europe-uav-cuas-2026') as eca_uav_landscape,
  (select status from landscape_candidates where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and landscape_slug='europe-cuas-2026') as eca_cuas_landscape,
  (select c.name from products p join companies c on c.id=p.company_id where p.id='3b53c4ed-299e-4621-9d1a-a93d0ba47354') as it180_owner,
  (select c.name from product_companies pc join companies c on c.id=pc.company_id where pc.product_id='3b53c4ed-299e-4621-9d1a-a93d0ba47354') as it180_pc,
  (select count(*) from company_aliases where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and alias in ('ECA Group','Infotron')) as exail_aliases_added,
  (select count(*) from company_aliases where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26') as eca_alias_left,
  (select to_slug from slug_redirects where from_slug='eca-group') as eca_group_redirect,
  (select to_slug from slug_redirects where from_slug='eca-group-infotron') as eca_group_infotron_redirect,
  (select count(*) from company_relationships where source_company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and target_company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and type='merged_with') as merge_rel,
  (select count(*) from companies c
     left join landscape_candidates lc on lc.company_id=c.id and lc.landscape_slug='europe-uav-cuas-2026'
    where c.publication_status='live' and lc.status='included' and c.slug::text<>''
      and c.hq_country in (select name from countries where is_landscape_scope)
      and exists (select 1 from company_sectors cs where cs.company_id=c.id and cs.sector_id in (select sector_id from domained))
  ) as landscape_count;

commit;
