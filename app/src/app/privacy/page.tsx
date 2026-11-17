import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy · Marriage Mode' };

// Plain-language privacy policy. Every line describes how the code actually works (checked 2026-11-17).
const S: [string, string[]][] = [
  ['The short version', [
    'Marriage Mode is built so we see as little as possible. The free audit, the AI coach and the file scanners run on your own device. We never sell or share your data, run ad trackers, or read your email, messages, contacts, location or browsing history.',
  ]],
  ['What stays on your device (we never receive it)', [
    'Your audit: the apps you pick, the steps you tick, your notes and proof screenshots are kept in your own browser. "Clear my audit" or clearing your browser data deletes them.',
    'Mia, the AI coach: the AI runs inside your browser. Your conversations, transcripts and any voice or video recordings are saved only in this browser and are never uploaded to us. The first time, your browser downloads the free AI model and voice from public servers (such as cdn.jsdelivr.net and Hugging Face); those servers see a normal download request, not your conversations.',
    'Data-download and social follow scanners: the file you choose is read on your device. It is never uploaded.',
    'Deletion-request letters: your name, email and username fill the letters on your device only.',
  ]],
  ['What we store if you create an account or use Couple Mode', [
    'Account: your email address, so you can sign in with an emailed link.',
    'Couple Mode (only if you invite or accept a partner): the daily answers, messages, goals, survey answers and progress items you choose to share, and an optional profile photo. Your partner can see what you share; a profile photo is stored at a link that anyone holding the link could open. Either of you can leave at any time, which ends sharing at once.',
    'Saved progress snapshots, if you choose to save your audit score to your account.',
    'Phone reminders, if you turn them on: a device token and the reminder dates and hour, so we can send the reminder. Turning them off deletes them.',
    'This data is kept in our database (Supabase, hosted in the United States). Row-level security means each person can only read their own rows, or what a partner chose to share with them.',
  ]],
  ['Google features (Gmail and YouTube)', [
    '"Send with my Gmail" asks Google for send-only permission. Your browser sends each deletion letter you approved from your own Gmail. We cannot read your inbox, we keep nothing, and the access is revoked right after sending.',
    '"Connect YouTube" asks for read-only YouTube permission so your browser can list the channels you subscribe to. The list stays on your device and is not stored by us.',
    'Marriage Mode’s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We never use Google data for advertising, never sell it, and never let people read it.',
  ]],
  ['Forms you send us', [
    'If you join a waitlist, request a counselor match, or apply as a counselor or partner, we keep what you type in that form only to answer you and run that service.',
  ]],
  ['Visit counts', [
    'We count page visits and a few anonymous actions (like "an audit was started") with GoatCounter, which uses no cookies and collects no personal data. We never count which apps you pick or anything you type.',
  ]],
  ['How long we keep data', [
    'Account and Couple Mode data stay until you delete them or your account. Form messages are kept until the request is finished, then archived. Encrypted database backups are kept for up to 30 days.',
  ]],
  ['Your choices and rights', [
    'Delete your account any time from Settings: it removes your account and the data tied to it. You can also ask us for a copy of your data, to correct it, or to delete it, by emailing upfrontconsultingwithtr@gmail.com. We answer within 30 days. We do not sell or share personal information, so there is nothing to opt out of.',
  ]],
  ['Safety and age', [
    'Marriage Mode is for adults 18 and over. It is a self-help tool, not a monitoring tool: it never checks on another person, and nothing is shared with a partner unless you choose it.',
  ]],
  ['Changes and contact', [
    'If this policy changes, we update the date above and, for big changes, tell signed-in users. Questions: upfrontconsultingwithtr@gmail.com.',
  ]],
];

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed text-ink/80">
      <h1 className="text-4xl font-bold text-glow">Privacy</h1>
      <p className="text-sm text-ink/50">Effective November 17, 2026. Marriage Mode is a product of Upfront Consulting with Tiff &amp; Reco LLC. See also our <a href="../terms/" className="text-teal underline">Terms of Use</a>.</p>
      {S.map(([h, ps]) => (<section key={h} className="space-y-2"><h2 className="pt-2 text-xl font-bold text-ink">{h}</h2>{ps.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</section>))}
    </article>
  );
}
