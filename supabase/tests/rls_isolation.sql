-- Row-level security isolation test. Run after migrations:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
-- Any failed check raises an exception and fails the run (CI gate).
begin;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a','a@test'), ('00000000-0000-0000-0000-00000000000b','b@test'),
  ('00000000-0000-0000-0000-00000000000c','c@test');

-- two ops tenants
insert into ops.organizations (id,name,slug) values
  ('10000000-0000-0000-0000-000000000001','Org One','one'), ('10000000-0000-0000-0000-000000000002','Org Two','two');
insert into ops.roles (id,org_id,key,name) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','founder','Founder'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','founder','Founder'),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','investor','Investor');
insert into ops.role_permissions values ('20000000-0000-0000-0000-000000000001','*'),
  ('20000000-0000-0000-0000-000000000002','*'), ('20000000-0000-0000-0000-000000000003','kpi.read');
insert into ops.members (org_id,user_id,role_id) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000b','20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','20000000-0000-0000-0000-000000000003');
insert into ops.tasks (org_id,title) values ('10000000-0000-0000-0000-000000000002','Org Two secret task');
insert into ops.documents (org_id,title,kind,visibility) values ('10000000-0000-0000-0000-000000000001','Cap table','contract','founder');
insert into app.audits (user_id) values ('00000000-0000-0000-0000-00000000000b');

create function pg_temp.as_user(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u, true); execute 'set local role authenticated'; end $$;
create function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception 'RLS FAIL: %', msg; end if; raise notice 'pass: %', msg; end $$;

-- user A (Org One founder)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from ops.tasks) = 0, 'A cannot read Org Two tasks');
select pg_temp.check((select count(*) from app.audits) = 0, 'A cannot read B''s audit');
select pg_temp.check((select count(*) from ops.organizations) = 1, 'A sees only own org');
select pg_temp.check((select count(*) from ops.documents) = 1, 'founder reads founder-only doc');
do $$ begin
  insert into ops.tasks (org_id,title) values ('10000000-0000-0000-0000-000000000002','injected');
  raise exception 'RLS FAIL: A wrote into Org Two';
exception when insufficient_privilege then raise notice 'pass: A cannot write into Org Two'; end $$;
do $$ declare n int; begin update ops.tasks set title='x'; get diagnostics n = row_count;
  perform pg_temp.check(n = 0, 'A cannot update Org Two tasks'); end $$;
reset role;

-- user C (Org One investor)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from ops.documents) = 0, 'investor cannot read founder-only doc');
do $$ begin
  insert into ops.tasks (org_id,title) values ('10000000-0000-0000-0000-000000000001','investor task');
  raise exception 'RLS FAIL: investor wrote a task';
exception when insufficient_privilege then raise notice 'pass: investor cannot write tasks'; end $$;
reset role;

-- couple mode: A invites B; sharing is opt-in; ending stops access
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
create temp table tok as select app.create_couple_invite() as t;
grant select on tok to authenticated;
do $$ begin perform app.accept_couple_invite((select t from tok));
  raise exception 'RLS FAIL: inviter accepted own invite';
exception when raise_exception then
  if sqlerrm like 'RLS FAIL%' then raise; end if; raise notice 'pass: cannot accept own invite'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check(app.accept_couple_invite((select t from tok)) is not null, 'B accepts invite on own session');
select pg_temp.check((select count(*) from app.couple_shares) = 0, 'nothing shared by default');
select pg_temp.check((select count(*) from app.audits) = 1, 'B still sees only own audit');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into app.couple_shares (couple_id, owner_id, share_kind, summary_text)
  select couple_id, '00000000-0000-0000-0000-00000000000a', 'summary', 'Closed 5 of 5 dating accounts' from app.couple_members limit 1;
select pg_temp.check((select count(*) from app.audits) = 0, 'A cannot read partner B''s audit even when linked');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from app.couple_shares) = 1, 'B reads the summary A chose to share');
update app.couples set status = 'ended', ended_at = now();  -- B unlinks
select pg_temp.check((select count(*) from app.couple_shares) = 0, 'after unlink, B loses access instantly');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from app.couple_shares) = 0, 'outsider sees no couple data');
reset role;
-- synced audits: owner-only
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into app.audit_snapshots (user_id, state) values ('00000000-0000-0000-0000-00000000000b', '{"platformIds":["tinder"]}');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.audit_snapshots) = 0, 'A cannot read B''s synced audit');
do $$ begin
  insert into app.audit_snapshots (user_id, state) values ('00000000-0000-0000-0000-00000000000b', '{}');
  raise exception 'RLS FAIL: A wrote B''s synced audit';
