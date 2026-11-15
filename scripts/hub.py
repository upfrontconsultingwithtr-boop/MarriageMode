#!/usr/bin/env python3
"""Founder hub helper for Claude sessions (live hub: /founders/, data in Supabase app.hub_*).
Uses the Supabase Management API (the session's saved credential for api.supabase.com).
  python3 scripts/hub.py inbox                 # unhandled messages from Tiffany
  python3 scripts/hub.py tasks                 # open tasks
  python3 scripts/hub.py reply "text" [taskId] # add a message from Claude
  python3 scripts/hub.py handled <id>          # mark Tiffany's message handled
  python3 scripts/hub.py task <id> '<json>'    # merge fields into a task (creates it if new)
"""
import json, sys, urllib.request, datetime as dt
REF = 'wdokqitjoeellkwbtdso'
def q(sql):
    r = urllib.request.Request(f'https://api.supabase.com/v1/projects/{REF}/database/query', data=json.dumps({'query': sql}).encode(), method='POST', headers={'Authorization': 'Bearer x', 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(r).read() or b'[]')
L = lambda s: "'" + str(s).replace("'", "''") + "'"
now = dt.datetime.now(dt.timezone.utc).isoformat()
cmd, *a = sys.argv[1:] or ['inbox']
if cmd == 'inbox': print(json.dumps(q("select id, data from app.hub_messages where data->>'from'='you' and coalesce((data->>'handled')::boolean,false)=false order by created_at"), indent=1, ensure_ascii=False))
elif cmd == 'tasks': print(json.dumps(q("select id, data->>'title' title, data->>'owner' owner, data->>'status' status, data->>'priority' p from app.hub_tasks where data->>'status' <> 'done' order by (data->>'priority')::int"), indent=1, ensure_ascii=False))
elif cmd == 'reply': d = {'from': 'builder', 'text': a[0], 'at': now, **({'taskId': a[1]} if len(a) > 1 else {})}; q(f"insert into app.hub_messages (data) values ({L(json.dumps(d))}::jsonb)"); print('ok')
elif cmd == 'handled': q(f"update app.hub_messages set data = data || '{{\"handled\":true}}'::jsonb where id = {L(a[0])}"); print('ok')
elif cmd == 'task': q(f"insert into app.hub_tasks (id, data) values ({L(a[0])}, {L(a[1])}::jsonb) on conflict (id) do update set data = app.hub_tasks.data || excluded.data, updated_at = now()"); print('ok')
