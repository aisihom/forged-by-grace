-- Real-device error log for js/guard.js (applied 2026-11-12 as migration app_errors_log).
-- Clients (anon/authenticated) may INSERT only. Nobody can read it with the public key;
-- read it in the Supabase dashboard:  select * from app_errors order by created_at desc limit 50;
create table if not exists public.app_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  version text check (char_length(version) <= 20),
  kind text check (char_length(kind) <= 40),
  msg text not null check (char_length(msg) <= 500),
  src text check (char_length(src) <= 200),
  line int, col int,
  stack text check (char_length(stack) <= 2000),
  route text check (char_length(route) <= 60),
  role text check (char_length(role) <= 20),
  ua text check (char_length(ua) <= 200),
  standalone boolean
);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;
grant insert (version, kind, msg, src, line, col, stack, route, role, ua, standalone) on public.app_errors to anon, authenticated;
create policy app_errors_insert on public.app_errors for insert to anon, authenticated with check (true);
create index if not exists app_errors_created_idx on public.app_errors (created_at desc);
