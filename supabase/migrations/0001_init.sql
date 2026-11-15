-- Marriage Mode: initial schema (Upfront Consulting with Tiff & Reco LLC)
-- Two halves:
--   app.*  customer product (personal data, owned by auth.uid())
--   ops.*  internal Command Center (multi-tenant by org_id)
-- Row-level security is enabled on every table. No passwords are stored:
-- identities live in Supabase Auth (auth.users).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

create schema if not exists app;
create schema if not exists ops;
create schema if not exists private;

-- ───────────────────────── shared helpers ─────────────────────────
create or replace function private.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ═════════════════════════ ORGANIZATIONS, TEAMS, PERMISSIONS (ops) ═════════════════════════
create table ops.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  plan        text not null default 'internal',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table ops.roles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  key         text not null,            -- founder, admin, executive, developer, marketing, support, advisor, investor
  name        text not null,
  is_system   boolean not null default false,
  unique (org_id, key)
);

create table ops.permissions (
  key         text primary key,         -- e.g. 'tasks.write', 'investor.read', 'billing.manage'
  description text not null
);

create table ops.role_permissions (
  role_id        uuid not null references ops.roles(id) on delete cascade,
  permission_key text not null references ops.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table ops.members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role_id     uuid not null references ops.roles(id),
  title       text,
  status      text not null default 'active' check (status in ('invited','active','suspended')),
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create table ops.teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table ops.team_members (
  team_id     uuid not null references ops.teams(id) on delete cascade,
  member_id   uuid not null references ops.members(id) on delete cascade,
  primary key (team_id, member_id)
);

-- Membership and permission checks. SECURITY DEFINER so RLS on members
-- does not recurse; scoped to the org being acted on (lesson from COS fix 2026-11-08).
create or replace function private.is_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from ops.members m
                 where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active');
$$;

create or replace function private.has_permission(p_org uuid, p_perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ops.members m
    join ops.role_permissions rp on rp.role_id = m.role_id
    where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active'
      and (rp.permission_key = p_perm or rp.permission_key = '*'));
$$;

-- ═════════════════════════ USERS & SETTINGS (app) ═════════════════════════
create table app.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  relationship_stage text check (relationship_stage in ('exclusive','engaged','married','rebuilding','other')),
  timezone       text default 'America/Chicago',
  onboarding_done boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table app.settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  analytics_opt_in     boolean not null default false,
  coach_can_see_audit  boolean not null default false,
  weekly_reminder      boolean not null default true,
  email_notifications  boolean not null default true,
  push_notifications   boolean not null default false,
  updated_at           timestamptz not null default now()
);

-- ═════════════════════════ CATALOG & AUDITS (app) ═════════════════════════
create table app.platforms (
  id              text primary key,               -- 'tinder'
  name            text not null,
  category        text not null check (category in ('mainstream','faith','lgbtq','niche','international','social','other')),
  domain          text,
  email_domains   text[] not null default '{}',
  delete_path     text,                            -- in-app steps
  billing         text[] not null default '{}',    -- 'apple','google','web'
  last_verified   date,
  active          boolean not null default true
);

create table app.audits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'in_progress' check (status in ('in_progress','complete','archived')),
  cleanup_progress smallint not null default 0 check (cleanup_progress between 0 and 100),
  organization_score smallint not null default 0 check (organization_score between 0 and 100),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now()
);

