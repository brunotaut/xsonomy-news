-- Guarded correction: existing March 2022 Cysero entry, not an additional event.
-- AIFI reports approximately EUR1.5m; transaction counsel confirms a subscribed
-- capital increase and equity instruments. Preserve month-level date precision.
do $correction$
declare affected integer;
begin
 update public.company_funding_rounds f
 set amount=1500000,currency='EUR',amount_basis='closed_amount',amount_qualifier='approximate',
 note_en='Cysero completed its first investment in March 2022 through a capital increase and equity instruments. AIFI reports approximately EUR1.5m; month-level date precision is retained.',
 checked_at='2026-11-03',updated_at=now()
 from public.companies c
 where c.id=f.company_id and c.slug='flyingbasket' and f.round_key='cysero-investment-2022'
 and f.amount is null and f.currency is null and f.amount_basis='undisclosed'
 and f.amount_qualifier='exact' and f.announced_date='2022-03'
 and f.note_en='The later company statement reports Cysero as a shareholder; stake percentage is not an investment amount. No cheque size is established.';
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'FlyingBasket expected-old-value guard failed'; end if;
 insert into public.company_funding_round_sources(round_id,url,title,source_type,checked_at)
 select f.id,s.url,s.title,s.kind,'2026-11-03'::date
 from public.company_funding_rounds f join public.companies c on c.id=f.company_id
 cross join (values
 ('https://aifi.it/it/private-capital-today/il-fondo-cysero-investe-in-flyingbasket','AIFI reports approximately EUR1.5m first Cysero investment','third_party_report'),
 ('https://www.molinarilex.it/en/press-area/communication/avm-gestioni-sgr-invests-in-flyingbasket','Transaction counsel confirms subscribed capital increase and equity instruments','third_party_report')) s(url,title,kind)
 where c.slug='flyingbasket' and f.round_key='cysero-investment-2022'
 on conflict(round_id,url) do nothing;
end $correction$;
