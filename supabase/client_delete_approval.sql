-- v3.31.0 (migration client_delete_approval_v3_31_0)
-- A) Coach "Delete client" really deletes everything + leaves a tombstone so the client's phone wipes itself.
-- B) Coach approval gate: every new sign-up is 'pending' until the coach taps "Toegang geven".
--    Status: 'invited' (coach made the row, nobody signed up yet) -> 'pending' (signed up) -> 'active' (approved).

-- ---------- B: approval ----------
-- status may now be 'pending' (signed up, waiting for the coach)
alter table public.clients drop constraint if exists clients_status_check;
alter table public.clients add constraint clients_status_check check (status = any (array['invited','pending','active']::text[]));
-- everyone who exists today stays approved (nobody gets locked out)
update public.clients set status = 'active' where status is distinct from 'active' and user_id is not null;

-- ids the signed-in user may use as an APPROVED client (pending users get nothing)
create or replace function private.my_active_client_ids() returns setof uuid language sql stable security definer set search_path = '' as $$
  select id from public.clients where user_id = (select auth.uid()) and status = 'active';
$$;
-- coach: all own clients; client: only own row once approved
create or replace function private.my_client_ids() returns setof uuid language sql stable security definer set search_path = '' as $$
  select id from public.clients where coach_id = (select auth.uid()) or (user_id = (select auth.uid()) and status = 'active');
$$;

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated
  using (coach_id = (select auth.uid()) or (user_id = (select auth.uid()) and status = 'active'));

drop policy if exists data_insert on public.client_data;
create policy data_insert on public.client_data for insert to authenticated
  with check (client_id in (select private.my_active_client_ids()));
drop policy if exists data_update on public.client_data;
create policy data_update on public.client_data for update to authenticated
  using (client_id in (select private.my_active_client_ids())) with check (client_id in (select private.my_active_client_ids()));

drop policy if exists photos_ins on storage.objects;
create policy photos_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'checkin-photos' and ((storage.foldername(name))[1])::uuid in (select private.my_active_client_ids()));

-- new sign-ups are pending (also when the coach made the row via "Invite for live sync")
create or replace function private.link_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from private.coach_emails where lower(email) = lower(new.email)) then
    insert into public.coaches(user_id, email) values (new.id, lower(new.email)) on conflict do nothing;
    update public.clients set coach_id = new.id where coach_id is null and lower(coach_email) = lower(new.email);
  end if;
  update public.clients set user_id = new.id, status = 'pending', updated_at = now()
    where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;

