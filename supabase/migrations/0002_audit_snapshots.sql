-- Synced audits: one row per signed-in person holding their checklist state.
-- Only the owner can read or write it (RLS). Opt-in: nothing is stored unless
-- the person signs in and turns on sync.
create table if not exists app.audit_snapshots (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null check (octet_length(state::text) < 200000),
  updated_at timestamptz not null default now()
);
alter table app.audit_snapshots enable row level security;
create policy owner_all on app.audit_snapshots for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on app.audit_snapshots to authenticated;