create table app.audit_items (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid not null references app.audits(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  platform_id   text references app.platforms(id),
  custom_platform text,
  kind          text not null check (kind in ('delete_profile','cancel_billing','delete_app','stop_emails','data_request','social','contacts','custom')),
  label         text not null,
  done          boolean not null default false,
  done_at       timestamptz,
  note          text,
  check (platform_id is not null or custom_platform is not null or kind in ('social','contacts','custom'))
);
create index on app.audit_items (audit_id);

create table app.reflections (                    -- Relationship Readiness reflection (private)
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  prompt_key  text not null,
  answer      text not null,
  created_at  timestamptz not null default now()
);

-- ═════════════════════════ COUPLE MODE (app) ═════════════════════════
create table app.couples (
  id           uuid primary key default gen_random_uuid(),
  created_by   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','active','ended')),
  created_at   timestamptz not null default now(),
  ended_at     timestamptz
);

create table app.couple_members (
  couple_id    uuid not null references app.couples(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  accepted_at  timestamptz,                         -- null until the person accepts on their own device
  primary key (couple_id, user_id)
);

create table app.couple_invites (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references app.couples(id) on delete cascade,
  token_hash   text not null unique,                -- sha256 of the invite token; raw token is never stored
  expires_at   timestamptz not null default now() + interval '7 days',
  used_at      timestamptz
);

-- Item-by-item sharing chosen by the owner. Default: nothing shared.
create table app.couple_shares (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references app.couples(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  share_kind   text not null check (share_kind in ('summary','goal','audit_item')),
  ref_id       uuid,
  summary_text text,
  created_at   timestamptz not null default now()
);

create table app.couple_goals (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references app.couples(id) on delete cascade,
  title        text not null,
  due_on       date,
  done         boolean not null default false,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now()
);

create or replace function private.is_active_couple_member(p_couple uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.couple_members cm join app.couples c on c.id = cm.couple_id
                 where cm.couple_id = p_couple and cm.user_id = auth.uid()
                   and cm.accepted_at is not null and c.status = 'active');
$$;

-- ═════════════════════════ AI CHATS (app + ops) ═════════════════════════
create table app.ai_chats (                         -- customer coach conversations
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now()
);

create table app.ai_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references app.ai_chats(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  model       text,
  tokens_in   int, tokens_out int,
  cost_usd    numeric(10,5),
  safety_flag text,
  created_at  timestamptz not null default now()
);

-- ═════════════════════════ SUBSCRIPTIONS & INTEGRATIONS (app) ═════════════════════════
create table app.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  plan               text not null check (plan in ('free','starter','premium','couple','family','enterprise_seat')),
  status             text not null check (status in ('trialing','active','past_due','canceled','incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  seats              int not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table app.integrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null,                       -- 'google'
  scopes        text[] not null,
  vault_secret_id uuid,                              -- token stored in Supabase Vault, never in this row
  status        text not null default 'active' check (status in ('active','revoked','error')),
  connected_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (user_id, provider)
);

create table app.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table app.waitlist (                          -- written only by the server (service role)
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  stage       text,
  source      text,
  created_at  timestamptz not null default now()
);

-- ═════════════════════════ OPS: PROJECTS, TASKS, MESSAGES, DOCS, KB, ANALYTICS ═════════════════════════
create table ops.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  name        text not null,
  kind        text not null default 'general' check (kind in ('general','product','marketing','sprint','release','investor')),
  status      text not null default 'active' check (status in ('planned','active','done','archived')),
  owner_id    uuid references ops.members(id),
  starts_on   date, ends_on date,
  created_at  timestamptz not null default now()
);

create table ops.tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  project_id  uuid references ops.projects(id) on delete set null,
  title       text not null,
  description text,
  type        text not null default 'task' check (type in ('task','feature','bug','chore','risk')),
  status      text not null default 'todo' check (status in ('backlog','todo','doing','review','done','archived')),
  priority    text not null default 'p2' check (priority in ('p0','p1','p2','p3')),
  assignee_id uuid references ops.members(id),
  due_on      date,
  estimate_pts smallint,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on ops.tasks (org_id, status);

create table ops.messages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  channel     text not null default 'general',
  task_id     uuid references ops.tasks(id) on delete cascade,
  author_id   uuid references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create table ops.documents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  title       text not null,
  kind        text not null check (kind in ('sop','brand','product','user_research','market_research','design','roadmap','meeting_notes','contract','technical','decision','other')),
  body_md     text,
  storage_path text,                                 -- Supabase Storage for files
  visibility  text not null default 'org' check (visibility in ('org','executive','founder')),
  version     int not null default 1,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table ops.knowledge_chunks (                  -- RAG memory
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  document_id uuid references ops.documents(id) on delete cascade,
  memory_id   uuid,
  chunk_index int not null default 0,
  content     text not null,
  embedding   extensions.vector(1024),
  created_at  timestamptz not null default now()
);
create index on ops.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

create table ops.memories (                          -- durable decisions & facts for the AI
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  kind        text not null check (kind in ('decision','fact','goal','preference','lesson')),
  statement   text not null,
  source      text,                                  -- doc link, meeting, founder message
  decided_by  uuid references auth.users(id),
  valid_from  timestamptz not null default now(),
  superseded_by uuid references ops.memories(id),
  created_at  timestamptz not null default now()
);

create table ops.ai_chats (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  agent       text not null default 'chief_of_staff',
  title       text,
  created_at  timestamptz not null default now()
);

create table ops.ai_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references ops.ai_chats(id) on delete cascade,
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system','tool')),
  content     text not null,
  model       text, tokens_in int, tokens_out int, cost_usd numeric(10,5),
  created_at  timestamptz not null default now()
);

create table ops.kpi_snapshots (                     -- analytics rollups for dashboards
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  metric      text not null,                         -- 'mrr_usd','active_users','audits_completed','waitlist'
  value       numeric not null,
  as_of       date not null,
  source      text not null,                         -- 'stripe','posthog','supabase','manual'
  unique (org_id, metric, as_of)
);

create table ops.analytics_events (                  -- server-side product events, no content
  id          bigint generated always as identity primary key,
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  event       text not null,
  anon_id     text,
  props       jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create table ops.notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null, title text not null, body text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table ops.settings (
  org_id      uuid primary key references ops.organizations(id) on delete cascade,
  ai_monthly_cap_usd numeric(10,2) not null default 0,  -- 0 = AI off until founder sets a cap
  default_model text not null default 'claude-sonnet',
  updated_at  timestamptz not null default now()
);

create table ops.integrations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references ops.organizations(id) on delete cascade,
  provider    text not null,                         -- stripe, posthog, github, hubspot, netlify
  vault_secret_id uuid,
  status      text not null default 'active',
  connected_at timestamptz not null default now(),
  unique (org_id, provider)
);

create table ops.audit_logs (                        -- append-only, both halves
  id          bigint generated always as identity primary key,
  org_id      uuid references ops.organizations(id),
  actor_id    uuid,
  action      text not null,                         -- 'insert','update','delete'
  table_name  text not null,
  row_id      text,
  diff        jsonb,
  at          timestamptz not null default now()
);

create or replace function private.write_audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_row jsonb := to_jsonb(coalesce(new, old));
begin
  insert into ops.audit_logs (org_id, actor_id, action, table_name, row_id, diff)
  values ((v_row->>'org_id')::uuid, auth.uid(), lower(tg_op), tg_table_schema || '.' || tg_table_name,
          v_row->>'id',
          case when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
               else v_row end);
  return coalesce(new, old);
end $$;

-- audit triggers on sensitive tables
do $$ declare t text; begin
  foreach t in array array['ops.members','ops.role_permissions','ops.documents','ops.memories','ops.integrations',
                           'app.couples','app.couple_members','app.couple_shares','app.integrations','app.subscriptions']
  loop
    execute format('create trigger audit_%s after insert or update or delete on %s for each row execute function private.write_audit_log()',
                   replace(t,'.','_'), t);
  end loop;
end $$;

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['ops.organizations','ops.tasks','ops.documents','app.profiles','app.audits','app.subscriptions']
  loop
    execute format('create trigger touch_%s before update on %s for each row execute function private.touch_updated_at()',
                   replace(t,'.','_'), t);
  end loop;
end $$;

-- ═════════════════════════ ROW-LEVEL SECURITY ═════════════════════════
-- app: owner-only tables
do $$ declare t text; begin
  foreach t in array array['app.profiles','app.settings','app.audits','app.audit_items','app.reflections',
                           'app.ai_chats','app.ai_messages','app.notifications']
  loop
    execute format('alter table %s enable row level security', t);
    execute format('create policy owner_all on %s for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- app: read-only for owner (written by Stripe webhook / server)
alter table app.subscriptions enable row level security;
create policy owner_read on app.subscriptions for select to authenticated using (user_id = (select auth.uid()));

alter table app.integrations enable row level security;
create policy owner_read on app.integrations for select to authenticated using (user_id = (select auth.uid()));
create policy owner_revoke on app.integrations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and status = 'revoked');

alter table app.platforms enable row level security;
create policy anyone_read on app.platforms for select to anon, authenticated using (active);

alter table app.waitlist enable row level security;           -- no policies: service role only

-- couple mode
alter table app.couples enable row level security;
create policy members_read on app.couples for select to authenticated
  using (created_by = (select auth.uid()) or private.is_active_couple_member(id));
create policy creator_insert on app.couples for insert to authenticated with check (created_by = (select auth.uid()));
create policy member_end on app.couples for update to authenticated       -- any member may end; nobody may re-activate from client
  using (private.is_active_couple_member(id) or created_by = (select auth.uid()))
  with check (status = 'ended');

alter table app.couple_members enable row level security;
create policy self_read on app.couple_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_active_couple_member(couple_id));
-- inserts/acceptance happen only through the accept_invite() server function

alter table app.couple_invites enable row level security;     -- service role only

alter table app.couple_shares enable row level security;
create policy owner_manage on app.couple_shares for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and private.is_active_couple_member(couple_id));
create policy partner_read on app.couple_shares for select to authenticated
  using (private.is_active_couple_member(couple_id));

