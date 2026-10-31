-- =============================================================================
-- Rollback for the Exail admission + ECA Group / Infotron merge.
-- Restores the exact values captured on 2026-10-31 before the apply, including the
-- original timestamps, so the records return to byte-identical state rather than
-- merely to equivalent state.
-- =============================================================================
--
-- Run as one transaction. Guarded and idempotent: a second run changes 0 rows.
-- Nothing here deletes anything the merge did not create.
--
-- One caveat. company_aliases.id is a gen_random_uuid() surrogate, so the restored
-- ECA Group alias row gets a NEW id. No table references company_aliases.id, so this
-- is immaterial -- but it means the rollback is identical in content, not in that key.

begin;

-- Guard: do not run against a database where the merge was never applied, or where
-- something else has since taken over these records.
do $$
declare n int;
begin
  select count(*) into n from companies
   where (id, name) in (
     ('8517768e-5a14-4ac2-8296-692a39e2a0a0'::uuid, 'Exail'),
     ('92299e36-58f5-4c27-9486-20bae0ab2d26'::uuid, 'ECA Group / Infotron'));
  if n <> 2 then raise exception
    'Guard failed: the two records are not both present under the reviewed ids and names (found %).', n; end if;
end $$;

-- 1-2. Remove the two taxonomy rows the merge added. Exail had ZERO company_sectors
--      rows before, so this restores it to none. Deliberately scoped to the two
--      sector ids, never a blanket delete on the company.
delete from company_sectors
 where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and sector_id in ('157db255-fce0-48ca-bf3a-6724f67aba5d',
                     'e73703e1-38b0-4bee-beea-ac1a3d8d2582');

-- 3. Exail's landscape verdict, back to the Batch 01 exclusion verbatim.
update landscape_candidates set
  status = 'excluded',
  priority = 1,
  screening_note = 'Batch 01: queued products (DriX, A-18M, DORCUS) are maritime/underwater. UMIS integrates third-party UAVs rather than establishing Exail as an aerial UAV OEM. Outside the aerial Landscape until Exail-owned aerial evidence appears.',
  screened_at = '2026-10-26 20:15:53.106783+00',
  updated_at = '2026-10-26 13:19:34.192844+00'
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and status = 'included';

-- 4-5. IT180 STH-U back to ECA Group / Infotron, in both places, with its original
--      updated_at. The name, slug, category, specs, description and all 14
--      product_taxonomy rows were never touched, so nothing else needs restoring and
--      /uav/it180-sth-u/ is unaffected in either direction.
update products set
  company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26',
  updated_at = '2026-10-22 12:18:02.298936+00'
where id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
  and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0';

update product_companies set
  company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
where product_id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
  and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and role = 'manufacturer'
  and not exists (
    select 1 from product_companies pc
     where pc.product_id = '3b53c4ed-299e-4621-9d1a-a93d0ba47354'
       and pc.company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
       and pc.role = 'manufacturer');

-- 6-8. Aliases back where they were: both removed from Exail, ECA Group restored to
--      ECA with its original type `aka` (NOT former_name - that was the merge's
--      wording for Exail's copy).
delete from company_aliases
 where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and alias in ('ECA Group', 'Infotron');

insert into company_aliases (company_id, alias, type) values
  ('92299e36-58f5-4c27-9486-20bae0ab2d26', 'ECA Group', 'aka')
on conflict (company_id, alias) do nothing;

-- 9-10. Redirects back to the Batch 14 shape: eca-group points at eca-group-infotron
--       again, and the eca-group-infotron row the merge created is removed. Guarded on
--       to_slug so it cannot clobber a redirect someone else has since repointed.
update slug_redirects set to_slug = 'eca-group-infotron'
 where from_slug = 'eca-group' and to_slug = 'exail';

delete from slug_redirects
 where from_slug = 'eca-group-infotron' and to_slug = 'exail' and kind = 'company';

-- 11. ECA back to live, with its original updated_at.
update companies set
  publication_status = 'live',
  updated_at = '2026-10-28 21:36:00.533242+00'
where id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and publication_status = 'draft';

-- 12. ECA's europe-uav-cuas-2026 verdict, back to the Batch 14 inclusion verbatim.
update landscape_candidates set
  status = 'included',
  priority = 3,
  screening_note = 'Batch 14: the duplicate record ECA Group was merged into this one, which holds the IT180 UAV lineage. ECA Group joined iXblue to form Exail in 2022; Exail is recorded separately and excluded as maritime, and that distinction was kept.',
  screened_at = '2026-10-28 21:39:44.678828+00',
  updated_at = '2026-10-28 21:39:44.678828+00'
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'excluded';

-- 13. ECA's europe-cuas-2026 row, back to an unscreened candidate with no note.
update landscape_candidates set
  status = 'candidate',
  priority = 0,
  screening_note = null,
  screened_at = null,
  updated_at = '2026-10-22 14:49:22.224606+00'
where landscape_slug = 'europe-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'excluded';

-- 14. Remove the merged_with lineage row the merge added.
delete from company_relationships
 where source_company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
   and target_company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and type = 'merged_with';

-- Verification. Expected after a successful rollback:
--   exail_sectors=0  exail_landscape=excluded  eca_publication=live
--   eca_uav_landscape=included  eca_cuas_landscape=candidate
--   it180_owner=ECA Group / Infotron  exail_merge_aliases=0  eca_aliases=1
--   eca_group_redirect=eca-group-infotron  eca_group_infotron_redirect=NULL
--   merge_rel=0  landscape_count=567
select
  (select count(*) from company_sectors where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0') as exail_sectors,
  (select status from landscape_candidates where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and landscape_slug='europe-uav-cuas-2026') as exail_landscape,
  (select publication_status from companies where id='92299e36-58f5-4c27-9486-20bae0ab2d26') as eca_publication,
  (select status from landscape_candidates where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and landscape_slug='europe-uav-cuas-2026') as eca_uav_landscape,
  (select status from landscape_candidates where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and landscape_slug='europe-cuas-2026') as eca_cuas_landscape,
  (select c.name from products p join companies c on c.id=p.company_id where p.id='3b53c4ed-299e-4621-9d1a-a93d0ba47354') as it180_owner,
  (select count(*) from company_aliases where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and alias in ('ECA Group','Infotron')) as exail_merge_aliases,
  (select count(*) from company_aliases where company_id='92299e36-58f5-4c27-9486-20bae0ab2d26') as eca_aliases,
  (select to_slug from slug_redirects where from_slug='eca-group') as eca_group_redirect,
  (select to_slug from slug_redirects where from_slug='eca-group-infotron') as eca_group_infotron_redirect,
  (select count(*) from company_relationships where source_company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and target_company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and type='merged_with') as merge_rel;

commit;
