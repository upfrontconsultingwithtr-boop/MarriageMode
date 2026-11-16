-- 0009: "Talk to a real counselor". Licensed counselors apply; founders check the
-- license and approve; couples browse approved counselors and send a session request.
-- Couples pay the counselor directly: Marriage Mode handles no money here.
create table if not exists app.counselors (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'paused')),
  name           text not null check (length(name) between 2 and 100),
  credential     text not null check (length(credential) between 2 and 60),   -- e.g. LMFT, LPC, PsyD
  license_state  text not null check (length(license_state) between 2 and 40),
  license_number text not null check (length(license_number) between 2 and 60),
  specialties    text[] not null default '{}' check (cardinality(specialties) <= 12),
  languages      text[] not null default '{English}' check (cardinality(languages) <= 6),
  formats        text[] not null default '{video}' check (cardinality(formats) <= 3),
  fee_note       text check (length(fee_note) <= 120),                        -- e.g. "$120/session, sliding scale"
  bio            text check (length(bio) <= 800),
  booking_url    text check (length(booking_url) <= 300 and booking_url ~* '^https://'),
  email          text not null check (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
alter table app.counselors enable row level security;
revoke all on app.counselors from anon, authenticated;
-- apply: insert only, always lands as pending
grant insert (name, credential, license_state, license_number, specialties, languages, formats, fee_note, bio, booking_url, email) on app.counselors to anon, authenticated;
-- browse: approved only, and never the private email
grant select (id, name, credential, license_state, license_number, specialties, languages, formats, fee_note, bio, booking_url) on app.counselors to anon, authenticated;
drop policy if exists counselors_apply on app.counselors;
create policy counselors_apply on app.counselors for insert to anon, authenticated with check (status = 'pending');
drop policy if exists counselors_browse on app.counselors;
create policy counselors_browse on app.counselors for select to anon, authenticated using (status = 'approved');

create or replace function private.counselor_open(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.counselors c where c.id = cid and c.status = 'approved') $$;
grant execute on function private.counselor_open(uuid) to anon, authenticated;

create table if not exists app.counselor_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  counselor_id uuid not null references app.counselors(id) on delete cascade,
  name         text not null check (length(name) between 1 and 100),
  email        text not null check (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  state        text check (length(state) <= 40),
  format       text check (length(format) <= 20),
  times        text check (length(times) <= 200),
  note         text check (length(note) <= 1000),
  forwarded    boolean not null default false
);
alter table app.counselor_requests enable row level security;
revoke all on app.counselor_requests from anon, authenticated;
grant insert (counselor_id, name, email, state, format, times, note) on app.counselor_requests to anon, authenticated;
drop policy if exists requests_insert on app.counselor_requests;
create policy requests_insert on app.counselor_requests for insert to anon, authenticated
  with check (private.counselor_open(counselor_id));

-- Founders only (checked inside): review applications and requests, approve, mark forwarded.
create or replace function app.founder_counselors() returns setof app.counselors
language sql stable security definer set search_path = '' as $$
  select * from app.counselors where private.is_comped() order by created_at desc $$;
create or replace function app.founder_counselor_requests() returns setof app.counselor_requests
language sql stable security definer set search_path = '' as $$
  select * from app.counselor_requests where private.is_comped() order by created_at desc $$;
create or replace function app.founder_set_counselor(cid uuid, new_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_comped() then raise exception 'founders only' using errcode = '42501'; end if;
  update app.counselors set status = new_status where id = cid;
end $$;
create or replace function app.founder_mark_forwarded(rid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_comped() then raise exception 'founders only' using errcode = '42501'; end if;
  update app.counselor_requests set forwarded = true where id = rid;
end $$;
revoke all on function app.founder_counselors(), app.founder_counselor_requests(), app.founder_set_counselor(uuid, text), app.founder_mark_forwarded(uuid) from public, anon;
grant execute on function app.founder_counselors(), app.founder_counselor_requests(), app.founder_set_counselor(uuid, text), app.founder_mark_forwarded(uuid) to authenticated;
