'use client';

import { useEffect, useRef, ElementType } from 'react';

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: ElementType;
};

export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add('in');
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    // @ts-ignore - dynamic tag accepts HTMLElement ref
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
