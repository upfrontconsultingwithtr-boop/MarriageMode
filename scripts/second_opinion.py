#!/usr/bin/env python3
"""Ask Google Gemini (free tier; its project has billing OFF) for a second opinion.
Usage: python3 scripts/second_opinion.py "question"   (or pipe text on stdin)
Never send customer data: only plans, copy and code. The key is read live, never stored."""
import json, os, subprocess, sys, urllib.error, urllib.request
PROJ, KEY_ID = 'upfront-dashkit-test', 'ab13227a-70f4-473b-9d23-f0118ccd2f12'
MODELS = [os.environ['GEMINI_MODEL']] if os.environ.get('GEMINI_MODEL') else ['gemini-pro-latest', 'gemini-flash-latest']

def key():
    if os.environ.get('GEMINI_API_KEY'): return os.environ['GEMINI_API_KEY']
    env = {k: v for k, v in os.environ.items() if k != 'CLOUDSDK_AUTH_ACCESS_TOKEN'}
    tok = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True, env=env).stdout.strip().splitlines()[-1]
    req = urllib.request.Request(f'https://apikeys.googleapis.com/v2/projects/{PROJ}/locations/global/keys/{KEY_ID}/keyString',
                                 headers={'Authorization': f'Bearer {tok}', 'x-goog-user-project': PROJ})
    return json.load(urllib.request.urlopen(req))['keyString']

q = ' '.join(sys.argv[1:]) or sys.stdin.read()
sys_txt = ('You are a senior product, UX, privacy and relationship-psychology advisor reviewing work on "Marriage Mode" '
           'by Upfront Consulting with Tiff & Reco LLC: a free, self-led, consent-based couples app (no surveillance). '
           'Be concise: list the top risks and the best improvements, most important first.')
body = {'systemInstruction': {'parts': [{'text': sys_txt}]}, 'contents': [{'role': 'user', 'parts': [{'text': q}]}]}
k = key()
for m in MODELS:
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent',
                                 data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': k})
    try: d = json.load(urllib.request.urlopen(req, timeout=180)); break
    except urllib.error.HTTPError as e: print(f'[{m}: {e.code} {e.read()[:200]!r}]', file=sys.stderr)
else: sys.exit('Gemini unavailable right now (free-tier limit?)')
print(f'[{m}]', ''.join(p.get('text', '') for p in d['candidates'][0]['content']['parts']))
