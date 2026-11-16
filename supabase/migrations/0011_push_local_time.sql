-- 0011: reminders arrive at 9am in each person's own time zone (Gemini second opinion).
-- We keep only the UTC offset in minutes, not a location. Idle phones are dropped after 180 days.
alter table app.push_subs add column if not exists tz_min smallint not null default -360 check (tz_min between -840 and 840);

drop function if exists app.push_save(uuid, text, text, text, text, date[]);
create or replace function app.push_save(t uuid, ep text, key text, au text, lg text, dates date[], tz smallint default -360) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from app.push_subs where endpoint = ep and token <> t;
  insert into app.push_subs (token, endpoint, p256dh, auth, lang, due, tz_min)
  values (t, ep, key, au, lg, (select coalesce(array_agg(distinct d order by d), '{}') from unnest(dates) d where d >= current_date - 1), tz)
  on conflict (token) do update set endpoint = excluded.endpoint, p256dh = excluded.p256dh, auth = excluded.auth,
    lang = excluded.lang, due = excluded.due, tz_min = excluded.tz_min, updated_at = now();
end $$;
revoke execute on function app.push_save(uuid, text, text, text, text, date[], smallint) from public;
grant execute on function app.push_save(uuid, text, text, text, text, date[], smallint) to anon, authenticated;

-- Runs hourly: picks phones where it is now the 9 o'clock hour locally and something is due by their local today.
-- at_hour is a parameter only so tests can run it at any time of day.
drop function if exists app.push_due_today();
create or replace function app.push_due_today(at_hour int default 9) returns table (token uuid, endpoint text, p256dh text, auth text, lang text)
language plpgsql security definer set search_path = '' as $$
begin
  delete from app.push_subs s where s.updated_at < now() - interval '180 days';
  return query
  update app.push_subs s set last_sent = (now() + s.tz_min * interval '1 minute')::date,
    due = (select coalesce(array_agg(d order by d), '{}') from unnest(s.due) d where d > (now() + s.tz_min * interval '1 minute')::date)
  where extract(hour from now() + s.tz_min * interval '1 minute') = at_hour
    and cardinality(s.due) > 0 and s.due[1] <= (now() + s.tz_min * interval '1 minute')::date
    and s.last_sent is distinct from (now() + s.tz_min * interval '1 minute')::date
  returning s.token, s.endpoint, s.p256dh, s.auth, s.lang;
end $$;
revoke execute on function app.push_due_today(int) from public, anon, authenticated;
grant execute on function app.push_due_today(int) to service_role;
