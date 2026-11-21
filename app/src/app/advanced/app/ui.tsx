'use client';
// Shared building blocks for Marriage Mode Advanced: one button style, one card style, one spacing scale.
import { createContext, useContext } from 'react';
import type { AdvState } from '@/lib/adv/store';

export type Tab = 'start' | 'learn' | 'sweep' | 'review' | 'accounts' | 'solo' | 'proof' | 'mia' | 'settings';
export interface Ctx { s: AdvState; set: (f: (s: AdvState) => AdvState) => void; es: boolean; t: (en: string, es: string) => string; go: (t: Tab) => void }
export const AdvCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAdv = () => useContext(AdvCtx);

export function Card({ children, className = '', tone }: { children: React.ReactNode; className?: string; tone?: 'rose' | 'gold' | 'warn' | 'ok' }) {
  const ring = tone === 'rose' ? 'ring-mango/40 bg-mango/[0.06]' : tone === 'gold' ? 'ring-lagoon/40 bg-lagoon/[0.05]' : tone === 'warn' ? 'ring-amber-300/40 bg-amber-300/[0.06]' : tone === 'ok' ? 'ring-palm/40 bg-palm/[0.06]' : 'ring-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgb(255_255_255/.08)]';
  return <section className={`rounded-3xl p-5 ring-1 backdrop-blur-xl sm:p-6 ${ring} ${className}`}>{children}</section>;
}
export function Btn({ children, onClick, kind = 'primary', disabled, className = '', type = 'button', href, ...rest }: { children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'quiet' | 'danger'; disabled?: boolean; className?: string; type?: 'button' | 'submit'; href?: string } & Record<string, unknown>) {
  const k = kind === 'primary' ? 'bg-mango text-night font-semibold shadow-[0_10px_40px_-10px_rgb(232_164_169/.7)] hover:brightness-110' : kind === 'danger' ? 'bg-coral text-night font-semibold' : kind === 'ghost' ? 'ring-1 ring-white/20 text-ink hover:bg-white/5' : 'text-ink/70 hover:text-ink underline underline-offset-4';
  const cls = `btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] transition disabled:cursor-not-allowed disabled:opacity-40 ${k} ${className}`;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>{children}</button>;
}
export function H({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return <header className="mb-5"><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{children}</h1>{sub && <p className="mt-2 max-w-2xl text-ink/70">{sub}</p>}</header>;
}
export function Pill({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'rose' | 'gold' | 'ok' | 'dark' }) {
  const c = tone === 'rose' ? 'bg-mango/15 text-mango' : tone === 'gold' ? 'bg-lagoon/15 text-lagoon' : tone === 'ok' ? 'bg-palm/15 text-palm' : tone === 'dark' ? 'bg-[#4a1630] text-white' : 'bg-white/8 text-ink/80';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}
export function Check({ checked, onChange, children, id }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; id?: string }) {
  return <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl px-1 py-2"><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#E8A4A9]" /><span>{children}</span></label>;
}
export const fmtDate = (iso?: string, es = false) => (iso ? new Date(iso).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
export function HumanLink() {
  const { s, t } = useAdv();
  if (!s.intake || s.intake.support === 'ai') return null;
  return <a href="https://upfrontconsultingwithtr-boop.github.io/MarriageMode/counselors/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lagoon/10 px-4 text-sm text-lagoon ring-1 ring-lagoon/30 hover:bg-lagoon/15">🤝 {t('Talk to a real counselor', 'Hablar con un consejero real')}</a>;
}
