'use client';
// "Two orbits, one ring": the hero's living background. Two particle rings (the two partners) drift
// toward each other and interlock; loose "feed noise" particles are swept away as you scroll.
// Canvas 2D, no libraries, pauses off-screen, static frame for reduced-motion users.
import { useEffect, useRef } from 'react';

export default function Orbits() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const g = c.getContext('2d')!; let w = 0, h = 0, dpr = 1, raf = 0, vis = true;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
    const N = 140; const ringA = Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2, r: 1 + (Math.random() - 0.5) * 0.06, s: 0.6 + Math.random() * 1.2 }));
    const ringB = ringA.map((p) => ({ ...p, a: p.a + 0.02, s: 0.6 + Math.random() * 1.2 }));
    const noise = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006, s: 0.5 + Math.random() * 1.4 }));
    let mx = 0.5, my = 0.5, scroll = 0;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; };
    const onScroll = () => { scroll = Math.min(1, scrollY / (h * 0.9)); };
    const draw = (time: number) => {
      const t = reduce ? 0 : time / 1000; g.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * (w < 700 ? 0.3 : 0.24); const cx = w * (w < 1024 ? 0.5 : 0.72) + (mx - 0.5) * 30; const cy = h * (w < 1024 ? 0.8 : 0.48) + (my - 0.5) * 20;
      const join = reduce ? 0.62 : 0.5 + 0.12 * Math.sin(t * 0.35) + scroll * 0.25; const off = R * (1 - join) * 1.1;
      const ring = (pts: typeof ringA, ox: number, tilt: number, hue: string, dir: number) => {
        for (const p of pts) {
          const a = p.a + t * 0.18 * dir; const x = cx + ox + Math.cos(a) * R * p.r; const y = cy + Math.sin(a) * R * p.r * tilt;
          const depth = (Math.sin(a) + 1) / 2; g.globalAlpha = 0.25 + depth * 0.65; g.fillStyle = hue;
          g.beginPath(); g.arc(x, y, p.s * (0.7 + depth * 0.8), 0, Math.PI * 2); g.fill();
        }
      };
      g.globalCompositeOperation = 'lighter';
      ring(ringA, -off, 0.42, '#E8A4A9', 1); ring(ringB, off, 0.42, '#D9B77E', -1);
      // glow where the rings meet
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9); grd.addColorStop(0, `rgba(232,164,169,${0.10 + join * 0.12})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 1; g.fillStyle = grd; g.fillRect(cx - R, cy - R, R * 2, R * 2);
      // feed noise: drifts, then gets swept out to the edges as you scroll
      for (const n of noise) {
        if (!reduce) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > 1) n.vx *= -1; if (n.y < 0 || n.y > 1) n.vy *= -1; }
        const px = n.x * w + (n.x - 0.5) * w * scroll * 1.4; const py = n.y * h + (n.y - 0.5) * h * scroll * 1.4;
        g.globalAlpha = 0.35 * (1 - scroll); g.fillStyle = '#B58BB0'; g.beginPath(); g.arc(px, py, n.s, 0, Math.PI * 2); g.fill();
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      if (!reduce && vis) raf = requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size); addEventListener('pointermove', onMove); addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; cancelAnimationFrame(raf); if (vis) raf = requestAnimationFrame(draw); }); io.observe(c);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', size); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />;
}
