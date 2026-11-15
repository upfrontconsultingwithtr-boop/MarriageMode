'use client';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/track';

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// "Add to Home Screen": works offline after the first visit. No app store needed.
export default function InstallApp() {
  const t = useT();
  const [evt, setEvt] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', () => { setInstalled(true); track('app-installed'); });
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (installed) return <p className="text-sm text-ink/65">✓ {t('Marriage Mode is on your home screen.', 'Marriage Mode está en tu pantalla de inicio.')}</p>;
  return (
    <div>
      <p className="text-sm text-ink/65">{t('Open it like an app, full screen, even with a weak connection. Free, no app store.', 'Ábrelo como una app, en pantalla completa, incluso con poca señal. Gratis, sin tienda de apps.')}</p>
      {evt ? (
        <button onClick={async () => { await evt.prompt(); const r = await evt.userChoice; if (r.outcome === 'accepted') setInstalled(true); setEvt(null); }} className="glow-mango mt-3 min-h-11 rounded-full bg-mango px-5 font-semibold text-night">{t('Add to my home screen', 'Agregar a mi pantalla de inicio')}</button>
      ) : (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink/75">
          {ios ? <>
            <li>{t('Tap the Share button (the square with an arrow) in Safari.', 'Toca el botón Compartir (el cuadro con una flecha) en Safari.')}</li>
            <li>{t('Tap “Add to Home Screen”, then “Add”.', 'Toca “Agregar a inicio” y luego “Agregar”.')}</li>
          </> : <>
            <li>{t('Open your browser menu (⋮ or ⋯).', 'Abre el menú del navegador (⋮ o ⋯).')}</li>
            <li>{t('Tap “Install app” or “Add to Home screen”.', 'Toca “Instalar app” o “Agregar a pantalla de inicio”.')}</li>
          </>}
        </ol>
      )}
    </div>
  );
}
