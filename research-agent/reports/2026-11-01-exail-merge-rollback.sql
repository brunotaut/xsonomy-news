-- =============================================================================
-- Rollback for the Exail admission + ECA Group / Infotron merge + description +
-- category corrections applied on 2026-11-01.
--
-- Supersedes 2026-10-31-exail-merge-rollback.sql, which covers only the first 14
-- steps and does NOT undo the description, the eleven category corrections or the
-- eleven product redirects. Use this file, not that one.
-- =============================================================================
--
-- Run as one transaction. Guarded and idempotent: a second run changes 0 rows.
-- Nothing here deletes anything the merge did not create.
--
-- TWO CAVEATS, both verified against the live database rather than assumed:
--
-- 1. updated_at is NOT restored. companies and products each carry a BEFORE UPDATE
--    trigger (set_updated_at) that overwrites updated_at with now() on every write.
--    The original timestamps are quoted below for the record, and the statements set
--    them, but the trigger wins. The 2026-10-31 rollback file claimed byte-identical
--    restoration including timestamps; that claim was wrong. This rollback restores
--    CONTENT exactly, and leaves a fresh updated_at behind.
--
-- 2. company_aliases.id is a gen_random_uuid() surrogate, so the restored ECA Group
--    alias row gets a NEW id. No table references company_aliases.id, so this is
--    immaterial -- but again, identical in content, not in that key.
--
-- The migration that added slug_redirects.from_section is deliberately NOT reverted.
-- It is additive and nullable, every pre-existing row is unaffected by it, and the
-- relaxed not-self CHECK is strictly more permissive. Reverting it would mean
-- dropping a column; if that is ever wanted it is a separate, deliberate step:
--    alter table public.slug_redirects drop constraint slug_redirects_not_self;
--    alter table public.slug_redirects add constraint slug_redirects_not_self
--      check (from_slug <> to_slug);
--    alter table public.slug_redirects drop column from_section;
-- and it will fail until step R17 below has removed the eleven same-slug rows.

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

-- R1-R2. Remove the two taxonomy rows the merge added. Exail had ZERO company_sectors
--        rows before, so this restores it to none. Deliberately scoped to the two
--        sector ids, never a blanket delete on the company.
delete from company_sectors
 where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and sector_id in ('157db255-fce0-48ca-bf3a-6724f67aba5d',
                     'e73703e1-38b0-4bee-beea-ac1a3d8d2582');

-- R3. Exail's landscape verdict, back to the Batch 01 exclusion verbatim.
--     Original screened_at 2026-10-26 20:15:53.106783+00, updated_at
--     2026-10-26 13:19:34.192844+00. landscape_candidates has no updated-at trigger,
--     so these DO restore.
update landscape_candidates set
  status = 'excluded',
  priority = 1,
  screening_note = 'Batch 01: queued products (DriX, A-18M, DORCUS) are maritime/underwater. UMIS integrates third-party UAVs rather than establishing Exail as an aerial UAV OEM. Outside the aerial Landscape until Exail-owned aerial evidence appears.',
  screened_at = '2026-10-26 20:15:53.106783+00',
  updated_at = '2026-10-26 13:19:34.192844+00'
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and status = 'included';

-- R4-R5. IT180 STH-U back to ECA Group / Infotron, in both places. Original
--        updated_at was 2026-10-22 12:18:02.298936+00 (see caveat 1). The name, slug,
--        category, specs, description and all 14 product_taxonomy rows were never
--        touched, so nothing else needs restoring and /uav/it180-sth-u/ is unaffected
--        in either direction.
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

