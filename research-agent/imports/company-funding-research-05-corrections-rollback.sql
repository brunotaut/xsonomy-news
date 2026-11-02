-- Reverses only the two guarded checkpoint-05 corrections.
do $rollback$
begin
  if not exists (
    select 1 from public.company_funding_rounds
    where id = '65b5afd8-e75d-4754-8f7c-bf7e3dbcfe43'
      and announced_date = '2026-10-22'
      and closing_status = 'closed'
      and note_en = 'Formal venture stage and investor cheque split beyond the named investor are not disclosed.'
  ) then
    raise exception 'Arke Telekom rollback guard failed';
  end if;

  if not exists (
    select 1 from public.company_funding_rounds
    where id = '3ad94092-387c-45e4-9ca8-035643945709'
      and announced_date = '2026-02-19'
      and closing_status = 'announced'
      and note_en = 'Amount and primary-versus-secondary split are not established. No lead role is inferred.'
  ) then
    raise exception 'DeltaQuad rollback guard failed';
  end if;

  update public.company_funding_rounds
  set announced_date = '2026-10-14', updated_at = '2026-11-02 14:42:36.854566+00'
  where id = '65b5afd8-e75d-4754-8f7c-bf7e3dbcfe43';

  update public.company_funding_rounds
  set closing_status = 'closed', updated_at = '2026-11-02 14:42:36.854566+00'
  where id = '3ad94092-387c-45e4-9ca8-035643945709';
end $rollback$;
