-- MMCM, rMCM, XLUUV — retirement. PREPARED, NOT APPLIED. 2026-11-01.
--
-- Proposal: 2026-11-01-mmcm-rmcm-xluuv-retirement-proposal.md
-- Rollback: 2026-11-01-mmcm-rmcm-xluuv-retirement-rollback.sql
--
-- This is the ALTERNATIVE to the prepared TX B in
-- 2026-11-01-non-aerial-product-batch-2.sql. TX B recategorises these three UAV -> Other;
-- this retires them. Run ONE of the two, never both.
--
-- NOTHING IS DELETED except rMCM's one false domain row. Five of the six foreign keys into
-- `products` are ON DELETE CASCADE, so a hard delete would silently take three article
-- links and seven taxonomy rows with it. Unpublishing keeps all of them.
--
-- Run inside `begin ... rollback` first and confirm the predicted values in §5 of the
-- proposal before committing.

begin;

do $$
declare n int;
begin
  -- the three records, exactly as expected
  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and publication_status = 'live' and category = 'UAV';
  if n <> 3 then raise exception 'guard: expected 3 live UAV rows, found %', n; end if;

  -- no company owns any of them; if one now does, somebody has worked on these and this
  -- proposal is stale
  select count(*) into n from products
   where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                '9d80e014-03aa-4342-9a91-1fcaa702fca2')
     and company_id is not null;
  if n <> 0 then raise exception 'guard: % of the three now have a company - review first', n; end if;

  select count(*) into n from product_companies
   where product_id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                        '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                        '9d80e014-03aa-4342-9a91-1fcaa702fca2');
  if n <> 0 then raise exception 'guard: % product_companies rows appeared', n; end if;

  -- what must survive: one article link each, and XLUUV's five taxonomy rows
  select count(*) into n from article_products
   where product_id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
                        '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
                        '9d80e014-03aa-4342-9a91-1fcaa702fca2');
  if n <> 3 then raise exception 'guard: expected 3 article links, found %', n; end if;

  select count(*) into n from product_taxonomy where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2';
  if n <> 5 then raise exception 'guard: expected 5 XLUUV taxonomy rows, found %', n; end if;

  -- rMCM's false row is still the row this was written against
  select count(*) into n from product_taxonomy
   where product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903'
     and option_id = '9624877b-041a-434e-b016-e35ee1988a30'      -- surface-usv
     and source = 'knowledge' and confidence = 'medium'
     and note = 'filed under category UAV but is not an aerial system — verify category';
  if n <> 1 then raise exception 'guard: rMCM''s domain row is not as recorded'; end if;

  -- no redirect references any of the three slugs in either direction
  select count(*) into n from slug_redirects
   where from_slug::text in ('mmcm','rmcm','xluuv') or to_slug::text in ('mmcm','rmcm','xluuv');
  if n <> 0 then raise exception 'guard: % redirect(s) reference these slugs', n; end if;
end $$;

-- 1-3. Retire the three records. The build fetches publication_status = 'live' only, so
-- /uav/mmcm/, /uav/rmcm/ and /uav/xluuv/ cease to exist at the next deploy. No redirect is
-- created, because there is no product to redirect to.
update products set publication_status = 'draft'
 where id in ('ccfd9d18-4029-4c1b-a46e-68e8de044f6b',
              '5d6c6ab3-6b4c-4552-9734-b6f7cff54903',
              '9d80e014-03aa-4342-9a91-1fcaa702fca2')
   and publication_status = 'live';                              -- expect 3

-- 4. MMCM's domain row is KEPT: its deliverable genuinely is a USV. Only the flag is
-- answered, and the note records what the record turned out to be. Contains neither
-- 'verify category' nor 'not an aerial system', so a flag search stops returning it.
update product_taxonomy
   set note = 'Surface (USV). This record names the FR/UK Maritime Mine Counter Measures PROGRAMME, managed by OCCAR for the French DGA and the UK MOD with Thales leading the industrial team - thalesgroup.com - not a product. The programme does field uncrewed surface vehicles, so this domain assertion is correct as far as it goes. Retired from publication on 2026-11-01 as a programme name extracted as a product; the earlier editorial instruction is answered by that retirement.'
 where product_id = 'ccfd9d18-4029-4c1b-a46e-68e8de044f6b'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30'
   and note = 'filed under category UAV but is not an aerial system — verify category';
                                                                 -- expect 1

-- 5. XLUUV's domain row is KEPT and correct: an extra-large uncrewed UNDERSEA vehicle is
-- underwater by definition. The other four rows (control, mission_military, origin,
-- range_class) are bare seeds and are deliberately left alone.
update product_taxonomy
   set note = 'Underwater (UUV/AUV). XLUUV is the US Navy''s CLASS TERM for extra-large uncrewed undersea vehicles, above 84 inches in diameter; Boeing''s Orca is the vehicle that fills it - boeing.com. This record names the class, not a product, and was extracted from an article about a DIU programme for XLUUVs. Retired from publication on 2026-11-01; the earlier editorial instruction is answered by that retirement.'
 where product_id = '9d80e014-03aa-4342-9a91-1fcaa702fca2'
   and option_id = '85766220-b0c7-4847-ad53-4eb5c7ad1bbb'
   and note = 'filed under category UAV but is not an aerial system — verify category';
                                                                 -- expect 1

-- 6. rMCM's domain row is FALSE and is deleted, not re-worded. The programme delivers
-- twelve CREWED City-class and Vlissingen-class mine countermeasures vessels, which carry
-- uncrewed systems - two Exail Inspector 125 USVs, three A-18 AUVs and two Saab V200
-- Skeldar air vehicles apiece - rather than being one. The row asserts the programme IS a
-- USV. Deleting it leaves the record with no domain assertion at all, which is honest.
--
-- This statement stands on its own evidence and is defensible whether or not the record is
-- retired: a false claim is worth removing either way.
delete from product_taxonomy
 where product_id = '5d6c6ab3-6b4c-4552-9734-b6f7cff54903'
   and option_id = '9624877b-041a-434e-b016-e35ee1988a30';       -- expect 1

commit;

-- ---------------------------------------------------------------------------------------
-- Predicted state after commit, from the post-batch-2 baseline:
--   live UAV 1410 (from 1413) · live total 3518 (from 3521) · taxonomy 11132 (from 11133)
--   redirects 97 (unchanged) · 'verify category' 1 · 'not an aerial system' 0
-- The one remaining flag is LUNA-2, which is pending by instruction and keeps it.
