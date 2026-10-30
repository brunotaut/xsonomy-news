-- Rollback for the 19 entity-extraction-error removals of 2026-10-30.
-- Restores publication_status='live'. No other field was changed.

begin;
update companies set publication_status='live' where id in (
  'f490f999-478d-460a-b751-e3e376ce2605',
  '1a9bb223-4737-4bfb-95eb-2fb6ee00d9da',
  'f71ebdaa-25b3-4d00-b612-a4a92cc839b3',
  '73149c22-048f-49ba-b98e-11022820b811',
  '5b86005a-7283-4a05-8d98-632b4a27d8b4',
  'e248dc29-794e-4927-9601-2f49ae688496',
  '4cbdcc71-013f-4424-a865-cd5ea8d2e555',
  '1a2eb67f-aba5-4a5a-b0b7-652921776dac',
  '5443845b-a9c6-4bd4-9adf-0987d0214298',
  'e5d7fd50-c814-4302-95bf-81537f93bbfe',
  '4729597f-3b6a-4338-81ad-72e3f3fb2aab',
  '99fd98cb-22f5-4d92-9529-033aa4e7be60',
  '568fde50-926b-4fb3-aa61-22a0665b8a7c',
  '6ef221f9-a256-4b26-8054-902f309fac9f',
  '8d1e8be1-e5a6-484f-b4a6-7f37414b4db5',
  '09fc8118-6c11-4de8-acc1-cad522ce60d7',
  'af434585-1fbb-4592-a30a-5d11ad1ac900',
  '972330a5-1350-4ffa-ab20-ccd8336c078f',
  '721df38f-86bd-48fb-b57e-b4f93f5e118d'
);
update products  set publication_status='live' where id in (
  '61c384ed-81e5-4d33-b504-09e1a56762ba',
  'f43ed148-676f-4a71-adad-df475fd7a898',
  'cf9479fc-d00a-4b99-93af-5e8110d93a62',
  '82c418c8-adba-4479-b27b-0e8cbe32b794',
  'e976c247-4ae1-4f63-b108-e72ba876a276',
  '81aa4053-9c0e-4587-9997-8fb658fbaf24',
  'af374361-fd49-418c-aa11-7075c8d94ec6'
);
commit;
