-- Live updates for the founder hub.
alter publication supabase_realtime add table app.hub_tasks;
alter publication supabase_realtime add table app.hub_messages;
