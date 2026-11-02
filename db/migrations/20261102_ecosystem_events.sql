-- European UAV & Counter-UAS events: data-only module, no website publication.
create table if not exists public.ecosystem_events (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 series_key text not null,
 name text not null,
 edition_year integer check (edition_year between 2000 and 2200),
 start_date date,
 end_date date,
 date_status text not null check (date_status in ('confirmed','announced','unannounced','conflicting')),
 date_precision text not null check (date_precision in ('day','month','season','year','unknown')),
 date_label text,
 event_status text not null check (event_status in ('scheduled','announced','unknown','postponed','cancelled','completed')),
 publication_status text not null default 'watchlist' check (publication_status in ('ready','watchlist','retired')),
 country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
 country text not null,
 city text,
 venue text,
 timezone text,
 attendance_mode text not null check (attendance_mode in ('in_person','online','hybrid','unknown')),
 organizer_name text,
 website_url text not null check (website_url ~ '^https?://'),
 registration_url text check (registration_url is null or registration_url ~ '^https?://'),
 exhibitor_url text check (exhibitor_url is null or exhibitor_url ~ '^https?://'),
 event_types text[] not null default '{}',
 topic_tags text[] not null default '{}',
 audience_tags text[] not null default '{}',
 relevance_tier text not null check (relevance_tier in ('core','adjacent')),
 classification_basis text not null,
 description_en text not null,
 access_policy text not null default 'not_verified' check (access_policy in ('not_verified','open_registration','invitation_only','approval_required')),
 ticket_price numeric check (ticket_price >= 0),
 ticket_currency char(3) check (ticket_currency is null or ticket_currency ~ '^[A-Z]{3}$'),
 registration_deadline date,
 speaker_deadline date,
 research_note_en text,
 source_verification text not null,
 checked_at date not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((start_date is null) = (end_date is null)),
 check (end_date >= start_date),
 check (date_status <> 'confirmed' or (date_precision='day' and start_date is not null and edition_year is not null)),
 check (date_precision <> 'day' or start_date is not null),
 check (publication_status <> 'ready' or (date_status='confirmed' and event_status='scheduled')),
 check ((ticket_price is null) = (ticket_currency is null))
);
create table if not exists public.ecosystem_event_sources (
 event_id uuid not null references public.ecosystem_events(id),
 url text not null check (url ~ '^https?://'),
 source_type text not null check (source_type in ('organizer','institution','industry_media','industry_association','exhibitor')),
 supported_fields text[] not null,
 finding_en text not null,
 checked_at date not null,
 primary key(event_id,url)
);
create index if not exists ecosystem_event_sources_event_idx on public.ecosystem_event_sources(event_id);
create index if not exists ecosystem_events_start_idx on public.ecosystem_events(start_date) where publication_status='ready';
create index if not exists ecosystem_events_country_idx on public.ecosystem_events(country_code);
create index if not exists ecosystem_events_series_idx on public.ecosystem_events(series_key);
create index if not exists ecosystem_events_topics_idx on public.ecosystem_events using gin(topic_tags);
create table if not exists public.ecosystem_event_research_runs (
 run_key text primary key,
 checked_at date not null,
 window_start date not null,
 window_end date not null check (window_end >= window_start),
 methodology_en text not null,
 limitations_en text not null,
 confirmed_count integer not null,
 watchlist_count integer not null,
 exclusions jsonb not null default '[]',
 coverage_notes jsonb not null default '{}'
);
alter table public.ecosystem_events enable row level security;
alter table public.ecosystem_event_sources enable row level security;
alter table public.ecosystem_event_research_runs enable row level security;
revoke all on public.ecosystem_events,public.ecosystem_event_sources,public.ecosystem_event_research_runs from anon,authenticated;
grant select,insert,update,delete on public.ecosystem_events,public.ecosystem_event_sources,public.ecosystem_event_research_runs to service_role;
create or replace view public.v_ecosystem_events with (security_invoker=true) as
select e.*,
 (select jsonb_agg(jsonb_build_object('url',s.url,'sourceType',s.source_type,'supportedFields',s.supported_fields,'finding',s.finding_en,'checkedAt',s.checked_at) order by s.url)
  from public.ecosystem_event_sources s where s.event_id=e.id) as sources
from public.ecosystem_events e
where e.publication_status='ready' and e.date_status='confirmed' and e.event_status='scheduled'
and exists(select 1 from public.ecosystem_event_sources s where s.event_id=e.id and 'dates'=any(s.supported_fields));
revoke all on public.v_ecosystem_events from anon,authenticated;
grant select on public.v_ecosystem_events to service_role;
comment on table public.ecosystem_events is 'Researched event editions and explicitly undated watch items. Ready means data ready, not published on website. Dates are local calendar days; end date inclusive.';
comment on view public.v_ecosystem_events is 'Server-only integration projection. Consumers choose their date window. No frontend is deployed by this migration.';
notify pgrst, 'reload schema';

