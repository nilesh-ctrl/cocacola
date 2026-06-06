'use client';

/*
 * Custom magnetic cursor — REMOVED.
 *
 * Per design request, the floating circular cursor indicator (small dot +
 * animated ring that followed the mouse and grew on hover targets) has been
 * disabled site-wide. The default native browser cursor is now used.
 *
 * The original implementation listened for `mousemove` / `mouseover`, ran a
 * requestAnimationFrame lerp loop, and rendered two fixed-position divs at
 * z-[9998]/[9999] with `mix-blend-difference`. All of that is gone.
 *
 * This export is kept as a no-op so any lingering import (or stale build
 * cache during HMR) won't crash — it simply renders nothing.
 *
 * The `data-hover` attribute that remains on buttons/links throughout the
 * app was ONLY read by this component to swell the ring on hover. It has no
 * styling or behavioral side-effect on its own, so leaving it in place is
 * harmless. Buttons, navigation, hero carousel, can animations, and scroll
 * behavior are unaffected.
 */
export function Cursor() {
  return null;
}

export default Cursor;
