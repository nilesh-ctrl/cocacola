'use client';

import { useState, useEffect } from 'react';
import { CinematicIntro } from '@/components/ui/CinematicIntro';
import { Cursor } from '@/components/ui/Cursor';
import { FloatingNav } from '@/components/ui/FloatingNav';
import { QualityToggle } from '@/components/ui/QualityToggle';
import { Hero } from '@/components/sections/Hero';
import { MarqueeBand } from '@/components/sections/MarqueeBand';
import { Legacy } from '@/components/sections/Legacy';
import { Products } from '@/components/sections/Products';
import { Refresh } from '@/components/sections/Refresh';
import { Impact } from '@/components/sections/Impact';
import { ShopCTA } from '@/components/sections/ShopCTA';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <main className="relative min-h-screen bg-cc-ink text-white">
      {hydrated && !introDone && (
        <CinematicIntro onComplete={() => setIntroDone(true)} />
      )}
      <Cursor />
      <FloatingNav />
      <QualityToggle />
      <Hero />
      <MarqueeBand />
      <Legacy />
      <Products />
      <Refresh />
      <Impact />
      <ShopCTA />
      <Footer />
    </main>
  );
}
