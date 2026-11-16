// Marriage Mode by Upfront Consulting with Tiff & Reco LLC: daily home-screen reminders.
// Called once a day by pg_cron (migration 0010b). Sends a short, private notification to
// every phone with something due today. The text never names an app or any personal detail.
// Secrets (set on the project, never in code): VAPID_PRIVATE_KEY, CRON_SECRET.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const VAPID_PUBLIC = 'BIru7y6HLDVh8NFj8ibWSqdnvosHwXPh6ffzUF1tVnXQbdi_72qId0rdjOAxGbcM0qIUL2l8f_6xt4ctOJkyXK8';
const TEXT = {
  en: { title: 'Marriage Mode', body: 'Something you planned is due today. Open Marriage Mode to see it.' },
  es: { title: 'Marriage Mode', body: 'Hoy toca algo que planeaste. Abre Marriage Mode para verlo.' },
};

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('no', { status: 401 });
  webpush.setVapidDetails('https://upfrontconsultingwithtr-boop.github.io/MarriageMode/', VAPID_PUBLIC, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'app' } });
  const { data, error } = await db.rpc('push_due_today');
  if (error) return new Response(error.message, { status: 500 });
  let sent = 0, gone = 0, failed = 0;
  for (const s of data ?? []) {
    const t = TEXT[s.lang as 'en' | 'es'] ?? TEXT.en;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ ...t, url: 'audit/' }), { TTL: 86400 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await db.from('push_subs').delete().eq('token', s.token); gone++; } else failed++;
    }
  }
  return Response.json({ sent, gone, failed });
});
