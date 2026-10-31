-- TIER A — the 12 evidence-backed composite-name renames, plus the dependent row F
-- (Vega Radio Engineering Corporation). APPROVED 2026-10-31 and applied the same day.
--
-- Scope: companies.name and new company_aliases rows. Nothing else.
--   * IDs preserved.
--   * Slugs preserved, so every indexed URL is unchanged and no redirect is needed
--     (CLAUDE.md rule 3). The catalogue's company pages are keyed on `slug`, and the
--     generated product slug comes from the product name, so no page moves.
--   * publication_status untouched — no publication change (CLAUDE.md rule 4).
--   * Relationships, sectors, products, article links and landscape rows untouched.
--     Meridian and U-TacS are in the published landscape and stay in it: membership is
--     keyed on company_id, not on the name.
--
-- Deliberately NOT included: parent and ownership facts ("record AVIC as parent",
-- "record Rostec as parent"). Writing those means either an ownership column or a new
-- relationship row, and ownership changes were not authorised. They are listed as
-- optional enrichment in the report.
--
-- Guarded and idempotent: `is distinct from` and ON CONFLICT DO NOTHING mean a rerun
-- changes nothing. Expected: 13 name rows, 11 alias rows; 0 on any rerun.
--
-- Dry run re-run before applying, 2026-10-31: all 13 before-values match the review
-- exactly (zero drift), all 13 live, no exact or normalised name collision, no alias
-- clash with any other company or alias, products and landscape rows retained.

begin;

with ren(id, new_name) as (values
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150'::uuid, 'Brolis Defence Group'),
  ('2d6547f1-1bfb-4820-8e2e-07d285816928', 'China Academy of Aerospace Aerodynamics (CAAA)'),
  ('3611fb65-ec52-460a-a5ab-6cf7788f34bd', 'Chengdu Aircraft Industry Group (CAIG)'),
  ('d2a87682-33ae-49ef-ab0f-b1f35f01956d', 'Guizhou Aircraft Industry Corporation (GAIC)'),
  ('9645022d-33cb-41a7-8902-9ed61b5ac5a6', 'KB Luch, Rybinsk'),
  ('88da1a33-39b3-4f67-b6af-9754e91198a5', 'Meridian (S.P. Korolev Meridian)'),
  ('ca4941cd-4828-44f7-8813-e3b72013be30', 'MIT Lincoln Laboratory'),
  ('5583563d-87b8-4f2a-9027-4c4f7a9e10b5', 'Shahed Aviation Industries'),
  ('e6eab384-fcd9-44e1-b566-085d61a89243', 'Spotter Global'),
  ('21335b89-b9e4-4088-bd10-1a691ee4b314', 'UAV Tactical Systems (U-TacS)'),
  ('adc51ccb-73b8-4fff-84b5-eff6520b9d83', 'United Instrument Manufacturing Corporation (UIMC)'),
  ('a49e3a30-2fb2-4597-991d-3ec16b817a62', 'Unmanned Systems Group'),
  -- Row F, outside the 19: KB Luch, Rybinsk is Vega's subsidiary, not a duplicate of it,
  -- so the subsidiary wrongly appended to the parent's name comes off. No alias: the
  -- appended fragment was an error, not a name this organisation was ever known by.
  ('5832034b-04c2-4115-9a47-7abf551d9960', 'Vega Radio Engineering Corporation')
)
update companies c set name = r.new_name, updated_at = now()
from ren r
where c.id = r.id
  and c.publication_status = 'live'
  and c.name is distinct from r.new_name;

-- The names being replaced are the useful ones: they are how these organisations appear
-- in sources and in the news pipeline's matching. Keep them as aliases rather than losing
-- them. Types follow the company_aliases_type_check vocabulary.
insert into company_aliases (company_id, alias, type) values
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150', 'Brolis Semiconductors', 'former_name'),
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150', 'Brolis Defence',        'aka'),
  ('2d6547f1-1bfb-4820-8e2e-07d285816928', 'CAAA',                  'abbreviation'),
  ('3611fb65-ec52-460a-a5ab-6cf7788f34bd', 'CAIG',                  'abbreviation'),
  ('d2a87682-33ae-49ef-ab0f-b1f35f01956d', 'GAIC',                  'abbreviation'),
  ('9645022d-33cb-41a7-8902-9ed61b5ac5a6', 'Design Bureau Luch',    'aka'),
  ('88da1a33-39b3-4f67-b6af-9754e91198a5', 'S.P. Korolev Meridian', 'aka'),
  -- SpotterRF is a documented former name: the company announced the change on
  -- 24 March 2022 ("SpotterRF has Grown into Spotter Global").
  ('e6eab384-fcd9-44e1-b566-085d61a89243', 'SpotterRF',             'former_name'),
  ('21335b89-b9e4-4088-bd10-1a691ee4b314', 'U-TacS',                'abbreviation'),
  ('adc51ccb-73b8-4fff-84b5-eff6520b9d83', 'OPK',                   'abbreviation'),
  ('a49e3a30-2fb2-4597-991d-3ec16b817a62', 'Supercam',              'brand')
on conflict (company_id, alias) do nothing;

-- Expected: 13 renames applied, suppliers 2,410 and research 37 unchanged,
-- landscape 567 unchanged, composites with ' / ' 19 -> 7.
select (select count(*) from companies where publication_status='live'
          and name in ('Brolis Defence Group','China Academy of Aerospace Aerodynamics (CAAA)',
            'Chengdu Aircraft Industry Group (CAIG)','Guizhou Aircraft Industry Corporation (GAIC)',
            'KB Luch, Rybinsk','Meridian (S.P. Korolev Meridian)','MIT Lincoln Laboratory',
            'Shahed Aviation Industries','Spotter Global','UAV Tactical Systems (U-TacS)',
            'United Instrument Manufacturing Corporation (UIMC)','Unmanned Systems Group',
            'Vega Radio Engineering Corporation')) as renamed,
       (select count(*) from companies where publication_status='live' and name like '% / %') as composites_left,
       (select count(*) from landscape_candidates
          where landscape_slug='europe-uav-cuas-2026' and status='included') as landscape_included;

commit;
