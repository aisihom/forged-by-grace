-- v3.32 (16 Nov 2026): an intake filled in via a link in Safari (not the home-screen app) used to stay in Safari only.
-- intake_drop saves it straight to the matching client's dossier: coach invite token + the client's own e-mail.
-- Append-only (an edit of the same intake id replaces only that one), max 20 intakes, max 100 kB. No match = nothing saved.
create or replace function public.intake_drop(p_token text, p_data jsonb) returns text
language plpgsql security definer set search_path to '' as $$
declare v_coach uuid; v_cid uuid; v_em text; v_old jsonb; v_new jsonb; v_id text;
begin
  if p_token is null or p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 100000 then return 'bad'; end if;
  if coalesce(p_data->>'type', '') <> 'intake' or coalesce(p_data->>'id', '') = '' or jsonb_typeof(p_data->'answers') <> 'object' then return 'bad'; end if;
  select user_id into v_coach from public.coaches where invite_token = lower(trim(p_token));
  if v_coach is null then return 'bad'; end if;
  v_em := lower(trim(coalesce(p_data->'answers'->>'email', '')));
  if v_em = '' then return 'nomatch'; end if;
  select id into v_cid from public.clients where coach_id = v_coach and lower(email) = v_em and status in ('active', 'pending') limit 1;
  if v_cid is null then return 'nomatch'; end if;
  v_id := p_data->>'id';
  select data into v_old from public.client_data where client_id = v_cid and kind = 'intake';
  if v_old is null or jsonb_typeof(v_old) <> 'array' then v_old := case when v_old is null or v_old = 'null'::jsonb then '[]'::jsonb else jsonb_build_array(v_old) end; end if;
  select coalesce(jsonb_agg(e), '[]'::jsonb) into v_new from jsonb_array_elements(v_old) e where coalesce(e->>'id', '') <> v_id;
  if jsonb_array_length(v_new) >= 20 then return 'full'; end if;
  v_new := jsonb_build_array(p_data) || v_new;
  insert into public.client_data(client_id, kind, data, updated_at) values (v_cid, 'intake', v_new, now())
  on conflict (client_id, kind) do update set data = excluded.data, updated_at = excluded.updated_at;
  return 'saved';
end $$;
revoke all on function public.intake_drop(text, jsonb) from public;
grant execute on function public.intake_drop(text, jsonb) to anon, authenticated;
