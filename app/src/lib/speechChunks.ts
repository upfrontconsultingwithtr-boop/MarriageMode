// Splits what Mia says into sentence-sized pieces and names each piece, so pre-recorded
// natural-voice clips (public/coach/voice/<lang>-<key>.mp3) can be found for fixed lines.
export function speechChunks(text: string): string[] {
  return text.split(/\n+/).flatMap((p) => p.split(/(?<=[.!?:])\s+(?=\S)/)).map((x) => x.trim()).filter((x) => /[\p{L}\p{N}]/u.test(x));
}
export function chunkKey(text: string): string {
  let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
