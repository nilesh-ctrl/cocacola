'use client';

import { Reveal } from '@/components/ui/Reveal';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      {/* particles bg */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-px w-px rounded-full bg-cc-red"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              boxShadow: '0 0 6px rgba(230,26,39,0.8)',
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-12">
        {/* big logo */}
        <Reveal>
          <div className="flex flex-col items-start">
            <div className="font-display text-[clamp(3rem,12vw,10rem)] font-black italic leading-[0.85] text-white">
              Coca<span className="text-cc-red">‑</span>Cola
            </div>
            <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
              Taste the feeling. Anywhere, anytime.
            </div>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-12 border-t border-white/5 pt-12 md:grid-cols-4">
          {[
            {
              t: 'Explore',
              l: ['Home', 'Legacy', 'Flavors', 'Refresh', 'Impact'],
            },
            {
              t: 'Company',
              l: ['About', 'Careers', 'Press', 'Sustainability', 'Investors'],
            },
            {
              t: 'Connect',
              l: ['Instagram', 'TikTok', 'YouTube', 'X / Twitter', 'Spotify'],
            },
            {
              t: 'Legal',
              l: ['Privacy', 'Cookies', 'Terms', 'Accessibility', 'Contact'],
            },
          ].map((col) => (
            <Reveal key={col.t}>
              <div>
                <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                  {col.t}
                </div>
                <ul className="space-y-2.5">
                  {col.l.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        data-hover
                        className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                      >
                        <span className="h-px w-3 bg-cc-red opacity-0 transition-all duration-300 group-hover:w-6 group-hover:opacity-100" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 md:flex-row md:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            © 2026 The Coca‑Cola Company · All rights reserved
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Made with fizz ✦ in Atlanta
          </span>
        </div>
      </div>
    </footer>
  );
}
