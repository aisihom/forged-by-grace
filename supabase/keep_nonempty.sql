-- v3.32 (16 Nov 2026): server-side net. An update may never replace a client's non-empty data with an empty copy
-- (fresh/empty phone, old cached app version). The old data is kept; a real delete of a client goes through
-- coach_delete_client (DELETE), which this trigger does not touch.
create or replace function private.fbg_blank(p_kind text, d jsonb) returns boolean
language sql immutable set search_path to '' as $$
  select case
    when d is null or d = 'null'::jsonb then true
    when p_kind = 'checkins' then coalesce(jsonb_array_length(case when jsonb_typeof(d->'list') = 'array' then d->'list' end), 0) = 0
                              and coalesce(jsonb_array_length(case when jsonb_typeof(d->'photoLog') = 'array' then d->'photoLog' end), 0) = 0
    when p_kind = 'game' then (d->'ls' is null or d->'ls' = '{}'::jsonb) and (d->'game' is null or d->'game' = 'null'::jsonb)
    when p_kind = 'photoGone' then d->'ids' is null or d->'ids' = '{}'::jsonb
    when jsonb_typeof(d) = 'object' then d = '{}'::jsonb
    when jsonb_typeof(d) = 'array' then jsonb_array_length(d) = 0
    else false end
$$;
create or replace function private.keep_nonempty() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if new.kind in ('food','sessions','body','habits','water','checkins','intake','recipes','profile','extra','game','consent','photoGone','health')
     and private.fbg_blank(new.kind, new.data) and not private.fbg_blank(old.kind, old.data) then
    new.data := old.data;
    new.updated_at := old.updated_at;
  end if;
  return new;
end $$;
drop trigger if exists keep_nonempty on public.client_data;
create trigger keep_nonempty before update on public.client_data for each row execute function private.keep_nonempty();
