-- Supabase-only: private bucket for pictures founders attach to hub messages. Founders only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hub-uploads', 'hub-uploads', false, 10485760, array['image/png','image/jpeg','image/webp','image/gif','image/heic'])
on conflict (id) do nothing;
drop policy if exists "hub uploads founders read" on storage.objects;
drop policy if exists "hub uploads founders add" on storage.objects;
create policy "hub uploads founders read" on storage.objects for select to authenticated using (bucket_id = 'hub-uploads' and private.is_comped());
create policy "hub uploads founders add" on storage.objects for insert to authenticated with check (bucket_id = 'hub-uploads' and private.is_comped());
