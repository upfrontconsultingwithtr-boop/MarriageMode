// Mia's voice. English: a natural neural voice (HeadTTS + Kokoro, free and open source,
// runs on the device). Spanish, or any device where it can't start: the device's own voice.
/* eslint-disable @typescript-eslint/no-explicit-any */
// Soft, unhurried voice (Tiffany 2026-11-17: 'soft and compassionate'). Samples: /coach/voices/.
export const MIA_VOICE = 'af_heart'; export const MIA_SPEED = 0.88;
const HT = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3.0';
import { MouthTrack, wordShapes, wordMs } from './lipsync';
import { speechChunks, chunkKey } from './speechChunks';
import { BASE } from './base';
const load = (url: string) => import(/* webpackIgnore: true */ url);

export type Voice = { speak: (text: string, es: boolean, onStart: () => void, onEnd: () => void) => void; stop: () => void; neural: () => boolean; stream: () => MediaStream | null; active: () => boolean; level: () => number | null; mouth: (now: number) => [string, number][] };

export function createVoice(): Voice {
  let tts: any = null; let ctx: AudioContext | null = null; let src: AudioBufferSourceNode | null = null; let gen = 0; let tap: MediaStreamAudioDestinationNode | null = null; let an: AnalyserNode | null = null; let lastWord = 0; const buf = new Uint8Array(512); const track = new MouthTrack();
  // Pre-recorded natural-voice clips for Mia's fixed lines (scripts/prerender-voice.mjs): instant, same on every device.
  let rec: Set<string> | null = null;
  const recReady: Promise<void> = fetch(`${BASE}/coach/voice/manifest.json`).then((r) => r.json()).then((m) => { rec = new Set(m.en ?? []); }).catch(() => {});
  void (async () => {
    try {
      ctx = new AudioContext(); tap = ctx.createMediaStreamDestination(); an = ctx.createAnalyser(); an.fftSize = 512;
      const { HeadTTS } = await load(`${HT}/+esm`);
      const t = new HeadTTS({ endpoints: ['webgpu', 'wasm'], languages: ['en-us'], voices: [MIA_VOICE], defaultVoice: MIA_VOICE, audioCtx: ctx, workerModule: `${HT}/modules/worker-tts.mjs`, dictionaryURL: `${HT}/dictionaries/` });
      await t.connect(); tts = t;
    } catch { tts = null; }
  })();

  const device = (text: string, es: boolean, onStart: () => void, onEnd: () => void) => {
    if (!('speechSynthesis' in window)) { onStart(); setTimeout(onEnd, Math.min(12000, text.length * 55)); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = es ? 'es-US' : 'en-US'; u.rate = 0.9; u.pitch = 1;
    const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(es ? 'es' : 'en'));
    const v = vs.find((x) => /natural|neural|female|samantha|victoria|ava|allison|zira|jenny|aria|paulina|monica|google/i.test(x.name)) ?? vs[0]; if (v) u.voice = v;
    // Word-for-word mouth: plan the whole sentence, then re-sync on every word the device announces.
    const words = [...text.matchAll(/\S+/g)].map((m) => ({ w: m[0], i: m.index ?? 0 }));
    const plan = (k: number, t: number) => { track.clearFrom(t - 1); for (let j = k; j < words.length; j++) { const ms = wordMs(words[j].w) * (es ? 1.08 : 1); track.add(wordShapes(words[j].w, t, ms)); t += ms + (/[.,;:!?]$/.test(words[j].w) ? 260 : 45); } };
    u.onstart = () => { lastWord = performance.now(); plan(0, lastWord); onStart(); };
    u.onboundary = (e) => { lastWord = performance.now(); if (e.name && e.name !== 'word') return; let k = words.findIndex((x) => x.i >= e.charIndex); if (k < 0) k = words.length - 1; plan(k, lastWord); }; u.onend = () => { track.clear(); onEnd(); }; u.onerror = () => { track.clear(); onEnd(); }; speechSynthesis.speak(u);
  };

  return {
    neural: () => !!tts,
    // Loudness of Mia's voice right now (0..1), or null when the device voice is used (no audio access).
    level: () => { if (!(src && an)) return null; an.getByteTimeDomainData(buf); let e = 0; for (const v of buf) e += (v - 128) * (v - 128); return Math.min(1, Math.sqrt(e / buf.length) / 40); },
    mouth: (now) => track.at(now),
    stream: () => tap?.stream ?? null,
    // Is Mia's voice actually making sound right now? (Drives the mouth: closes on pauses.)
    active: () => {
      if (src && an) { an.getByteTimeDomainData(buf); let e = 0; for (const v of buf) e += (v - 128) * (v - 128); return Math.sqrt(e / buf.length) > 4; }
      return performance.now() - lastWord < 420;
    },
    stop() { gen++; track.clear(); try { speechSynthesis.cancel(); } catch { /* none */ } try { src?.stop(); } catch { /* none */ } src = null; },
    speak(text, es, onStart, onEnd) {
      this.stop(); const my = gen;
      // First line can arrive before the list of recordings: wait for it (at most 2.5s), then decide.
      if (!rec && !es) { void Promise.race([recReady, new Promise((r) => setTimeout(r, 2500))]).then(() => { if (my === gen) { rec = rec ?? new Set(); this.speak(text, es, onStart, onEnd); } }); return; }
      const parts = speechChunks(text);
      if (!es && ctx && rec && parts.length && parts.every((p) => rec!.has(chunkKey(p)))) {
        void (async () => {
          try {
            await ctx!.resume();
            const bufs = parts.map((p) => fetch(`${BASE}/coach/voice/en-${chunkKey(p)}.mp3`).then((r) => r.arrayBuffer()).then((a) => ctx!.decodeAudioData(a)));
            const first = await bufs[0]; if (my !== gen) return; onStart();
            for (const [i, pb] of bufs.entries()) {
              const b = i ? await pb : first; if (my !== gen) return;
              await new Promise<void>((res) => { src = ctx!.createBufferSource(); src.buffer = b; src.connect(ctx!.destination); if (tap) src.connect(tap); if (an) src.connect(an); src.onended = () => res(); src.start(); });
              if (i < bufs.length - 1) await new Promise((r) => setTimeout(r, 180)); // natural breath between sentences
            }
            if (my === gen) onEnd();
          } catch { if (my === gen) device(text, es, onStart, onEnd); }
        })();
        return;
      }
      if (!tts || es || !ctx) { device(text, es, onStart, onEnd); return; }
      void (async () => {
        try {
          await ctx!.resume();
          const msgs: any[] = await tts.synthesize({ input: text, voice: MIA_VOICE, speed: MIA_SPEED });
          const bufs = msgs.filter((m) => m.type === 'audio' && m.data?.audio instanceof AudioBuffer).map((m) => m.data);
          if (!bufs.length) throw new Error('no audio');
          if (my !== gen) return;
          onStart();
          for (const b of bufs) {
            if (my !== gen) return;
            await new Promise<void>((res) => { src = ctx!.createBufferSource(); src.buffer = b.audio; src.connect(ctx!.destination); if (tap) src.connect(tap); if (an) src.connect(an); src.onended = () => res(); src.start(); const t0 = performance.now() + ((ctx as any).outputLatency || ctx!.baseLatency || 0) * 1000;
              const v: string[] = b.visemes ?? []; track.add(v.map((x, i) => ({ v: x, t: t0 + b.vtimes[i], d: b.vdurations[i] }))); });
          }
          if (my === gen) onEnd();
        } catch { if (my === gen) device(text, es, onStart, onEnd); }
      })();
    },
  };
}
