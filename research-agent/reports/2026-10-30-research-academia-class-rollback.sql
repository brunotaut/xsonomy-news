-- Rollback for the 11 Research & academia membership corrections applied 2026-10-30
-- (migration 20261030...research_academia_class_membership_corrections).
--
-- These are the exact company_type values each row held immediately before the apply,
-- captured in the pre-apply drift check. Zero drift was recorded against the values the
-- approved SQL was written from, so these are also the original values.
--
-- Guarded and idempotent: a rerun matches nothing. Restores 2,411 suppliers and
-- 36 research organisations. Changes company_type only — no publication status, no slug.

update companies c set company_type = v.old_type, updated_at = now()
from (values
  ('2d6547f1-1bfb-4820-8e2e-07d285816928'::uuid, 'research_institute'), -- CASC / CAAA
  ('71372805-fc4a-4a94-8d02-f45b03e2f690', 'research_institute'),       -- Chengdu Aircraft Design and Research Institute
  ('d346bcda-05fb-497f-b54a-47ac2bba2eb2', 'research_institute'),       -- NPO Android Technology
  ('346490d2-cee5-41b3-991a-9f5c66ae5293', 'research_institute'),       -- Roke Manor Research
  ('c5cbb0e4-1185-41d8-ac22-46db4da8e61f', 'research_institute'),       -- SGS-CSTC
  ('b75c4fdf-7990-4b99-b69e-4ba0bc6e65c8', null),                      -- Central Michigan University
  ('dcb46913-3a1f-4834-808d-930572359eb0', null),                      -- Embry-Riddle Aeronautical University
  ('44064f97-26a6-4e72-8e83-2b22ed82a869', null),                      -- Peking University
  ('9e84a790-08a6-4492-a965-6819306d4bef', null),                      -- University of Hong Kong
  ('eb530227-9d0b-43da-8b99-37b81c06f923', null),                      -- University of Maryland
  ('f966ff63-d2cf-4cca-9a18-f76e028724ba', null)                       -- University of Pennsylvania
) as v(id, old_type)
where c.id = v.id
  and c.publication_status = 'live'
  and c.company_type is distinct from v.old_type;
