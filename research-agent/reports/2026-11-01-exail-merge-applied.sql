-- =============================================================================
-- Exail admission + ECA Group / Infotron merge + description + category fixes.
-- APPLIED 2026-11-01 under Nazar's written authorisation (three items: the reviewed
-- admission and merge with the merged_with lineage row and the retirement of ECA's
-- duplicate entries in both landscape editions; the description proposed in section
-- 8.1 of the merge review; category-only corrections for the products whose
-- maritime / non-aerial identity is supported by evidence).
--
-- One atomic transaction, 17 steps. Either all land or none do.
--
-- Rebased on the live database of 2026-11-01, AFTER the European hub import and the
-- investor reconciliation. The 2026-10-31 package's counts are stale: live companies
-- are 2,458 today, not 2,447. Identity, taxonomy and relationship state are unchanged.
--
-- Scope, and what is deliberately OUT of it:
--   OUT: product deduplication (H-8 / H-9 / O-16), retirement of the DriX and Oryx
--        family records, every product RENAME, every publication-status change,
--        Exail A27 (no source names it), DORCUS ownership, iXblue, Exail Robotics,
--        the Groupe Gorge / Exail Technologies parent restructuring, and the 21
--        non-Exail products that carry the same "not an aerial system" taxonomy flag.
--
-- Schema re-verified against the live database today, not assumed:
--   * company_relationships uses source_company_id / target_company_id.
--   * product_companies PK is (product_id, company_id, role) -- three columns.
--   * landscape_candidates PK is (landscape_slug, company_id); note column is
--     screening_note.
--   * company_sectors PK is (company_id, sector_id); assigned_by editor|llm|import|seed.
--   * company_aliases.alias is citext, UNIQUE (company_id, alias) -- per company.
--   * slug_redirects PK is from_slug; kind in (company, product); from_section added
--     by migration slug_redirects_from_section today, and the not-self CHECK relaxed
--     to `from_slug <> to_slug OR from_section is not null`.
--   * products.category CHECK allows UAV|Sensor|Counter-UAS|Effector|Software|Other.
--
-- RUNTIME behaviour PREPARE cannot prove, found today and verified by a dry run:
--   * companies and products both carry a BEFORE UPDATE trigger (set_updated_at) that
--     overwrites updated_at with now(). The explicit `updated_at = now()` below is
--     therefore redundant but harmless -- and the ROLLBACK's restored timestamps are
--     NOT honoured, so rollback restores content, not the original updated_at.
--   * company_sectors carries BEFORE INSERT company_sectors_skip_derivable (silently
--     drops a row implied by a more specific one -- bypassed here because both rows
--     carry source_urls) and AFTER INSERT company_sectors_prune_implied (deletes an
--     implied ancestor row -- a no-op here: Exail had zero sector rows and the two new
--     rows are siblings). A dry run confirmed exail_sectors = 2, so neither fires.
--
-- Idempotency: every statement is guarded by its own WHERE or ON CONFLICT, so a
-- second run changes 0 rows. The step-0 guard checks identity invariants only --
-- things equally true before and after -- so it does not fire on a rerun.
-- =============================================================================

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

  -- The eleven products whose category is corrected must all still be live Exail rows
  -- categorised UAV under the reviewed names. Any drift and the whole batch refuses.
  select count(*) into n from products
   where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
     and publication_status = 'live' and category = 'UAV'
     and (id, name) in (
       ('1de976af-ff68-498c-b855-7c9ac2514e4d'::uuid, 'A-18M'),
       ('c87b1319-f15d-48d3-a7fd-a09a49893e57'::uuid, 'DriX'),
       ('b9f83dc2-3ae3-4ef0-9be1-349000e17688'::uuid, 'DriX H-8'),
       ('2dbd66ec-3f36-4a0a-87ff-0561e2bed85e'::uuid, 'DriX O-16'),
       ('e38073ce-dce9-4c86-b5cd-9214cad0963e'::uuid, 'H-8'),
       ('9511089c-3fcf-4cc8-b884-acfb13c6a97d'::uuid, 'H-9'),
       ('3e1dcc70-b839-4a78-a87b-d9dbe3678205'::uuid, 'Inspector'),
       ('6efaadb9-8c45-4695-ac50-49e3fdba53b0'::uuid, 'K-Ster'),
       ('b9dbf15b-ce58-4fa5-afa2-751c96ec1d6e'::uuid, 'Neptis'),
       ('0aa9487c-aa91-4bb2-be9c-68b3c3f6df62'::uuid, 'O-16'),
       ('8b1f6503-d1cc-416f-ad98-c39dce97115f'::uuid, 'Oryx'));
  if n <> 11 then raise exception
    'Guard failed: expected 11 live Exail UAV products under the reviewed ids and names, found %.', n; end if;

  -- The redirect table must be able to express a same-slug cross-section redirect.
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='slug_redirects'
                    and column_name='from_section') then
    raise exception 'Guard failed: slug_redirects.from_section is missing - run migration slug_redirects_from_section first.'; end if;
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
--
-- source_urls are also what makes these rows survive company_sectors_skip_derivable.
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
-- Step 14. Records the merge as structured lineage instead of prose in a screening
-- note. Invisible publicly -- the catalogue generator reads neither
-- company_relationships nor company_aliases. Authorised explicitly.
-- -----------------------------------------------------------------------------
insert into company_relationships
  (source_company_id, target_company_id, type, started_year, note)