alter table app.couple_goals enable row level security;
create policy members_all on app.couple_goals for all to authenticated
  using (private.is_active_couple_member(couple_id)) with check (private.is_active_couple_member(couple_id));

-- ops: org-scoped tables, read by members, write gated by permission
do $$ declare r record; begin
  for r in select * from (values
      ('ops.teams','team.manage'), ('ops.projects','projects.write'), ('ops.tasks','tasks.write'),
      ('ops.messages','messages.write'), ('ops.documents','docs.write'), ('ops.knowledge_chunks','docs.write'),
      ('ops.memories','memory.write'), ('ops.kpi_snapshots','kpi.write'), ('ops.analytics_events','kpi.write'),
      ('ops.ai_chats','ai.use'), ('ops.ai_messages','ai.use')) as v(tbl, perm)
  loop
    execute format('alter table %s enable row level security', r.tbl);
    execute format('create policy member_read on %s for select to authenticated using (private.is_member(org_id))', r.tbl);
    execute format('create policy perm_write on %s for all to authenticated using (private.has_permission(org_id, %L)) with check (private.has_permission(org_id, %L))', r.tbl, r.perm, r.perm);
  end loop;
end $$;

-- documents: tighter read for executive / founder visibility
drop policy member_read on ops.documents;
create policy visibility_read on ops.documents for select to authenticated using (
  private.is_member(org_id) and (visibility = 'org'
    or (visibility = 'executive' and private.has_permission(org_id, 'docs.executive'))
    or (visibility = 'founder'   and private.has_permission(org_id, '*'))));

