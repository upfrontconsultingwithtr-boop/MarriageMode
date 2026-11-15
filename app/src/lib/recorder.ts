// Records a coaching session in the format it happened in, on the customer's own device:
// video sessions as video (Mia + your camera + captions), voice sessions as audio.
// Recordings are kept in this browser's private storage (IndexedDB), never uploaded.
export type Kind = 'video' | 'voice';
export type Part = { key: string; kind: Kind; mime: string; at: string };

const DB = 'marriage-mode-recordings';
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('parts'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
export async function putBlob(key: string, blob: Blob) { const d = await db(); await new Promise((res, rej) => { const tx = d.transaction('parts', 'readwrite'); tx.objectStore('parts').put(blob, key); tx.oncomplete = () => res(null); tx.onerror = () => rej(tx.error); }); }
export async function getBlob(key: string): Promise<Blob | null> { const d = await db(); return new Promise((res) => { const r = d.transaction('parts').objectStore('parts').get(key); r.onsuccess = () => res((r.result as Blob) ?? null); r.onerror = () => res(null); }); }
export async function delBlob(key: string) { const d = await db(); await new Promise((res) => { const tx = d.transaction('parts', 'readwrite'); tx.objectStore('parts').delete(key); tx.oncomplete = () => res(null); tx.onerror = () => res(null); }); }

function pick(kind: Kind): string {
  const c = kind === 'video' ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return c.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? '';
}

export type Rec = { kind: Kind; stop: () => Promise<Part | null> };

export async function startRecording(opts: { kind: Kind; key: string; coachAudio: MediaStream | null; frame?: () => { coach: HTMLVideoElement | null; cam: HTMLVideoElement | null; caption: string } }): Promise<Rec | null> {
  if (typeof MediaRecorder === 'undefined') return null;
  const mime = pick(opts.kind); if (!mime) return null;
  // Mix Mia's voice + the person's microphone into one track.
  const ctx = new AudioContext(); const mixDest = ctx.createMediaStreamDestination();
  let mic: MediaStream | null = null;
  try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); ctx.createMediaStreamSource(mic).connect(mixDest); } catch { /* no mic: still record Mia */ }
  if (opts.coachAudio && opts.coachAudio.getAudioTracks().length) ctx.createMediaStreamSource(opts.coachAudio).connect(mixDest);
  const tracks: MediaStreamTrack[] = [...mixDest.stream.getAudioTracks()];
  let timer = 0;
  if (opts.kind === 'video' && opts.frame) {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 640; const g = canvas.getContext('2d')!;
    const draw = () => {
      const f = opts.frame!(); g.fillStyle = '#140B10'; g.fillRect(0, 0, 640, 640);
      if (f.coach && f.coach.readyState >= 2) g.drawImage(f.coach, 0, 0, 640, 640);
      if (f.cam && f.cam.readyState >= 2) { g.save(); g.beginPath(); g.roundRect(468, 412, 156, 208, 16); g.clip(); g.drawImage(f.cam, 468, 412, 156, 208); g.restore(); }
      if (f.caption) { g.fillStyle = 'rgba(12,7,9,0.72)'; g.fillRect(0, 560, 640, 80); g.fillStyle = '#F6EFE6'; g.font = '20px system-ui, sans-serif'; const words = f.caption.split(' '); let line = ''; const lines: string[] = []; for (const w of words) { if (g.measureText(line + w).width > 600) { lines.push(line); line = ''; } line += w + ' '; } lines.push(line); lines.slice(-2).forEach((l, i) => g.fillText(l.trim(), 20, 592 + i * 26)); }
      g.fillStyle = '#D9B77E'; g.font = '14px system-ui, sans-serif'; g.fillText('Marriage Mode · Mia (AI coach)', 16, 24);
    };
    timer = window.setInterval(draw, 1000 / 20); draw();
    tracks.unshift(...canvas.captureStream(20).getVideoTracks());
  }
  const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: 600_000, audioBitsPerSecond: 64_000 });
  const chunks: Blob[] = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start(1000);
  return {
    kind: opts.kind,
    stop: () => new Promise((res) => {
      rec.onstop = async () => {
        clearInterval(timer); mic?.getTracks().forEach((t) => t.stop()); void ctx.close();
        if (!chunks.length) { res(null); return; }
        try { await putBlob(opts.key, new Blob(chunks, { type: mime })); res({ key: opts.key, kind: opts.kind, mime, at: new Date().toISOString() }); } catch { res(null); }
      };
      try { rec.stop(); } catch { res(null); }
    }),
  };
}
