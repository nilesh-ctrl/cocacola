'use client';

import { useEffect, useState } from 'react';
import { getQualityTier, setQualityOverride, type QualityTier } from '@/lib/performance';

/**
 * Small floating quality toggle for users on low-end devices.
 * Allows them to override auto-detection.
 */
export function QualityToggle() {
  const [tier, setTier] = useState<QualityTier | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTier(getQualityTier());
  }, []);

  if (!tier) return null;
  // Never expose to users - internal optimizations only
  return null;

  const change = (newTier: QualityTier | null) => {
    setQualityOverride(newTier);
    setTier(newTier || getQualityTier());
    setOpen(false);
    // Reload to apply settings to all canvases
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9997]">
      {open ? (
        <div className="rounded-xl border border-white/10 bg-black/80 p-3 backdrop-blur-xl">
          <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
            Graphics Quality
          </div>
          {(['auto', 'high', 'mid', 'low'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => change(opt === 'auto' ? null : opt)}
              className="block w-full rounded px-3 py-1.5 text-left text-xs text-white/80 transition-colors hover:bg-white/10"
            >
              {opt === 'auto' ? 'Auto' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded px-3 py-1 text-[10px] text-white/40 hover:text-white/70"
          >
            Close
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-xl hover:bg-black/90 hover:text-white"
          aria-label="Graphics quality"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
          Low-end mode
        </button>
      )}
    </div>
  );
}