-- investor role sees KPIs only through kpi.read
drop policy member_read on ops.kpi_snapshots;
create policy kpi_read on ops.kpi_snapshots for select to authenticated using (private.has_permission(org_id, 'kpi.read'));

alter table ops.organizations enable row level security;
create policy member_read on ops.organizations for select to authenticated using (private.is_member(id));

alter table ops.roles enable row level security;
create policy member_read on ops.roles for select to authenticated using (private.is_member(org_id));
create policy admin_write on ops.roles for all to authenticated using (private.has_permission(org_id, 'roles.manage')) with check (private.has_permission(org_id, 'roles.manage'));

alter table ops.permissions enable row level security;
create policy anyone_read on ops.permissions for select to authenticated using (true);

alter table ops.role_permissions enable row level security;
create policy member_read on ops.role_permissions for select to authenticated
  using (exists (select 1 from ops.roles r where r.id = role_id and private.is_member(r.org_id)));
create policy admin_write on ops.role_permissions for all to authenticated
  using (exists (select 1 from ops.roles r where r.id = role_id and private.has_permission(r.org_id, 'roles.manage')))
  with check (exists (select 1 from ops.roles r where r.id = role_id and private.has_permission(r.org_id, 'roles.manage')));

alter table ops.members enable row level security;
create policy member_read on ops.members for select to authenticated using (private.is_member(org_id));
create policy admin_write on ops.members for all to authenticated using (private.has_permission(org_id, 'members.manage')) with check (private.has_permission(org_id, 'members.manage'));

