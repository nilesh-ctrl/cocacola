'use client';

import { Marquee } from '@/components/ui/Marquee';
import { Reveal } from '@/components/ui/Reveal';

export function MarqueeBand() {
  return (
    <section className="relative border-y border-white/5 bg-cc-ink py-12">
      <Marquee
        items={[
          'TASTE THE FEELING',
          'OPEN HAPPINESS',
          'ICE COLD REFRESHMENT',
          'SINCE 1886',
          'TASTE THE FEELING',
        ]}
      />
    </section>
  );
}
