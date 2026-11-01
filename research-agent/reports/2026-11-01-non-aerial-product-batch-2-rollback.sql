-- Rollback for non-aerial product batch 2 — 2026-11-01.
--
-- NOTHING IN THIS BATCH HAS BEEN APPLIED, so this file currently reverses a change that
-- has not happened. It is written now, and dry-run now, so that it exists before it is
-- needed rather than after.
--
-- Mirrors the three transactions of 2026-11-01-non-aerial-product-batch-2.sql. Reverse in
-- the opposite order to application if more than one was applied: T, then B, then A.
--
-- TWO LIMITS, STATED UP FRONT
--
-- 1. `products` carries a BEFORE UPDATE trigger `set_updated_at`, so a reversal cannot
--    restore the original `updated_at`. The six category reversals below restore `category`
--    and nothing else; their timestamps will read as touched. This is the same limit the
--    2026-11-01 Exail rollback records.
-- 2. `product_taxonomy` has no surrogate key and no `updated_at`, so every statement below
--    is keyed on (product_id, option_id) and there is no timestamp to compare. The guards
--    are expected current values instead.

-- =====================================================================  undo TX A
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
                '0c420e85-28c1-4c88-acab-436348b91ec3',
                '8a28d7c5-df6e-4d91-900a-d451f65a61ec')
     and category = 'Other';
  if n <> 3 then raise exception 'undo A guard: expected 3 rows now in Other, found %', n; end if;
end $$;

update products set category = 'UAV'
 where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
              '0c420e85-28c1-4c88-acab-436348b91ec3',
              '8a28d7c5-df6e-4d91-900a-d451f65a61ec')
   and category = 'Other';                                                  -- expect 3

delete from slug_redirects
 where kind = 'product' and from_section = 'uav'
   and from_slug in ('dire-wolf','ghost-shark','luna-2');                   -- expect 3

-- Ghost Shark's domain note, verbatim before-image
update product_taxonomy set source = 'knowledge', confidence = 'medium',
 note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3';                 -- expect 1

-- LUNA-2's domain note, verbatim before-image (it was already web/high)
update product_taxonomy pt set source = 'web', confidence = 'high',
 note = 'LoRa IoT nanosatellite launched by SpaceX 30 Mar 2026 — aselsan.com — filed under UAV — verify category'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';     -- expect 1

-- Dire WOLF's four upgraded rows back to their seed state
update product_taxonomy pt set source = 'knowledge', confidence = 'medium',
 note = 'seeded from model knowledge for product with no specs — verify before Live'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id = 'd77e3215-00e6-4bde-88cd-2aa49c294522'
   and o.id = pt.option_id and f.id = o.facet_id
   and f.slug in ('domain','propulsion','mission_military','origin');       -- expect 4

commit;

-- =====================================================================  undo TX B
begin;

do $$
declare n int;
begin
  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and category = 'Other';
  if n <> 3 then raise exception 'undo B guard: expected 3 rows now in Other, found %', n; end if;

  select count(*) into n from product_taxonomy
   where product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903';
  if n <> 0 then raise exception 'undo B guard: rMCM should hold 0 taxonomy rows, found %', n; end if;
end $$;

update products set category = 'UAV'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and category = 'Other';                                                  -- expect 3

delete from slug_redirects
 where kind = 'product' and from_section = 'uav'
   and from_slug in ('mmcm','rmcm','xluuv');                                -- expect 3

-- MMCM and XLUUV domain notes, verbatim before-image (identical text on both)
update product_taxonomy pt set source = 'knowledge', confidence = 'medium',
 note = 'filed under category UAV but is not an aerial system — verify category'
 from taxonomy_options o, taxonomy_facets f
 where pt.product_id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                         '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain';     -- expect 2

-- rMCM's deleted domain row, re-inserted with its complete original values. The option id
-- is the `surface-usv` option; it is literal here rather than looked up by slug, because
-- the row this restores is the row that was deleted, not whatever currently answers to
-- that slug.
insert into product_taxonomy (product_id, option_id, source, confidence, note)
values ('5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
        '9624877b-041a-434e-b016-e35ee1988a30',
        'knowledge','medium',
        'filed under category UAV but is not an aerial system — verify category');
                                                                            -- expect 1
commit;

-- =====================================================================  undo TX T
begin;

