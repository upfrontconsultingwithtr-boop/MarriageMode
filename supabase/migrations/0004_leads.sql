-- 0004: leads from the public site (partner sign-ups and the waitlist).
-- Anyone may ADD a lead (insert only). Nobody but the service role can read,
-- change or delete leads, so one visitor never sees another's details.
create table if not exists app.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('partner', 'waitlist')),
  email      text not null check (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name       text check (length(name) <= 100),
  org        text check (length(org) <= 150),
  role       text check (length(role) <= 60),
  city       text check (length(city) <= 100),
  note       text check (length(note) <= 1000),
  source     text check (length(source) <= 100)
);
alter table app.leads enable row level security;
revoke all on app.leads from anon, authenticated;
grant insert (kind, email, name, org, role, city, note, source) on app.leads to anon, authenticated;
drop policy if exists leads_insert_only on app.leads;
create policy leads_insert_only on app.leads for insert to anon, authenticated with check (true);
