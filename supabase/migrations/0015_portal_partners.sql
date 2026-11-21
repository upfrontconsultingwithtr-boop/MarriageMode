-- 0015 Partner pairing on file (Tiffany 2026-11-21): when the company already has a customer's
-- partner email, the intake fills it in, and the pair's shared dashboards show to each other.
-- Each person can read only their own row (matched by their signed-in email).
create table if not exists app.portal_partner_map (
  email text primary key check (email = lower(email)),
  partner_emails text[] not null check (cardinality(partner_emails) between 1 and 5),
  auto_share boolean not null default false,
  created_at timestamptz not null default now()
);
alter table app.portal_partner_map enable row level security;
revoke all on app.portal_partner_map from anon;
create or replace function private.my_email() returns text
language sql stable security definer set search_path = '' as $$ select lower(u.email) from auth.users u where u.id = auth.uid() $$;
grant execute on function private.my_email() to authenticated;
create policy "partner map own row" on app.portal_partner_map for select to authenticated using (email = private.my_email());
grant select on app.portal_partner_map to authenticated;

-- Partners on file may read each other's member row and shared dashboard.
create or replace function private.portal_is_partner(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from app.portal_partner_map m
    join auth.users me on lower(me.email) = m.email and me.id = auth.uid()
    join auth.users o on o.id = other and lower(o.email) = any (m.partner_emails)) $$;
grant execute on function private.portal_is_partner(uuid) to authenticated;
create or replace function private.portal_can_see(customer uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() = customer
      or private.portal_level() >= 3
      or (private.portal_level() = 2 and exists (select 1 from app.portal_assignments a where a.staff_id = auth.uid() and a.customer_id = customer))
      or private.portal_is_partner(customer) $$;
drop policy if exists "portal members read" on app.portal_members;
create policy "portal members read" on app.portal_members for select to authenticated
  using (user_id = auth.uid() or private.portal_level() >= 3 or private.portal_is_partner(user_id)
         or exists (select 1 from app.portal_assignments a where a.staff_id = auth.uid() and a.customer_id = user_id));
