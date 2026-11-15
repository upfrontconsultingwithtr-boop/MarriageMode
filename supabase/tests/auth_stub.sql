-- Minimal stand-in for Supabase's auth schema and API roles, so CI can run
-- the migrations and RLS tests on plain Postgres. Not used in Supabase itself.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
