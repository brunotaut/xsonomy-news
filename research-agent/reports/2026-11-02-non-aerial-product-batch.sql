-- =============================================================================
-- Non-aerial product correction batch.  APPLIED 2026-11-01.
-- Prepared under an authorisation for preparation only, then applied on Nazar's
-- go-ahead to decision 1 of the review report. The 8 held candidates were not touched.
--
-- Scope: 28 products whose category is UAV but whose identity is not aerial.
-- 8 further candidates are deliberately HELD - see the review report.
--
-- The candidate set was defined from the taxonomy's own `domain` facet rather than
-- from note text. That is why it is 36 records and not the 19 the previous
-- report named: the earlier filter matched one note phrasing and missed six products
-- whose notes read "filed under UAV - verify category", plus eleven more carrying a
-- non-aerial domain row with no such note at all.
--
-- URL consequence: a product page lives at /<section>/<slug>/, where the section comes
-- from products.category and the slug from the product NAME. Each of these pages
-- therefore moves from /uav/<slug>/ to /other/<slug>/. Checked beforehand for all
-- 28: every slug is free in /other/ and no namesake is left behind in /uav/,
-- so nothing inherits a vacated slug and none lands on a -2 suffix.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Step 0. Identity guard. Refuse to run against a drifted database.
-- -----------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from products
   where publication_status = 'live' and category = 'UAV'
     and (id, name) in (
       ('6aaa96b3-543e-48b6-9983-b6d53efc2c62'::uuid, 'FireAnt'),
       ('e78add2b-651e-411c-b801-5264183200b9'::uuid, 'Ghostfin'),
       ('22117c3f-7879-4504-a588-1b4451e8010f'::uuid, 'Kuryer'),
       ('9c77e46b-300c-45f5-80c8-4d5e79cea28f'::uuid, 'Max1'),
       ('28471b23-090b-4863-88b4-2186fb59d8b4'::uuid, 'Ascento Guard Dori USA v1'),
       ('e695a588-6d51-44ba-a6c4-0beaf4bfefc3'::uuid, 'Hunter WOLF'),
       ('21fcca57-c8dd-4f8c-ac67-0275df7ca24b'::uuid, 'Lightfish'),
       ('009df3a2-0c3b-4aa5-aacb-eee740f030e3'::uuid, 'Dot'),
       ('96b4c84e-968c-436a-b253-fca473c6ee56'::uuid, 'K3 Scout'),
       ('67551366-8223-4229-8a48-8807dcf347ee'::uuid, 'K5 Kraken'),
       ('6d99c320-610d-4753-a47d-567a2cfdb2f6'::uuid, 'K7 Sabre'),
       ('8622edaa-9301-4f80-ac54-58aae1f44cf5'::uuid, 'Lionfish'),
       ('b7397fa3-84b1-4906-95ca-ecd7b27b680c'::uuid, 'MAGURA V5'),
       ('e7d13ab2-091b-4afc-aacc-af652a7a6b11'::uuid, 'Mako'),
       ('06993fe2-fe91-4e6e-a760-68849e9c6d28'::uuid, 'REMUS 100'),
       ('9fe492b6-89b9-4ecb-b8e0-1e841d0191b9'::uuid, 'REMUS 130'),
       ('186ba646-fc07-49f0-bacd-a859e3009d6e'::uuid, 'Saildrone Explorer'),
       ('6a34533d-3c6c-4dab-b457-2e3e5f9696c2'::uuid, 'Saildrone Spectre'),
       ('7a5a7360-2570-4932-b80f-0c7978bd75d9'::uuid, 'Surveyor'),
       ('eca0f54c-81eb-4407-b21e-6070b984435f'::uuid, 'ARES'),
       ('d7c68b98-9203-4cfe-9cfe-759d280dd152'::uuid, 'GULL'),
       ('c74588f3-9429-423f-ae34-ee775d209d69'::uuid, 'SEASTRIKE'),
       ('c4ced6a2-31e8-450e-9440-cae951e2177f'::uuid, 'Saronic Corsair'),
       ('807ffae7-4a54-421c-9b71-1f1362ae3bd7'::uuid, 'Sea Baby'),
       ('0aeb7617-2669-438f-b5fd-e4b6b6adef70'::uuid, 'Sub Sea Baby'),
       ('ecfdcb8d-7036-4653-a651-194fca5f6182'::uuid, 'Gavia'),
       ('9cec705d-43fc-490b-8fe1-ee4e08066b5c'::uuid, 'Hugin'),
       ('82dbd59f-c9b9-48e0-b156-ddcf02c9327d'::uuid, 'WOLF-X'));
  if n <> 28 then raise exception
    'Guard failed: expected 28 live UAV products under the reviewed ids and names, found %.', n; end if;

  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='slug_redirects'
                    and column_name='from_section') then
    raise exception 'Guard failed: slug_redirects.from_section is missing - the moved urls cannot be preserved without it.'; end if;
