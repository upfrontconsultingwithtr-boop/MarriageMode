'use client';
import { useEffect, useRef, useState } from 'react';
import { cloudEnabled, signOut } from '@/lib/cloud';
import { loadPrefs, savePrefs, type Prefs } from '@/lib/prefs';
import * as P from '@/lib/partner';

type Props = { signedInEmail: string | null; openSignIn: () => void; clearDevice: () => void };

function Toggle({ id, label, sub, on, set }: { id: string; label: string; sub?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="cursor-pointer"><span className="font-medium">{label}</span>{sub && <span className="block text-sm text-ink/55">{sub}</span>}</label>
      <button id={id} role="switch" aria-checked={on} onClick={() => set(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-lagoon' : 'bg-white/15'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function Choice<T extends string>({ label, value, options, set }: { label: string; value: T; options: [T, string][]; set: (v: T) => void }) {
  return (
    <fieldset className="py-2"><legend className="font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{options.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => set(v)} className={`min-h-11 rounded-full px-4 text-sm ring-1 ${value === v ? 'bg-lagoon/15 ring-lagoon/70 font-semibold' : 'ring-white/15'}`}>{l}</button>))}</div>
    </fieldset>
  );
}

export default function SettingsTab({ signedInEmail, openSignIn, clearDevice }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<P.Profile | null>(null);
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [exportUrl, setExportUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!signedInEmail) return;
    (async () => {
      const id = await P.me(); setUid(id); if (!id) return;
      const pr = (await P.profiles([id]))[id] ?? { user_id: id, display_name: null, avatar_path: null, relationship_stage: null };
      setProfile(pr); setName(pr.display_name ?? ''); setStage(pr.relationship_stage ?? '');
    })();
  }, [signedInEmail]);

  const update = (patch: Partial<Prefs>) => { const p = { ...prefs, ...patch }; setPrefs(p); savePrefs(p); if (uid) void P.savePrefsToAccount(uid, p); };
  const saveProfile = async () => { if (!uid) return; const ok = await P.saveProfile(uid, { display_name: name.trim().slice(0, 40) || null, relationship_stage: stage || null }); setMsg(ok ? 'Profile saved.' : 'Could not save. Try again.'); };
  const onPhoto = async (f?: File) => { if (!uid || !f) return; setMsg('Uploading photo…'); const path = await P.uploadAvatar(uid, f); if (path) { setProfile((p) => (p ? { ...p, avatar_path: path } : p)); setMsg('Photo updated.'); } else setMsg('Could not upload that photo. Try a JPG or PNG.'); };
  const doExport = async () => { if (!uid) return; const data = await P.exportMyData(uid); setExportUrl(URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))); };
  const doDelete = async () => { if (confirmDelete !== 'DELETE') return; const ok = await P.deleteMyAccount(); setMsg(ok ? 'Your account and synced data are deleted.' : 'Could not delete. Try again.'); if (ok) { setUid(null); setProfile(null); } };
  const photo = P.avatarUrl(profile?.avatar_path ?? null);

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      {msg && <p role="status" className="rounded-xl bg-lagoon/10 p-3 text-sm ring-1 ring-lagoon/30 lg:col-span-2">{msg}</p>}

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        {!signedInEmail ? (
          <><p className="mt-1 text-sm text-ink/60">A profile (name and photo your partner sees) needs the free sign-in.</p>
            {cloudEnabled && <button onClick={openSignIn} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">Sign in</button>}</>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-4">
              {photo ? <img src={photo} alt="Your profile photo" width={72} height={72} className="size-[72px] rounded-full object-cover ring-2 ring-lagoon/60" />
                : <span className="grid size-[72px] place-items-center rounded-full bg-lagoon/15 text-2xl font-semibold text-teal ring-2 ring-lagoon/40">{(name || signedInEmail).charAt(0).toUpperCase()}</span>}
              <div>
                <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} id="photo" />
                <button onClick={() => file.current?.click()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">{photo ? 'Change photo' : 'Add a photo'}</button>
                <p className="mt-1 text-xs text-ink/50">Only you and your linked partner see it.</p>
              </div>
            </div>
            <label htmlFor="pf-name" className="block text-sm text-ink/70">Name your partner sees</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4" />
            <label htmlFor="pf-stage" className="block text-sm text-ink/70">Where are you?</label>
            <select id="pf-stage" value={stage} onChange={(e) => setStage(e.target.value)} className="min-h-11 w-full rounded-full border border-white/15 bg-night/60 px-4">
              <option value="">Choose…</option><option value="exclusive">Newly exclusive</option><option value="engaged">Engaged</option><option value="married">Married</option><option value="rebuilding">Rebuilding trust</option><option value="other">Other</option>
            </select>
            <button onClick={saveProfile} className="glow-lagoon min-h-11 rounded-full bg-lagoon px-5 font-semibold text-night">Save profile</button>
            <p className="text-xs text-ink/50">Signed in as {signedInEmail}</p>
          </div>
        )}
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <Choice label="Theme" value={prefs.theme} options={[['dark', 'Dark'], ['light', 'Light']]} set={(v) => update({ theme: v })} />
        <Choice label="Text size" value={prefs.textSize} options={[['s', 'Small'], ['m', 'Default'], ['l', 'Large'], ['xl', 'Extra large']]} set={(v) => update({ textSize: v })} />
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">Accessibility</h2>
        <Toggle id="a-motion" label="Reduce motion" sub="Turns off glowing animations and transitions." on={prefs.reduceMotion} set={(v) => update({ reduceMotion: v })} />
        <Toggle id="a-contrast" label="High contrast" sub="Brighter text and stronger edges." on={prefs.highContrast} set={(v) => update({ highContrast: v })} />
        <Toggle id="a-links" label="Underline all links" on={prefs.underlineLinks} set={(v) => update({ underlineLinks: v })} />
        <p className="mt-2 text-xs text-ink/50">Text size is under Appearance. Your phone&apos;s screen reader and zoom work everywhere too.</p>
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold">Privacy &amp; security</h2>
        <Toggle id="p-analytics" label="Count my visits anonymously" sub="Helps us improve. Never includes which apps you pick or anything you type." on={prefs.analytics} set={(v) => update({ analytics: v })} />
        <ul className="mt-2 space-y-1 text-sm text-ink/65">
          <li>✓ No passwords: sign-in uses a one-time email link.</li>
          <li>✓ Your checklist and messages are visible only to you (and your partner, for what you share).</li>
          <li>✓ We never sell data or show ads.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={clearDevice} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Clear data on this device</button>
          {signedInEmail && <>
            <button onClick={doExport} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Download my data</button>
            <button onClick={() => void signOut()} className="min-h-11 rounded-full px-4 text-sm ring-1 ring-white/15">Sign out</button>
          </>}
        </div>
        {exportUrl && <a href={exportUrl} download="marriage-mode-my-data.json" className="mt-2 inline-block text-sm text-teal underline">Save my data file</a>}
        {signedInEmail && (
          <div className="mt-5 rounded-xl bg-coral/10 p-4 ring-1 ring-coral/30">
            <p className="font-semibold text-coral">Delete my account</p>
            <p className="mt-1 text-sm text-ink/65">Deletes your account, synced checklist, profile and partner space for good. Type DELETE to confirm.</p>
            <div className="mt-2 flex gap-2">
              <label htmlFor="del" className="sr-only">Type DELETE</label>
              <input id="del" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
              <button onClick={doDelete} disabled={confirmDelete !== 'DELETE'} className="min-h-11 rounded-full bg-coral/25 px-4 text-sm font-semibold text-coral disabled:opacity-40">Delete</button>
            </div>
          </div>
        )}
        <p className="mt-4 text-sm"><a href="../privacy/" className="text-teal underline">Privacy</a> · <a href="../safety/" className="text-teal underline">Safety &amp; consent</a></p>
      </div>
    </section>
  );
}