alter table ops.team_members enable row level security;
create policy member_read on ops.team_members for select to authenticated
  using (exists (select 1 from ops.teams t where t.id = team_id and private.is_member(t.org_id)));
create policy admin_write on ops.team_members for all to authenticated
  using (exists (select 1 from ops.teams t where t.id = team_id and private.has_permission(t.org_id, 'team.manage')))
  with check (exists (select 1 from ops.teams t where t.id = team_id and private.has_permission(t.org_id, 'team.manage')));

alter table ops.notifications enable row level security;
create policy owner_all on ops.notifications for all to authenticated
  using (user_id = (select auth.uid()) and private.is_member(org_id))
  with check (user_id = (select auth.uid()) and private.is_member(org_id));

alter table ops.settings enable row level security;
create policy member_read on ops.settings for select to authenticated using (private.is_member(org_id));
create policy founder_write on ops.settings for update to authenticated using (private.has_permission(org_id, '*')) with check (private.has_permission(org_id, '*'));

alter table ops.integrations enable row level security;
create policy admin_read on ops.integrations for select to authenticated using (private.has_permission(org_id, 'integrations.manage'));

alter table ops.audit_logs enable row level security;   -- append-only: read for admins, no update/delete policies
create policy admin_read on ops.audit_logs for select to authenticated using (org_id is not null and private.has_permission(org_id, 'audit.read'));

-- ═════════════════════════ SEED: permissions catalogue ═════════════════════════
insert into ops.permissions (key, description) values
  ('*','Everything (founder)'),
  ('members.manage','Invite, suspend and change roles'), ('roles.manage','Edit roles and permissions'),
  ('team.manage','Create teams'), ('projects.write','Create and edit projects'), ('tasks.write','Create and edit tasks'),
  ('messages.write','Post messages'), ('docs.write','Create and edit documents'), ('docs.executive','Read executive documents'),
  ('memory.write','Record AI memory and decisions'), ('kpi.read','Read KPIs and investor metrics'), ('kpi.write','Write KPIs'),
  ('ai.use','Use the AI Chief of Staff'), ('integrations.manage','Connect integrations'), ('audit.read','Read audit logs'),
  ('billing.manage','Manage billing')
on conflict do nothing;

-- ═════════════════════════ COUPLE INVITES (server functions) ═════════════════════════
-- create_couple_invite: returns a raw token once; only its hash is stored.
create or replace function app.create_couple_invite() returns text
language plpgsql security definer set search_path = '' as $$
declare v_couple uuid; v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  insert into app.couples (created_by) values (auth.uid()) returning id into v_couple;
  insert into app.couple_members (couple_id, user_id, accepted_at) values (v_couple, auth.uid(), now());
  insert into app.couple_invites (couple_id, token_hash) values (v_couple, encode(extensions.digest(v_token, 'sha256'), 'hex'));
  return v_token;
end $$;

-- accept_couple_invite: must be called by the invitee, signed in on their own device.
create or replace function app.accept_couple_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_inv app.couple_invites;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  select * into v_inv from app.couple_invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and used_at is null and expires_at > now()
   for update;
  if not found then raise exception 'invite invalid or expired'; end if;
  if exists (select 1 from app.couple_members where couple_id = v_inv.couple_id and user_id = auth.uid()) then
    raise exception 'cannot accept your own invite';
  end if;
  insert into app.couple_members (couple_id, user_id, accepted_at) values (v_inv.couple_id, auth.uid(), now());
  update app.couple_invites set used_at = now() where id = v_inv.id;
  update app.couples set status = 'active' where id = v_inv.couple_id;
  return v_inv.couple_id;
end $$;

-- ═════════════════════════ GRANTS (Supabase API roles) ═════════════════════════
grant usage on schema app, ops to authenticated;
grant usage on schema app to anon;
grant usage on schema private to authenticated, anon;
grant execute on all functions in schema private to authenticated, anon;
grant select, insert, update, delete on all tables in schema app, ops to authenticated;
grant select on app.platforms to anon;
grant usage on all sequences in schema ops to authenticated;
revoke all on function app.create_couple_invite() from public;
revoke all on function app.accept_couple_invite(text) from public;
grant execute on function app.create_couple_invite() to authenticated;
grant execute on function app.accept_couple_invite(text) to authenticated;
