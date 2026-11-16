'use client';
import { useEffect, useRef, useState } from 'react';
import { MODELS, MODELS_F32, hasF16, pickModel, canRunAI, systemPrompt, crisis, CRISIS_EN, CRISIS_ES } from '@/lib/coach';
import { answer as guideAnswer } from '@/lib/guide';
import { loadPrefs } from '@/lib/prefs';
import { BASE } from '@/lib/base';
import { track } from '@/lib/track';
import { startMia, type Mia } from '@/lib/mia';
import { createVoice, type Voice } from '@/lib/voice';
import { saveSession } from '@/lib/sessions';
import { startRecording, type Rec as Recording, type Part } from '@/lib/recorder';
import { coachReply, guidanceFor, findTopics } from '@/lib/coachKnowledge';
import { addAssignment, extractAssignment } from '@/lib/assignments';
import { loadMine, surveyContext } from '@/lib/survey';
import { loadReview, reviewContext } from '@/lib/review';

type Msg = { role: 'user' | 'assistant'; content: string };
type Engine = { chat: { completions: { create: (o: unknown) => Promise<AsyncIterable<{ choices: { delta: { content?: string } }[] }>> } } };
type Rec = { lang: string; interimResults: boolean; continuous: boolean; onresult: (e: { results: { 0: { transcript: string }; isFinal: boolean }[] & { length: number } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void };

// Mia's real-human face with word-for-word lip sync, built free. Listening: the calm actor video.
// Talking: the actor's real talking footage (natural head, brows, blinks, shoulders), with real mouth
// shapes cut from the same actor drawn over her mouth for each sound, matched to her head turn and
// light-corrected frame by frame. Falls back to the plain video if anything can't load.
type Pose = [number, number, number, number];
type Lips = { u: number; box: [number, number, number, number]; cols: number; fps: number; visemes: string[]; bins: number[]; idle: Pose[]; talk: Pose[]; yIdle: number[]; yTalk: number[]; gIdle: number[][]; gTalk: number[][]; eIdle?: number[][]; eTalk?: number[][] };
function VideoAvatar({ speaking, listening, mouth, canvasRef }: { speaking: boolean; listening: boolean; mouth?: (now: number) => [string, number][]; canvasRef?: React.RefObject<HTMLCanvasElement | null> }) {
  const idle = useRef<HTMLVideoElement>(null); const talk = useRef<HTMLVideoElement>(null); const own = useRef<HTMLCanvasElement>(null); const cv = canvasRef ?? own;
  // Honor 'reduce motion': her face stays still (poster frame), no mouth animation; captions still show.
  const [rm, setRm] = useState(false); useEffect(() => { try { setRm(matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { /* old browser */ } }, []);
  if (rm) mouth = undefined;
  const mouthRef = useRef(mouth); mouthRef.current = mouth; const speakRef = useRef(speaking); speakRef.current = speaking; const [ready, setReady] = useState(false);
  useEffect(() => { if (rm) idle.current?.pause(); else void idle.current?.play().catch(() => {}); }, [rm]);
  useEffect(() => {
    const t = talk.current; if (!t || !mouthRef.current) return;
    if (speaking) { if (t.paused) { try { t.currentTime = 4.48; } catch { /* not ready */ } } void t.play().catch(() => {}); }
    else { const h = setTimeout(() => t.pause(), 600); return () => clearTimeout(h); }
  }, [speaking]);
  useEffect(() => {
    if (!mouthRef.current) return;
    let raf = 0; let dead = false; let L: Lips | null = null; const img = new Image(); let shown = false; let mix = 0; let last = performance.now(); let lastDraw = 0;
    const sm = new Map<string, number>(); const off = document.createElement('canvas'); let o: CanvasRenderingContext2D | null = null;
    void fetch(`${BASE}/coach/mia-lips.json`).then((r) => r.json()).then((j: Lips) => { L = j; off.width = j.box[2]; off.height = j.box[3]; o = off.getContext('2d', { willReadFrequently: true }); img.src = `${BASE}/coach/mia-mouths.webp`; }).catch(() => {});
    const cell = (bin: number, name: string, a: number) => { const j = L!.visemes.indexOf(name); if (j < 0 || a <= 0) return; const [, , W, H] = L!.box; const n = bin * L!.visemes.length + j;
      o!.globalAlpha = Math.min(1, a); o!.drawImage(img, (n % L!.cols) * W, Math.floor(n / L!.cols) * H, W, H, 0, 0, W, H); };
    const draw = () => {
      if (dead) return; raf = requestAnimationFrame(draw);
      const t0 = performance.now(); if (t0 - lastDraw < 31) return; lastDraw = t0; // ~30 fps: plenty for lips, half the work on low-end phones
      const vi = idle.current; const vt = talk.current; const c = cv.current; const g = c?.getContext('2d');
      if (!vi || !vt || !c || !g || !L || !o || !img.complete || !img.naturalWidth || vi.readyState < 2) return;
      if (!shown) { shown = true; setReady(true); }
      const now = performance.now(); const dt = Math.min(100, now - last); last = now;
      mix = Math.max(0, Math.min(1, mix + (speakRef.current && vt.readyState >= 2 ? 1 : -1) * dt / 300));
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.drawImage(vi, 0, 0, c.width, c.height);
      if (mix > 0) { g.globalAlpha = mix; g.drawImage(vt, 0, 0, c.width, c.height); g.globalAlpha = 1; }
      const want = new Map((mouthRef.current?.(now) ?? []));
      for (const k of new Set([...sm.keys(), ...want.keys()])) { const w = (sm.get(k) ?? 0) * 0.45 + (want.get(k) ?? 0) * 0.55; if (w < 0.02) sm.delete(k); else sm.set(k, w); }
      const top = [...sm.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2);
      if (!top.length && mix === 0) return;
      // Pose, head-turn version and lighting come from whichever body video is showing most.
      const useTalk = mix >= 0.5; const vid = useTalk ? vt : vi; const poses = useTalk ? L.talk : L.idle;
      const f = Math.min(poses.length - 1, Math.floor(vid.currentTime * L.fps)); const [nx, ny, ang, e] = poses[f];
      const yaw = (useTalk ? L.yTalk : L.yIdle)[f]; const bin = L.bins.filter((b) => yaw > b).length; const gain = (useTalk ? L.gTalk : L.gIdle)[f];
      const [X0, Y0, W, H] = L.box; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
      cell(bin, 'rest', mix); // while talking, her own footage's mouth is always covered
      const total = Math.min(1, top.reduce((a, x) => a + x[1], 0));
      top.forEach(([name, w], i) => cell(bin, name, i === 0 ? total : (total * w) / (top[0][1] + w)));
      const id = o.getImageData(0, 0, W, H); const px = id.data;
      for (let ch = 0; ch < 3; ch++) {
        const [c0, cx, cy] = [gain[ch * 3], gain[ch * 3 + 1], gain[ch * 3 + 2]]; const ex = new Float32Array(W); for (let x = 0; x < W; x++) ex[x] = Math.exp(c0 + cx * (x / W - 0.5));
        for (let y = 0; y < H; y++) { const ey = Math.exp(cy * (y / H - 0.5)); let p = y * W * 4 + ch; for (let x = 0; x < W; x++, p += 4) px[p] = px[p] * ex[x] * ey; }
      }
      // Pull the blend in from any side where hair falls beside her mouth in this frame.
      const ed = (useTalk ? L.eTalk : L.eIdle)?.[f];
      if (ed) { const el = Math.min(ed[0], -0.42); const er = Math.max(ed[1], 0.42);
        for (let x = 0; x < W; x++) { const xu = x / L.u + X0; let a = Math.max(0, Math.min(1, (er + 0.03 - xu) / 0.08, (xu - el + 0.03) / 0.08)); if (a >= 1) continue; a = a * a * (3 - 2 * a);
          for (let y = 0, p = x * 4 + 3; y < H; y++, p += W * 4) px[p] = px[p] * a; } }
      o.putImageData(id, 0, 0);
      const sc = c.width / 720; const k = (e / L.u) * sc;
      g.setTransform(k * Math.cos(ang), k * Math.sin(ang), -k * Math.sin(ang), k * Math.cos(ang), nx * sc, ny * sc); g.globalAlpha = 1;
      g.drawImage(off, X0 * L.u, Y0 * L.u);
    };
    raf = requestAnimationFrame(draw); return () => { dead = true; cancelAnimationFrame(raf); };
  }, [cv]);
  return (
    <div className="absolute inset-0">
      <video ref={idle} src={`${BASE}/coach/mia-idle.mp4`} poster={`${BASE}/coach/mia-poster.jpg`} muted loop playsInline autoPlay preload="auto" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      {mouth && <video ref={talk} src={`${BASE}/coach/mia-talk.mp4`} muted loop playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover opacity-0" aria-hidden="true" />}
      {mouth && <canvas ref={cv} width={720} height={720} className={`absolute inset-0 h-full w-full object-cover ${ready ? '' : 'opacity-0'}`} aria-hidden="true" />}
      {listening && <span className="absolute left-3 top-3 rounded-full bg-night/70 px-3 py-1 text-xs text-mango">● listening</span>}
    </div>
  );
}

export default function CoachApp() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const es = lang === 'es';
  const t = (en: string, sp: string) => (es ? sp : en);
  const [phase, setPhase] = useState<'intro' | 'call'>('intro');
  const [mode, setMode] = useState<'ai' | 'lite'>('ai');
  const [gpu, setGpu] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0); const [progressText, setProgressText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]); const [live, setLive] = useState('');
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false); const [listening, setListening] = useState(false);
  const [assigned, setAssigned] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  useEffect(() => { setReviewMode(new URLSearchParams(window.location.search).has('review') && !!loadReview()); }, []);
  const [voiceOn, setVoiceOn] = useState(true); const [cam, setCam] = useState(false); const [err, setErr] = useState('');
  const engine = useRef<Engine | null>(null); const rec = useRef<Rec | null>(null);
  const session = useRef<{ id: string; startedAt: string } | null>(null);
  const recording = useRef<Recording | null>(null); const parts = useRef<Part[]>([]); const [format, setFormat] = useState<'text' | 'voice' | 'video'>('text');
  const faceBox = useRef<HTMLDivElement>(null); const caption = useRef(''); const speakingRef = useRef(false); const faceCanvas = useRef<HTMLCanvasElement>(null); const mouthOf = useRef((now: number) => voice.current?.mouth(now) ?? []);
  const mia = useRef<Mia | null>(null); const stage = useRef<HTMLDivElement>(null); const voice = useRef<Voice | null>(null);
  const [face3d, setFace3d] = useState<'off' | 'loading' | 'on' | 'failed'>('off'); const [faceP, setFaceP] = useState(0);
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const [size, setSize] = useState(MODELS.full.sizeMB);

  useEffect(() => { setLang(loadPrefs().lang); setSize(MODELS[pickModel()].sizeMB); void canRunAI().then(setGpu); return () => { try { speechSynthesis.cancel(); } catch { /* none */ } stream.current?.getTracks().forEach((x) => x.stop()); }; }, []);

  // Save the transcript on this device after every message (shown later in the dashboard).
  useEffect(() => {
    if (phase !== 'call' || !msgs.length) return;
    if (!session.current) session.current = { id: `s-${Date.now()}`, startedAt: new Date().toISOString() };
    saveSession({ ...session.current, updatedAt: '', mode, lang, msgs, format, parts: parts.current });
  }, [msgs, phase, mode, lang, format]);
  useEffect(() => { speakingRef.current = speaking; }, [speaking]);
  // Record in the format the session happens in: voice when the mic is used, video when the camera is on.
  const record = async (kind: 'voice' | 'video') => {
    if (recording.current?.kind === kind || (recording.current?.kind === 'video')) return;
    if (!session.current) session.current = { id: `s-${Date.now()}`, startedAt: new Date().toISOString() };
    if (recording.current) { const p = await recording.current.stop(); if (p) parts.current = [...parts.current, p]; recording.current = null; }
    recording.current = await startRecording({ kind, key: `${session.current.id}-${parts.current.length + 1}`, coachAudio: voice.current?.stream() ?? null,
      frame: () => { return { coach: faceCanvas.current ?? faceBox.current?.querySelector('video') ?? null, cam: video.current, caption: caption.current }; } });
    setFormat(kind);
  };
  const finishRecording = async () => {
    const r = recording.current; recording.current = null; if (!r || !session.current) return;
    const p = await r.stop(); if (p) parts.current = [...parts.current, p];
    saveSession({ ...session.current, updatedAt: '', mode, lang, msgs, format, parts: parts.current });
  };

  const say = (text: string) => {
    if (!voiceOn) return;
    if (mia.current) { mia.current.speak(text, es, () => setSpeaking(true), () => setSpeaking(false)); return; }
    if (voice.current) { voice.current.speak(text, es, () => setSpeaking(true), () => setSpeaking(false)); return; }
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = es ? 'es-US' : 'en-US'; u.rate = 1; u.pitch = 1.05;
    const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(es ? 'es' : 'en'));
    const v = vs.find((x) => /female|samantha|victoria|ava|allison|zira|jenny|aria|paulina|monica|google us english|google español/i.test(x.name)) ?? vs[0]; if (v) u.voice = v;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    speechSynthesis.speak(u);
  };

  const opening = () => reviewMode ? t('Hi, I’m Mia, your AI relationship coach. Thank you for doing your social media review: that took honesty. If your partner is with you, welcome to you both. This is a calm, no-blame conversation. To start, how are each of you feeling about what came up?', 'Hola, soy Mia, tu coach de relaciones con IA. Gracias por hacer tu revisión de redes sociales: eso requirió honestidad. Si tu pareja está contigo, bienvenidos los dos. Esta es una conversación tranquila y sin culpas. Para empezar, ¿cómo se siente cada uno con lo que salió?') : t('Hi, I’m Mia, your Marriage Mode AI relationship coach. I’m an AI, not a counselor, and our conversation stays on your device. What would you like to work on today?', 'Hola, soy Mia, tu coach de relaciones con IA de Marriage Mode. Soy una IA, no una consejera, y nuestra conversación se queda en tu dispositivo. ¿En qué te gustaría trabajar hoy?');

  // Load Mia's lifelike 3D face + natural voice (free, open source). Falls back to the drawn face.
  const startFace = async () => {
    if (mia.current || face3d === 'loading') return mia.current;
    if (!new URLSearchParams(window.location.search).has('face3d')) return null; // free 3D preview: only with ?face3d
    setFace3d('loading');
    for (let i = 0; i < 40 && !stage.current; i++) await new Promise((r) => setTimeout(r, 50));
    try { mia.current = await startMia(stage.current!, `${BASE}/coach/mia.glb`, setFaceP); setFace3d('on'); track('coach-face3d'); }
    catch { setFace3d('failed'); }
    return mia.current;
  };

  const start = async (useAI: boolean) => {
    setErr(''); track(useAI ? 'coach-start-ai' : 'coach-start-lite');
    if (!voice.current) voice.current = createVoice();
    if (!useAI) { setMode('lite'); setPhase('call'); await startFace(); const o = opening(); setMsgs([{ role: 'assistant', content: o }]); say(o); return; }
    // Start talking right away (Lite), and download the full AI quietly in the background.
    setMode('lite'); setPhase('call'); setProgress(0.001); await startFace(); const o = opening(); setMsgs([{ role: 'assistant', content: o }]); say(o);
    try {
      const webllm = await import('@mlc-ai/web-llm');
      const id = ((await hasF16()) ? MODELS : MODELS_F32)[pickModel()].id;
      engine.current = (await webllm.CreateMLCEngine(id, { initProgressCallback: (r: { progress: number; text: string }) => { setProgress(Math.max(0.001, r.progress)); setProgressText(r.text); } })) as unknown as Engine;
      setMode('ai'); setProgress(0); track('coach-ai-ready');
    } catch {
      setProgress(0);
      setErr(t('The full AI couldn’t start on this device, so Mia stays in Lite mode. You can keep talking.', 'La IA completa no pudo iniciar en este dispositivo, así que Mia sigue en modo Lite. Puedes seguir hablando.'));
    }
  };

  const send = async (text: string) => {
    const v = text.trim(); if (!v || busy) return; setInput('');
    const history: Msg[] = [...msgs, { role: 'user', content: v }]; setMsgs(history); setBusy(true);
    let reply = '';
    if (crisis(v)) reply = es ? CRISIS_ES : CRISIS_EN;
    else if (mode === 'lite' || !engine.current) reply = coachReply(v, es) ?? (reviewMode ? coachReply('social media phones boundaries trust', es) : null) ?? guideAnswer(v, es, { base: BASE }).text;
    else {
      try {
        const chunks = await engine.current.chat.completions.create({ stream: true, temperature: 0.7, max_tokens: 320, messages: [{ role: 'system', content: systemPrompt(es) + surveyContext(loadMine().answers) + (reviewMode ? reviewContext(loadReview()) : '') + guidanceFor(history.filter((m) => m.role === 'user').slice(-3).map((m) => m.content).join(' ')) }, ...history.slice(-12)] });
        for await (const c of chunks) { reply += c.choices[0]?.delta?.content ?? ''; setLive(reply); }
      } catch {
        // The device ran out of graphics memory: keep the session going in Lite mode.
        engine.current = null; setMode('lite');
        setErr(t('This device ran out of memory for the full AI, so Mia switched to Lite mode. You can keep talking.', 'Este dispositivo se quedó sin memoria para la IA completa, así que Mia cambió al modo Lite. Puedes seguir hablando.'));
        reply = coachReply(v, es) ?? guideAnswer(v, es, { base: BASE }).text;
      }
    }
    const hw = extractAssignment(reply);
    if (hw) { if (!session.current) session.current = { id: `s-${Date.now()}`, startedAt: new Date().toISOString() }; const a = addAssignment(hw, findTopics(v, 1)[0]?.id ?? 'general', session.current.id); if (a) { setAssigned(a.text); track('coach-assignment'); } }
    setLive(''); setMsgs((m) => [...m, { role: 'assistant', content: reply.trim() }]); setBusy(false); say(reply.trim());
  };

  const toggleMic = () => {
    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const R = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!R) { setErr(t('Voice input isn’t available in this browser. You can type instead.', 'La voz no está disponible en este navegador. Puedes escribir.')); return; }
    if (listening) { rec.current?.stop(); return; }
    mia.current?.stop(); voice.current?.stop(); speechSynthesis.cancel(); setSpeaking(false); mia.current?.listen(true);
    void record(cam ? 'video' : 'voice');
    const r = new R(); r.lang = es ? 'es-US' : 'en-US'; r.interimResults = true; r.continuous = false;
    let finalText = '';
    r.onresult = (e) => { let s = ''; for (let i = 0; i < e.results.length; i++) { s += e.results[i][0].transcript; if (e.results[i].isFinal) finalText = s; } setInput(s); };
    r.onend = () => { setListening(false); mia.current?.listen(false); if (finalText) void send(finalText); };
    r.onerror = () => setListening(false);
    rec.current = r; setListening(true); r.start();
  };

  const toggleCam = async () => {
    if (cam) { stream.current?.getTracks().forEach((x) => x.stop()); stream.current = null; setCam(false); return; }
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); setCam(true); setTimeout(() => { if (video.current && stream.current) video.current.srcObject = stream.current; }, 0); void record('video'); }
    catch { setErr(t('Camera not available. That’s fine: the coach works without it.', 'Cámara no disponible. No pasa nada: la coach funciona sin ella.')); }
  };

  const end = () => { void finishRecording().then(() => { session.current = null; parts.current = []; setFormat('text'); }); mia.current?.stop(); voice.current?.stop(); speechSynthesis.cancel(); rec.current?.stop(); stream.current?.getTracks().forEach((x) => x.stop()); setCam(false); setPhase('intro'); setMsgs([]); };
  const lastCoach = live || [...msgs].reverse().find((m) => m.role === 'assistant')?.content || '';
  caption.current = lastCoach;

  return (
    <div lang={lang} className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">{t('AI Relationship Coach · free · beta', 'Coach de relaciones con IA · gratis · beta')}</p>
        <div role="group" aria-label="Language" className="flex rounded-full bg-white/[0.04] p-1 text-xs ring-1 ring-white/10">
          {(['en', 'es'] as const).map((l) => <button key={l} aria-pressed={lang === l} disabled={phase !== 'intro'} onClick={() => setLang(l)} className={`min-h-9 rounded-full px-3 font-semibold disabled:opacity-50 ${lang === l ? 'bg-lagoon/20 text-ink' : 'text-ink/60'}`}>{l === 'en' ? 'English' : 'Español'}</button>)}
        </div>
      </div>

      {phase === 'intro' && (
        <div className="mt-6 grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-[1.75rem] ring-1 ring-white/10"><VideoAvatar speaking={false} listening={false} /></div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">{t('Talk it through with Mia, your AI coach', 'Habla con Mia, tu coach de IA')}</h1>
            <p className="mt-4 text-ink/75">{t('A live, face-to-face style session: speak or type, and Mia answers out loud. Use it alone or together as a couple.', 'Una sesión en vivo, cara a cara: habla o escribe y Mia responde en voz alta. Úsala a solas o juntos como pareja.')}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/75">
              <li>🔒 {t('Private: the AI runs on your own device. Nothing you say is sent to us or anyone.', 'Privado: la IA funciona en tu propio dispositivo. Nada de lo que dices se nos envía a nosotros ni a nadie.')}</li>
              <li>💸 {t('Free: no account, no subscription.', 'Gratis: sin cuenta ni suscripción.')}</li>
              <li>🤖 {t('Mia is an AI coach, not a person or a licensed counselor. Her face is video of an actor.', 'Mia es una coach de IA, no una persona ni una consejera con licencia. Su rostro es video de una actriz.')}</li>
              <li>📶 {t(`First time only: a one-time download of about ${size >= 1000 ? (size / 1000).toFixed(1) + ' GB' : size + ' MB'}. Wi-Fi recommended.`, `Solo la primera vez: una descarga única de unos ${size >= 1000 ? (size / 1000).toFixed(1) + ' GB' : size + ' MB'}. Se recomienda Wi-Fi.`)}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {gpu !== false && <button onClick={() => start(true)} disabled={gpu === null} className="glow-mango min-h-12 rounded-full bg-mango px-7 font-semibold text-night disabled:opacity-50">{t('Start my free session', 'Empezar mi sesión gratis')}</button>}
              <button onClick={() => start(false)} className="min-h-12 rounded-full px-6 font-semibold ring-1 ring-white/15">{gpu === false ? t('Start (Lite mode)', 'Empezar (modo Lite)') : t('Quick Lite mode', 'Modo Lite rápido')}</button>
            </div>
            {gpu === false && <p className="mt-3 text-sm text-ink/60">{t('This browser can’t run the full AI coach yet (it needs WebGPU: recent Chrome, Edge or Safari). Lite mode works everywhere.', 'Este navegador aún no puede usar la coach completa (necesita WebGPU: Chrome, Edge o Safari recientes). El modo Lite funciona en todas partes.')}</p>}
          </div>
        </div>
      )}


      {phase === 'call' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
          <div className="relative overflow-hidden rounded-[2rem] bg-deep/95 p-6 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-xs text-ink/60"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-palm shadow-[0_0_8px_#7BC59A]" />{t('Live session with Mia', 'Sesión en vivo con Mia')} · {mode === 'ai' ? t('AI on your device', 'IA en tu dispositivo') : t('Lite mode', 'Modo Lite')}</span><span>{t('AI coach · not a counselor', 'Coach de IA · no es consejera')}</span></div>
            {mode === 'lite' && progress > 0 && <div className="mt-2" role="status"><p className="text-[11px] text-ink/60">{t('Getting Mia’s full AI ready in the background, keep talking meanwhile', 'Preparando la IA completa de Mia, puedes seguir hablando')} · {Math.round(progress * 100)}%</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-lagoon to-mango transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div></div>}
            <div className="relative mx-auto mt-4 aspect-square w-full max-w-[420px] overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-[#2A1520] to-night" style={{ boxShadow: listening ? '0 0 0 4px #D9B77E66, 0 0 50px #D9B77E55' : speaking ? '0 0 40px #E7A3AE44' : undefined }}>
              <div ref={stage} className={`absolute inset-0 ${face3d === 'on' ? '' : 'invisible'}`} aria-label={t('Mia, the AI coach (3D)', 'Mia, la coach de IA (3D)')} role="img" />
              {face3d !== 'on' && face3d !== 'loading' && <div ref={faceBox} className="absolute inset-0"><VideoAvatar speaking={speaking} listening={listening} mouth={mouthOf.current} canvasRef={faceCanvas} /></div>}
              <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-night/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink/80">{t('AI coach · not a therapist', 'Coach de IA · no es terapeuta')}</span>
              {format !== 'text' && <span className="absolute right-3 top-3 rounded-full bg-night/70 px-3 py-1 text-xs text-coral">● {format === 'video' ? t('Recording video to this device', 'Grabando video en este dispositivo') : t('Recording audio to this device', 'Grabando audio en este dispositivo')}</span>}
              {face3d === 'loading' && <p className="absolute inset-x-0 bottom-2 text-center text-[11px] text-ink/60">{t('Loading Mia’s 3D face…', 'Cargando el rostro 3D de Mia…')} {Math.round(faceP * 100)}%</p>}
            </div>
            {cam && <video ref={video} autoPlay muted playsInline className="absolute bottom-24 right-4 h-28 w-20 rounded-xl object-cover ring-2 ring-white/20 sm:h-36 sm:w-28" aria-label={t('Your camera (stays on your device)', 'Tu cámara (se queda en tu dispositivo)')} />}
            <p aria-live="polite" className="mt-4 line-clamp-4 min-h-[4.5rem] text-center text-lg leading-snug">{busy && !live ? <span className="text-ink/50">{t('Mia is thinking…', 'Mia está pensando…')}</span> : lastCoach}</p>
            {/counsel|therap|consejer|terapeut|988|911/i.test(lastCoach) && !live && <p className="mt-2 text-center"><a href={`${BASE}/counselors/`} className="inline-flex min-h-10 items-center rounded-full bg-white/[0.06] px-4 text-sm font-semibold text-mango ring-1 ring-white/10">{t('Find a licensed counselor →', 'Busca un consejero con licencia →')}</a></p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button onClick={toggleMic} aria-pressed={listening} className={`grid size-14 place-items-center rounded-full text-xl ${listening ? 'bg-mango text-night shadow-[0_0_24px_#E7A3AE]' : 'bg-white/10'}`} aria-label={listening ? t('Stop listening', 'Dejar de escuchar') : t('Talk', 'Hablar')}>🎙</button>
              <button onClick={toggleCam} aria-pressed={cam} className={`grid size-14 place-items-center rounded-full text-xl ${cam ? 'bg-lagoon/30' : 'bg-white/10'}`} aria-label={t('Show my camera', 'Mostrar mi cámara')}>📷</button>
              <button onClick={() => { setVoiceOn((v) => !v); speechSynthesis.cancel(); }} aria-pressed={voiceOn} className="grid size-14 place-items-center rounded-full bg-white/10 text-xl" aria-label={voiceOn ? t('Mute Mia', 'Silenciar a Mia') : t('Unmute Mia', 'Activar voz de Mia')}>{voiceOn ? '🔊' : '🔇'}</button>
              <button onClick={end} className="min-h-14 rounded-full bg-coral/25 px-6 font-semibold text-coral">{t('End', 'Terminar')}</button>
            </div>
          </div>
          <div className="glass flex flex-col p-5">
            <h2 className="font-semibold">{t('Conversation', 'Conversación')}</h2>
            <div className="mt-3 flex max-h-[420px] min-h-56 flex-col gap-2 overflow-y-auto pr-1">
              {msgs.map((m, i) => <p key={i} className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere] ${m.role === 'user' ? 'self-end bg-mango/15 ring-1 ring-mango/30' : 'self-start bg-lagoon/10 ring-1 ring-lagoon/30'}`}>{m.content}</p>)}
              {live && <p className="max-w-[88%] self-start whitespace-pre-line rounded-2xl bg-lagoon/10 px-3 py-2 text-sm ring-1 ring-lagoon/30">{live}</p>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mt-3 flex gap-2">
              <label htmlFor="coach-in" className="sr-only">{t('Message Mia', 'Mensaje para Mia')}</label>
              <input id="coach-in" value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? t('Listening…', 'Escuchando…') : t('Type or tap the mic…', 'Escribe o toca el micrófono…')} className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-night/60 px-4" />
              <button disabled={busy} className="glow-lagoon min-h-11 rounded-full bg-lagoon px-5 font-semibold text-night disabled:opacity-50">{t('Send', 'Enviar')}</button>
            </form>
            {assigned && <p role="status" className="mt-2 rounded-xl bg-mango/10 p-2 text-xs ring-1 ring-mango/30">📌 {t('Added to your assignments in My dashboard:', 'Agregada a tus tareas en Mi panel:')} {assigned}</p>}
            {err && <p role="status" className="mt-2 text-xs text-coral">{err}</p>}
            <p className="mt-3 text-[11px] text-ink/50">{t('Your transcript is saved on this device: find it in My dashboard → Overview. ', 'Tu transcripción se guarda en este dispositivo: está en Mi panel → Resumen. ')}{t('Mia is an AI and can make mistakes. Not therapy or medical advice. In danger? Call 911. Hotline: 1-800-799-7233 · Crisis: 988.', 'Mia es una IA y puede equivocarse. No es terapia ni consejo médico. ¿En peligro? Llama al 911. Línea: 1-800-799-7233 · Crisis: 988.')}</p>
            <p className="mt-2 text-xs"><a href={`${BASE}/counselors/`} className="text-mango underline">{t('Want a human expert too? Talk to a licensed counselor →', '¿Quieres también a una persona experta? Habla con un consejero con licencia →')}</a></p>
          </div>
        </div>
      )}
    </div>
  );
}
