-- ROLLBACK for 2026-11-01-domain-facet.sql. NOT APPLIED.
--
-- Re-inserts the two deleted rows with their literal original values. product_taxonomy
-- carries a created_at set by a column DEFAULT rather than a trigger, so the original
-- creation times are restored explicitly instead of being replaced by now().
--
-- option_id for 'aerial-uav-uas' is resolved through the facet join rather than
-- hard-coded, so this stays correct if the option's id is ever reseeded.

begin;

insert into product_taxonomy (product_id, option_id, source, confidence, note, created_at)
select v.product_id, o.id, 'rule', 'high', 'category=UAV', v.created_at
  from (values
    ('6fb1094b-2df0-405b-97c6-26c01211ea31'::uuid, '2026-09-05 16:52:03.652926+00'::timestamptz),
    ('c0fca03f-7285-4e71-901b-2dc46c73ba5a'::uuid, '2026-09-05 16:52:03.652926+00'::timestamptz)
  ) as v(product_id, created_at)
  join taxonomy_options o on o.slug = 'aerial-uav-uas'
  join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain';
                                                              -- expect 2

commit;

-- ---------------------------------------------------------------------------------------
-- The two created_at values above were READ FROM THE LIVE ROWS on 2026-11-01, not
-- assumed. Both rows were created in the same backfill statement, which is why they
-- share a timestamp. option_id is 2e1d09e9-0cf6-4c08-bcfc-591d2dbb307f, resolved via the
-- facet join above rather than hard-coded. To re-confirm before relying on this:
--
--   select pt.product_id, pt.created_at
--     from product_taxonomy pt
--     join taxonomy_options o on o.id = pt.option_id
--     join taxonomy_facets f on f.id = o.facet_id and f.slug = 'domain'
--    where o.slug = 'aerial-uav-uas'
--      and pt.product_id in ('6fb1094b-2df0-405b-97c6-26c01211ea31',
--                            'c0fca03f-7285-4e71-901b-2dc46c73ba5a');
--
-- Expected state after a full reversal: product_taxonomy back to its pre-change count,
-- and 2 aerial-uav-uas rows on non-UAV products.
