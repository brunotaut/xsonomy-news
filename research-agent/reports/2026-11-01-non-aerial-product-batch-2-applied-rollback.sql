-- ROLLBACK for 2026-11-01-non-aerial-product-batch-2-applied.sql
--
-- REVERSE ORDER: TX C, then TX A', then TX T. TX T must go last for the same reason it ran
-- first: its T1 predicate catches any note containing 'not an aerial system' on a record
-- not categorised UAV, and reversing TX A' puts Ghost Shark's original note - which
-- contains exactly that string - back on a record that is UAV again. Reversing in this
-- order keeps the two apart.
--
-- Every statement is keyed on exact ids and guarded by the value it expects to find, and
-- every one asserts its affected-row count. A guard that does not match means something
-- else has edited the row since: STOP, do not force it.
--
-- ONE LIMIT, STATED. `products` carries a BEFORE UPDATE set_updated_at trigger, so
-- reversing a products row CANNOT restore its original updated_at. The literal previous
-- values are recorded here for the record and are not recoverable by any statement below:
--
--   Dire WOLF   d77e3215-00e6-4bde-88cd-2aa49c294522  updated_at 2026-07-26 07:34:33.816051+00
--   Ghost Shark 0c420e85-28c1-4c88-acab-436348b91ec3  updated_at 2026-10-17 08:18:52.843608+00
--   Exail A27   3515b298-4a7d-4cff-a1f4-ec6a7bf24726  updated_at 2026-08-09 05:46:16.886986+00
--
-- `product_taxonomy` has no surrogate key and no updated_at, so its statements are keyed
-- on (product_id, option_id) or on the exact replacement text, and guarded by expected
-- current values. It does carry a created_at, but nothing in this batch inserts or deletes
-- a taxonomy row, so no created_at moves. `product_companies` has no key beyond its
-- columns and no timestamps at all.

-- =====================================================================  undo TX C
begin;
update products set publication_status = 'live'
 where id = '3515b298-4a7d-4cff-a1f4-ec6a7bf24726'
   and publication_status = 'draft'                             -- expected current value
   and category = 'UAV' and slug::text = 'exail-a27';           -- and still itself
                                                                -- expect 1; 0 means stop
commit;

-- =====================================================================  undo TX A'
begin;

-- the four Dire WOLF upgrades, back to the seed they replaced. Keyed on the exact four
-- option_ids; the fifth row (control 85221077) was never touched and is not named here.
update product_taxonomy
   set source = 'knowledge', confidence = 'medium',
       note = 'seeded from model knowledge for product with no specs — verify before Live'
 where product_id = 'd77e3215-00e6-4bde-88cd-2aa49c294522'
   and option_id in ('15ff1efc-50a5-40e7-9725-ea8fd9a612c4',   -- domain ground-ugv
                     'f8288f3f-b310-4f39-b079-6fcb88fa23d3',   -- propulsion hybrid
                     '4eabed35-39ef-4b77-a982-050232d274fe',   -- mission logistics-resupply
                     '0351dd1d-422f-489e-b54e-0e0b7aa8abc7')   -- origin military-grade
   and source = 'web' and confidence = 'high';                 -- expected current values
                                                               -- expect 4

-- Ghost Shark's domain note, back to the literal flag it carried
update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and option_id = '85766220-b0c7-4847-ad53-4eb5c7ad1bbb'
   and note like 'Underwater (UUV/AUV): an extra-large%';       -- expected current value
                                                               -- expect 1

-- the maker, both ends, back to Albacore
update product_companies set company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473'
 where product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and company_id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc'
   and role = 'manufacturer';                                  -- expect 1

update products set company_id = '67acfba0-d73f-455f-ab06-f4476b5ef473'
 where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and company_id = '5e2751f3-e686-4264-b72a-d5b58ed8f3dc';    -- expect 1

-- the two redirects, keyed on from_slug (the natural key; this table has no surrogate)
delete from slug_redirects
 where kind = 'product' and from_section = 'uav'
   and from_slug::text in ('dire-wolf','ghost-shark')
   and reason like 'Non-aerial product batch 2, 2026-11-01:%';  -- only this pass's rows
                                                                -- expect 2

update products set category = 'UAV'
 where id in ('d77e3215-00e6-4bde-88cd-2aa49c294522',
              '0c420e85-28c1-4c88-acab-436348b91ec3')
   and category = 'Other';                                      -- expect 2

commit;

-- =====================================================================  undo TX T
begin;

