-- Self-service unsubscribe.
--
-- The newsletter footer used to link to mailto:news@uav360.xyz, but uav360.xyz
-- publishes no MX record, so nothing could ever receive that mail — the link
-- was a dead end. Each subscriber now carries an unguessable token, and a
-- SECURITY DEFINER function lets the public site act on it without granting
-- anon any write access to the table.

alter table public.subscribers
  add column if not exists unsub_token uuid not null default gen_random_uuid();

create unique index if not exists subscribers_unsub_token_idx
  on public.subscribers (unsub_token);

-- Turns every digest off for the holder of the token. Returns true when a row
-- matched, so the page can tell "done" from "that link is not recognised"
-- without revealing whether an address exists.
create or replace function public.unsubscribe(token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare matched int;
begin
  update public.subscribers
     set daily = false, weekly = false, monthly = false
   where unsub_token = token;
  get diagnostics matched = row_count;
  return matched > 0;
end $$;

-- anon may CALL it, but still has no direct UPDATE on subscribers.
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
