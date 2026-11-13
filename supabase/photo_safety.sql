-- v3.30.19 photo safety (applied 2026-11-13 as migration photo_safety_v3_30_19).
-- 1) client_data accepted every kind the app sends EXCEPT 'photoGone' -> every sync batch failed (23514)
--    and phones re-sent photo deletes forever. test/photo-safety.js checks this list against cloud.js snapshot().
alter table public.client_data add constraint client_data_kind_check check (kind = any (array['profile','sessions','food','body','habits','checkins','water','steps','health','intake','game','extra','health_sync','recipes','consent','avatar','notes','pause','photoGone']::text[]));
-- 2) deleting a check-in photo = MOVE to <clientId>/trash/<ms>__<id>.jpg (kept 30 days). Move needs UPDATE;
--    client and own coach may rename, and the new name must stay in the same client's folder.
drop policy if exists photos_upd on storage.objects;
create policy photos_upd on storage.objects for update to authenticated
  using (bucket_id = 'checkin-photos' and ((storage.foldername(name))[1])::uuid in (select private.my_client_ids()))
  with check (bucket_id = 'checkin-photos' and ((storage.foldername(name))[1])::uuid in (select private.my_client_ids()));