-- T5 K-Ster: two rows back to seed. control (426464dd) was never upgraded.
update product_taxonomy
   set source = 'knowledge', confidence = 'medium',
       note = 'seeded from model knowledge for product with no specs — verify before Live'
 where product_id = '6efaadb9-8c45-4695-ac50-49e3fdba53b0'
   and option_id in ('85766220-b0c7-4847-ad53-4eb5c7ad1bbb',   -- domain underwater
                     '0351dd1d-422f-489e-b54e-0e0b7aa8abc7')   -- origin military-grade
   and source = 'web' and confidence = 'high';                 -- expect 2

-- T5 A-18M: three rows back to seed. mission_military (f1b7ebbf) was never upgraded.
update product_taxonomy
   set source = 'knowledge', confidence = 'medium',
       note = 'seeded from model knowledge for product with no specs — verify before Live'
 where product_id = '1de976af-ff68-498c-b855-7c9ac2514e4d'
   and option_id in ('85766220-b0c7-4847-ad53-4eb5c7ad1bbb',   -- domain underwater
                     '7ead9e68-6d92-41f3-b911-7a5f3bd0e700',   -- control fully-autonomous
                     '0351dd1d-422f-489e-b54e-0e0b7aa8abc7')   -- origin military-grade
   and source = 'web' and confidence = 'high';                 -- expect 3

-- T3 HALIA, back to its literal previous note
update product_taxonomy
   set note = 'amphibious float-and-fly: 30+ day sea persistence between flights; also retains aerial domain — levantatech.com — filed under UAV — verify category'
 where product_id = '4d80bcae-02da-44d5-8643-c030cd9a8df4'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note like 'Amphibious float-and-fly: 30+ day sea persistence%';  -- expect 1

-- T2b DriX and DriX O-16, back to their literal previous notes. Both rows carried the
-- same text, quoting the instruction - which is the defect, restored faithfully.
update product_taxonomy
   set note = 'Surface (USV). Category corrected from UAV to Other in the 2026-11-01 Exail pass; this note previously carried the unresolved instruction "verify category".'
 where product_id in ('c87b1319-f15d-48d3-a7fd-a09a49893e57',
                      '2dbd66ec-3f36-4a0a-87ff-0561e2bed85e')
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note like 'Surface (USV). Category corrected from UAV to Other in the 2026-11-01 Exail pass. The editorial%';
                                                               -- expect 2

-- T2 the six sourced rows: the exact inverse of the regexp. The appended sentence is
-- stripped and the instruction re-appended. The six literal previous notes are recorded
-- below as the authority for this transform; the statement reproduces them exactly.
--
--   FireAnt  6aaa96b3  small ground swarm robot for anti-armour, IP67, under $50k a unit — interestingengineering.com Swarmbotics FireAnt — filed under UAV — verify category
--   Ghostfin e78add2b  8.5 ft / 425 lb modular autonomous submarine — albacore.inc — filed under UAV — verify category
--   Kuryer   22117c3f  tracked UGV hauling up to 200 kg — janes.com Russia shows more applications of Kuryer UGV — filed under UAV — verify category
--   Max1     9c77e46b  modular tracked/wheeled UGV, 850 kg payload, tows 4.5 t — economica.net Max1 — filed under UAV — verify category
--   Pioneer  ab039d1a  14.2 m SWATH USV, 25.7 t, 45 kW Nuvera H2 fuel cell — navylookout.com — filed under UAV — verify category
--   TEC800   0cb522cb  tracked teleoperated firefighting robot, 500 kg — angatec.com/en/tec800/ — filed under UAV — verify category
update product_taxonomy
   set note = regexp_replace(note, ' — category corrected UAV -> Other by an earlier pass; the editorial instruction that followed this description was answered by that correction and cleared 2026-11-01\.$', '')
              || ' — filed under UAV — verify category'
 where note like '%— category corrected UAV -> Other by an earlier pass; the editorial instruction that followed this description was answered by that correction and cleared 2026-11-01.';
                                                               -- expect 6

-- T1 the seventeen identical rows. All seventeen carried the same literal note and no
-- sourced description, so this restores them byte for byte.
update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where note = 'Non-aerial domain confirmed and the category corrected from UAV to Other by an earlier pass. The unresolved editorial instruction this note used to carry was answered by that correction, and was cleared on 2026-11-01.';
                                                               -- expect 17

commit;

-- ---------------------------------------------------------------------------------------
-- After a full reversal the expected state is the 2026-11-01 baseline:
--   live UAV 1416 · live Other 410 · live total 3522 · taxonomy 11133 · redirects 95
--   'verify category' 31 · 'not an aerial system' 21
-- Everything except the three updated_at values above is restored exactly. Proven by
-- running forward and back inside one transaction and diffing against a snapshot.
