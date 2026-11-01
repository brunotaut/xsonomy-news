-- =============================================================================
-- Rollback for the non-aerial product correction batch.
-- Pairs with 2026-11-02-non-aerial-product-batch.sql, which was APPLIED on 2026-11-01
-- (the 28 ready corrections and the 3 taxonomy changes; the 8 held records were not touched).
-- This file is therefore a live rollback, not a hypothetical one.
-- =============================================================================
--
-- Run as one transaction. Guarded and idempotent: a second run changes 0 rows.
--
-- CAVEAT, verified against the live database: products carries a BEFORE UPDATE trigger
-- (set_updated_at) that overwrites updated_at with now(). This rollback therefore
-- restores CONTENT exactly and leaves a fresh updated_at behind. The per-product
-- original timestamps are in the manifest CSV if they are ever needed.
--
-- Nothing here deletes anything the batch did not create.

begin;

-- R1. The 28 categories, back to UAV. Guarded on category='Other' so it cannot drag
--     back a record someone has since moved somewhere else deliberately, and scoped by
--     id so the products that were ALREADY 'Other' before this batch - the eleven Exail
--     ones, GhostFoiler, Pioneer, Sea Lancer, Sea Sabre, TEC800 - are untouched.
update products set category = 'UAV'
where publication_status = 'live' and category = 'Other'
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
    '82dbd59f-c9b9-48e0-b156-ddcf02c9327d');

-- R2. The 28 product redirects. Their only purpose was to keep the old /uav/ urls
--     alive; with the categories back to UAV the real pages return there and the stubs
--     would collide with them. Scoped by from_section AND the batch's own reason text,
--     so neither the pre-existing ax250-gax500-3d redirect nor the Exail batch's 11
--     redirects are touched.
delete from slug_redirects
 where kind = 'product' and from_section = 'uav'
   and reason like 'Non-aerial product batch%'
   and from_slug in (
    'fireant',
    'ghostfin',
    'kuryer',
    'max1',
    'ascento-guard-dori-usa-v1',
    'hunter-wolf',
    'lightfish',
    'dot',
    'k3-scout',
    'k5-kraken',
    'k7-sabre',
    'lionfish',
    'magura-v5',
    'mako',
    'remus-100',
    'remus-130',
    'saildrone-explorer',
    'saildrone-spectre',
    'surveyor',
    'ares',
    'gull',
    'seastrike',
    'saronic-corsair',
    'sea-baby',
    'sub-sea-baby',
    'gavia',
    'hugin',
    'wolf-x');

-- R3. Katana's domain row, back to the (wrong) knowledge-seeded value it held before.
--     Restoring a known-false row is the honest rollback: it returns the database to
--     its prior state rather than keeping a correction from a batch that was reverted.
update product_taxonomy set
  option_id = '9624877b-041a-434e-b016-e35ee1988a30',   -- domain: Surface (USV)
  source = 'knowledge', confidence = 'medium',
  note = 'filed under category UAV but is not an aerial system — verify category'
where product_id = '7a1ed9b6-25a8-4e52-a450-a1fd07f84808'
  and option_id = '2e1d09e9-0cf6-4c08-bcfc-591d2dbb307f';

-- R4. The two stale notes on DriX and DriX O-16, restored verbatim.
update product_taxonomy set
  note = 'filed under category UAV but is not an aerial system — verify category'
where product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57',
                     '2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')
  and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
  and note like 'Surface (USV). Category corrected from UAV to Other%';

-- Verification. Expected after a successful rollback:
--   back_to_uav=28  redirects_left=0  katana_domain='Surface (USV)'
--   stale_notes_restored=2  exail_redirects_untouched=11
select
  (select count(*) from products where publication_status='live' and category='UAV'
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
    '82dbd59f-c9b9-48e0-b156-ddcf02c9327d')) as back_to_uav,
  (select count(*) from slug_redirects where kind='product' and from_section='uav'
     and reason like 'Non-aerial product batch%') as redirects_left,
  (select o.name from product_taxonomy pt join taxonomy_options o on o.id=pt.option_id
     join taxonomy_facets f on f.id=o.facet_id and f.slug='domain'
    where pt.product_id='7a1ed9b6-25a8-4e52-a450-a1fd07f84808') as katana_domain,
  (select count(*) from product_taxonomy
    where note='filed under category UAV but is not an aerial system — verify category'
      and product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57','2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')) as stale_notes_restored,
  (select count(*) from slug_redirects where kind='product' and from_section='uav'
     and reason like 'Batch 16%') as exail_redirects_untouched;

commit;
