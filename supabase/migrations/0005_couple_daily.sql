-- 0005: daily couple question. Each partner answers once a day; only the two
-- active members of the couple can read the answers. Either can delete their own.
create table if not exists app.couple_answers (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references app.couples(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade default auth.uid(),
  day        date not null default current_date,
  question   int  not null check (question between 0 and 999),
  answer     text not null check (char_length(answer) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (couple_id, author_id, day)
);
create index if not exists couple_answers_couple_day on app.couple_answers (couple_id, day);
alter table app.couple_answers enable row level security;
drop policy if exists members_read on app.couple_answers;
drop policy if exists members_write on app.couple_answers;
drop policy if exists author_delete on app.couple_answers;
create policy members_read on app.couple_answers for select to authenticated using (private.is_active_couple_member(couple_id));
create policy members_write on app.couple_answers for insert to authenticated
  with check (author_id = (select auth.uid()) and private.is_active_couple_member(couple_id));
create policy author_delete on app.couple_answers for delete to authenticated using (author_id = (select auth.uid()));
grant select, insert, delete on app.couple_answers to authenticated;
