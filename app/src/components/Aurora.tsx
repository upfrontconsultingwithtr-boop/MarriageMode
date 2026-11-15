'use client';
import { useEffect, useRef } from 'react';

// Slow-moving aurora of green, pink and violet light. Canvas, ~1 KB, pauses
// when off-screen and stays still for people who prefer reduced motion.
export default function Aurora({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext('2d')!;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
    const light = document.documentElement.dataset.theme === 'light';
    const blobs = [
      { c: '217,183,126', x: .25, y: .35, r: .55, sx: .00011, sy: .00008 },
      { c: '232,164,169', x: .75, y: .30, r: .5, sx: -.00009, sy: .00012 },
      { c: '181,139,176', x: .55, y: .75, r: .45, sx: .00007, sy: -.0001 },
      { c: '217,183,126', x: .9, y: .85, r: .35, sx: -.00012, sy: -.00006 },
    ];
    let raf = 0, t0 = performance.now(), visible = true;
    // Tiny canvas, scaled up by the browser: naturally soft, far cheaper than a blur filter.
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = Math.max(1, Math.round(r.width / 8)); cv.height = Math.max(1, Math.round(r.height / 8)); };
    let last = 0, started = false;
    const draw = (t: number) => {
      if (!still && t - last < 66) { raf = requestAnimationFrame(draw); return; } // ~15 fps is plenty for slow light
      last = t;
      const w = cv.width, h = cv.height, dt = still ? 0 : t - t0;
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = light ? 'multiply' : 'lighter';
      for (const b of blobs) {
        const x = (b.x + Math.sin(dt * b.sx * 6) * .12) * w, y = (b.y + Math.cos(dt * b.sy * 6) * .12) * h, r = b.r * Math.max(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.c},${light ? .22 : .32})`); g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      if (!still && visible && started) raf = requestAnimationFrame(draw);
    };
    size(); draw(t0);
    const start = () => { if (started || still) return; started = true; raf = requestAnimationFrame(draw); };
    const idle = setTimeout(start, 1500);
    const ro = new ResizeObserver(() => { size(); if (still) draw(t0); }); ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !still && started) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } }); io.observe(cv);
    return () => { clearTimeout(idle); cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none ${className}`} style={{ imageRendering: 'auto' }} />;
}
