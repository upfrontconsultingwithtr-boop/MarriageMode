'use client';
// Dashboard language (English / Spanish). Chosen in Settings or the header,
// saved with the other prefs on the device (and the account when signed in).
import { createContext, useContext } from 'react';
export type Lang = 'en' | 'es';
export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });
export function useLang() { return useContext(LangCtx); }
export function useT() { const { lang } = useContext(LangCtx); return (en: string, es: string) => (lang === 'es' ? es : en); }
export const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-ES' };