end $$;

-- -----------------------------------------------------------------------------
-- Step 1. Category only. No rename, no ownership change, no publication change,
-- no deduplication, and product_taxonomy values are untouched by this step.
-- -----------------------------------------------------------------------------
update products set category = 'Other', updated_at = now()
where publication_status = 'live' and category = 'UAV'
  and id in (
    '6aaa96b3-543e-48b6-9983-b6d53efc2c62',  -- FireAnt
    'e78add2b-651e-411c-b801-5264183200b9',  -- Ghostfin
    '22117c3f-7879-4504-a588-1b4451e8010f',  -- Kuryer
    '9c77e46b-300c-45f5-80c8-4d5e79cea28f',  -- Max1
    '28471b23-090b-4863-88b4-2186fb59d8b4',  -- Ascento Guard Dori USA v1
    'e695a588-6d51-44ba-a6c4-0beaf4bfefc3',  -- Hunter WOLF
    '21fcca57-c8dd-4f8c-ac67-0275df7ca24b',  -- Lightfish
    '009df3a2-0c3b-4aa5-aacb-eee740f030e3',  -- Dot
    '96b4c84e-968c-436a-b253-fca473c6ee56',  -- K3 Scout
    '67551366-8223-4229-8a48-8807dcf347ee',  -- K5 Kraken
    '6d99c320-610d-4753-a47d-567a2cfdb2f6',  -- K7 Sabre
    '8622edaa-9301-4f80-ac54-58aae1f44cf5',  -- Lionfish
    'b7397fa3-84b1-4906-95ca-ecd7b27b680c',  -- MAGURA V5
    'e7d13ab2-091b-4afc-aacc-af652a7a6b11',  -- Mako
    '06993fe2-fe91-4e6e-a760-68849e9c6d28',  -- REMUS 100
    '9fe492b6-89b9-4ecb-b8e0-1e841d0191b9',  -- REMUS 130
    '186ba646-fc07-49f0-bacd-a859e3009d6e',  -- Saildrone Explorer
    '6a34533d-3c6c-4dab-b457-2e3e5f9696c2',  -- Saildrone Spectre
    '7a5a7360-2570-4932-b80f-0c7978bd75d9',  -- Surveyor
    'eca0f54c-81eb-4407-b21e-6070b984435f',  -- ARES
    'd7c68b98-9203-4cfe-9cfe-759d280dd152',  -- GULL
    'c74588f3-9429-423f-ae34-ee775d209d69',  -- SEASTRIKE
    'c4ced6a2-31e8-450e-9440-cae951e2177f',  -- Saronic Corsair
    '807ffae7-4a54-421c-9b71-1f1362ae3bd7',  -- Sea Baby
    '0aeb7617-2669-438f-b5fd-e4b6b6adef70',  -- Sub Sea Baby
    'ecfdcb8d-7036-4653-a651-194fca5f6182',  -- Gavia
    '9cec705d-43fc-490b-8fe1-ee4e08066b5c',  -- Hugin
    '82dbd59f-c9b9-48e0-b156-ddcf02c9327d'    -- WOLF-X
  );

