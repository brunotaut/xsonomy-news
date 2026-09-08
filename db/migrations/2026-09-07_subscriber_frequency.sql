-- Per-subscriber choice of which digests to receive.
--
-- APPLIED to the live database on 2026-09-08. Kept for the record and for
-- rebuilding a database from scratch; safe to re-run.
--
-- Defaulting to true is deliberate: every EXISTING subscriber is subscribed to
-- daily, weekly and monthly, which is what they signed up for before the choice
-- existed. Nobody is opted out by this change.

alter table public.subscribers add column if not exists daily   boolean not null default true;
alter table public.subscribers add column if not exists weekly  boolean not null default true;
alter table public.subscribers add column if not exists monthly boolean not null default true;

-- digest.mjs reads by period, so index the flag it filters on.
create index if not exists subscribers_daily_idx   on public.subscribers (daily)   where daily;
create index if not exists subscribers_weekly_idx  on public.subscribers (weekly)  where weekly;
create index if not exists subscribers_monthly_idx on public.subscribers (monthly) where monthly;

-- Let PostgREST see the new columns immediately.
notify pgrst, 'reload schema';

-- Check: every existing subscriber should now show t | t | t
-- select email, daily, weekly, monthly from public.subscribers order by created_at;
