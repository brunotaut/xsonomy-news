begin;

do $check$
declare matched integer;
begin
  select count(*) into matched
  from public.company_funding_rounds r
  join public.companies c on c.id = r.company_id
  where r.id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid
    and c.slug = 'marduk-technologies'
    and r.round_key = 'estonian-mod-grant-2024'
    and r.stage = 'Defence industry development grant'
    and r.announced_date = '2024'
    and r.amount is null
    and r.currency is null
    and r.amount_basis = 'undisclosed'
    and r.closing_status = 'announced'
    and r.note_en = 'Company-specific amount is not disclosed. The total competition budget and award range are not assigned to Marduk.'
    and r.publication_status = 'approved'
    and r.checked_at = date '2026-11-02'
    and r.record_kind = 'round'
    and r.amount_qualifier = 'exact';
  if matched <> 1 then
    raise exception 'Marduk correction expected exactly one unchanged source row, found %', matched;
  end if;
end $check$;

update public.company_funding_rounds
set amount = 93875,
    currency = 'EUR',
    amount_basis = 'closed_amount',
    note_en = 'The Estonian Ministry of Defence awarded EUR93,875, covering 25% of the passive optical drone-detection platform project cost.',
    checked_at = date '2026-11-02'
where id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid;

insert into public.company_funding_round_sources(round_id,url,title,source_type,checked_at)
values (
  '947b4b60-0303-42d4-a714-32cda39cf384'::uuid,
  'https://www.kaitseministeerium.ee/kaitsetoostuse-arendusprojektide-konkurss',
  'Estonian Ministry of Defence lists EUR93,875 grant for Marduk passive optical drone-detection platform',
  'third_party_report',
  date '2026-11-02'
)
on conflict(round_id,url) do nothing;

do $verify$
begin
  if not exists (
    select 1 from public.company_funding_rounds
    where id = '947b4b60-0303-42d4-a714-32cda39cf384'::uuid
      and amount = 93875 and currency = 'EUR' and amount_basis = 'closed_amount'
  ) then
    raise exception 'Marduk correction did not persist expected values';
  end if;
end $verify$;

commit;
