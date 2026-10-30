-- Research & academia class — membership corrections
-- Adopted 2026-10-30. Run in the Supabase SQL editor (project uobidcahmrmfdmfbrtkt).
--
-- The class itself needed no database change: it is company_type IN
-- ('research_institute','university'), which the companies_company_type_check CHECK
-- constraint already permits, and the catalogue build does the split. This file only
-- makes the membership true.
--
-- Guarded and idempotent — `is distinct from` means a second run matches nothing.
-- Expected: 11 rows updated on the first run, 0 on any rerun.

begin;

with fix(id, newtype) as (values
  -- Mistyped as research. These are companies, divisions or a joint venture, and were
  -- sitting in a class that would have taken them out of the company count.
  ('2d6547f1-1bfb-4820-8e2e-07d285816928'::uuid, 'state_owned'), -- CASC / CAAA
  ('71372805-fc4a-4a94-8d02-f45b03e2f690', 'division'),          -- Chengdu Aircraft Design and Research Institute (AVIC)
  ('d346bcda-05fb-497f-b54a-47ac2bba2eb2', 'sme'),               -- NPO Android Technology
  ('346490d2-cee5-41b3-991a-9f5c66ae5293', 'division'),          -- Roke Manor Research (Chemring); in the published landscape
  ('c5cbb0e4-1185-41d8-ac22-46db4da8e61f', 'jv'),                -- SGS-CSTC
  -- Universities carrying no company_type at all, so the class could not see them.
  ('b75c4fdf-7990-4b99-b69e-4ba0bc6e65c8', 'university'),        -- Central Michigan University
  ('dcb46913-3a1f-4834-808d-930572359eb0', 'university'),        -- Embry-Riddle Aeronautical University
  ('44064f97-26a6-4e72-8e83-2b22ed82a869', 'university'),        -- Peking University
  ('9e84a790-08a6-4492-a965-6819306d4bef', 'university'),        -- University of Hong Kong
  ('eb530227-9d0b-43da-8b99-37b81c06f923', 'university'),        -- University of Maryland
  ('f966ff63-d2cf-4cca-9a18-f76e028724ba', 'university')         -- University of Pennsylvania
)
update companies c set company_type = f.newtype, updated_at = now()
from fix f
where c.id = f.id
  and c.publication_status = 'live'
  and c.company_type is distinct from f.newtype;

-- Check before committing. Expected: 2410 companies, 37 research & academia.
select count(*) filter (where company_type in ('research_institute','university')) as academia,
       count(*) filter (where company_type not in ('research_institute','university')
                           or company_type is null)                                as companies
from companies where publication_status = 'live';

commit;

-- ---------------------------------------------------------------------------
-- Rollback: restores the exact values held before this ran.
--
-- update companies set company_type = v.old, updated_at = now()
-- from (values
--   ('2d6547f1-1bfb-4820-8e2e-07d285816928'::uuid, 'research_institute'),
--   ('71372805-fc4a-4a94-8d02-f45b03e2f690', 'research_institute'),
--   ('d346bcda-05fb-497f-b54a-47ac2bba2eb2', 'research_institute'),
--   ('346490d2-cee5-41b3-991a-9f5c66ae5293', 'research_institute'),
--   ('c5cbb0e4-1185-41d8-ac22-46db4da8e61f', 'research_institute'),
--   ('b75c4fdf-7990-4b99-b69e-4ba0bc6e65c8', NULL),
--   ('dcb46913-3a1f-4834-808d-930572359eb0', NULL),
--   ('44064f97-26a6-4e72-8e83-2b22ed82a869', NULL),
--   ('9e84a790-08a6-4492-a965-6819306d4bef', NULL),
--   ('eb530227-9d0b-43da-8b99-37b81c06f923', NULL),
--   ('f966ff63-d2cf-4cca-9a18-f76e028724ba', NULL)
-- ) as v(id, old)
-- where companies.id = v.id;
