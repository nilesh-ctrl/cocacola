'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button, MagneticArrow } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const IconicBottle = dynamic(
  () => import('@/components/3d/IconicBottle').then((m) => m.IconicBottle),
  { ssr: false }
);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      // Tighter range so the bottle never feels jumpy
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
      className="relative h-screen w-full overflow-hidden bg-[#050505]"
    >
      {/* ============== BACKGROUND LAYERS ============== */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0000] via-[#050505] to-black" />
        {/* Soft red ambient glow - top center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,_rgba(230,26,39,0.18),_transparent_60%)]" />
        {/* Subtle red glow from below bottle (floor bounce) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_20%_at_65%_85%,_rgba(230,26,39,0.25),_transparent_60%)]" />
        {/* Faint grid for depth */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '90px 90px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)',
          }}
        />
      </div>

      {/* ============== 3D BOTTLE — RIGHT SIDE ============== */}
      <div className="absolute inset-0 z-10">
        {/* On mobile: bottle behind text, on desktop: positioned to the right */}
        <div className="absolute right-0 top-1/2 hidden h-[80vh] w-[55vw] -translate-y-1/2 md:block">
          <Suspense fallback={null}>
            <IconicBottle pointer={pointer} />
          </Suspense>
        </div>
        {/* Mobile fallback - bottle behind centered */}
        <div className="absolute inset-0 md:hidden">
          <Suspense fallback={null}>
            <IconicBottle pointer={pointer} />
          </Suspense>
        </div>
      </div>

      {/* ============== VIGNETTE ============== */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_25%_50%,_black_0%,_transparent_40%,_black_90%)]" />

      {/* ============== TEXT CONTENT — LEFT SIDE ============== */}
      <div className="relative z-30 flex h-full items-center">
        <div className="w-full max-w-2xl px-8 md:px-16 lg:px-20">
          <Reveal>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-cc-red" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
                EST · 1886 · ATLANTA
              </span>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="font-display text-[clamp(3.5rem,9.5vw,9rem)] font-black leading-[0.85] tracking-tight">
              <span className="block text-white">Taste</span>
              <span className="block italic text-cc-red">The</span>
              <span className="block bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
                Feeling
              </span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
              Experience the world&apos;s most iconic refreshment through a
              next‑generation digital journey. A hyper‑realistic tribute to
              Coca‑Cola&apos;s timeless craft.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button variant="primary" icon={<MagneticArrow />}>
                Explore Collection
              </Button>
              <Button
                variant="ghost"
                icon={
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-white/30 text-[10px]">
                    ▶
                  </span>
                }
              >
                Watch Experience
              </Button>
            </div>
          </Reveal>

          <Reveal delay={800}>
            <div className="mt-16 flex items-center gap-10">
              {[
                { n: '138', l: 'YEARS' },
                { n: '200+', l: 'COUNTRIES' },
                { n: '1.9B', l: 'DAILY' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl font-bold text-white md:text-3xl">
                    {s.n}
                  </div>
                  <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-white/40">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ============== SCROLL CUE ============== */}
      <div className="absolute bottom-8 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[9px] tracking-[0.4em] text-white/40">
          SCROLL
        </span>
        <div className="relative h-12 w-px overflow-hidden bg-white/10">
          <div className="absolute left-0 top-0 h-1/2 w-full animate-[scrollLine_2s_ease-in-out_infinite] bg-cc-red" />
        </div>
      </div>
    </section>
  );
}
