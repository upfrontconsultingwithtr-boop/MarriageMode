// Mia's lifelike 3D face and natural voice, all free and open source, loaded from a public CDN:
// - TalkingHead (MIT): 3D avatar with real-time lip-sync, blinking, eye contact, head movement, gestures.
// - HeadTTS (MIT) + Kokoro-82M (Apache 2.0): natural neural English voice, runs on the device.
// Spanish (and any device where the neural voice can't start) uses the device's own voice,
// with the 3D mouth driven from the words.
/* eslint-disable @typescript-eslint/no-explicit-any */
const TH = 'https://cdn.jsdelivr.net/npm/@met4citizen/talkinghead@1.8.2/modules/talkinghead.mjs';
const HT = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3.0';
export const IMPORT_MAP = JSON.stringify({ imports: {
  three: 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js',
  'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/',
} });

const load = (url: string) => import(/* webpackIgnore: true */ url);

export type Mia = { speak: (text: string, es: boolean, onStart?: () => void, onEnd?: () => void) => void; stop: () => void; listen: (on: boolean) => void; neural: boolean };

export async function startMia(node: HTMLElement, glbUrl: string, onProgress?: (p: number) => void): Promise<Mia> {
  const { TalkingHead } = await load(TH);
  const head: any = new TalkingHead(node, { ttsEndpoint: null, lipsyncModules: ['en', 'pt_br'], cameraView: 'upper', cameraRotateEnable: false, cameraZoomEnable: false, cameraPanEnable: false, avatarMood: 'happy', modelFPS: 30 });
  await head.showAvatar({ url: glbUrl, body: 'F', avatarMood: 'happy', lipsyncLang: 'en' }, (ev: ProgressEvent) => { if (ev.lengthComputable && onProgress) onProgress(ev.loaded / ev.total); });
  head.lookAtCamera(2000);

  // Natural neural English voice (optional: falls back to the device voice if it can't start).
  // Loads in the background: Mia talks with the device voice until the neural voice is ready.
  let tts: any = null; let ending: (() => void) | null = null; const state = { neural: false };
  void (async () => {
    try {
      const { HeadTTS } = await load(`${HT}/+esm`);
      const t = new HeadTTS({ endpoints: ['webgpu', 'wasm'], languages: ['en-us'], voices: ['af_heart'], defaultVoice: 'af_heart', workerModule: `${HT}/modules/worker-tts.mjs`, dictionaryURL: `${HT}/dictionaries/` });
      await t.connect();
      t.onmessage = (m: any) => { if (m.type === 'audio') { try { head.speakAudio(m.data, {}, null); } catch { /* skip */ } } };
      t.onend = () => { const f = ending; ending = null; setTimeout(() => f?.(), 400); };
      tts = t; state.neural = true;
    } catch { tts = null; }
  })();

  const deviceVoice = (text: string, es: boolean, onStart?: () => void, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = es ? 'es-US' : 'en-US';
    const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(es ? 'es' : 'en'));
    const v = vs.find((x) => /female|samantha|victoria|ava|allison|zira|jenny|aria|paulina|monica|google/i.test(x.name)) ?? vs[0]; if (v) u.voice = v;
    // Drive the 3D mouth from the words with a silent track timed to a natural speaking pace.
    const words = text.split(/\s+/).filter(Boolean); const per = es ? 330 : 310;
    const wtimes = words.map((_, i) => i * per); const wdurations = words.map((w) => Math.min(per - 20, 120 + w.length * 28));
    const sr = 22050; const len = Math.ceil(((words.length * per) / 1000 + 0.3) * sr);
    const audio = new AudioBuffer({ length: len, sampleRate: sr, numberOfChannels: 1 });
    u.onstart = () => { onStart?.(); try { head.speakAudio({ audio, words, wtimes, wdurations }, { lipsyncLang: es ? 'pt_br' : 'en' }); } catch { /* skip */ } };
    u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  };

  const mia: Mia = {
    get neural() { return state.neural; },
    speak(text, es, onStart, onEnd) {
      head.stopSpeaking?.();
      if (tts && !es) { onStart?.(); ending = onEnd ?? null; tts.synthesize({ input: text }).catch(() => { ending = null; deviceVoice(text, es, undefined, onEnd); }); }
      else deviceVoice(text, es, onStart, onEnd);
    },
    stop() { try { speechSynthesis.cancel(); } catch { /* none */ } head.stopSpeaking?.(); ending = null; },
    listen(on) { if (on) { head.lookAtCamera(4000); head.setMood?.('neutral'); } else head.setMood?.('happy'); },
  };
  return mia;
}