values
  ('92299e36-58f5-4c27-9486-20bae0ab2d26', '8517768e-5a14-4ac2-8296-692a39e2a0a0',
   'merged_with', 2022,
   'ECA Group merged with iXblue to form Exail in 2022. This catalogue record was retired as a duplicate in Batch 16 (2026-10-31) and its IT180 STH-U product, aliases and slug redirects moved to Exail.')
on conflict (source_company_id, target_company_id, type) do nothing;

-- -----------------------------------------------------------------------------
-- Step 15. The description, approved from section 8.1 of the merge review.
--
-- Without it this merge would lose a described landscape member (ECA's 134 characters)
-- and gain a blank one: buildLandscape emits `description: c.description || ''`, so
-- Exail's empty description renders as an empty string on the public map.
-- Guarded on `description is null` so it can never overwrite later editorial wording.
-- -----------------------------------------------------------------------------
update companies set
  description = 'French navigation, robotics and photonics group formed in 2022 by the merger of ECA Group and iXblue. Supplies inertial navigation systems and IMUs for airborne, land and naval platforms — including the UmiX-40 IMU selected for the navigation system of Airbus''s SIRTAP tactical UAS — alongside uncrewed surface and underwater vehicles.',
  updated_at = now()
where id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and description is null;

-- -----------------------------------------------------------------------------
-- Step 16. Category-only corrections. Eleven of Exail's twelve UAV-categorised
-- products are not aerial vehicles. CATEGORY ONLY: no rename, no publication change,
-- no ownership change, no deduplication, no retirement, and product_taxonomy is left
-- exactly as it is.
--
-- Evidence per record, and why each clears the authorised test:
--   A-18M      - A18-M autonomous UNDERWATER vehicle, mine countermeasures.
--   DriX H-8   - DriX H-8 uncrewed SURFACE vessel, 7.71 m / 1.6 t; product_taxonomy
--                carries "diesel, 550 L fuel capacity" and "max 14 kn".
--   DriX O-16  - DriX O-16 USV, 15.75 m / 10.5 t; taxonomy note on this very row reads
--                "filed under category UAV but is not an aerial system - verify
--                category", and a sibling note "3,500 nmi transoceanic range".
--   Inspector  - Inspector 125 / 90 SURFACE vessel. (Name left as "Inspector".)
--   K-Ster     - K-Ster C expendable mine-disposal ROV; the record's own summary says
--                "expendable mine-disposal system ... autonomous mine countermeasures".
--   Neptis     - maritime surveillance SYSTEM launched 9 Oct 2026, built on Oryx USVs;
--                the record's own summary says so.
--   DriX, Oryx - USV SERIES names. Whether a family record should exist at all is a
--                separate, unauthorised question; it is maritime either way, so the
--                category correction is orthogonal to it and both records stay.
--   H-8, H-9,  - bare designations. Which family they belong to is genuinely ambiguous
--   O-16         (DriX and Oryx reuse the same designations) and they are very likely
--                prefix-stripped duplicates - BOTH of which are unauthorised questions
--                and left untouched. But every candidate identity is an uncrewed
--                SURFACE vessel, so the non-aerial fact is settled regardless, and the
--                ambiguity does not touch the category.
--
-- Held back deliberately:
--   Exail A27  - no source anywhere names this product, so its identity cannot be
--                established at all and its category is not corrected.
--   DORCUS     - categorised Counter-UAS and not an Exail product (a SOFRAME / MAC JEE
--                vehicle in which Exail supplies navigation). That is an OWNERSHIP
--                question, explicitly left pending.
--
-- URL consequence, handled in step 17: these pages move from /uav/<slug>/ to
-- /other/<slug>/. Verified beforehand - each slug is unique within /uav/ (so no other
-- product's -2 suffix shifts when these leave) and free within /other/ (so none of the
-- eleven lands on a -2 suffix of its own).
-- -----------------------------------------------------------------------------
update products set category = 'Other', updated_at = now()
where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and category = 'UAV'
  and id in (
    '1de976af-ff68-498c-b855-7c9ac2514e4d',  -- A-18M
    'c87b1319-f15d-48d3-a7fd-a09a49893e57',  -- DriX
    'b9f83dc2-3ae3-4ef0-9be1-349000e17688',  -- DriX H-8
    '2dbd66ec-3f36-4a0a-87ff-0561e2bed85e',  -- DriX O-16
    'e38073ce-dce9-4c86-b5cd-9214cad0963e',  -- H-8
    '9511089c-3fcf-4cc8-b884-acfb13c6a97d',  -- H-9
    '3e1dcc70-b839-4a78-a87b-d9dbe3678205',  -- Inspector
    '6efaadb9-8c45-4695-ac50-49e3fdba53b0',  -- K-Ster
    'b9dbf15b-ce58-4fa5-afa2-751c96ec1d6e',  -- Neptis
    '0aa9487c-aa91-4bb2-be9c-68b3c3f6df62',  -- O-16
    '8b1f6503-d1cc-416f-ad98-c39dce97115f'); -- Oryx

-- -----------------------------------------------------------------------------
-- Step 17. Preserve the eleven old product URLs.
--
-- A product page lives at /<section>/<slug>/, where the section comes from
-- products.category and the slug from the product NAME. Correcting the category moves
-- the page without changing the slug, so each old url and its new one differ only in
-- the section: /uav/drix-h-8/ becomes /other/drix-h-8/.
--
-- from_section (added today) tells the generator which section the stub belongs in.
-- Without it the generator wrote every stub beside its TARGET, so a same-slug stub
-- landed on top of the live page it pointed at and was skipped -- and the old
-- `from_slug <> to_slug` CHECK rejected the row outright.
-- -----------------------------------------------------------------------------
insert into slug_redirects (from_slug, to_slug, kind, from_section, reason) values
  ('a-18m',     'a-18m',     'product', 'uav', 'Batch 16: category corrected UAV -> Other (A18-M autonomous underwater vehicle); page moved to /other/'),
  ('drix',      'drix',      'product', 'uav', 'Batch 16: category corrected UAV -> Other (DriX uncrewed surface vessel series); page moved to /other/'),
  ('drix-h-8',  'drix-h-8',  'product', 'uav', 'Batch 16: category corrected UAV -> Other (DriX H-8 uncrewed surface vessel); page moved to /other/'),
  ('drix-o-16', 'drix-o-16', 'product', 'uav', 'Batch 16: category corrected UAV -> Other (DriX O-16 uncrewed surface vessel); page moved to /other/'),
  ('h-8',       'h-8',       'product', 'uav', 'Batch 16: category corrected UAV -> Other (uncrewed surface vessel designation); page moved to /other/'),
  ('h-9',       'h-9',       'product', 'uav', 'Batch 16: category corrected UAV -> Other (uncrewed surface vessel designation); page moved to /other/'),
  ('inspector', 'inspector', 'product', 'uav', 'Batch 16: category corrected UAV -> Other (Inspector 125 / 90 surface vessel); page moved to /other/'),
  ('k-ster',    'k-ster',    'product', 'uav', 'Batch 16: category corrected UAV -> Other (K-Ster C expendable mine-disposal ROV); page moved to /other/'),
  ('neptis',    'neptis',    'product', 'uav', 'Batch 16: category corrected UAV -> Other (maritime surveillance system built on Oryx USVs); page moved to /other/'),
  ('o-16',      'o-16',      'product', 'uav', 'Batch 16: category corrected UAV -> Other (uncrewed surface vessel designation); page moved to /other/'),
  ('oryx',      'oryx',      'product', 'uav', 'Batch 16: category corrected UAV -> Other (Oryx uncrewed surface vessel family); page moved to /other/')
on conflict (from_slug) do nothing;

-- -----------------------------------------------------------------------------
-- Verification. Expected on a first run, all on one row:
--   exail_sectors=2  exail_landscape=included  eca_publication=draft
--   eca_uav_landscape=excluded  eca_cuas_landscape=excluded
--   it180_owner=Exail  it180_pc=Exail  exail_aliases_added=2  eca_alias_left=0
--   eca_group_redirect=exail  eca_group_infotron_redirect=exail  merge_rel=1
--   exail_desc_len=335  exail_uav_products=2  exail_other_products=13
--   (exail_uav_products is 2, not 1: the IT180 STH-U arriving from ECA, plus Exail A27,
--    whose category is deliberately not corrected because no source names the product.)
--   product_redirects=11  landscape_count=567
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
  (select length(description) from companies where id='8517768e-5a14-4ac2-8296-692a39e2a0a0') as exail_desc_len,
  (select count(*) from products where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and publication_status='live' and category='UAV') as exail_uav_products,
  (select count(*) from products where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and publication_status='live' and category='Other') as exail_other_products,
  (select count(*) from slug_redirects where kind='product' and from_section='uav') as product_redirects,
  (select count(*) from slug_redirects) as redirects_total,
  (select count(*) from companies where publication_status='live') as live_companies,
  (select count(*) from products where publication_status='live') as live_products,
  (select count(*) from products where publication_status='live' and category='UAV') as uav_products,
  (select count(*) from products where publication_status='live' and category='Other') as other_products,
  (select count(*) from companies c
     left join landscape_candidates lc on lc.company_id=c.id and lc.landscape_slug='europe-uav-cuas-2026'
    where c.publication_status='live' and lc.status='included' and c.slug::text<>''
      and c.hq_country in (select name from countries where is_landscape_scope)
      and exists (select 1 from company_sectors cs where cs.company_id=c.id and cs.sector_id in (select sector_id from domained))
  ) as landscape_count;

commit;
