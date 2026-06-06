'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingNav() {
  const [show, setShow] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > window.innerHeight * 0.6);
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#hero', label: 'Home' },
    { href: '#legacy', label: 'Legacy' },
    { href: '#products', label: 'Flavors' },
    { href: '#impact', label: 'Impact' },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2"
        >
          <nav
            className={`flex items-center gap-6 rounded-full px-6 py-3 transition-all duration-500 ${
              scrolled
                ? 'border border-white/10 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-2xl'
                : 'border border-white/5 bg-black/30 backdrop-blur-xl'
            }`}
          >
            <a href="#hero" className="group flex items-center gap-2" data-hover>
              <span className="relative h-6 w-6">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cc-red to-cc-redDark" />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
              </span>
              <span className="font-display text-sm font-bold tracking-widest text-white">
                COCA‑COLA
              </span>
            </a>
            <span className="h-5 w-px bg-white/20" />
            <ul className="flex items-center gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    data-hover
                    className="group relative block rounded-full px-3 py-1.5 text-xs font-medium tracking-wide text-white/70 transition-colors hover:text-white"
                  >
                    <span className="relative z-10">{l.label}</span>
                    <span className="absolute inset-0 -z-0 scale-90 rounded-full bg-white/5 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
            <span className="h-5 w-px bg-white/20" />
            <a
              href="#shop"
              data-hover
              className="group relative overflow-hidden rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-all duration-300 hover:bg-cc-red hover:text-white"
            >
              <span className="relative z-10">Order Now</span>
            </a>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
