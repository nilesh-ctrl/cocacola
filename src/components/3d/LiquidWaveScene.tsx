'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { getQualitySettings } from '@/lib/performance';

/* ===========================================================
   LIQUID WAVE SIMULATION
   - Custom shader with sin/cos based vertex displacement
   - Red Coca-Cola waves with ice cubes
   =========================================================== */

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  // 2D noise
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float n1 = noise(pos.xy * 1.5 + uTime * 0.3);
    float n2 = noise(pos.xy * 3.0 - uTime * 0.5);
    float n3 = sin(pos.x * 2.0 + uTime * 1.2) * 0.5;
    float elevation = n1 * 0.4 + n2 * 0.15 + n3 * 0.1;
    pos.z += elevation;
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float t = smoothstep(-0.2, 0.5, vElevation);
    vec3 col = mix(uColorA, uColorB, t);
    // gloss highlight
    float gloss = smoothstep(0.4, 0.6, vElevation);
    col += vec3(1.0, 0.9, 0.9) * gloss * 0.6;
    // vignette
    float v = 1.0 - length(vUv - 0.5) * 0.6;
    col *= v;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function LiquidWaveScene() {
  const quality = useMemo(() => getQualitySettings(), []);
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
        stencil: false,
      }}
      dpr={quality.dpr}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[0, 2, 3]} intensity={2.0} color="#ff4040" />
      <LiquidPlane />
    </Canvas>
  );
}

function LiquidPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  // Reduce plane subdivisions on low-end (128² = 16k verts → 64² = 4k)
  const segs = quality.tier === 'low' ? 64 : quality.tier === 'mid' ? 96 : 128;
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#3a0008') },
      uColorB: { value: new THREE.Color('#ff2030') },
    }),
    []
  );

  useFrame((s) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = s.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, segs, segs]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  );
}

export default LiquidWaveScene;
