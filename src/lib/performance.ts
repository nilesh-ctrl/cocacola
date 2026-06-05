/**
 * GPU performance detection + adaptive quality settings
 * Targets low-end GPUs like Intel HD Graphics 4000/4400/4600
 *
 * Strategy: preserve 95%+ visual quality on most devices.
 * Only reduce on truly low-end (Intel HD Graphics, software rendering).
 */

export type QualityTier = 'low' | 'mid' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  postprocessing: boolean;
  particlesMultiplier: number;
  geometrySegments: number;
  transmission: boolean;
  enableBloom: boolean;
  enableDOF: boolean;
  enableChromatic: boolean;
  enableVignette: boolean;
  enableNoise: boolean;
  maxLights: number;
  /** Use demand frameloop (only render on change) instead of always */
  demandFrameloop: boolean;
}

let cachedTier: QualityTier | null = null;
let cachedSettings: QualitySettings | null = null;

/**
 * Detect GPU tier using WebGL renderer string
 * - low:  Intel HD Graphics, very old mobile, software rendering
 * - mid:  GTX 1050 / RX 560 / Apple M1 / modern mobile (DEFAULT - preserves quality)
 * - high: RTX / RX 6000+ / M2+
 */
function detectGPUTier(): QualityTier {
  if (typeof window === 'undefined') return 'mid';

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod/.test(ua);

  // 1. WebGL renderer info
  let renderer = '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        renderer = (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string) || '';
      }
    }
  } catch (e) {
    // ignore
  }

  const r = renderer.toLowerCase();

  // Low-end GPU signals (the only ones we reduce for)
  const lowSignals = [
    'intel hd graphics',      // Most Intel integrated
    'intel(r) hd graphics',
    'intel graphics',         // Generic Intel
    'swiftshader',             // Software renderer
    'llvmpipe',                 // Mesa software
    'software',
    'adreno 3',                 // Very old mobile
    'adreno (tm) 3',
    'mali-t6', 'mali-t7',     // Old mobile
    'powervr sgx',              // Very old
    'via',                      // Old ChromeOS
  ];
  if (lowSignals.some((s) => r.includes(s))) return 'low';

  // High-end signals
  const highSignals = [
    'rtx',
    'gtx 16', 'gtx 17',
    'radeon rx 6', 'radeon rx 7',
    'apple m2', 'apple m3', 'apple m4',
    'arc', // Intel Arc
  ];
  if (highSignals.some((s) => r.includes(s))) return 'high';

  // Device memory
  const deviceMemory = (navigator as any).deviceMemory;
  if (typeof deviceMemory === 'number' && deviceMemory <= 2) return 'low';

  // Hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return 'low';

  // Mobile: usually mid - preserves quality
  if (isMobile) return 'mid';

  return 'mid'; // Default to mid - PRESERVES quality
}

/**
 * Manually override quality (for testing or user setting)
 */
let override: QualityTier | null = null;
export function setQualityOverride(tier: QualityTier | null) {
  override = tier;
  cachedTier = null;
  cachedSettings = null;
}

export function getQualityTier(): QualityTier {
  if (override) return override;
  if (cachedTier) return cachedTier;
  cachedTier = detectGPUTier();
  return cachedTier;
}

/**
 * Returns adaptive quality settings.
 *
 * IMPORTANT: Even on "low" tier, we preserve:
 *  - All animations and motion
 *  - Bottle + bubbles + condensation
 *  - Lighting (5-point rig)
 *  - Vignette (cheap)
 *  - Reflections via environment map
 *  - Glass-like appearance (transmission reduced but not removed)
 *
 * Only on "low" tier we:
 *  - Cap DPR at 1 (no super-sampling)
 *  - Disable shadows (single most expensive thing)
 *  - Disable bloom (cheap-ish but adds GPU passes)
 *  - Reduce transmission slightly (keeps glass look)
 *  - Reduce particle counts by 40% (still hundreds of particles)
 *  - Disable DOF, chromatic aberration, noise
 */
export function getQualitySettings(): QualitySettings {
  if (cachedSettings) return cachedSettings;
  const tier = getQualityTier();

  switch (tier) {
    case 'low':
      cachedSettings = {
        tier: 'low',
        dpr: [0.75, 1],                       // Cap at 1x (huge savings on retina)
        shadows: false,                        // Single biggest perf gain
        antialias: false,                      // MSAA is expensive on Intel HD
        postprocessing: true,                  // Keep postprocessing for visual quality
        particlesMultiplier: 0.6,              // 60% of normal (still 100s of particles)
        geometrySegments: 48,                  // 50% segments (still smooth)
        transmission: true,                    // Keep glass look
        enableBloom: true,                     // Keep glow (looks great, low cost)
        enableDOF: false,                      // Disable (expensive)
        enableChromatic: false,                // Disable (subtle anyway)
        enableVignette: true,                  // Keep (cheap)
        enableNoise: false,                    // Disable (subtle)
        maxLights: 5,                          // Keep full lighting
        demandFrameloop: false,                // Keep smooth animation
      };
      break;
    case 'mid':
      cachedSettings = {
        tier: 'mid',
        dpr: [1, 1.5],
        shadows: false,
        antialias: true,
        postprocessing: true,
        particlesMultiplier: 0.85,
        geometrySegments: 64,
        transmission: true,
        enableBloom: true,
        enableDOF: false,
        enableChromatic: false,
        enableVignette: true,
        enableNoise: false,
        maxLights: 6,
        demandFrameloop: false,
      };
      break;
    case 'high':
    default:
      cachedSettings = {
        tier: 'high',
        dpr: [1, 2],
        shadows: true,
        antialias: true,
        postprocessing: true,
        particlesMultiplier: 1.0,
        geometrySegments: 96,
        transmission: true,
        enableBloom: true,
        enableDOF: true,
        enableChromatic: true,
        enableVignette: true,
        enableNoise: true,
        maxLights: 8,
        demandFrameloop: false,
      };
      break;
  }
  return cachedSettings;
}
