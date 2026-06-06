'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const INTRO_KEY = 'coca-cola-intro-seen';
const DESKTOP_SRC = '/intro.mp4';
const MOBILE_SRC = '/phoneintro.mp4';
const MOBILE_QUERY = '(max-width: 767px)';

export function VideoIntro({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  /*
   * `src` starts as null so the server and the first client render both
   * output an empty container. The real src is chosen inside useEffect
   * after matchMedia resolves on the client — this guarantees no Next.js
   * hydration mismatch (server has no way to know viewport width).
   */
  const [src, setSrc] = useState<string | null>(null);

  // --- viewport detection (runs once after mount) ---
  useEffect(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia(MOBILE_QUERY).matches;
    setSrc(isMobile ? MOBILE_SRC : DESKTOP_SRC);
  }, []);

  // --- play + lifecycle (runs after the <video> element actually exists) ---
  useEffect(() => {
    if (!src) return; // wait until we've picked a source
    const video = videoRef.current;
    if (!video) return;

    // Set video attributes (defense in depth — also set in JSX)
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        // Some browsers may block autoplay despite muted;
        // try again on first user interaction
        const resume = () => {
          video.play().catch(() => {});
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('keydown', resume);
          window.removeEventListener('touchstart', resume);
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
        window.addEventListener('touchstart', resume, { once: true });
      }
    };

    tryPlay();

    const handleEnded = () => {
      setFadingOut(true);
      // Wait for fade animation to finish, then unmount
      setTimeout(() => {
        setShouldRender(false);
        try {
          sessionStorage.setItem(INTRO_KEY, '1');
        } catch {}
        onComplete();
      }, 1000);
    };

    video.addEventListener('ended', handleEnded);

    // Safety fallback: if the `ended` event doesn't fire (some codecs/edge cases),
    // hide intro after video.duration + 1.5s
    const fallback = setTimeout(() => {
      if (!video.ended) handleEnded();
    }, (video.duration || 15) * 1000 + 1500);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(fallback);
    };
  }, [src, onComplete]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="video-intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: fadingOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: fadingOut ? 1.0 : 0,
            ease: 'easeInOut',
          }}
          className="fixed inset-0 z-[10000] bg-black"
          aria-hidden="true"
        >
          {src && (
            <video
              ref={videoRef}
              src={src}
              autoPlay
              muted
              playsInline
              preload="auto"
              // @ts-ignore - non-standard but widely supported for iOS
              x5-video-player-type="h5"
              // @ts-ignore
              x5-playsinline="true"
              // @ts-ignore
              webkit-playsinline="true"
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              /*
               * Both desktop (/intro.mp4 → 1280x720 landscape) and mobile
               * (/phoneintro.mp4 → 720x1280 portrait) are aspect-matched to
               * their target viewport, so object-cover fills the screen edge-
               * to-edge on both with negligible cropping. The subject stays
               * centered via object-center. No black bars on either device.
               */
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{
                backgroundColor: '#000',
                pointerEvents: 'none',
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VideoIntro;
