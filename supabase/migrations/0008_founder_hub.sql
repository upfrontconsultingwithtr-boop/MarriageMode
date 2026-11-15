-- 0008: Tiffany's hub as a live page on the Marriage Mode site (not hosted by Claude).
-- Only founders (app.comp_accounts) can read or write it. Claude writes with the
-- service role. Documents keep the same shape as the old hub (data jsonb).
create table if not exists app.hub_tasks (
  id text primary key, data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists app.hub_messages (
  id text primary key default gen_random_uuid()::text, data jsonb not null, created_at timestamptz not null default now()
);
alter table app.hub_tasks enable row level security;
alter table app.hub_messages enable row level security;
drop policy if exists founders_all on app.hub_tasks;
drop policy if exists founders_all on app.hub_messages;
create policy founders_all on app.hub_tasks for all to authenticated using (private.is_comped()) with check (private.is_comped());
create policy founders_all on app.hub_messages for all to authenticated using (private.is_comped()) with check (private.is_comped());
grant select, insert, update on app.hub_tasks, app.hub_messages to authenticated;
