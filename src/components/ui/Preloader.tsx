'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Preloader() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let p = 0;
    function step() {
      p += 1.4 + Math.random() * 2.2;
      if (p >= 100) {
        p = 100;
        setProgress(100);
        setTimeout(() => setDone(true), 600);
        return;
      }
      setProgress(p);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cc-ink"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                filter: ['drop-shadow(0 0 30px rgba(230,26,39,0.5))', 'drop-shadow(0 0 60px rgba(230,26,39,0.9))', 'drop-shadow(0 0 30px rgba(230,26,39,0.5))'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <svg viewBox="0 0 80 200" className="h-48 w-auto">
                <defs>
                  <linearGradient id="preBottle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff3030" />
                    <stop offset="0.5" stopColor="#c00000" />
                    <stop offset="1" stopColor="#5a0000" />
                  </linearGradient>
                </defs>
                <path
                  d="M30 10 L50 10 L50 30 Q58 35 58 50 L58 180 Q58 192 46 192 L34 192 Q22 192 22 180 L22 50 Q22 35 30 30 Z"
                  fill="url(#preBottle)"
                />
                <rect x="22" y="90" width="36" height="50" fill="#fff" opacity=".95" />
                <text
                  x="40"
                  y="120"
                  textAnchor="middle"
                  fontFamily="Playfair Display, serif"
                  fontSize="11"
                  fill="#c00"
                  fontStyle="italic"
                  fontWeight="900"
                >
                  Coca‑Cola
                </text>
              </svg>
            </motion.div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="font-display text-2xl tracking-[0.4em] text-white">
              CHILLING
            </div>
            <div className="h-px w-64 overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cc-red via-cc-redDark to-cc-red"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-mono text-xs text-white/40">{Math.round(progress)}%</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