exception when insufficient_privilege then raise notice 'pass: A cannot write B''s synced audit'; end $$;
reset role;
-- partner space messages (relink A and B, C is an outsider)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
create temp table tok2 as select app.create_couple_invite() as t;
grant select on tok2 to authenticated;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
create temp table cid as select app.accept_couple_invite((select t from tok2)) as id;
grant select on cid to authenticated;
insert into app.couple_messages (couple_id, body) select id, 'Hi from B' from cid;
insert into app.couple_answers (couple_id, question, answer) select id, 1, 'B daily answer' from cid;
insert into app.couple_survey (couple_id, answers) select id, '{"q1":4}'::jsonb from cid;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.couple_answers) = 1, 'A reads partner B''s daily answer');
select pg_temp.check((select count(*) from app.couple_survey) = 1, 'A reads partner B''s survey');
update app.couple_survey set answers = '{"q1":1}'::jsonb;
reset role;
select pg_temp.check((select answers->>'q1' from app.couple_survey) = '4', 'A cannot change B''s survey');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from app.couple_answers) = 0, 'outsider reads no daily answers');
select pg_temp.check((select count(*) from app.couple_survey) = 0, 'outsider reads no surveys');
do $$ begin
  insert into app.couple_answers (couple_id, question, answer) select id, 1, 'intrude' from cid;
  raise exception 'RLS FAIL: outsider answered for a couple';
exception when insufficient_privilege then raise notice 'pass: outsider cannot answer for a couple'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.couple_messages) = 1, 'A reads partner B''s message');
select pg_temp.check(private.is_partner('00000000-0000-0000-0000-00000000000b'), 'A and B are partners');
insert into app.profiles (user_id, display_name) values ('00000000-0000-0000-0000-00000000000a', 'Tester A') on conflict (user_id) do update set display_name = 'Tester A';
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select display_name from app.profiles where user_id = '00000000-0000-0000-0000-00000000000a') = 'Tester A', 'B sees partner A''s name');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from app.profiles where user_id = '00000000-0000-0000-0000-00000000000a') = 0, 'outsider cannot see A''s profile');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from app.couple_messages) = 0, 'outsider reads no partner messages');
do $$ begin
  insert into app.couple_messages (couple_id, body) select id, 'intrude' from cid;
  raise exception 'RLS FAIL: outsider posted into a couple';
exception when insufficient_privilege then raise notice 'pass: outsider cannot post into a couple'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select app.leave_couple();
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.couple_messages) = 0, 'after leaving, messages are no longer visible');
-- leads: anyone can add one, nobody can read them back
set local role anon;
insert into app.leads (kind, email, name, org) values ('partner', 'pastor@example.org', 'Test', 'Test Church');
do $$ begin
  perform count(*) from app.leads;
  raise exception 'RLS FAIL: anon read leads';
exception when insufficient_privilege then raise notice 'pass: anon cannot read leads'; end $$;
do $$ begin
  update app.leads set email = 'x@x.co';
  raise exception 'RLS FAIL: anon updated leads';
exception when insufficient_privilege then raise notice 'pass: anon cannot change leads'; end $$;
do $$ begin
  insert into app.leads (kind, email) values ('partner', 'not-an-email');
  raise exception 'RLS FAIL: bad email accepted';
exception when check_violation then raise notice 'pass: bad email rejected'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  perform count(*) from app.leads;
  raise exception 'RLS FAIL: signed-in user read leads';
exception when insufficient_privilege then raise notice 'pass: signed-in user cannot read leads'; end $$;
reset role;
-- founders' access: list is unreadable; only the listed user is comped
insert into app.comp_accounts (email) values ('a@test');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(app.am_i_comped(), 'listed founder is comped');
do $$ begin
  perform count(*) from app.comp_accounts;
  raise exception 'RLS FAIL: user read the comp list';
exception when insufficient_privilege then raise notice 'pass: comp list is private'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check(not app.am_i_comped(), 'other user is not comped');
reset role;
-- founder hub: founders only
insert into app.hub_tasks (id, data) values ('t1', '{"title":"x"}');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.hub_tasks) = 1, 'founder reads hub tasks');
insert into app.hub_messages (data) values ('{"from":"you","text":"hi"}');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from app.hub_tasks) = 0, 'non-founder cannot read hub tasks');
select pg_temp.check((select count(*) from app.hub_messages) = 0, 'non-founder cannot read hub messages');
do $$ begin
  insert into app.hub_messages (data) values ('{"from":"you","text":"intrude"}');
  raise exception 'RLS FAIL: non-founder wrote hub message';
exception when insufficient_privilege then raise notice 'pass: non-founder cannot write hub'; end $$;
reset role;
-- counselors: apply = pending only; public sees approved only and never emails; founders approve
insert into app.counselors (id, status, name, credential, license_state, license_number, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'approved', 'Dr A', 'LMFT', 'MO', '123', 'a@ex.com'),
  ('00000000-0000-0000-0000-0000000000c2', 'pending',  'Bee',  'LPC',  'MO', '456', 'b@ex.com');
