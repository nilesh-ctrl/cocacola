'use client';

import dynamic from 'next/dynamic';
import { Reveal } from '@/components/ui/Reveal';

const LiquidScene = dynamic(
  () => import('@/components/3d/LiquidWaveScene').then((m) => m.LiquidWaveScene),
  { ssr: false }
);

export function Refresh() {
  return (
    <section
      id="refresh"
      className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-cc-ink via-cc-redDeep/30 to-cc-ink py-32 md:py-48"
    >
      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cc-red" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/50">
                  The Sensation
                </span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
                A rush of <em className="italic text-cc-red">fizz</em>.
                <br />
                A wave of <em className="italic text-cc-red">ice</em>.
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-white/60 md:text-lg">
                Open the bottle, hear the cap release, watch the bubbles rush
                upward. The most cinematic refreshment on earth, captured in
                every drop.
              </p>
            </Reveal>
            <Reveal delay={450}>
              <div className="mt-10 space-y-4">
                {[
                  { l: 'Real‑time liquid simulation', v: 'Shader‑driven waves' },
                  { l: 'Physics‑based bubbles', v: '200+ particles' },
                  { l: 'Volumetric ice cubes', v: 'Full transmission' },
                  { l: 'Cinema lighting', v: '5‑point rig' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between border-b border-white/5 py-3 transition-colors hover:border-cc-red/40"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] tracking-widest text-cc-red">
                        0{i + 1}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {item.l}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/30 transition-colors group-hover:text-white/60">
                      {item.v}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={500}>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cc-redDeep/40 via-black to-cc-ink">
              <LiquidScene />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cc-red" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
                  Fluid sim · live
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
