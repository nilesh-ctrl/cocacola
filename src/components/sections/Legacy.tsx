'use client';

import { useEffect, useRef } from 'react';
import { Reveal } from '@/components/ui/Reveal';

const MILESTONES = [
  {
    year: '1886',
    title: 'The Original Recipe',
    text: 'Dr. John Pemberton brews the first glass of Coca‑Cola in a backyard pharmacy in Atlanta, Georgia.',
  },
  {
    year: '1892',
    title: 'The Coca‑Cola Company',
    text: 'Asa Griggs Candler purchases the rights and incorporates the most iconic beverage company in history.',
  },
  {
    year: '1915',
    title: 'The Contour Bottle',
    text: 'The Root Glass Company creates the now‑famous contour bottle — recognizable even in the dark by touch.',
  },
  {
    year: '1971',
    title: 'A Global Anthem',
    text: '"I&apos;d Like to Buy the World a Coke" turns a soft drink into a worldwide cultural moment.',
  },
  {
    year: '2025',
    title: 'A New Era',
    text: 'Sustainability, design, and digital craft converge — a new chapter of refreshment begins.',
  },
];

export function Legacy() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // simple line-draw on scroll
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('in');
            obs.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="legacy"
      className="reveal relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-cc-ink via-cc-black to-cc-ink py-32 md:py-48"
    >
      {/* bg ornaments */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-px bg-cc-red shadow-[0_0_400px_200px_rgba(230,26,39,0.15)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <Reveal>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-cc-red" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
              Brand Legacy
            </span>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white md:text-8xl">
            A timeless <em className="italic text-cc-red">recipe</em>
            <br />
            of bold moments.
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
            From a small Atlanta pharmacy to every corner of the world —
            Coca‑Cola has been the spark behind life&apos;s most refreshing
            moments for over a century. Five milestones that defined an era.
          </p>
        </Reveal>

        {/* Timeline */}
        <div className="mt-24">
          <div className="relative">
            {/* horizontal line on desktop */}
            <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent md:block" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-5 md:gap-4">
              {MILESTONES.map((m, i) => (
                <Reveal key={m.year} delay={400 + i * 100}>
                  <div className="group relative">
                    {/* dot */}
                    <div className="mb-6 hidden md:block">
                      <div className="relative mx-auto h-3 w-3 rounded-full bg-cc-red shadow-[0_0_20px_rgba(230,26,39,0.6)] transition-transform duration-500 group-hover:scale-150" />
                    </div>
                    <div className="glass group rounded-2xl border border-white/5 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-cc-red/30 hover:bg-cc-red/5">
                      <div className="font-display text-4xl font-black italic text-cc-red md:text-5xl">
                        {m.year}
                      </div>
                      <div className="mt-3 font-display text-lg font-bold text-white">
                        {m.title}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">
                        {m.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
