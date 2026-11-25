-- Rest-timer web push: schedule a "Rust voorbij!" notification so it still arrives
-- when iOS has frozen the PWA. $0: pg_cron only calls the Edge Function when an
-- alert is actually due. The VAPID private key lives in vault (fbg_vapid_*), never here.

create extension if not exists pg_cron;
do $$ begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    create extension pg_net with schema extensions;
  end if;
end $$;

create table if not exists private.rest_alerts (
  id uuid primary key default gen_random_uuid(),
  fire_at timestamptz not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);
create index if not exists rest_alerts_due on private.rest_alerts (fire_at) where status = 'pending';
create index if not exists rest_alerts_endpoint on private.rest_alerts (endpoint, status);

alter table private.rest_alerts enable row level security;
revoke all on private.rest_alerts from public, anon, authenticated;
grant all on private.rest_alerts to postgres, service_role;

create or replace function public.rest_alert_schedule(p_fire_at timestamptz, p_endpoint text, p_p256dh text, p_auth text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare v_id uuid;
begin
  if p_fire_at is null or p_fire_at < now() - interval '15 seconds' or p_fire_at > now() + interval '45 minutes' then
    raise exception 'bad fire_at';
  end if;
  if p_endpoint is null or length(p_endpoint) < 24 or length(p_endpoint) > 2000 or p_endpoint not like 'https://%' then
    raise exception 'bad endpoint';
  end if;
  if p_endpoint not like 'https://web.push.apple.com/%'
     and p_endpoint not like 'https://fcm.googleapis.com/%'
     and p_endpoint not like 'https://updates.push.services.mozilla.com/%'
     and p_endpoint not like 'https://wns2-%.notify.windows.com/%' then
    raise exception 'bad endpoint';
  end if;
  if p_p256dh is null or p_auth is null or length(p_p256dh) < 20 or length(p_p256dh) > 200 or length(p_auth) < 10 or length(p_auth) > 200 then
    raise exception 'bad keys';
  end if;
  if p_p256dh !~ '^[A-Za-z0-9_=-]+$' or p_auth !~ '^[A-Za-z0-9_=-]+$' then
    raise exception 'bad keys';
  end if;
  update private.rest_alerts set status = 'cancelled'
    where endpoint = p_endpoint and status in ('pending', 'sending');
  insert into private.rest_alerts(fire_at, endpoint, p256dh, auth)
    values (p_fire_at, p_endpoint, p_p256dh, p_auth)
    returning id into v_id;
  return v_id;
end $$;

create or replace function public.rest_alert_cancel(p_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_id is null then return; end if;
  update private.rest_alerts set status = 'cancelled'
    where id = p_id and status in ('pending', 'sending');
end $$;

create or replace function public.rest_alert_reschedule(p_id uuid, p_fire_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_id is null or p_fire_at is null or p_fire_at < now() - interval '15 seconds' or p_fire_at > now() + interval '45 minutes' then
    raise exception 'bad args';
  end if;
  update private.rest_alerts set fire_at = p_fire_at, status = 'pending', last_error = null
    where id = p_id and status in ('pending', 'sending', 'cancelled');
  if found then return p_id; end if;
  raise exception 'not found';
end $$;

-- Service-role only: claim due rows and read VAPID material from vault.
create or replace function public.rest_alert_claim()
returns table(id uuid, endpoint text, p256dh text, auth text)
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return query
  with due as (
    select a.id from private.rest_alerts a
    where a.status = 'pending' and a.fire_at <= now() + interval '2 seconds'
    order by a.fire_at
    limit 25
    for update skip locked
  )
  update private.rest_alerts a
     set status = 'sending'
    from due
   where a.id = due.id
  returning a.id, a.endpoint, a.p256dh, a.auth;
end $$;

create or replace function public.rest_alert_finish(p_id uuid, p_ok boolean, p_error text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  if p_ok then
    update private.rest_alerts set status = 'sent', sent_at = now(), last_error = null where id = p_id and status = 'sending';
  else
    -- Expired subscriptions (410) and bad endpoints: drop. Other errors: retry once later as pending if still soon.
    if coalesce(p_error, '') like '410%' or coalesce(p_error, '') like '404%' then
      update private.rest_alerts set status = 'failed', last_error = left(p_error, 300) where id = p_id;
    else
      update private.rest_alerts
         set status = case when fire_at > now() - interval '2 minutes' then 'pending' else 'failed' end,
             last_error = left(p_error, 300)
       where id = p_id and status = 'sending';
    end if;
  end if;
end $$;

create or replace function public.rest_alert_vapid()
returns table(public_key text, private_jwk jsonb, subject text)
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return query
  select
    (select ds.decrypted_secret from vault.decrypted_secrets ds where ds.name = 'fbg_vapid_public' limit 1),
    (select ds.decrypted_secret::jsonb from vault.decrypted_secrets ds where ds.name = 'fbg_vapid_private_jwk' limit 1),
    (select ds.decrypted_secret from vault.decrypted_secrets ds where ds.name = 'fbg_vapid_subject' limit 1);
end $$;

create or replace function private.rest_alert_tick()
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from private.rest_alerts
    where status <> 'pending' and coalesce(sent_at, created_at) < now() - interval '2 days';
  if not exists (
    select 1 from private.rest_alerts
     where status = 'pending' and fire_at <= now() + interval '8 seconds'
  ) then
    return;
  end if;
  perform net.http_post(
    url := 'https://hdcpxmctilthjhdhhixw.supabase.co/functions/v1/rest-alert-send',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg'
    ),
    timeout_milliseconds := 8000
  );
end $$;

revoke all on function public.rest_alert_schedule(timestamptz, text, text, text) from public;
revoke all on function public.rest_alert_cancel(uuid) from public;
revoke all on function public.rest_alert_reschedule(uuid, timestamptz) from public;
revoke all on function public.rest_alert_claim() from public, anon, authenticated;
revoke all on function public.rest_alert_finish(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.rest_alert_vapid() from public, anon, authenticated;
revoke all on function private.rest_alert_tick() from public, anon, authenticated;

grant execute on function public.rest_alert_schedule(timestamptz, text, text, text) to anon, authenticated;
grant execute on function public.rest_alert_cancel(uuid) to anon, authenticated;
grant execute on function public.rest_alert_reschedule(uuid, timestamptz) to anon, authenticated;
grant execute on function public.rest_alert_claim() to service_role;
grant execute on function public.rest_alert_finish(uuid, boolean, text) to service_role;
grant execute on function public.rest_alert_vapid() to service_role;
grant execute on function private.rest_alert_tick() to postgres;

-- Recreate the cron job idempotently (every 5s, cheap no-op unless an alert is due).
do $$
declare j bigint;
begin
  for j in select jobid from cron.job where jobname = 'fbg-rest-alerts' loop
    perform cron.unschedule(j);
  end loop;
  perform cron.schedule('fbg-rest-alerts', '5 seconds', 'select private.rest_alert_tick()');
end $$;
