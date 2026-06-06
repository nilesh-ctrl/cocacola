'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline';
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
};

export function Button({ children, variant = 'primary', icon, className = '', onClick, type = 'button' }: ButtonProps) {
  const base =
    'group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-500';
  const styles = {
    primary:
      'bg-white text-black hover:bg-cc-red hover:text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_-15px_rgba(230,26,39,0.7)]',
    ghost:
      'bg-transparent text-white border border-white/20 hover:border-white hover:bg-white/5',
    outline:
      'bg-transparent text-white border border-cc-red hover:bg-cc-red',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      data-hover
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${base} ${styles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-3">
        {children}
        {icon}
      </span>
      {variant === 'primary' && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
    </motion.button>
  );
}

export function MagneticArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-500 group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
