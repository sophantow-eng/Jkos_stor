// Supabase Edge Function: sos-push
// ส่ง Web Push ไปยังเครื่องของผู้ที่ได้รับสิทธิ์รับแจ้งเตือน SOS (+แอดมิน)
// Deploy แบบปิด "Verify JWT"  (supabase functions deploy sos-push --no-verify-jwt)
// Secrets ที่ต้องตั้ง: SOS_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const ADMIN = 'sophantow@gmail.com';
const KIND: Record<string, { icon: string; name: string }> = {
  fire: { icon: '🔥', name: 'ไฟไหม้' },
  earthquake: { icon: '🏚️', name: 'แผ่นดินไหว' },
};

Deno.serve(async (req) => {
  if (req.headers.get('x-sos-secret') !== Deno.env.get('SOS_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  let a: any;
  try { a = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  if (!a || a.status !== 'active') return new Response('skip');

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:' + ADMIN,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const perms = await sb.from('sos_perms').select('email').eq('can_receive', true);
  const emails = new Set<string>((perms.data || []).map((x: any) => String(x.email).toLowerCase()));
  emails.add(ADMIN);
  emails.delete(String(a.sender_email || '').toLowerCase());
  if (!emails.size) return new Response('no recipients');

  const subs = await sb.from('push_subs').select('endpoint,email,p256dh,auth');
  const targets = (subs.data || []).filter((s: any) => emails.has(String(s.email).toLowerCase()));

  const k = KIND[a.kind] || KIND.fire;
  const who = a.sender_name || String(a.sender_email || '').split('@')[0];
  const payload = JSON.stringify({
    title: `🚨 SOS ${k.icon} ${k.name}!`,
    body: `แจ้งโดย ${who}${a.note ? ' · ' + a.note : ''} — แตะเพื่อรับทราบ`,
    tag: String(a.id),
  });

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(targets.map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 3600, urgency: 'high' },
      );
      sent++;
    } catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.endpoint);
    }
  }));
  if (dead.length) await sb.from('push_subs').delete().in('endpoint', dead);
  return new Response(JSON.stringify({ sent, removed: dead.length }), { headers: { 'Content-Type': 'application/json' } });
});
