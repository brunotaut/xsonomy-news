-- Rollback for the 13 applied renames (Tier A plus row F). Restores the exact
-- pre-rename names captured before the apply, and removes the 11 aliases it added. Guarded and idempotent; changes companies.name and company_aliases only.

begin;

with undo(id, old_name) as (values
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150'::uuid, 'Brolis Semiconductors / Brolis Defence'),
  ('2d6547f1-1bfb-4820-8e2e-07d285816928', 'CASC / China Academy of Aerospace Aerodynamics (CAAA)'),
  ('3611fb65-ec52-460a-a5ab-6cf7788f34bd', 'Chengdu Aircraft Industry Group (CAIG) / AVIC'),
  ('d2a87682-33ae-49ef-ab0f-b1f35f01956d', 'Guizhou Aircraft Industry Corporation / Chengdu (AVIC)'),
  ('9645022d-33cb-41a7-8902-9ed61b5ac5a6', 'KB Luch (part of Vega Concern / Rostec)'),
  ('88da1a33-39b3-4f67-b6af-9754e91198a5', 'Meridian / Politek-Aero'),
  ('ca4941cd-4828-44f7-8813-e3b72013be30', 'MIT Lincoln Laboratory / U.S. DoD Strategic Capabilities Office'),
  ('5583563d-87b8-4f2a-9027-4c4f7a9e10b5', 'Shahed Aviation Industries / HESA'),
  ('e6eab384-fcd9-44e1-b566-085d61a89243', 'Spotter Global / SpotterRF'),
  ('21335b89-b9e4-4088-bd10-1a691ee4b314', 'Thales / Elbit Systems (U-TacS joint venture)'),
  ('adc51ccb-73b8-4fff-84b5-eff6520b9d83', 'United Instrument Manufacturing Corporation (OPK / Rostec)'),
  ('a49e3a30-2fb2-4597-991d-3ec16b817a62', 'Unmanned Systems Group (Supercam / BAS)'),
  ('5832034b-04c2-4115-9a47-7abf551d9960', 'Vega Radio Engineering Corporation (Luch Design Bureau, Rybinsk)')
)
update companies c set name = u.old_name, updated_at = now()
from undo u where c.id = u.id and c.name is distinct from u.old_name;

delete from company_aliases a
 using (values
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150'::uuid, 'Brolis Semiconductors'),
  ('59fd4d05-1fb6-4a4d-b007-a2f634d37150', 'Brolis Defence'),
  ('2d6547f1-1bfb-4820-8e2e-07d285816928', 'CAAA'),
  ('3611fb65-ec52-460a-a5ab-6cf7788f34bd', 'CAIG'),
  ('d2a87682-33ae-49ef-ab0f-b1f35f01956d', 'GAIC'),
  ('9645022d-33cb-41a7-8902-9ed61b5ac5a6', 'Design Bureau Luch'),
  ('88da1a33-39b3-4f67-b6af-9754e91198a5', 'S.P. Korolev Meridian'),
  ('e6eab384-fcd9-44e1-b566-085d61a89243', 'SpotterRF'),
  ('21335b89-b9e4-4088-bd10-1a691ee4b314', 'U-TacS'),
  ('adc51ccb-73b8-4fff-84b5-eff6520b9d83', 'OPK'),
  ('a49e3a30-2fb2-4597-991d-3ec16b817a62', 'Supercam')
) as v(id, alias)
where a.company_id = v.id and a.alias = v.alias::citext;

commit;
