'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Reveal } from '@/components/ui/Reveal';

const GlobeScene = dynamic(
  () => import('@/components/3d/GlobeScene').then((m) => m.GlobeScene),
  { ssr: false }
);

const STATS = [
  { value: '200+', label: 'Countries Served' },
  { value: '1.9B', label: 'Daily Servings' },
  { value: '30M+', label: 'Retail Outlets' },
  { value: '700K', label: 'System Employees' },
];

export function Impact() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = [200, 1.9, 30, 700];
    const suffixes = ['+', 'B', 'M+', 'K'];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            targets.forEach((t, i) => {
              const obj = { v: 0 };
              const start = performance.now();
              const dur = 2000;
              function step(now: number) {
                const p = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - p, 3);
                setCounts((prev) => {
                  const next = [...prev];
                  next[i] = parseFloat((t * eased).toFixed(t < 10 ? 1 : 0));
                  return next;
                });
                if (p < 1) requestAnimationFrame(step);
              }
              requestAnimationFrame(step);
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="impact"
      className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-cc-ink to-cc-black py-32 md:py-48"
    >
      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cc-ink via-black to-cc-redDeep/30">
              <GlobeScene />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cc-red" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
                  Global · real‑time
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4">
                <span className="font-mono text-[9px] tracking-[0.3em] text-white/30">
                  LAT 40.7128° N · LON 74.0060° W
                </span>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cc-red" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
                  Global Impact
                </span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
                In every <em className="italic text-cc-red">corner</em>
                <br />
                of the world.
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-white/60 md:text-lg">
                From Tokyo to São Paulo, Nairobi to Reykjavík — Coca‑Cola&apos;s
                distribution network reaches more corners of the earth than
                almost any consumer brand in history.
              </p>
            </Reveal>
            <Reveal delay={450}>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-cc-red/40"
                  >
                    <div className="font-display text-3xl font-black text-white md:text-4xl">
                      {i === 1
                        ? counts[i].toFixed(1) + 'B'
                        : i === 2
                        ? Math.round(counts[i]) + 'M+'
                        : i === 3
                        ? Math.round(counts[i]) + 'K'
                        : Math.round(counts[i]) + '+'}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/50">
                      {s.label}
                    </div>
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-cc-red/10 blur-2xl transition-all duration-500 group-hover:bg-cc-red/30" />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
