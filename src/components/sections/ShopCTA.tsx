'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/Reveal';
import { Button, MagneticArrow } from '@/components/ui/Button';

export function ShopCTA() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section
      id="shop"
      className="relative overflow-hidden border-t border-white/5 py-32 md:py-48"
    >
      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cc-red/20 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cc-red/30 bg-cc-red/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cc-red" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cc-red">
              Limited Edition
            </span>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="font-display text-6xl font-black leading-[0.9] tracking-tight text-white md:text-9xl">
            Stay <em className="italic text-cc-red">cool</em>.
            <br />
            Stay <em className="italic text-cc-red">classic</em>.
          </h2>
        </Reveal>
        <Reveal delay={300}>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
            Subscribe to receive a limited‑edition collector&apos;s can and
            early access to new flavors, designs, and experiences.
          </p>
        </Reveal>
        <Reveal delay={450}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSent(true);
            }}
            className="mx-auto mt-10 flex max-w-md flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
            />
            <Button type="submit" variant="primary" icon={<MagneticArrow />}>
              Subscribe
            </Button>
          </form>
        </Reveal>
        <AnimatePresence>
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 font-mono text-xs text-cc-red"
            >
              ✓ Welcome to the family. Check your inbox.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
