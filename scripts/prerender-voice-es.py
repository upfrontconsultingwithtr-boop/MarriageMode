# Records Mia's fixed Spanish lines with the free Piper voice es_MX "claude" (Apache-2.0 data), soft and unhurried.
# Usage: python3 scripts/prerender-voice-es.py chunks-es.json <path to es_MX-claude-high.onnx>
import json, subprocess, sys, os
chunks = json.load(open(sys.argv[1])); model = sys.argv[2]; out = 'app/public/coach/voice'
for i, c in enumerate(chunks):
    mp3 = f"{out}/es-{c['k']}.mp3"
    if os.path.exists(mp3): continue
    subprocess.run([sys.executable, '-m', 'piper', '-m', model, '--length-scale', '1.12', '-f', '/tmp/es-tmp.wav'], input=c['t'].encode(), check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', '/tmp/es-tmp.wav', '-ac', '1', '-b:a', '48k', mp3], check=True)
    if i % 25 == 0: print(i, '/', len(chunks), flush=True)
m = json.load(open(f'{out}/manifest.json')); m['es'] = [c['k'] for c in chunks]; m['voice_es'] = 'piper es_MX-claude-high @1.12'
json.dump(m, open(f'{out}/manifest.json', 'w')); print('done', len(chunks))
