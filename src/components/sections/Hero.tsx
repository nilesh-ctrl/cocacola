'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Reveal } from '@/components/ui/Reveal';

const CanCarousel = dynamic(
  () => import('@/components/3d/CanCarousel').then((m) => m.CanCarousel),
  { ssr: false }
);

function TopNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-6 md:px-12">
      <div className="pointer-events-auto flex items-center gap-3">
        <span className="font-display text-2xl font-black italic tracking-tight text-cc-red">
          Coca‑Cola
        </span>
      </div>
      <nav className="pointer-events-auto hidden items-center gap-10 md:flex">
        <a href="#flavors" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Collection
        </a>
        <a href="#refresh" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Experience
        </a>
        <a href="#legacy" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          History
        </a>
        <a href="#shop" data-hover className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Shop
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </nav>
      <button data-hover className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-white hover:bg-white/5">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="group relative h-screen w-full overflow-hidden bg-black"
    >
      {/* ============== UPLOADED HERO BACKGROUND ============== */}
      <div className="pointer-events-none absolute inset-0">
        {/* User-uploaded hero background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpeg')" }}
        />
        {/* Subtle film grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* ============== CAN CAROUSEL — RIGHT SIDE ============== */}
      <div className="absolute inset-0 z-10">
        <div className="absolute right-0 top-1/2 hidden h-[100vh] w-[62vw] -translate-y-1/2 md:block">
          <Suspense fallback={null}>
            <CanCarousel />
          </Suspense>
        </div>
        <div className="absolute inset-0 md:hidden">
          <Suspense fallback={null}>
            <CanCarousel />
          </Suspense>
        </div>
      </div>

      {/* Left-side readability scrim (very subtle, doesn't block bg) */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.20)_35%,transparent_60%)]" />

      {/* ============== TOP NAV ============== */}
      <TopNav />

      {/* ============== TEXT CONTENT — LEFT SIDE ============== */}
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
