'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Flavor = {
  src: string;
  name: string;
  tagline: string;
};

const FLAVORS: Flavor[] = [
  { src: '/flavors/coca-cola-original.png', name: 'Original', tagline: 'The Classic · Since 1886' },
  { src: '/flavors/coca-cola-zero-sugar.png', name: 'Zero Sugar', tagline: 'Bold Taste · Zero Guilt' },
  { src: '/flavors/coca-cola-cherry.png', name: 'Cherry', tagline: 'Bold Cherry Twist' },
  { src: '/flavors/coca-cola-diet.png', name: 'Diet Coke', tagline: 'Light · Crisp · Iconic' },
];

const COUNT = FLAVORS.length;
const AUTOPLAY_MS = 4000;
const RESUME_MS = 5000;
/* Distinct thresholds: touch needs a bigger swipe to feel intentional;
   mouse drag wants to feel responsive (Apple-gallery style ~40px). */
const TOUCH_SWIPE_THRESHOLD = 60;
const MOUSE_DRAG_THRESHOLD = 40;
/* How far the can can be tugged during an active mouse drag, in px.
   Caps the live-follow so the can never escapes its frame. */
const MAX_DRAG_FOLLOW_PX = 120;
const SLIDE_DURATION = 0.7;

const variants = {
  enter: (dir: 1 | -1) => ({ x: dir > 0 ? '40%' : '-40%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir > 0 ? '-40%' : '40%', opacity: 0 }),
};

const previewVariants = {
  enter: (side: 'left' | 'right') => ({
    x: side === 'left' ? -30 : 30,
    opacity: 0,
  }),
  center: { x: 0, opacity: 0.22 },
  exit: (side: 'left' | 'right') => ({
    x: side === 'left' ? 30 : -30,
    opacity: 0,
  }),
};

function wrap(i: number): number {
  return ((i % COUNT) + COUNT) % COUNT;
}

export function CanCarousel({ compact = false }: { compact?: boolean } = {}) {
  // === STATE ===
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  /* While the user is actively mouse-dragging, we offset the main can by
     the live cursor delta (capped). Touch path leaves this at 0 so mobile
     behavior is byte-identical to before. */
  const [dragOffset, setDragOffset] = useState(0);
  /* True only during a mouse drag — drives the `cursor: grabbing` class. */
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  // === REFS (for callbacks, avoids stale closures) ===
  const indexRef = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  /* Tracks whether the in-flight gesture is mouse, touch, or pen.
     `null` between gestures. */
  const activePointerType = useRef<string | null>(null);
  /* The pointerId we captured, so we can release it on up/cancel. */
  const activePointerId = useRef<number | null>(null);

  // Keep ref in sync with state
  useEffect(() => { indexRef.current = index; }, [index]);

  // === ACTIONS ===
  const pauseAndResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setPaused(false);
    }, RESUME_MS);
  }, []);

  const goTo = useCallback((target: number, dir: 1 | -1) => {
    setDirection(dir);
    setIndex(wrap(target));
    pauseAndResume();
  }, [pauseAndResume]);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => wrap(i + 1));
    pauseAndResume();
  }, [pauseAndResume]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => wrap(i - 1));
    pauseAndResume();
  }, [pauseAndResume]);

  // === AUTOPLAY ===
  useEffect(() => {
    /* Pause autoplay while a mouse drag is in flight — otherwise the can
       could jump forward under the user's hand mid-gesture. */
    if (paused || isMouseDragging) return;
    const t = setTimeout(() => {
      setDirection(1);
      setIndex((i) => wrap(i + 1));
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, isMouseDragging]);

  // === POINTER / DRAG ===
  // Pointer events unify mouse + touch + pen. We branch on pointerType so
  // the desktop mouse path gets the upgraded "live drag" UX while touch
  // keeps its original simple swipe.
  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = true;
    activePointerType.current = e.pointerType;
    activePointerId.current = e.pointerId;
    pauseAndResume();

    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      setIsMouseDragging(true);
      /* Capture so we keep receiving move/up even if the cursor leaves the
         carousel bounds — same trick Apple uses on their product galleries. */
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* Some older browsers may throw; safe to ignore. */
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return;
    /* Mouse/pen only — touch deliberately does NOT update visual offset
       so the existing mobile experience is preserved exactly. */
    if (activePointerType.current !== 'mouse' && activePointerType.current !== 'pen') return;
    const dx = e.clientX - startX.current;
    /* Damp the live follow so the can feels weighty, then clamp. */
    const damped = dx * 0.45;
    const clamped = Math.max(-MAX_DRAG_FOLLOW_PX, Math.min(MAX_DRAG_FOLLOW_PX, damped));
    setDragOffset(clamped);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) {
      // Nothing to do; just clean up state
      setIsMouseDragging(false);
      setDragOffset(0);
      activePointerType.current = null;
      activePointerId.current = null;
      return;
    }
    const dx = e.clientX - startX.current;
    /* Pick the right threshold for the pointer type that initiated the
       gesture, not the one in the up event (defends against weird device
       switching). */
    const threshold = activePointerType.current === 'touch'
      ? TOUCH_SWIPE_THRESHOLD
      : MOUSE_DRAG_THRESHOLD;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) goNext();
      else goPrev();
    }
    /* Snap back to center; if we DID navigate, the new slide's enter
       animation already starts from an offset so this reset is invisible. */
    setDragOffset(0);
    setIsMouseDragging(false);

    if (activePointerId.current !== null) {
      try {
        (e.currentTarget as Element).releasePointerCapture(activePointerId.current);
      } catch { /* ignore */ }
    }
    startX.current = null;
    dragging.current = false;
    activePointerType.current = null;
    activePointerId.current = null;
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    setDragOffset(0);
    setIsMouseDragging(false);
    if (activePointerId.current !== null) {
      try {
        (e.currentTarget as Element).releasePointerCapture(activePointerId.current);
      } catch { /* ignore */ }
    }
    startX.current = null;
    dragging.current = false;
    activePointerType.current = null;
    activePointerId.current = null;
  };

  // === DERIVED (from current index) ===
  // We use refs for index so the previews are always synced to the current can
  const current = FLAVORS[index];
  const prevIndex = wrap(index - 1);
  const nextIndex = wrap(index + 1);
  const prevFlavor = FLAVORS[prevIndex];
  const nextFlavor = FLAVORS[nextIndex];

  return (
    <div
      className={`group/carousel relative h-full w-full select-none overflow-hidden bg-transparent outline-none ${
        /* Desktop drag UX: grab → grabbing. Mobile devices that report
           hover:none get the default cursor so we don't show a grab icon
           on touchscreens. */
        isMouseDragging
          ? 'cursor-grabbing'
          : 'md:cursor-grab'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
      onKeyDown={(e) => {
        /* Keyboard accessibility — arrow keys navigate the carousel. */
        if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Coca-Cola flavor selector"
      tabIndex={0}
      style={{
        /* pan-y allows vertical scroll on touch but tells the browser the
           carousel will handle horizontal gestures itself — prevents the
           page from scrolling sideways under an active drag. */
        touchAction: 'pan-y',
        /* Belt-and-braces against text selection during fast mouse drags. */
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* ============== LEFT PREVIEW (previous can) ============== */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-0 flex items-center pl-4 md:pl-8">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={`prev-${prevIndex}`}
            src={prevFlavor.src}
            alt={`Previous: ${prevFlavor.name}`}
            draggable={false}
            custom="left"
            variants={previewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${compact ? 'h-[38%] max-h-[28vh]' : 'h-[52%] max-h-[58vh]'} w-auto object-contain blur-[1.5px] select-none`}
          />
        </AnimatePresence>
      </div>

      {/* ============== RIGHT PREVIEW (next can) ============== */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex items-center pr-4 md:pr-8">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={`next-${nextIndex}`}
            src={nextFlavor.src}
            alt={`Next: ${nextFlavor.name}`}
            draggable={false}
            custom="right"
            variants={previewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${compact ? 'h-[38%] max-h-[28vh]' : 'h-[52%] max-h-[58vh]'} w-auto object-contain blur-[1.5px] select-none`}
          />
        </AnimatePresence>
      </div>

      {/* ============== MAIN CAN ============== */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{
          /* Live tug during an active mouse drag — adds the premium
             Apple-gallery feel. Resets to 0 on release. The wrapper moves
             so we don't fight Framer Motion's enter/exit x animation on
             the <img>. transform3d engages GPU compositing for smoothness. */
          transform: `translate3d(${dragOffset}px, 0, 0)`,
          transition: isMouseDragging
            ? 'none'
            : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: isMouseDragging ? 'transform' : undefined,
        }}
      >
        <AnimatePresence initial={false} mode="sync" custom={direction}>
          <motion.img
            key={`main-${index}`}
            src={current.src}
            alt={current.name}
            draggable={false}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { duration: SLIDE_DURATION, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: SLIDE_DURATION * 0.6, ease: 'easeOut' },
            }}
            className={`absolute ${compact ? 'h-[78%] max-h-[34vh]' : 'h-[58%] max-h-[68vh]'} w-auto object-contain select-none`}
            style={{
              filter:
                'drop-shadow(0 25px 45px rgba(0,0,0,0.55)) drop-shadow(0 0 1px rgba(0,0,0,0.3))',
              imageRendering: 'auto',
              background: 'transparent',
            }}
          />
        </AnimatePresence>
      </div>

      {/* ============== FLAVOR NAME + TAGLINE ============== */}
      <div
        className={`pointer-events-none absolute ${
          compact ? 'bottom-8' : 'bottom-16'
        } left-1/2 z-20 -translate-x-1/2 text-center`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`label-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div
              className={`font-display font-bold tracking-wider text-white ${
                compact ? 'text-lg' : 'text-2xl md:text-3xl'
              }`}
            >
              {current.name}
            </div>
            <div
              className={`mt-1 font-mono uppercase tracking-[0.35em] text-white/60 ${
                compact ? 'text-[9px]' : 'text-[10px] text-white/50'
              }`}
            >
              {current.tagline}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ============== DOTS ============== */}
      <div className={`absolute ${compact ? 'bottom-2' : 'bottom-4'} left-1/2 z-20 flex -translate-x-1/2 gap-2`}>
        {FLAVORS.map((f, i) => {
          const isActive = i === index;
          return (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={`Go to ${f.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-8 bg-cc-red'
                  : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>

      {/* ============== ARROWS ============== */}
      {!compact && (
        <>
          <button
            onClick={goPrev}
            aria-label={`Previous flavor: ${prevFlavor.name}`}
            className="absolute left-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-black/70 hover:text-white group-hover/carousel:opacity-100 md:left-6"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={goNext}
            aria-label={`Next flavor: ${nextFlavor.name}`}
            className="absolute right-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-black/70 hover:text-white group-hover/carousel:opacity-100 md:right-6"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

export default CanCarousel;
