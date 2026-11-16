-- Daily reminder run (16:00 UTC = 10am Central). pg_cron calls the push-reminders
-- Edge Function; the shared secret lives in Vault, never in this file.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('push-reminders') where exists (select 1 from cron.job where jobname = 'push-reminders');
select cron.schedule('push-reminders', '0 16 * * *', $$
  select net.http_post(
    url := 'https://wdokqitjoeellkwbtdso.supabase.co/functions/v1/push-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 30000) $$);
