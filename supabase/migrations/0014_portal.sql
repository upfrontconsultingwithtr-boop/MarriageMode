-- 0014 Marriage Mode customer portal: sign-in dashboard (results, important items, updates)
-- with security levels and access assignments. Tiffany 2026-11-21.
-- Levels: 4 Company Admin Access (everything; at least one must always exist)
--         3 Manager (sees every customer's dashboard, posts updates; cannot change access)
--         2 Coach / Support (sees and posts only for customers assigned to them)
--         1 Customer (sees only their own dashboard)
-- Customers' raw exports never reach the server; a dashboard holds only what the customer syncs.

create table if not exists app.portal_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text check (char_length(display_name) <= 80),
  level smallint not null default 1 check (level between 1 and 4),
  created_at timestamptz not null default now()
);
create table if not exists app.portal_assignments (
  staff_id uuid not null references app.portal_members(user_id) on delete cascade,
  customer_id uuid not null references app.portal_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, customer_id)
);
create table if not exists app.portal_dashboards (
  customer_id uuid primary key references auth.users(id) on delete cascade,
  results jsonb not null default '{}'::jsonb check (pg_column_size(results) < 20000),
  items jsonb not null default '[]'::jsonb check (pg_column_size(items) < 20000),
  updated_at timestamptz not null default now()
);
create table if not exists app.portal_updates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  urgent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists portal_updates_customer on app.portal_updates (customer_id, created_at desc);

alter table app.portal_members enable row level security;
alter table app.portal_assignments enable row level security;
alter table app.portal_dashboards enable row level security;
alter table app.portal_updates enable row level security;
revoke all on app.portal_members, app.portal_assignments, app.portal_dashboards, app.portal_updates from anon;

create or replace function private.portal_level() returns smallint
language sql stable security definer set search_path = '' as $$
  select coalesce((select m.level from app.portal_members m where m.user_id = auth.uid()), 0)::smallint $$;
create or replace function private.portal_can_see(customer uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() = customer
      or private.portal_level() >= 3
      or (private.portal_level() = 2 and exists (select 1 from app.portal_assignments a where a.staff_id = auth.uid() and a.customer_id = customer)) $$;
grant execute on function private.portal_level(), private.portal_can_see(uuid) to authenticated;

-- members: everyone reads their own row; managers and admins read all; nobody edits rows directly.
create policy "portal members read" on app.portal_members for select to authenticated
  using (user_id = auth.uid() or private.portal_level() >= 3 or exists (select 1 from app.portal_assignments a where a.staff_id = auth.uid() and a.customer_id = user_id));
grant select on app.portal_members to authenticated;

create policy "portal assignments read" on app.portal_assignments for select to authenticated
  using (staff_id = auth.uid() or customer_id = auth.uid() or private.portal_level() >= 3);
grant select on app.portal_assignments to authenticated;

create policy "portal dashboards read" on app.portal_dashboards for select to authenticated using (private.portal_can_see(customer_id));
create policy "portal dashboards own insert" on app.portal_dashboards for insert to authenticated with check (customer_id = auth.uid());
create policy "portal dashboards own update" on app.portal_dashboards for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "portal dashboards own delete" on app.portal_dashboards for delete to authenticated using (customer_id = auth.uid());
grant select, insert, update, delete on app.portal_dashboards to authenticated;

create policy "portal updates read" on app.portal_updates for select to authenticated using (private.portal_can_see(customer_id));
create policy "portal updates staff write" on app.portal_updates for insert to authenticated
  with check (author_id = auth.uid() and private.portal_level() >= 2 and private.portal_can_see(customer_id) and customer_id <> auth.uid());
create policy "portal updates admin delete" on app.portal_updates for delete to authenticated using (private.portal_level() = 4);
grant select, insert, delete on app.portal_updates to authenticated;

-- Never zero Company Admins.
create or replace function private.portal_keep_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.level = 4 and (tg_op = 'DELETE' or new.level < 4)
     and not exists (select 1 from app.portal_members m where m.level = 4 and m.user_id <> old.user_id) then
    raise exception 'at least one Company Admin Access account must remain';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists portal_keep_admin on app.portal_members;
create trigger portal_keep_admin before update or delete on app.portal_members for each row execute function private.portal_keep_admin();

-- Join on first sign-in: level 1, except founders (comp list), who get Company Admin Access.
create or replace function app.portal_join(name text default null) returns smallint
language plpgsql security definer set search_path = '' as $$
declare lvl smallint; em text;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select email into em from auth.users where id = auth.uid();
  insert into app.portal_members (user_id, email, display_name, level)
  values (auth.uid(), coalesce(em, ''), left(name, 80),
          case when exists (select 1 from app.comp_accounts c where c.email = lower(coalesce(em, ''))) then 4 else 1 end)
  on conflict (user_id) do update set display_name = coalesce(left(excluded.display_name, 80), app.portal_members.display_name);
  select level into lvl from app.portal_members where user_id = auth.uid();
  return lvl;
end $$;
grant execute on function app.portal_join(text) to authenticated;

-- Company Admin only: change a level, or assign / unassign a coach to a customer.
create or replace function app.portal_set_level(target uuid, new_level smallint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if private.portal_level() <> 4 then raise exception 'Company Admin Access required'; end if;
  if new_level not between 1 and 4 then raise exception 'level must be 1-4'; end if;
  update app.portal_members set level = new_level where user_id = target;
end $$;
create or replace function app.portal_assign(staff uuid, customer uuid, on_off boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if private.portal_level() <> 4 then raise exception 'Company Admin Access required'; end if;
  if on_off then insert into app.portal_assignments (staff_id, customer_id) values (staff, customer) on conflict do nothing;
  else delete from app.portal_assignments where staff_id = staff and customer_id = customer; end if;
end $$;
grant execute on function app.portal_set_level(uuid, smallint), app.portal_assign(uuid, uuid, boolean) to authenticated;
