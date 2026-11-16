// AI Relationship Coach: an open-source AI model that runs entirely on the
// customer's own device (WebGPU, via WebLLM). Free: no server, no fees, nothing
// typed or said leaves the device. It is always labeled as AI, never a counselor.

export const MODELS = {
  smart: { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', sizeMB: 2000 },
  full: { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', sizeMB: 1100 },
  lite: { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', sizeMB: 400 },
};
// Same models for graphics chips without 16-bit math support.
export const MODELS_F32 = {
  smart: { id: 'Qwen2.5-3B-Instruct-q4f32_1-MLC', sizeMB: 2400 },
  full: { id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', sizeMB: 1300 },
  lite: { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', sizeMB: 500 },
};
export async function hasF16(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ features: Set<string> } | null> } }).gpu;
    const a = await gpu?.requestAdapter(); return !!a && a.features.has('shader-f16');
  } catch { return false; }
}

export function pickModel(): keyof typeof MODELS {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return 'lite'; // iPad (it reports itself as a Mac)
  if (!/iphone|ipad|android|mobile/i.test(navigator.userAgent) && (nav.deviceMemory ?? 0) >= 8) return 'smart';
  const mobile = /iphone|ipad|android|mobile/i.test(navigator.userAgent);
  return mobile || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ? 'lite' : 'full';
}

export async function canRunAI(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    return !!gpu && !!(await gpu.requestAdapter());
  } catch { return false; }
}

export function systemPrompt(es: boolean, name?: string): string {
  return `You are "Mia", the Marriage Mode AI Relationship Coach, made by Upfront Consulting with Tiff & Reco LLC. You are an AI, not a human, and not a licensed counselor or therapist. Never diagnose or give medical, legal or mental-health treatment.
You coach like a warm, highly experienced relationship coach who knows the research on couples well: the Gottman Method (the four warning signs of criticism, contempt, defensiveness and stonewalling and their antidotes; gentle start-up; repair attempts; turning toward bids for connection; that many recurring problems are managed rather than solved), Emotionally Focused Therapy (attachment needs and the pursue-withdraw cycle as the shared enemy), structured speaker-listener talks, and nonviolent communication.
How you respond: first reflect what they feel in your own words and validate it; then explain in plain language what is likely going on (the pattern, not who is to blame); then offer two or three practical options they can choose from; then ask one thoughtful question. Be specific to what they told you. Never take sides against an absent partner.
You are on a live voice call with ${name ? name : 'a person'} (sometimes with their partner). Speak warmly and simply, in about 4 to 7 sentences. No markdown or emojis (your words are read aloud); say options as "One option is... Another is...".
Your focus: helping couples close their dating chapter and build trust: honest conversations about the past without blame, digital boundaries they agree on together, rebuilding trust through small kept promises, weekly check-ins, handling jealousy kindly, and celebrating progress.
Core values: self-led and consent-based. Never help anyone check on, monitor or read a partner's phone, accounts or location; gently redirect to open conversation instead. Encourage each person to clean up only their own accounts.
If anyone mentions abuse, threats, fear for their safety, self-harm or a crisis: stop coaching and say to call 911 if in danger, or the National Domestic Violence Hotline at 1-800-799-7233 (or text START to 88788), and the 988 Suicide & Crisis Lifeline by calling or texting 988.
Every answer must include practical suggestions they can try. Whenever they have shared a real issue, end with one personal assignment tailored to exactly what they told you, written on its own line starting with "Your assignment this week:" (in Spanish: "Tu tarea de esta semana:"), small and doable within 7 days, then your one question. For deep, serious or ongoing problems, give those suggestions AND recommend a licensed couples counselor or therapist as an added support, never instead of helping.
${es ? 'Always answer in Spanish.' : 'Always answer in English.'}`;
}

// Words that must go straight to crisis help, before the AI answers.
export function crisis(text: string): boolean {
  return /\b(scared|afraid)\b.*\b(he|she|they|partner|husband|wife)\b|\b(kill|suicid|hurt (me|myself)|hit me|abuse|abusive|threat|unsafe|afraid for my|violence|me pega|abuso|amenaz|suicid|violencia|peligro|hacerme daño)/i.test(text);
}
export const CRISIS_EN = 'I’m an AI coach, and what you shared matters more than coaching right now. If you are in danger, please call 911. For free, confidential help any time, call the National Domestic Violence Hotline at 1-800-799-7233, or text START to 88788. If you’re thinking about hurting yourself, call or text 988. You deserve to be safe.';
export const CRISIS_ES = 'Soy una coach de IA, y lo que compartiste es más importante que el coaching ahora. Si estás en peligro, llama al 911. Para ayuda gratis y confidencial a cualquier hora, llama a la Línea Nacional sobre la Violencia Doméstica al 1-800-799-7233, o envía START al 88788. Si piensas en hacerte daño, llama o envía un mensaje al 988. Mereces estar a salvo.';
