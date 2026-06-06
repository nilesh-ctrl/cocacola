'use client';

import { useState, useEffect } from 'react';
import { VideoIntro } from '@/components/ui/VideoIntro';
import { Hero } from '@/components/sections/Hero';
import { MarqueeBand } from '@/components/sections/MarqueeBand';
import { Legacy } from '@/components/sections/Legacy';
import { Products } from '@/components/sections/Products';
import { Impact } from '@/components/sections/Impact';
import { ShopCTA } from '@/components/sections/ShopCTA';
import { Footer } from '@/components/sections/Footer';

const INTRO_KEY = 'coca-cola-intro-seen';

export default function Home() {
  // Skip the intro if it has already played this session/refresh cycle.
  // Only the page-level unmount/remount (a hard refresh) restarts it.
  const [showIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !sessionStorage.getItem(INTRO_KEY);
    } catch {
      return true;
    }
  });
  const [introDone, setIntroDone] = useState<boolean>(() => !showIntro);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleIntroComplete = () => setIntroDone(true);

  return (
    <main className="relative min-h-screen bg-cc-ink text-white">
      {hydrated && showIntro && !introDone && (
        <VideoIntro onComplete={handleIntroComplete} />
      )}
      <Hero />
      <MarqueeBand />
      <Legacy />
      <Products />
      <Impact />
      <ShopCTA />
      <Footer />
    </main>
  );
}
