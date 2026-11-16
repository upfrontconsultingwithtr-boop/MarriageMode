-- 0010: free home-screen reminders (web push) with no account.
-- Privacy: we keep only the phone's push address and the DATES something is due.
-- No names, no app names, no audit content. Notifications say only "something is due".
-- The device holds a random token; only that token can change or delete its row.
create table if not exists app.push_subs (
  token      uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  endpoint   text not null unique check (length(endpoint) <= 1000 and endpoint ~* '^https://([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)/'),
  p256dh     text not null check (length(p256dh) between 20 and 200),
  auth       text not null check (length(auth) between 8 and 100),
  lang       text not null default 'en' check (lang in ('en', 'es')),
  due        date[] not null default '{}' check (cardinality(due) <= 40),
  last_sent  date
);
alter table app.push_subs enable row level security;
revoke all on app.push_subs from anon, authenticated;
grant usage on schema app to service_role;
grant select, update, delete on app.push_subs to service_role;

create or replace function app.push_save(t uuid, ep text, key text, au text, lg text, dates date[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from app.push_subs where endpoint = ep and token <> t;
  insert into app.push_subs (token, endpoint, p256dh, auth, lang, due)
  values (t, ep, key, au, lg, (select coalesce(array_agg(distinct d order by d), '{}') from unnest(dates) d where d >= current_date - 1))
  on conflict (token) do update set endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth,
    lang = excluded.lang, due = excluded.due, updated_at = now();
end $$;
create or replace function app.push_forget(t uuid) returns void
language sql security definer set search_path = '' as $$ delete from app.push_subs where token = t $$;
revoke execute on function app.push_save(uuid, text, text, text, text, date[]), app.push_forget(uuid) from public;
grant execute on function app.push_save(uuid, text, text, text, text, date[]), app.push_forget(uuid) to anon, authenticated;

-- For the sender only: who has something due today (and was not already sent today).
create or replace function app.push_due_today() returns table (token uuid, endpoint text, p256dh text, auth text, lang text)
language sql security definer set search_path = '' as $$
  update app.push_subs s set last_sent = current_date,
    due = (select coalesce(array_agg(d order by d), '{}') from unnest(s.due) d where d > current_date)
  where current_date = any(s.due) or (cardinality(s.due) > 0 and s.due[1] < current_date and s.last_sent is distinct from current_date)
  returning s.token, s.endpoint, s.p256dh, s.auth, s.lang $$;
revoke execute on function app.push_due_today() from public, anon, authenticated;
grant execute on function app.push_due_today() to service_role;