create or replace function private.join_coach(p_token text, p_name text, p_profile jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_coach uuid; v_id uuid; v_email text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select user_id into v_coach from public.coaches where invite_token = lower(trim(p_token));
  if v_coach is null then raise exception 'invalid invite'; end if;
  if v_coach = v_uid then raise exception 'coach cannot join self'; end if;
  select id into v_id from public.clients where user_id = v_uid limit 1;
  if v_id is not null then return v_id; end if;
  select email into v_email from auth.users where id = v_uid;
  insert into public.clients(coach_id, user_id, email, name, profile, status, consent_at, notes)
  values (v_coach, v_uid, lower(v_email), left(coalesce(nullif(trim(p_name),''), split_part(v_email,'@',1)),80), p_profile, 'pending', now(), 'Nieuw via uitnodigingslink — wacht op goedkeuring')
  returning id into v_id;
  return v_id;
end $$;

-- the phone asks: what am I? ('active' | 'pending' | 'invited' | 'none'). Only ever about the caller.
create or replace function public.my_status() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r record;
begin
  if auth.uid() is null then return jsonb_build_object('status', 'none'); end if;
  select id, status into r from public.clients where user_id = auth.uid() limit 1;
  if r.id is null then return jsonb_build_object('status', 'none'); end if;
  return jsonb_build_object('status', coalesce(r.status, 'pending'), 'client_id', r.id);
end $$;

-- a pending client may only send intake + consent (so the coach can decide)
create or replace function public.pending_push(p_kind text, p_data jsonb) returns boolean language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_kind not in ('intake', 'consent') then raise exception 'not allowed'; end if;
  if p_data is null or length(p_data::text) > 200000 then raise exception 'bad request'; end if;
  select id into cid from public.clients where user_id = auth.uid() limit 1;
  if cid is null then raise exception 'not a client'; end if;
  insert into public.client_data(client_id, kind, data, updated_at) values (cid, p_kind, p_data, now())
  on conflict (client_id, kind) do update set data = excluded.data, updated_at = excluded.updated_at;
  return true;
end $$;

-- health keys + Shortcut pushes only for approved clients
create or replace function private.my_health_token(p_reset boolean) returns text language plpgsql security definer set search_path = '' as $$
declare cid uuid; tok text;
begin
  select id into cid from public.clients where user_id = auth.uid() and status = 'active';
  if cid is null then raise exception 'not a client'; end if;
  if p_reset then delete from private.health_tokens where client_id = cid; end if;
  select token into tok from private.health_tokens where client_id = cid;
  if tok is null then
    tok := 'fbgh_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into private.health_tokens(client_id, token) values (cid, tok);
  end if;
  return tok;
end $$;

create or replace function private.health_ok() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'health_sync' and not exists (select 1 from public.clients where id = new.client_id and status = 'active') then
    raise exception 'client not approved';
  end if;
  return new;
end $$;
drop trigger if exists health_ok on public.client_data;
create trigger health_ok before insert or update on public.client_data for each row when (new.kind = 'health_sync') execute function private.health_ok();

-- ---------- A: delete ----------
create table if not exists private.deleted_clients (
  client_id uuid primary key, user_id uuid, coach_id uuid not null, at timestamptz not null default now()
);

-- coach deletes ONE of his own clients completely. Photos must be removed first with the Storage API
-- (storage.objects refuses direct SQL deletes); this refuses while any photo of the client is left.
create or replace function public.coach_delete_client(p_cid uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); r record; n_left int; n_data int; v_auth boolean := false;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.coaches where user_id = v_uid) then raise exception 'not a coach'; end if;
  select id, user_id, coach_id into r from public.clients where id = p_cid;
  if r.id is null or r.coach_id is distinct from v_uid then raise exception 'not your client'; end if;
  if r.user_id = v_uid then raise exception 'cannot delete yourself'; end if;
  select count(*) into n_left from storage.objects where bucket_id = 'checkin-photos' and name like p_cid::text || '/%';
  if n_left > 0 then raise exception 'photos left: %', n_left; end if;
  insert into private.deleted_clients(client_id, user_id, coach_id) values (r.id, r.user_id, v_uid)
    on conflict (client_id) do update set at = now();
  delete from private.health_tokens where client_id = r.id;
  delete from public.client_data where client_id = r.id;
  get diagnostics n_data = row_count;
  delete from public.clients where id = r.id;
  -- the login itself goes too (never a coach account): signing up again later starts empty and pending
  if r.user_id is not null and not exists (select 1 from public.coaches where user_id = r.user_id)
     and not exists (select 1 from public.clients where user_id = r.user_id) then
    delete from auth.users where id = r.user_id; v_auth := true;
  end if;
  return jsonb_build_object('ok', true, 'data_rows', n_data, 'login_deleted', v_auth);
end $$;

-- phone: "was I deleted?" Explicit yes/no; needs the client id (+ user id) the phone already has.
create or replace function public.fbg_was_deleted(p_cid uuid, p_uid uuid default null) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.deleted_clients where client_id = p_cid and (p_uid is null or user_id is null or user_id = p_uid));
$$;
-- coach: ids I deleted (so other devices drop them too)
create or replace function public.coach_deleted_ids() returns setof uuid language sql stable security definer set search_path = '' as $$
  select client_id from private.deleted_clients where coach_id = (select auth.uid());
$$;

revoke all on function public.coach_delete_client(uuid), public.my_status(), public.pending_push(text, jsonb), public.coach_deleted_ids() from public, anon;
grant execute on function public.coach_delete_client(uuid), public.my_status(), public.pending_push(text, jsonb), public.coach_deleted_ids() to authenticated;
revoke all on function public.fbg_was_deleted(uuid, uuid) from public;
grant execute on function public.fbg_was_deleted(uuid, uuid) to anon, authenticated;
revoke all on function private.my_active_client_ids() from public, anon;
grant execute on function private.my_active_client_ids() to authenticated;
