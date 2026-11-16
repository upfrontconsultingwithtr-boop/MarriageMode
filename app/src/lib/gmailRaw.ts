// Pure: builds a plain-text email for Gmail's send API (base64url, UTF-8 safe).
export type Mail = { to: string; subject: string; body: string };

const b64url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hdr = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(s)))}?=`);
export const rawMessage = (m: Mail) => b64url([`To: ${m.to}`, `Subject: ${hdr(m.subject)}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', m.body].join('\r\n'));

