-- ROLLBACK for 2026-11-01-mmcm-rmcm-xluuv-retirement.sql. NOT APPLIED.
--
-- Reverse order. Every statement keyed on exact ids, guarded by the value it expects to
-- find, with an affected-row assertion. A guard that does not match means something else
-- has edited the row since: STOP, do not force it.
--
-- ONE LIMIT, STATED. `products` carries a BEFORE UPDATE set_updated_at trigger, so these
-- three original updated_at values are NOT recoverable by any statement below:
--
--   MMCM   ccfd9d18-4029-4c1b-a46e-68e8de044f6b   2026-08-09 05:46:16.886986+00
--   rMCM   5d6c6ab3-6b4c-4552-9734-b6f7cff54903   2026-08-10 06:09:58.130665+00
--   XLUUV  9d80e014-03aa-4342-9a91-1fcaa702fca2   2026-08-30 10:18:56.057622+00
--
-- `product_taxonomy` has no surrogate key and no updated_at, so its statements are keyed
-- on (product_id, option_id) and guarded by the exact note text they expect to find. It
-- DOES carry a created_at, set by a column default rather than a trigger, so the re-insert
-- below restores that value explicitly instead of letting now() overwrite it.

begin;

-- 6. rMCM's domain row, re-inserted with its literal original values. The option_id is
-- surface-usv; source, confidence and note are reproduced exactly as they stood.
insert into product_taxonomy (product_id, option_id, source, confidence, note, created_at)
values ('5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
        '9624877b-041a-434e-b016-e35ee1988a30',
        'knowledge', 'medium',
        'filed under category UAV but is not an aerial system — verify category',
        '2026-09-05 16:56:47.583515+00');   -- the row's original created_at, restored
                                                                 -- expect 1

-- 5. XLUUV's domain note, back to the literal flag it carried
update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2'
   and option_id = '85766220-b0c7-4847-ad53-4eb5c7ad1bbb'
   and note like 'Underwater (UUV/AUV). XLUUV is the US Navy''s CLASS TERM%';
                                                                 -- expect 1

-- 4. MMCM's domain note, likewise
update product_taxonomy
   set note = 'filed under category UAV but is not an aerial system — verify category'
 where product_id = 'ccfd9d18-4029-4c1b-a46e-68e8de044f6b'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note like 'Surface (USV). This record names the FR/UK Maritime Mine Counter Measures PROGRAMME%';
                                                                 -- expect 1

-- 1-3. Republish the three records
update products set publication_status = 'live'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and publication_status = 'draft'                               -- expected current value
   and category = 'UAV';                                          -- and still itself
                                                                  -- expect 3; 0 means stop

commit;

-- ---------------------------------------------------------------------------------------
-- Expected state after a full reversal, the post-batch-2 baseline:
--   live UAV 1413 · live Other 412 · live total 3521 · taxonomy 11133 · redirects 97
--   'verify category' 4 · 'not an aerial system' 3
-- Everything except the three updated_at values above is restored exactly.
--
-- NOT DRY-RUN. The transactional round-trip proof is to be run at the point of
-- application, against the forward SQL, before either is committed.
