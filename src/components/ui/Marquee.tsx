'use client';

export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
        {[...items, ...items, ...items, ...items].map((it, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="font-display text-5xl font-bold uppercase tracking-wider text-white md:text-7xl">
              {it}
            </span>
            <span className="text-3xl text-cc-red md:text-5xl">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
