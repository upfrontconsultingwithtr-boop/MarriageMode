-- Partner space (messages between linked partners), profiles with photos,
-- and saved settings. Every row is limited by row-level security.

alter table app.profiles add column if not exists avatar_path text;
alter table app.settings add column if not exists prefs jsonb not null default '{}'::jsonb;

-- Is p_user my active partner? (security definer avoids RLS recursion)
create or replace function private.is_partner(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from app.couple_members me
    join app.couple_members them on them.couple_id = me.couple_id and them.user_id = p_user
    join app.couples c on c.id = me.couple_id and c.status = 'active'
    where me.user_id = auth.uid() and me.accepted_at is not null and them.accepted_at is not null and p_user <> auth.uid());
$$;
grant execute on function private.is_partner(uuid) to authenticated;

-- Partners can see each other's name and photo (nothing else).
create policy partner_read on app.profiles for select to authenticated using (private.is_partner(user_id));

-- Messages between partners.
create table if not exists app.couple_messages (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references app.couples(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists couple_messages_couple_time on app.couple_messages (couple_id, created_at);
alter table app.couple_messages enable row level security;
create policy members_read on app.couple_messages for select to authenticated using (private.is_active_couple_member(couple_id));
create policy members_write on app.couple_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and private.is_active_couple_member(couple_id));
create policy author_delete on app.couple_messages for delete to authenticated using (author_id = (select auth.uid()));
grant select, insert, delete on app.couple_messages to authenticated;

-- New sign-ups get a profile and settings row automatically.
create or replace function private.on_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into app.profiles (user_id) values (new.id) on conflict do nothing;
  insert into app.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.on_new_user();

-- Leave the partner space: ends it for both; sharing stops instantly.
create or replace function app.leave_couple() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update app.couples c set status = 'ended', ended_at = now()
   where c.status in ('pending','active')
     and exists (select 1 from app.couple_members m where m.couple_id = c.id and m.user_id = auth.uid());
end $$;
revoke all on function app.leave_couple() from public;
grant execute on function app.leave_couple() to authenticated;

-- Delete my account and everything tied to it (cascades through every app.* table).
create or replace function app.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  perform app.leave_couple();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function app.delete_my_account() from public;
grant execute on function app.delete_my_account() to authenticated;
