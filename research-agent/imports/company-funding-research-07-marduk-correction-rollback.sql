begin;

do $check$
declare matched integer;
begin
  select count(*) into matched
  from public.company_funding_rounds
  where id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid
    and amount = 93875
    and currency = 'EUR'
    and amount_basis = 'closed_amount'
    and note_en = 'The Estonian Ministry of Defence awarded EUR93,875, covering 25% of the passive optical drone-detection platform project cost.'
    and checked_at = date '2026-11-02';
  if matched <> 1 then
    raise exception 'Marduk rollback expected exactly one corrected row, found %', matched;
  end if;
end $check$;

delete from public.company_funding_round_sources
where round_id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid
  and url = 'https://www.kaitseministeerium.ee/kaitsetoostuse-arendusprojektide-konkurss'
  and title = 'Estonian Ministry of Defence lists EUR93,875 grant for Marduk passive optical drone-detection platform'
  and source_type = 'third_party_report'
  and checked_at = date '2026-11-02';

update public.company_funding_rounds
set amount = null,
    currency = null,
    amount_basis = 'undisclosed',
    note_en = 'Company-specific amount is not disclosed. The total competition budget and award range are not assigned to Marduk.',
    checked_at = date '2026-11-02'
where id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid;

commit;