-- R6-R8. Aliases back where they were: both removed from Exail, ECA Group restored to
--        ECA with its original type `aka` (NOT former_name - that was the merge's
--        wording for Exail's copy).
delete from company_aliases
 where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and alias in ('ECA Group', 'Infotron');

insert into company_aliases (company_id, alias, type) values
  ('92299e36-58f5-4c27-9486-20bae0ab2d26', 'ECA Group', 'aka')
on conflict (company_id, alias) do nothing;

-- R9-R10. Redirects back to the Batch 14 shape: eca-group points at
--         eca-group-infotron again, and the eca-group-infotron row the merge created
--         is removed. Guarded on to_slug so it cannot clobber a redirect someone else
--         has since repointed.
update slug_redirects set to_slug = 'eca-group-infotron'
 where from_slug = 'eca-group' and to_slug = 'exail';

delete from slug_redirects
 where from_slug = 'eca-group-infotron' and to_slug = 'exail' and kind = 'company';

-- R11. ECA back to live. Original updated_at 2026-10-28 21:36:00.533242+00 (caveat 1).
update companies set
  publication_status = 'live',
  updated_at = '2026-10-28 21:36:00.533242+00'
where id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and publication_status = 'draft';

-- R12. ECA's europe-uav-cuas-2026 verdict, back to the Batch 14 inclusion verbatim.
update landscape_candidates set
  status = 'included',
  priority = 3,
  screening_note = 'Batch 14: the duplicate record ECA Group was merged into this one, which holds the IT180 UAV lineage. ECA Group joined iXblue to form Exail in 2022; Exail is recorded separately and excluded as maritime, and that distinction was kept.',
  screened_at = '2026-10-28 21:39:44.678828+00',
  updated_at = '2026-10-28 21:39:44.678828+00'
where landscape_slug = 'europe-uav-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'excluded';

-- R13. ECA's europe-cuas-2026 row, back to an unscreened candidate with no note.
update landscape_candidates set
  status = 'candidate',
  priority = 0,
  screening_note = null,
  screened_at = null,
  updated_at = '2026-10-22 14:49:22.224606+00'
where landscape_slug = 'europe-cuas-2026'
  and company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
  and status = 'excluded';

-- R14. Remove the merged_with lineage row the merge added.
delete from company_relationships
 where source_company_id = '92299e36-58f5-4c27-9486-20bae0ab2d26'
   and target_company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
   and type = 'merged_with';

-- R15. Exail's description back to NULL. It was NULL before, not an empty string.
--      Guarded on the exact text the merge wrote, so it can never blank a description
--      someone has since edited.
update companies set
  description = null,
  updated_at = '2026-10-28 00:06:19.905984+00'
where id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and description = 'French navigation, robotics and photonics group formed in 2022 by the merger of ECA Group and iXblue. Supplies inertial navigation systems and IMUs for airborne, land and naval platforms — including the UmiX-40 IMU selected for the navigation system of Airbus''s SIRTAP tactical UAS — alongside uncrewed surface and underwater vehicles.';

-- R16. The eleven category corrections, back to UAV. Original updated_at per row, for
--      the record (caveat 1 means they are not restored):
--        A-18M      1de976af  2026-10-25 08:59:50.546428+00
--        DriX       c87b1319  2026-10-16 08:48:36.836892+00
--        DriX H-8   b9f83dc2  2026-10-10 10:57:53.43572+00
--        DriX O-16  2dbd66ec  2026-10-27 09:40:09.845199+00
--        H-8        e38073ce  2026-10-10 10:57:53.43572+00
--        H-9        9511089c  2026-10-10 10:57:53.43572+00
--        Inspector  3e1dcc70  2026-10-10 10:57:53.43572+00
--        K-Ster     6efaadb9  2026-10-29 10:44:48.409385+00
--        Neptis     b9dbf15b  2026-10-22 09:13:41.584718+00
--        O-16       0aa9487c  2026-10-10 10:57:53.43572+00
--        Oryx       8b1f6503  2026-10-31 10:14:26.239646+00
--      Guarded on category='Other' so it cannot drag back a record that someone has
--      since moved somewhere else deliberately. DriX H-9 (513779b6) and Oryx O-16
--      (b0d223b9) were ALREADY `Other` before the merge and are deliberately absent.
update products set category = 'UAV'
where company_id = '8517768e-5a14-4ac2-8296-692a39e2a0a0'
  and category = 'Other'
  and id in (
    '1de976af-ff68-498c-b855-7c9ac2514e4d',
    'c87b1319-f15d-48d3-a7fd-a09a49893e57',
    'b9f83dc2-3ae3-4ef0-9be1-349000e17688',
    '2dbd66ec-3f36-4a0a-87ff-0561e2bed85e',
    'e38073ce-dce9-4c86-b5cd-9214cad0963e',
    '9511089c-3fcf-4cc8-b884-acfb13c6a97d',
    '3e1dcc70-b839-4a78-a87b-d9dbe3678205',
    '6efaadb9-8c45-4695-ac50-49e3fdba53b0',
    'b9dbf15b-ce58-4fa5-afa2-751c96ec1d6e',
    '0aa9487c-aa91-4bb2-be9c-68b3c3f6df62',
    '8b1f6503-d1cc-416f-ad98-c39dce97115f');

-- R17. Remove the eleven product redirects. Their whole purpose was to keep the old
--      /uav/ urls alive; with the categories back to UAV the real pages return there
--      and the stubs would collide with them. Scoped by from_section so the one
--      pre-existing product redirect (ax250-gax500-3d -> ax250) is untouched.
delete from slug_redirects
 where kind = 'product' and from_section = 'uav'
   and from_slug in ('a-18m','drix','drix-h-8','drix-o-16','h-8','h-9',
                     'inspector','k-ster','neptis','o-16','oryx');

-- Verification. Expected after a successful rollback:
--   exail_sectors=0  exail_landscape=excluded  eca_publication=live
--   eca_uav_landscape=included  eca_cuas_landscape=candidate
--   it180_owner=ECA Group / Infotron  exail_merge_aliases=0  eca_aliases=1
--   eca_group_redirect=eca-group-infotron  eca_group_infotron_redirect=NULL
--   merge_rel=0  exail_desc_null=true  exail_uav_products=13
--   exail_other_products=2  product_redirects=0  landscape_count=567
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
  (select count(*) from company_relationships where source_company_id='92299e36-58f5-4c27-9486-20bae0ab2d26' and target_company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and type='merged_with') as merge_rel,
  (select description is null from companies where id='8517768e-5a14-4ac2-8296-692a39e2a0a0') as exail_desc_null,
  (select count(*) from products where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and publication_status='live' and category='UAV') as exail_uav_products,
  (select count(*) from products where company_id='8517768e-5a14-4ac2-8296-692a39e2a0a0' and publication_status='live' and category='Other') as exail_other_products,
  (select count(*) from slug_redirects where kind='product' and from_section='uav') as product_redirects;

commit;
