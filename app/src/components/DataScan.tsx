'use client';
import { useState } from 'react';
import { scanFile, type Hit } from '@/lib/scan';
import { track } from '@/lib/track';

type Props = { selected: string[]; toggle: (id: string) => void };

export default function DataScan({ selected, toggle }: Props) {
  const [busy, setBusy] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [err, setErr] = useState('');

  const onFile = async (f?: File) => {
    if (!f) return; setErr(''); setHits(null); setBusy('Starting…');
    try { const h = await scanFile(f, setBusy); setHits(h); track('data-scan'); }
    catch (e) {
      const m = (e as Error).message;
      setErr(m === 'too_big' ? 'That file is very large. Download fewer categories (see the steps) and try again.' : m === 'unsupported' ? 'Pick the .zip file you downloaded (or a .json, .html, .csv or .txt file).' : 'That file could not be read. Try downloading it again.');
    } finally { setBusy(''); }
  };

  return (
    <div className="glass p-6 md:col-span-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">Find forgotten accounts</p>
      <h2 className="mt-1 text-lg font-semibold">Scan your Google or Facebook data download</h2>
      <p className="mt-1 text-sm text-ink/65">Your download lists apps you signed into and sites you visited. Pick the file and we look for dating sites <strong>on this device</strong>; the file is never uploaded.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <details className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <summary className="cursor-pointer font-semibold">Get your Facebook download</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/70">
            <li>In Facebook, open Settings, then Accounts Center.</li>
            <li>Tap Your information and permissions, then Download your information.</li>
            <li>Choose only <strong>Apps and websites</strong> (it shows apps you logged into with Facebook), format JSON.</li>
            <li>When the email arrives, download the .zip file.</li>
          </ol>
        </details>
        <details className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <summary className="cursor-pointer font-semibold">Get your Google download</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink/70">
            <li>Go to takeout.google.com and tap Deselect all.</li>
            <li>Tick <strong>Chrome</strong> and <strong>My Activity</strong> (they're small). Mail works too but is very large.</li>
            <li>Create export, then download the .zip when it's ready.</li>
          </ol>
        </details>
      </div>
      <p className="mt-2 text-xs text-ink/50">Menu names can change a little. Look for &ldquo;Download your information&rdquo;.</p>

      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-lagoon px-5 font-semibold text-night glow-lagoon">
        Choose my download file
        <input type="file" accept=".zip,.json,.html,.htm,.csv,.txt,.mbox" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {busy && <p role="status" className="mt-3 text-sm text-ink/70">{busy}</p>}
      {err && <p role="alert" className="mt-3 text-sm text-coral">{err}</p>}
      {hits && (
        <div className="mt-4 rounded-xl bg-night/60 p-4">
          <p className="font-semibold">{hits.length ? `Found ${hits.length} dating ${hits.length === 1 ? 'site' : 'sites'} in your download` : 'No dating sites found in this file. 🎉'}</p>
          <ul className="mt-3 space-y-2">{hits.map((h) => { const on = selected.includes(h.platformId); return (
            <li key={h.platformId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
              <span className="min-w-0"><span className="font-medium">{h.name}</span> <span className="text-xs text-ink/55">· mentioned {h.count}× · {h.files.map((f) => f.split('/').pop()).join(', ')}</span></span>
              <button onClick={() => toggle(h.platformId)} aria-pressed={on} className={`min-h-9 rounded-full px-3 text-xs ring-1 ${on ? 'bg-lagoon/15 ring-lagoon/60' : 'ring-white/15'}`}>{on ? '✓ In my list' : 'Add to my apps'}</button>
            </li>); })}</ul>
          {hits.length > 0 && <p className="mt-2 text-xs text-ink/50">A mention doesn&apos;t always mean an account. Add the ones you recognize; each gets its delete steps.</p>}
        </div>
      )}
    </div>
  );
}
