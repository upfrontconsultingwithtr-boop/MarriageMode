-- Reminders now run every hour so each phone gets its note at 9am local time.
select cron.alter_job((select jobid from cron.job where jobname = 'push-reminders'), schedule := '0 * * * *');
