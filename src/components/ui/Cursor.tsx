'use client';

import { useEffect, useState } from 'react';

/* Premium magnetic cursor */
export function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ring, setRing] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    let rx = -100, ry = -100;
    let frame = 0;
    function tick() {
      rx += (pos.x - rx) * 0.18;
      ry += (pos.y - ry) * 0.18;
      setRing({ x: rx, y: ry });
      frame = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(frame);
  }, [pos]);

  useEffect(() => {
    function move(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    function over(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [data-hover]')) setHover(true);
      else setHover(false);
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference md:block"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
      <div
        className={`pointer-events-none fixed left-0 top-0 z-[9998] hidden -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 md:block ${
          hover ? 'h-12 w-12 border-cc-red bg-cc-red/10' : 'h-8 w-8 border-white/40'
        }`}
        style={{
          transform: `translate(${ring.x}px, ${ring.y}px)`,
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
}
