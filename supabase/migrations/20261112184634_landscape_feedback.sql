-- Private inbox for the public landscape feedback form. No anonymous table/RPC access.
create table if not exists public.landscape_feedback (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 email text not null check(length(email) between 3 and 254 and email !~ '[[:space:]]'),
 message text not null check(length(btrim(message)) between 10 and 10000),
 consent boolean not null check(consent=true),
 consent_version text not null check(consent_version='2026-11-12'),
 consent_text text not null,
 consented_at timestamptz not null default now(),
 ip_hash text check(ip_hash ~ '^[A-Za-z0-9_-]{43}$'),
 challenge_id uuid not null unique,
 review_status text not null default 'new' check(review_status in ('new','reviewed','closed')),
 notification_status text not null default 'pending' check(notification_status in ('pending','sending','sent','failed')),
 notification_attempts integer not null default 0 check(notification_attempts>=0),
 notification_next_attempt_at timestamptz not null default now(),
 notification_lease_token uuid,
 notification_locked_until timestamptz,
 notification_sent_at timestamptz,
 notification_provider_id text,
 notification_error text
);
alter table public.landscape_feedback enable row level security;
revoke all on table public.landscape_feedback from public,anon,authenticated;
grant select,insert,update on table public.landscape_feedback to service_role;
create index if not exists landscape_feedback_rate_ip on public.landscape_feedback(ip_hash,created_at desc) where ip_hash is not null;
create index if not exists landscape_feedback_rate_email on public.landscape_feedback(email,created_at desc);
create index if not exists landscape_feedback_notifications on public.landscape_feedback(notification_next_attempt_at,created_at) where notification_sent_at is null;
comment on table public.landscape_feedback is 'Private recommendations and contact emails; service-role only. Never export to the public catalogue.';

create or replace function public.submit_landscape_feedback(p_email text,p_message text,p_consent boolean,p_consent_version text,p_ip_hash text,p_challenge_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing public.landscape_feedback%rowtype; saved_id uuid;
begin
 if p_consent is distinct from true or p_consent_version is distinct from '2026-11-12' then raise exception 'feedback_consent_required'; end if;
 if p_email is null or length(p_email)>254 or p_email !~ '^[^@[:space:]]+@[^@.[:space:]]+([.][^@.[:space:]]+)+$' or p_message is null or length(btrim(p_message)) not between 10 and 10000 or p_ip_hash is null or p_ip_hash !~ '^[A-Za-z0-9_-]{43}$' or p_challenge_id is null then raise exception 'feedback_invalid'; end if;
 -- A small fixed lock makes quota checks + insert one atomic operation under concurrency.
 perform pg_catalog.pg_advisory_xact_lock(728394019);
 select * into existing from public.landscape_feedback where challenge_id=p_challenge_id;
 if found then
  if existing.email=lower(btrim(p_email)) and existing.message=btrim(p_message) then return jsonb_build_object('id',existing.id,'duplicate',true); end if;
  raise exception 'feedback_replay_conflict';
 end if;
 if (select count(*) from public.landscape_feedback where created_at>now()-interval '1 hour' and ip_hash=p_ip_hash)>=20
 or (select count(*) from public.landscape_feedback where created_at>now()-interval '1 hour' and email=lower(btrim(p_email)))>=3
 or (select count(*) from public.landscape_feedback where created_at>now()-interval '1 day')>=120 then raise exception 'feedback_rate_limit'; end if;
 insert into public.landscape_feedback(email,message,consent,consent_version,consent_text,ip_hash,challenge_id)
 values(lower(btrim(p_email)),btrim(p_message),true,'2026-11-12','I agree that xSonomy may store and process my email address and message to review my suggestion and contact me about it. I have read the privacy information below.',p_ip_hash,p_challenge_id) returning id into saved_id;
 return jsonb_build_object('id',saved_id,'duplicate',false);
end $$;
revoke all on function public.submit_landscape_feedback(text,text,boolean,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_landscape_feedback(text,text,boolean,text,text,uuid) to service_role;

create or replace function public.claim_landscape_feedback_notifications(p_limit integer default 20)
returns setof public.landscape_feedback language plpgsql security invoker set search_path='' as $$
begin
 -- Rate-limit identifiers are unnecessary after the quota window; keep the feedback itself.
 update public.landscape_feedback set ip_hash=null where ip_hash is not null and created_at<now()-interval '2 days';
 return query
 with pending as (
  select id from public.landscape_feedback where notification_sent_at is null and notification_attempts<8 and notification_next_attempt_at<=now() and (notification_locked_until is null or notification_locked_until<now()) order by created_at for update skip locked limit greatest(1,least(coalesce(p_limit,20),20))
 ) update public.landscape_feedback f set notification_status='sending',notification_attempts=f.notification_attempts+1,notification_locked_until=now()+interval '10 minutes',notification_lease_token=gen_random_uuid() from pending where f.id=pending.id returning f.*;
end $$;
revoke all on function public.claim_landscape_feedback_notifications(integer) from public,anon,authenticated;
grant execute on function public.claim_landscape_feedback_notifications(integer) to service_role;

create or replace function public.finish_landscape_feedback_notification(p_id uuid,p_lease_token uuid,p_provider_id text default null,p_error text default null)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_provider_id is null and (p_error is null or p_error !~ '^(resend_http_[0-9]{3}|resend_network|resend_bad_response)$') then raise exception 'feedback_invalid_delivery_result'; end if;
 update public.landscape_feedback set
  notification_status=case when p_provider_id is not null then 'sent' when notification_attempts>=8 then 'failed' else 'pending' end,
  notification_provider_id=p_provider_id,
  notification_sent_at=case when p_provider_id is not null then now() else null end,
  notification_error=case when p_provider_id is not null then null else p_error end,
  notification_next_attempt_at=now()+make_interval(mins=>least(120,5*(2^least(notification_attempts,5))::integer)),
  notification_locked_until=null,notification_lease_token=null
 where id=p_id and notification_lease_token=p_lease_token and notification_sent_at is null;
 if not found then raise exception 'feedback_lease_lost'; end if;
end $$;
revoke all on function public.finish_landscape_feedback_notification(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_landscape_feedback_notification(uuid,uuid,text,text) to service_role;
