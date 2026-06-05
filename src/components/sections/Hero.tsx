'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/ui/Reveal';

const HeroCan = dynamic(
  () => import('@/components/3d/HeroCan').then((m) => m.HeroCan),
  { ssr: false }
);
const TopNav = dynamic(
  () => import('@/components/3d/HeroCan').then((m) => m.TopNav),
  { ssr: false }
);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setPointer({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,_rgba(230,26,39,0.18),_transparent_60%)]" />
      </div>

      {/* 3D Can Scene - right side, large and prominent */}
      <div className="absolute inset-0 z-10">
        <div className="absolute right-0 top-1/2 hidden h-[100vh] w-[65vw] -translate-y-1/2 md:block">
          <Suspense fallback={null}>
            <HeroCan pointer={pointer} />
          </Suspense>
        </div>
        <div className="absolute inset-0 md:hidden">
          <Suspense fallback={null}>
            <HeroCan pointer={pointer} />
          </Suspense>
        </div>
      </div>

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_25%_50%,_rgba(0,0,0,0.4)_0%,_transparent_50%,_rgba(0,0,0,0.7)_95%)]" />

      {/* Top nav overlay (always visible) */}
      <Suspense fallback={null}>
        <TopNav />
      </Suspense>

      {/* Text content - left side */}
      <div className="relative z-30 flex h-full items-center">
        <div className="w-full max-w-2xl px-8 md:px-16 lg:px-20">
          <Reveal>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-cc-red" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/70">
                EST · 1886 · ATLANTA
              </span>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.85] tracking-tight">
              <span className="block text-cc-red">Taste</span>
              <span className="block italic text-cc-red">The</span>
              <span className="block bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
                Feeling
              </span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-8 max-w-md text-base leading-relaxed text-white/65 md:text-lg">
              Experience the world&apos;s most iconic refreshment through a
              next-generation digital journey. A hyper-realistic tribute to
              Coca-Cola&apos;s timeless craft.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {/* Filled red CTA */}
              <button
                data-hover
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-cc-red px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_-15px_rgba(230,26,39,0.7)] transition-all duration-500 hover:scale-[1.02] hover:bg-cc-redDark"
              >
                <span className="relative z-10">Explore Collection</span>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10 transition-transform duration-500 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              {/* Outlined CTA */}
              <button
                data-hover
                className="group inline-flex items-center gap-3 rounded-full border border-white/25 bg-transparent px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all duration-500 hover:border-white hover:bg-white/5"
              >
                <span>Watch Experience</span>
                <span className="grid h-5 w-5 place-items-center rounded-full border border-white/40 text-[9px]">
                  ▶
                </span>
              </button>
            </div>
          </Reveal>

          <Reveal delay={800}>
            <div className="mt-16 flex items-center gap-10">
              {[
                { n: '138', l: 'Years' },
                { n: '200+', l: 'Countries' },
                { n: '1.9B', l: 'Daily Served' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl font-bold text-white md:text-3xl">
                    {s.n}
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/45">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[9px] tracking-[0.4em] text-white/40">
          SCROLL
        </span>
        <div className="relative h-10 w-px overflow-hidden bg-white/10">
          <div className="absolute left-0 top-0 h-1/2 w-full animate-[scrollLine_2s_ease-in-out_infinite] bg-cc-red" />
        </div>
      </div>
    </section>
  );
}