set local role anon;
select pg_temp.check((select count(*) from app.counselors) = 1, 'public sees approved counselors only');
do $$ begin
  perform email from app.counselors;
  raise exception 'RLS FAIL: public read counselor email';
exception when insufficient_privilege then raise notice 'pass: counselor emails private'; end $$;
insert into app.counselors (name, credential, license_state, license_number, email) values ('Cee', 'LCSW', 'IL', '789', 'c@ex.com');
do $$ begin
  insert into app.counselors (status, name, credential, license_state, license_number, email) values ('approved', 'Dee', 'XX', 'IL', '1', 'd@ex.com');
  raise exception 'RLS FAIL: applicant self-approved';
exception when insufficient_privilege then raise notice 'pass: cannot self-approve'; end $$;
insert into app.counselor_requests (counselor_id, name, email) values ('00000000-0000-0000-0000-0000000000c1', 'Pat', 'p@ex.com');
do $$ begin
  insert into app.counselor_requests (counselor_id, name, email) values ('00000000-0000-0000-0000-0000000000c2', 'Pat', 'p@ex.com');
  raise exception 'RLS FAIL: request to unapproved counselor';
exception when insufficient_privilege then raise notice 'pass: requests only to approved'; end $$;
do $$ begin
  perform count(*) from app.counselor_requests;
  raise exception 'RLS FAIL: public read requests';
exception when insufficient_privilege then raise notice 'pass: requests private'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
do $$ begin
  perform email from app.counselors;
  raise exception 'RLS FAIL: signed-in user read counselor email';
exception when insufficient_privilege then raise notice 'pass: emails private to users'; end $$;
select pg_temp.check((select count(*) from app.founder_counselors()) = 0, 'non-founder gets no applications');
do $$ begin
  perform app.founder_set_counselor('00000000-0000-0000-0000-0000000000c2', 'approved');
  raise exception 'RLS FAIL: non-founder approved counselor';
exception when insufficient_privilege then raise notice 'pass: only founders approve'; end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from app.founder_counselors()) = 3, 'founder sees all applications');
select pg_temp.check((select count(*) from app.founder_counselor_requests()) = 1, 'founder sees requests');
select app.founder_set_counselor('00000000-0000-0000-0000-0000000000c2', 'approved');
reset role;
select pg_temp.check((select status from app.counselors where id = '00000000-0000-0000-0000-0000000000c2') = 'approved', 'founder approval saved');
-- 0010 push reminders: anonymous save/forget only through the token; nobody but the sender reads rows
set local role anon;
select app.push_save('00000000-0000-0000-0000-0000000000f1', 'https://fcm.googleapis.com/fcm/send/abc', repeat('k', 40), repeat('a', 16), 'en', array[current_date, current_date + 30, current_date - 9], 0::smallint);
do $$ begin
  perform count(*) from app.push_subs;
  raise exception 'RLS FAIL: public read push subscriptions';
exception when insufficient_privilege then raise notice 'pass: push subscriptions private'; end $$;
do $$ begin
  perform * from app.push_due_today(0);
  raise exception 'RLS FAIL: public ran the push sender';
exception when insufficient_privilege then raise notice 'pass: only the sender lists due reminders'; end $$;
do $$ begin
  perform app.push_save('00000000-0000-0000-0000-0000000000f2', 'https://evil.example.com/x', repeat('k', 40), repeat('a', 16), 'en', '{}', 0::smallint);
  raise exception 'RLS FAIL: push to a non-push host accepted';
exception when check_violation then raise notice 'pass: only real push services'; end $$;
reset role;
select pg_temp.check((select due from app.push_subs where token = '00000000-0000-0000-0000-0000000000f1') = array[current_date, current_date + 30], 'old dates dropped on save');
select pg_temp.check((select count(*) from app.push_due_today(((extract(hour from now())::int) + 1) % 24)) = 0, 'not sent outside their 9am hour');
select pg_temp.check((select count(*) from app.push_due_today((extract(hour from now())::int))) = 1, 'due today is sent in their local hour');
select pg_temp.check((select count(*) from app.push_due_today((extract(hour from now())::int))) = 0, 'sent once a day only');
set local role anon;
select app.push_forget('00000000-0000-0000-0000-0000000000f9');
reset role;
select pg_temp.check((select count(*) from app.push_subs) = 1, 'wrong token deletes nothing');
set local role anon;
select app.push_forget('00000000-0000-0000-0000-0000000000f1');
reset role;
select pg_temp.check((select count(*) from app.push_subs) = 0, 'right token deletes instantly');
rollback;
\echo RLS_ISOLATION_ALL_PASSED
