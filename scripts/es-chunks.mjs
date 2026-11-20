// Lists every fixed Spanish line Mia says (openings + Lite replies), split into the same pieces the player uses.
// Run: node --experimental-strip-types scripts/es-chunks.mjs > chunks-es.json  (then scripts/prerender-voice-es.py)
import { TOPICS, coachReply } from '../app/src/lib/coachKnowledge.ts';
import { OPENING, OPENING_REVIEW } from '../app/src/lib/coachLines.ts';
import { speechChunks, chunkKey } from '../app/src/lib/speechChunks.ts';
const texts = [OPENING.es, OPENING_REVIEW.es, coachReply('siento que las cosas han estado muy difíciles entre nosotros últimamente', true), coachReply('social media phones boundaries trust', true), ...TOPICS.map((t) => coachReply(t.keys[0], true))].filter(Boolean);
const chunks = [...new Set(texts.flatMap((t) => speechChunks(t)))];
console.log(JSON.stringify(chunks.map((c) => ({ k: chunkKey(c), t: c }))));
