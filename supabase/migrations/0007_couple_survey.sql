-- 0007: relationship survey. Each partner saves their own answers; only the two
-- active members of the couple can read them. Each person can only change their own.
create table if not exists app.couple_survey (
  couple_id  uuid not null references app.couples(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade default auth.uid(),
  answers    jsonb not null check (pg_column_size(answers) < 20000),
  updated_at timestamptz not null default now(),
  primary key (couple_id, author_id)
);
alter table app.couple_survey enable row level security;
drop policy if exists members_read on app.couple_survey;
drop policy if exists author_insert on app.couple_survey;
drop policy if exists author_update on app.couple_survey;
drop policy if exists author_delete on app.couple_survey;
create policy members_read on app.couple_survey for select to authenticated using (private.is_active_couple_member(couple_id));
create policy author_insert on app.couple_survey for insert to authenticated with check (author_id = (select auth.uid()) and private.is_active_couple_member(couple_id));
create policy author_update on app.couple_survey for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()) and private.is_active_couple_member(couple_id));
create policy author_delete on app.couple_survey for delete to authenticated using (author_id = (select auth.uid()));
grant select, insert, update, delete on app.couple_survey to authenticated;
