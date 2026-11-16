import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rawMessage } from './gmailRaw.ts';

const b64urlDecode = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
test('gmail message: plain text, UTF-8 subject encoded, body intact', () => {
  const raw = rawMessage({ to: 'privacy@x.com', subject: 'Solicitud de eliminación', body: 'Hola ñ\nLine 2' });
  assert.doesNotMatch(raw, /[+/=]/);
  const txt = b64urlDecode(raw);
  assert.match(txt, /^To: privacy@x\.com\r\nSubject: =\?UTF-8\?B\?/);
  assert.match(txt, /\r\n\r\nHola ñ\nLine 2$/);
});