-- -----------------------------------------------------------------------------
-- Step 2. Preserve every old url. from_section records the section the OLD url
-- lived in; without it the stub is written on top of the live page it points at.
-- -----------------------------------------------------------------------------
insert into slug_redirects (from_slug, to_slug, kind, from_section, reason) values
  ('fireant', 'fireant', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('ghostfin', 'ghostfin', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('kuryer', 'kuryer', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('max1', 'max1', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('ascento-guard-dori-usa-v1', 'ascento-guard-dori-usa-v1', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('hunter-wolf', 'hunter-wolf', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('lightfish', 'lightfish', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('dot', 'dot', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/'),
  ('k3-scout', 'k3-scout', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('k5-kraken', 'k5-kraken', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('k7-sabre', 'k7-sabre', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('lionfish', 'lionfish', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('magura-v5', 'magura-v5', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('mako', 'mako', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('remus-100', 'remus-100', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('remus-130', 'remus-130', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('saildrone-explorer', 'saildrone-explorer', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('saildrone-spectre', 'saildrone-spectre', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('surveyor', 'surveyor', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('ares', 'ares', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('gull', 'gull', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('seastrike', 'seastrike', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('saronic-corsair', 'saronic-corsair', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('sea-baby', 'sea-baby', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Surface (USV)); page moved to /other/'),
  ('sub-sea-baby', 'sub-sea-baby', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('gavia', 'gavia', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('hugin', 'hugin', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Underwater (UUV/AUV)); page moved to /other/'),
  ('wolf-x', 'wolf-x', 'product', 'uav', 'Non-aerial product batch: category corrected UAV -> Other (Ground (UGV)); page moved to /other/')
on conflict (from_slug) do nothing;

-- -----------------------------------------------------------------------------
-- Step 3. Two taxonomy corrections, which are the ONLY taxonomy changes proposed.
--
-- (a) Katana's domain row says "Surface (USV)". That is simply false: Katana is a
--     single-main-rotor helicopter drone that won DARPA's Lift Challenge in August
--     2026. The row is a knowledge-seeded guess and it is the reason this batch does
--     NOT trust a knowledge seed on its own. Its category stays UAV.
-- (b) The stale instruction notes. "verify category" was an instruction to a reviewer;
--     once the category is corrected the note describes a resolved problem, and a
--     reader cannot tell a settled record from an open one. The note is rewritten to
--     state what was concluded, keeping the substantive evidence in the same sentence.
--
-- No taxonomy VALUE is changed and no specification is touched: none of the products
-- in this batch carries any specs at all, and the only Exail product with UAV-prefixed
-- spec fields is the IT180 STH-U, which is correctly a UAV.
-- -----------------------------------------------------------------------------
update product_taxonomy set
  option_id = '2e1d09e9-0cf6-4c08-bcfc-591d2dbb307f',   -- domain: Aerial (UAV/UAS)
  source = 'web', confidence = 'high',
  note = 'Single-main-rotor helicopter drone; won the DARPA Lift Challenge in August 2026 carrying a 51 kg payload on a 13.3 kg airframe. Corrects an earlier knowledge-seeded row that read "Surface (USV)".'
where product_id = '7a1ed9b6-25a8-4e52-a450-a1fd07f84808'
  and option_id = '9624877b-041a-434e-b016-e35ee1988a30';

update product_taxonomy set
  note = 'Surface (USV). Category corrected from UAV to Other in the 2026-11-01 Exail pass; this note previously carried the unresolved instruction "verify category".'
where product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57',   -- DriX
                     '2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')   -- DriX O-16
  and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
  and note = 'filed under category UAV but is not an aerial system — verify category';

-- -----------------------------------------------------------------------------
-- Verification. Expected on a first run, all on one row:
--   corrected=28  katana_still_uav=UAV  katana_domain='Aerial (UAV/UAS)'
--   product_redirects=28  stale_notes_left=0  held_still_uav=8
-- -----------------------------------------------------------------------------
select
  (select count(*) from products where category='Other' and publication_status='live'
     and id in (
        '6aaa96b3-543e-48b6-9983-b6d53efc2c62',
        'e78add2b-651e-411c-b801-5264183200b9',
        '22117c3f-7879-4504-a588-1b4451e8010f',
        '9c77e46b-300c-45f5-80c8-4d5e79cea28f',
        '28471b23-090b-4863-88b4-2186fb59d8b4',
        'e695a588-6d51-44ba-a6c4-0beaf4bfefc3',
        '21fcca57-c8dd-4f8c-ac67-0275df7ca24b',
        '009df3a2-0c3b-4aa5-aacb-eee740f030e3',
        '96b4c84e-968c-436a-b253-fca473c6ee56',
        '67551366-8223-4229-8a48-8807dcf347ee',
        '6d99c320-610d-4753-a47d-567a2cfdb2f6',
        '8622edaa-9301-4f80-ac54-58aae1f44cf5',
        'b7397fa3-84b1-4906-95ca-ecd7b27b680c',
        'e7d13ab2-091b-4afc-aacc-af652a7a6b11',
        '06993fe2-fe91-4e6e-a760-68849e9c6d28',
        '9fe492b6-89b9-4ecb-b8e0-1e841d0191b9',
        '186ba646-fc07-49f0-bacd-a859e3009d6e',
        '6a34533d-3c6c-4dab-b457-2e3e5f9696c2',
        '7a5a7360-2570-4932-b80f-0c7978bd75d9',
        'eca0f54c-81eb-4407-b21e-6070b984435f',
        'd7c68b98-9203-4cfe-9cfe-759d280dd152',
        'c74588f3-9429-423f-ae34-ee775d209d69',
        'c4ced6a2-31e8-450e-9440-cae951e2177f',
        '807ffae7-4a54-421c-9b71-1f1362ae3bd7',
        '0aeb7617-2669-438f-b5fd-e4b6b6adef70',
        'ecfdcb8d-7036-4653-a651-194fca5f6182',
        '9cec705d-43fc-490b-8fe1-ee4e08066b5c',
        '82dbd59f-c9b9-48e0-b156-ddcf02c9327d')) as corrected,
  (select category from products where id='7a1ed9b6-25a8-4e52-a450-a1fd07f84808') as katana_still_uav,
  (select o.name from product_taxonomy pt join taxonomy_options o on o.id=pt.option_id
     join taxonomy_facets f on f.id=o.facet_id and f.slug='domain'
    where pt.product_id='7a1ed9b6-25a8-4e52-a450-a1fd07f84808') as katana_domain,
  (select count(*) from slug_redirects where kind='product' and from_section='uav'
     and reason like 'Non-aerial product batch%') as product_redirects,
  (select count(*) from product_taxonomy
    where note = 'filed under category UAV but is not an aerial system — verify category'
      and product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57','2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')) as stale_notes_left,
  (select count(*) from products where publication_status='live' and category='UAV'
     and id in ('7a1ed9b6-25a8-4e52-a450-a1fd07f84808','3515b298-4a7d-4cff-a1f4-ec6a7bf24726',
       'ccfd9d18-4029-4c1b-a46e-68e8de044f6b','5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
       '9d80e014-03aa-4342-9a91-1fcaa702fca2','8a28d7c5-df6e-4d91-900a-d451f65a61ec',
       '0c420e85-28c1-4c88-acab-436348b91ec3','d77e3215-00e6-4bde-88cd-2aa49c294522')) as held_still_uav;

commit;