-- T1. All seventeen rows carried the identical note, so one statement restores them, keyed
-- on the exact (product_id, option_id) pairs rather than on a predicate over the text.
update product_taxonomy set source = 'knowledge', confidence = 'medium',
 note = 'filed under category UAV but is not an aerial system — verify category'
 where (product_id, option_id) in (
  ('28471b23-090b-4863-88b4-2186fb59d8b4','15ff1efc-50a5-40e7-9725-ea8fd9a612c4'),  -- Ascento Guard Dori USA v1
  ('ecfdcb8d-7036-4653-a651-194fca5f6182','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- Gavia
  ('2e5c1690-1acd-4564-a051-b93ebef9bb61','9624877b-041a-434e-b016-e35ee1988a30'),  -- GhostFoiler
  ('9cec705d-43fc-490b-8fe1-ee4e08066b5c','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- Hugin
  ('e695a588-6d51-44ba-a6c4-0beaf4bfefc3','15ff1efc-50a5-40e7-9725-ea8fd9a612c4'),  -- Hunter WOLF
  ('21fcca57-c8dd-4f8c-ac67-0275df7ca24b','9624877b-041a-434e-b016-e35ee1988a30'),  -- Lightfish
  ('b7397fa3-84b1-4906-95ca-ecd7b27b680c','9624877b-041a-434e-b016-e35ee1988a30'),  -- MAGURA V5
  ('06993fe2-fe91-4e6e-a760-68849e9c6d28','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- REMUS 100
  ('9fe492b6-89b9-4ecb-b8e0-1e841d0191b9','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- REMUS 130
  ('186ba646-fc07-49f0-bacd-a859e3009d6e','9624877b-041a-434e-b016-e35ee1988a30'),  -- Saildrone Explorer
  ('6a34533d-3c6c-4dab-b457-2e3e5f9696c2','9624877b-041a-434e-b016-e35ee1988a30'),  -- Saildrone Spectre
  ('c4ced6a2-31e8-450e-9440-cae951e2177f','9624877b-041a-434e-b016-e35ee1988a30'),  -- Saronic Corsair
  ('807ffae7-4a54-421c-9b71-1f1362ae3bd7','9624877b-041a-434e-b016-e35ee1988a30'),  -- Sea Baby
  ('e37a46f8-cd66-4c9c-81a7-197228a40b09','9624877b-041a-434e-b016-e35ee1988a30'),  -- Sea Lancer
  ('e012b0b8-fcbf-4d52-bbf8-e4bf36d858ce','9624877b-041a-434e-b016-e35ee1988a30'),  -- Sea Sabre
  ('0aeb7617-2669-438f-b5fd-e4b6b6adef70','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- Sub Sea Baby
  ('82dbd59f-c9b9-48e0-b156-ddcf02c9327d','15ff1efc-50a5-40e7-9725-ea8fd9a612c4')); -- WOLF-X
                                                                            -- expect 17

-- T2. The forward statement stripped a known suffix and appended another, so its inverse
-- is exact and needs no stored text: strip what was appended, append what was stripped.
update product_taxonomy
   set note = regexp_replace(note,
        '\s*—\s*category corrected UAV -> Other by an earlier pass; the editorial instruction that followed this description was answered by that correction and cleared 2026-11-01\.\s*$', '')
        || ' — filed under UAV — verify category'
 where (product_id, option_id) in (
  ('6aaa96b3-543e-48b6-9983-b6d53efc2c62','15ff1efc-50a5-40e7-9725-ea8fd9a612c4'),  -- FireAnt
  ('e78add2b-651e-411c-b801-5264183200b9','85766220-b0c7-4847-ad53-4eb5c7ad1bbb'),  -- Ghostfin
  ('22117c3f-7879-4504-a588-1b4451e8010f','15ff1efc-50a5-40e7-9725-ea8fd9a612c4'),  -- Kuryer
  ('9c77e46b-300c-45f5-80c8-4d5e79cea28f','15ff1efc-50a5-40e7-9725-ea8fd9a612c4'),  -- Max1
  ('ab039d1a-194b-4975-ad22-111623f38aeb','9624877b-041a-434e-b016-e35ee1988a30'),  -- Pioneer
  ('0cb522cb-e451-435c-ad7d-c43a0115fb5e','15ff1efc-50a5-40e7-9725-ea8fd9a612c4')); -- TEC800
                                                                            -- expect 6
-- The six resulting notes must read, verbatim:
--   FireAnt  small ground swarm robot for anti-armour, IP67, under $50k a unit — interestingengineering.com Swarmbotics FireAnt — filed under UAV — verify category
--   Ghostfin 8.5 ft / 425 lb modular autonomous submarine — albacore.inc — filed under UAV — verify category
--   Kuryer   tracked UGV hauling up to 200 kg — janes.com Russia shows more applications of Kuryer UGV — filed under UAV — verify category
--   Max1     modular tracked/wheeled UGV, 850 kg payload, tows 4.5 t — economica.net Max1 — filed under UAV — verify category
--   Pioneer  14.2 m SWATH USV, 25.7 t, 45 kW Nuvera H2 fuel cell — navylookout.com — filed under UAV — verify category
--   TEC800   tracked teleoperated firefighting robot, 500 kg — angatec.com/en/tec800/ — filed under UAV — verify category
-- Compare them after running; if any differs, the inverse did not apply cleanly and the
-- verbatim text above is the authority.

-- T2b. DriX and DriX O-16 back to the 2026-11-01 Exail pass's own wording.
update product_taxonomy
   set note = 'Surface (USV). Category corrected from UAV to Other in the 2026-11-01 Exail pass; this note previously carried the unresolved instruction "verify category".'
 where product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57','2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30';                   -- expect 2

-- T3. HALIA, verbatim before-image.
update product_taxonomy
   set note = 'amphibious float-and-fly: 30+ day sea persistence between flights; also retains aerial domain — levantatech.com — filed under UAV — verify category'
 where product_id = '4d80bcae-02da-44d5-8643-c030cd9a8df4'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30';                   -- expect 1

-- T5. A-18M (3 rows) and K-Ster (2 rows) back to their model-knowledge seeds.
update product_taxonomy pt set source = 'knowledge', confidence = 'medium',
 note = 'seeded from model knowledge for product with no specs — verify before Live'
 from taxonomy_options o, taxonomy_facets f
 where o.id = pt.option_id and f.id = o.facet_id
   and ( (pt.product_id = '1de976af-ff68-498c-b855-7c9ac2514e4d' and f.slug in ('domain','control','origin'))
      or (pt.product_id = '6efaadb9-8c45-4695-ac50-49e3fdba53b0' and f.slug in ('domain','origin')) );
                                                                            -- expect 5
commit;

-- =====================================================================  assertions
-- After reversing all three, the database should read exactly as it did at 21:40 UTC on
-- 2026-11-01, except for `products.updated_at` on the six category rows:
--   live products categorised UAV                 = 1416
--   live products categorised Other               = 410
--   live products total                           = 3522
--   slug_redirects                                = 95
--   product_taxonomy rows matching 'verify category' or 'not an aerial system' = 31
--   rMCM taxonomy rows                            = 1
--   Dire WOLF rows with the seed note             = 5
