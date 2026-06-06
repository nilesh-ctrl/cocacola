'use client';

import { Component, ReactNode, Suspense, Fragment } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { getQualitySettings } from '@/lib/performance';

/**
 * Safe PostFX wrapper for React Three Fiber.
 * - Wraps EffectComposer in an ErrorBoundary (graceful fallback if renderer is null)
 * - Renders Bloom + Vignette only when quality allows
 * - enableNormalPass=false avoids extra render target
 * - Uses Fragment wrapper around conditional passes to avoid TS strict children issue
 */

interface State {
  hasError: boolean;
}

class PostFXErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[PostFX] Disabled:', error.message);
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* Inner passes wrapped in fragment to bypass EffectComposer's strict child typing */
function PostFXPasses({
  bloom,
  vignette,
}: {
  bloom: boolean;
  vignette: boolean;
}) {
  return (
    <Fragment>
      {bloom ? (
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.8}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
      ) : null}
      {vignette ? <Vignette eskil={false} offset={0.18} darkness={0.85} /> : null}
    </Fragment>
  );
}

export function SafePostFX() {
  const quality = getQualitySettings();

  if (!quality.postprocessing) return null;

  const showBloom = quality.enableBloom;
  const showVignette = quality.enableVignette;

  // Always render at least one pass to avoid addPass errors
  if (!showBloom && !showVignette) {
    return (
      <PostFXErrorBoundary>
        <Suspense fallback={null}>
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Vignette eskil={false} offset={0.3} darkness={0.8} />
          </EffectComposer>
        </Suspense>
      </PostFXErrorBoundary>
    );
  }

  return (
    <PostFXErrorBoundary>
      <Suspense fallback={null}>
        <EffectComposer
          multisampling={quality.antialias ? 2 : 0}
          enableNormalPass={false}
        >
          <PostFXPasses bloom={showBloom} vignette={showVignette} />
        </EffectComposer>
      </Suspense>
    </PostFXErrorBoundary>
  );
}

export default SafePostFX;
