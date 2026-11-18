// Pre-records every fixed line Mia says (openings + Lite-mode replies) in her chosen soft voice
// (Kokoro af_heart, speed 0.88 = "voice 11"), free and offline. Output: app/public/coach/voice/en-<key>.mp3
// + manifest.json. Run: KOKORO_DIR=<dir with node_modules/kokoro-js> node --experimental-strip-types scripts/prerender-voice.mjs
import { createRequire } from 'node:module'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
import { TOPICS, coachReply } from '../app/src/lib/coachKnowledge.ts';
import { OPENING, OPENING_REVIEW } from '../app/src/lib/coachLines.ts';
import { speechChunks, chunkKey } from '../app/src/lib/speechChunks.ts';
const req = createRequire(process.env.KOKORO_DIR + '/package.json'); const { KokoroTTS } = await import(req.resolve('kokoro-js'));
const out = 'app/public/coach/voice'; fs.mkdirSync(out, { recursive: true });
const texts = [OPENING.en, OPENING_REVIEW.en, coachReply('I feel like things have been really hard between us lately', false), coachReply('social media phones boundaries trust', false), ...TOPICS.map((t) => coachReply(t.keys[0], false))].filter(Boolean);
const chunks = [...new Set(texts.flatMap((t) => speechChunks(t)))];
console.log('chunks', chunks.length);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const manifest = {};
for (const [i, c] of chunks.entries()) {
  const k = chunkKey(c); const mp3 = `${out}/en-${k}.mp3`; manifest[k] = 1;
  if (fs.existsSync(mp3)) continue;
  const a = await tts.generate(c, { voice: 'af_heart', speed: 0.88 }); const wav = `${out}/tmp.wav`; await a.save(wav);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '48k', mp3]); fs.unlinkSync(wav);
  if (i % 20 === 0) console.log(i, '/', chunks.length);
}
fs.writeFileSync(`${out}/manifest.json`, JSON.stringify({ voice: 'af_heart@0.88', en: Object.keys(manifest) }));
console.log('done', Object.keys(manifest).length);
