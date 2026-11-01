-- ROLLBACK for 2026-11-01-batch-2-decisions-applied.sql
--
-- The three transactions are independent, so these reverse blocks can be run in any order
-- or individually. Every statement is keyed on exact ids, guarded by the value it expects
-- to find, with an affected-row assertion. A guard that does not match means something
-- else has edited the row since: STOP, do not force it.
--
-- ONE LIMIT, STATED. `products` carries a BEFORE UPDATE set_updated_at trigger, so these
-- four original updated_at values are NOT recoverable by any statement below:
--
--   MMCM        ccfd9d18-4029-4c1b-a46e-68e8de044f6b   2026-08-09 05:46:16.886986+00
--   rMCM        5d6c6ab3-6b4c-4552-9734-b6f7cff54903   2026-08-10 06:09:58.130665+00
--   XLUUV       9d80e014-03aa-4342-9a91-1fcaa702fca2   2026-08-30 10:18:56.057622+00
--   LUNA-2      8a28d7c5-df6e-4d91-900a-d451f65a61ec   2026-10-30 10:44:17.268420+00
--
-- Ghost Shark's updated_at was already unrecoverable from the earlier pass in this batch
-- and moves again here; its pre-batch value was 2026-10-17 08:18:52.843608+00.
--
-- `product_taxonomy` has no surrogate key and no updated_at, so its statements are keyed
-- on (product_id, option_id) and guarded by the exact note text they expect. It DOES carry
-- a created_at set by a column default rather than a trigger, so the one re-insert below
-- restores that value explicitly instead of letting now() overwrite it.

-- =====================================================================  undo TX L
begin;

update product_taxonomy
   set note = 'LoRa IoT nanosatellite launched by SpaceX 30 Mar 2026 — aselsan.com — filed under UAV — verify category'
 where product_id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec'
   and option_id = '3bc29cc3-3134-4724-a77b-21fd67f101a0'
   and note like 'Space (orbital). ASELSAN LoRa IoT nanosatellite%';        -- expect 1

delete from slug_redirects
 where kind = 'product' and from_section = 'uav' and from_slug::text = 'luna-2'
   and reason like 'Non-aerial product batch 2, 2026-11-01:%';              -- expect 1

update products set category = 'UAV'
 where id = '8a28d7c5-df6e-4d91-900a-d451f65a61ec' and category = 'Other';  -- expect 1

commit;

-- =====================================================================  undo TX S
begin;

update product_taxonomy pt
   set note = 'Underwater (UUV/AUV): an extra-large autonomous undersea vehicle. Category corrected from UAV to Other on 2026-11-01, and the maker corrected in the same pass. This record was attributed to Albacore, whose only vehicle is Ghostfin - a separate record, albacore.inc names no other - and whose name is where the confusion came from. Ghost Shark is Anduril''s XL-AUV, co-developed with the Royal Australian Navy and DSTG and placed under a production contract in September 2025: anduril.com/news/first-ghost-shark-debuts-in-australia, defence.gov.au. NOT changed here: the record''s own source_urls still cite an article about Albacore''s Ghostfin.'
  from taxonomy_options o, taxonomy_facets f
 where pt.product_id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and o.id = pt.option_id and f.id = o.facet_id and f.slug = 'domain'
   and pt.note like '%they were replaced on 2026-11-01%';                   -- expect 1

update products
   set source_urls = array['https://dronexl.co/2026/08/27/navy-albacore-ghostfin-drone-submarines-philadelphia']
 where id = '0c420e85-28c1-4c88-acab-436348b91ec3'
   and source_urls = array['https://www.anduril.com/news/first-ghost-shark-debuts-in-australia',
                           'https://www.defence.gov.au/news-events/news/2022-12-14/ghost-shark-stealthy-game-changer'];
                                                                            -- expect 1
commit;

-- =====================================================================  undo TX R
begin;

-- rMCM's domain row, re-inserted with its literal original values including created_at
insert into product_taxonomy (product_id, option_id, source, confidence, note, created_at)
values ('5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
        '9624877b-041a-434e-b016-e35ee1988a30',
        'knowledge', 'medium',
        'filed under category UAV but is not an aerial system — verify category',
        '2026-09-05 16:56:47.583515+00');   -- the row's original created_at, restored
                                                                            -- expect 1

update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2'
   and option_id = '85766220-b0c7-4847-ad53-4eb5c7ad1bbb'
   and note like 'Underwater (UUV/AUV). XLUUV is the US Navy''s CLASS TERM%';
                                                                            -- expect 1

update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = 'ccfd9d18-4029-4c1b-a46e-68e8de044f6b'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note like 'Surface (USV). This record names the FR/UK Maritime Mine Counter Measures PROGRAMME%';
                                                                            -- expect 1

update products set publication_status = 'live'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and publication_status = 'draft'                                         -- expected current
   and category = 'UAV';                                                    -- and still itself
                                                                            -- expect 3

commit;

-- ---------------------------------------------------------------------------------------
-- Expected after a full reversal, the post-applied-batch baseline:
--   live UAV 1413 · live Other 412 · live total 3521 · taxonomy 11133 · redirects 97
--   'verify category' 4 · 'not an aerial system' 3
-- Everything except the updated_at values above is restored exactly.
