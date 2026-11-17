-- Rate limit: at most 10 partner invites per person per 24 hours (stops spam; real couples need 1-2).
create or replace function app.create_couple_invite() returns text
language plpgsql security definer set search_path = '' as $$
declare v_couple uuid; v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  if (select count(*) from app.couples where created_by = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many invites today, try again tomorrow';
  end if;
  insert into app.couples (created_by) values (auth.uid()) returning id into v_couple;
  insert into app.couple_members (couple_id, user_id, accepted_at) values (v_couple, auth.uid(), now());
  insert into app.couple_invites (couple_id, token_hash) values (v_couple, encode(extensions.digest(v_token, 'sha256'), 'hex'));
  return v_token;
end $$;
revoke all on function app.create_couple_invite() from public;
grant execute on function app.create_couple_invite() to authenticated;
