'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/Reveal';

const CanScene = dynamic(() => import('@/components/3d/CanScene').then((m) => m.CanScene), {
  ssr: false,
});

const PRODUCTS = [
  {
    name: 'Coca‑Cola',
    flavor: 'The Original',
    description:
      'The unmistakable classic — bold, crisp, and timelessly refreshing. The taste that started it all.',
    accent: 'from-[#e61a27] to-[#7a0000]',
    details: ['Caffeine · 34mg', 'Sugar · 39g', 'Calories · 140'],
  },
  {
    name: 'Zero Sugar',
    flavor: 'Bold Without the Sugar',
    description:
      'All the taste, none of the sugar. Coca‑Cola Zero Sugar — designed for those who never compromise.',
    accent: 'from-[#1a1a1a] to-[#3a3a3a]',
    details: ['Caffeine · 34mg', 'Sugar · 0g', 'Calories · 0'],
  },
  {
    name: 'Diet Coke',
    flavor: 'Light & Crisp',
    description:
      'A lighter, cleaner taste with a distinctive bite. The silver icon of effortless refreshment.',
    accent: 'from-[#c0c0c8] to-[#5a5a60]',
    details: ['Caffeine · 46mg', 'Sugar · 0g', 'Calories · 0'],
  },
  {
    name: 'Cherry Coke',
    flavor: 'Bold Cherry Twist',
    description:
      'The marriage of two legends — Coca‑Cola&apos;s iconic taste meets the bold sweetness of cherry.',
    accent: 'from-[#a0001a] to-[#3a0008]',
    details: ['Caffeine · 34mg', 'Sugar · 42g', 'Calories · 150'],
  },
];

export function Products() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="products"
      className="relative overflow-hidden border-t border-white/5 bg-cc-black py-32 md:py-48"
    >
      {/* background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-cc-red/20 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-cc-redDark/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-end gap-8 md:grid-cols-2">
          <div>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cc-red" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
                  The Collection
                </span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
                Pick your <em className="italic text-cc-red">spark</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={300}>
            <p className="max-w-md text-base leading-relaxed text-white/60 md:text-lg md:justify-self-end">
              Four iconic expressions, one unforgettable feeling. Each crafted
              with the same obsessive attention that defined the original in
              1886.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-10 md:grid-cols-2">
          {/* 3D can display */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cc-ink to-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <CanScene flavorIndex={active} />
              </motion.div>
            </AnimatePresence>
            {/* overlay label */}
            <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cc-red" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
                Live · 3D
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-6 right-6 z-10 text-right">
              <div className="font-mono text-[9px] tracking-[0.3em] text-white/30">
                {String(active + 1).padStart(2, '0')} / 04
              </div>
            </div>
          </div>

          {/* Selector + details */}
          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.name}
                  data-hover
                  onClick={() => setActive(i)}
                  className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-500 ${
                    active === i
                      ? 'border-cc-red bg-cc-red/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`mb-3 h-1 w-8 rounded-full bg-gradient-to-r ${p.accent} transition-all duration-500 ${
                      active === i ? 'w-12' : ''
                    }`}
                  />
                  <div className="font-display text-base font-bold text-white">
                    {p.name}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/50">
                    {p.flavor}
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-10"
              >
                <h3 className="font-display text-4xl font-black text-white md:text-5xl">
                  {PRODUCTS[active].name}
                </h3>
                <p
                  className="mt-4 text-base leading-relaxed text-white/65"
                  dangerouslySetInnerHTML={{ __html: PRODUCTS[active].description }}
                />
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {PRODUCTS[active].details.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        {d.split('·')[0]}
                      </div>
                      <div className="mt-1 font-display text-xl font-bold text-white">
                        {d.split('·')[1].trim()}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  data-hover
                  className="group mt-10 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all duration-500 hover:bg-cc-red hover:text-white"
                >
                  Shop {PRODUCTS[active].name}
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-500 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
