-- Supabase-only: private bucket for paid downloads; founders (comped) can read.
insert into storage.buckets (id, name, public) values ('kits', 'kits', false) on conflict (id) do nothing;
drop policy if exists "kits founders read" on storage.objects;
create policy "kits founders read" on storage.objects for select to authenticated using (bucket_id = 'kits' and private.is_comped());
