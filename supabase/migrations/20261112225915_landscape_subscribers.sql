create table if not exists public.landscape_subscribers (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (email=lower(btrim(email)) and length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@.]+(\.[^[:space:]@.]+)+$'),
 subscribed_at timestamptz not null default now(),
 consent boolean not null check(consent),
 consent_version text not null,
 consent_text text not null
);
alter table public.landscape_subscribers enable row level security;
revoke all on public.landscape_subscribers from public,anon,authenticated;
grant select,insert on public.landscape_subscribers to service_role;
comment on table public.landscape_subscribers is 'Private xSonomy landscape update opt-ins. Separate from news digests; never export in public catalogue data.';
create table if not exists public.landscape_subscription_requests (
 challenge_id uuid primary key,
 created_at timestamptz not null default now(),
 email_hash text not null,
 ip_hash text not null
);
alter table public.landscape_subscription_requests enable row level security;
revoke all on public.landscape_subscription_requests from public,anon,authenticated;
grant select,insert,delete on public.landscape_subscription_requests to service_role;
create index if not exists landscape_subscription_requests_ip on public.landscape_subscription_requests(ip_hash,created_at desc);
create index if not exists landscape_subscription_requests_email on public.landscape_subscription_requests(email_hash,created_at desc);
create index if not exists landscape_subscription_requests_time on public.landscape_subscription_requests(created_at);
create or replace function public.subscribe_landscape_updates(p_email text,p_consent boolean,p_consent_version text,p_ip_hash text,p_challenge_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare email_value text:=lower(btrim(p_email)); email_digest text; existing_hash text;
begin
 if p_consent is distinct from true or p_consent_version is distinct from '2026-11-12' then raise exception 'subscription_consent_required'; end if;
 if email_value is null or length(email_value)>254 or email_value !~ '^[^[:space:]@]+@[^[:space:]@.]+(\.[^[:space:]@.]+)+$' or p_ip_hash is null or length(p_ip_hash)>100 or p_challenge_id is null then raise exception 'subscription_invalid'; end if;
 email_digest:=encode(sha256(convert_to(email_value,'UTF8')),'hex');
 perform pg_advisory_xact_lock(70261112);
 delete from public.landscape_subscription_requests where created_at<now()-interval '2 days';
 select email_hash into existing_hash from public.landscape_subscription_requests where challenge_id=p_challenge_id;
 if found then
  if existing_hash<>email_digest then raise exception 'subscription_replay_conflict'; end if;
  return jsonb_build_object('ok',true);
 end if;
 if (select count(*) from public.landscape_subscription_requests where ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=20
 or (select count(*) from public.landscape_subscription_requests where email_hash=email_digest and created_at>now()-interval '1 hour')>=3
 or (select count(*) from public.landscape_subscription_requests where created_at>now()-interval '1 day')>=200 then raise exception 'subscription_rate_limit'; end if;
 insert into public.landscape_subscription_requests(challenge_id,email_hash,ip_hash) values(p_challenge_id,email_digest,p_ip_hash);
 insert into public.landscape_subscribers(email,consent,consent_version,consent_text)
 values(email_value,true,p_consent_version,'By subscribing, I agree to receive xSonomy landscape updates by email. I can ask to have my email removed at any time.') on conflict(email) do nothing;
 return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.subscribe_landscape_updates(text,boolean,text,text,uuid) from public,anon,authenticated;
grant execute on function public.subscribe_landscape_updates(text,boolean,text,text,uuid) to service_role;
