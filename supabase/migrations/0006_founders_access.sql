-- 0006: founders' access. People on this private list get every Marriage Mode
-- product free. The list is filled directly in the database (never in code) and
-- nobody can read it; the app can only ask "am I on it?" for the signed-in user.
create table if not exists app.comp_accounts (
  email      text primary key check (email = lower(email)),
  note       text,
  created_at timestamptz not null default now()
);
alter table app.comp_accounts enable row level security;
revoke all on app.comp_accounts from anon, authenticated;

create or replace function private.is_comped() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.comp_accounts c join auth.users u on lower(u.email) = c.email where u.id = auth.uid())
$$;
create or replace function app.am_i_comped() returns boolean
language sql stable security definer set search_path = '' as $$ select private.is_comped() $$;
revoke all on function app.am_i_comped() from public;
grant execute on function app.am_i_comped() to authenticated;
grant execute on function private.is_comped() to authenticated;
