'use client';

import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { getQualitySettings } from '@/lib/performance';
import { getSharedEnvMap } from '@/lib/envMap';

/* ============================================================
   HYPER-REALISTIC COCA-COLA CAN — Commercial Quality
   Matches the reference image:
   - Tall premium can with brand-red gradient
   - Dense carbonation bubbles (varying sizes, depth)
   - Realistic condensation droplets
   - Wet reflective floor with red glow
   - Dramatic red rim lighting + warm key
   - Strong aluminum highlights
   ============================================================ */

/* Procedural Coca-Cola can label (1024x512, high quality) */
function makeCanLabel(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  // Brand red base gradient (matches reference: darker top, vivid middle, deep red bottom)
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#a00010');
  g.addColorStop(0.2, '#c80012');
  g.addColorStop(0.4, '#e61010');
  g.addColorStop(0.7, '#e61010');
  g.addColorStop(1, '#6a0008');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  // White wave at bottom
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  for (let x = 0; x <= 1024; x += 4) {
    ctx.lineTo(x, 420 + Math.sin(x * 0.011) * 8);
  }
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();
  // "ORIGINAL TASTE" arc at top
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORIGINAL TASTE', 512, 80);
  // Coca-Cola script logo
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 900 200px "Playfair Display", "Times New Roman", serif';
  ctx.fillText('Coca‑Cola', 512, 250);
  // Sub-tag
  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('CLASSIC · 330ml', 512, 460);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/* ============================================================
   CONDENSATION — droplets on can surface
   ============================================================ */
function Condensation({ count = 220 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const droplets = useMemo(() => {
    const arr: { theta: number; y: number; scale: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        theta: Math.random() * Math.PI * 2,
        y: -0.48 + Math.random() * 0.95,
        scale: 0.003 + Math.random() * 0.012,
        speed: 0.0003 + Math.random() * 0.0014,
      });
    }
    return arr;
  }, [count]);

  const acc = useRef(0);
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const quality = getQualitySettings();
    const every = quality.tier === 'low' ? 2 : 1;
    acc.current += delta;
    if (acc.current < 1 / 60 * every) return;
    const dt = acc.current;
    acc.current = 0;

    for (let i = 0; i < droplets.length; i++) {
      const d = droplets[i];
      d.y += d.speed * 60 * dt;
      if (d.y > 0.48) d.y = -0.48;
      const r = 0.31;
      const x = Math.cos(d.theta) * r;
      const z = Math.sin(d.theta) * r;
      dummy.position.set(x, d.y, z);
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.75}
        roughness={0.02}
        metalness={0}
        transmission={0.85}
        ior={1.33}
        thickness={0.05}
        clearcoat={1}
        clearcoatRoughness={0.05}
      />
    </instancedMesh>
  );
}

/* ============================================================
   BUBBLE LAYERS — 4 layers of carbonation with depth
   ============================================================ */
function Bubbles() {
  const quality = useMemo(() => getQualitySettings(), []);

  // Layer specs: count, radius (distance from can), size, opacity, speed
  const layers = useMemo(() => {
    const m = quality.particlesMultiplier;
    return [
      // Large foreground bubbles (closest to camera, most visible)
      { count: Math.floor(70 * m), radius: 1.5, size: 0.07, opacity: 0.95, speed: 0.7, color: '#ff8080', depth: 1 },
      // Mid layer
      { count: Math.floor(110 * m), radius: 1.1, size: 0.045, opacity: 0.75, speed: 0.55, color: '#ff6060', depth: 0.7 },
      // Small mid layer
      { count: Math.floor(140 * m), radius: 0.9, size: 0.03, opacity: 0.55, speed: 0.45, color: '#ff4040', depth: 0.5 },
      // Distant (simulates depth-of-field blur via low opacity)
      { count: Math.floor(100 * m), radius: 0.7, size: 0.018, opacity: 0.3, speed: 0.4, color: '#ff3030', depth: 0.3 },
    ];
  }, [quality.particlesMultiplier]);

  return (
    <>
      {layers.map((layer, i) => (
        <BubbleLayer key={i} {...layer} index={i} />
      ))}
    </>
  );
}

function BubbleLayer({
  count,
  radius,
  size,
  opacity,
  speed,
  color,
  depth,
  index,
}: {
  count: number;
  radius: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
  depth: number;
  index: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const { positions, velocities, baseY, baseX, baseZ } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const baseY = new Float32Array(count);
    const baseX = new Float32Array(count);
    const baseZ = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = -0.6 + Math.random() * 1.5;
      const r = Math.sqrt(Math.random()) * radius;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      baseX[i] = x;
      baseY[i] = y;
      baseZ[i] = z;
      // Lateral drift
      velocities[i * 3] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = speed * (0.006 + Math.random() * 0.025);
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return { positions, velocities, baseY, baseX, baseZ };
  }, [count, radius, speed]);

  const acc = useRef(Math.random() * 0.1);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const quality = getQualitySettings();
    const every = quality.tier === 'low' ? 2 : 1;
    acc.current += delta;
    if (acc.current < 1 / 60 * every) return;
    const dt = acc.current;
    acc.current = 0;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3] * 60 * dt;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * 60 * dt;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * 60 * dt;
      // Reset when reaching top
      if (pos[i * 3 + 1] > 0.9) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        pos[i * 3] = Math.cos(theta) * r;
        pos[i * 3 + 1] = -0.6;
        pos[i * 3 + 2] = Math.sin(theta) * r;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================================
   THE CAN
   ============================================================ */
function Can({ pointer }: { pointer: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const labelTex = useMemo(() => makeCanLabel(), []);
  const quality = useMemo(() => getQualitySettings(), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle Y rotation + mouse parallax (smaller than before - matches reference)
    groupRef.current.rotation.y = -0.15 + t * 0.08 + pointer.x * 0.15;
    groupRef.current.rotation.x = -0.05 + pointer.y * 0.04;
    // Gentle vertical float
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.025;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main can body - aluminum with brand wrap */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.95, 96, 1, true]} />
        <meshPhysicalMaterial
          map={labelTex}
          color="#e61010"
          metalness={0.85}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Top aluminum cap */}
      <mesh position={[0, 0.477, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 64]} />
        <meshStandardMaterial color="#c8c8d0" metalness={1} roughness={0.32} envMapIntensity={1.5} />
      </mesh>
      {/* Top inner recessed area */}
      <mesh position={[0, 0.474, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 64]} />
        <meshStandardMaterial color="#a0a0a8" metalness={1} roughness={0.4} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 0.479, 0]}>
        <torusGeometry args={[0.3, 0.012, 8, 64]} />
        <meshStandardMaterial color="#8a8a90" metalness={1} roughness={0.2} envMapIntensity={1.5} />
      </mesh>
      {/* Pull tab base ring */}
      <mesh position={[0, 0.486, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.08, 24]} />
        <meshStandardMaterial color="#9a9aa0" metalness={1} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Pull tab handle */}
      <mesh position={[0.1, 0.488, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.14, 0.014, 0.04]} />
        <meshStandardMaterial color="#9a9aa0" metalness={1} roughness={0.25} />
      </mesh>
      {/* Pull tab end */}
      <mesh position={[0.18, 0.488, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.014, 16]} />
        <meshStandardMaterial color="#9a9aa0" metalness={1} roughness={0.3} />
      </mesh>
      {/* Bottom cap */}
      <mesh position={[0, -0.477, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 64]} />
        <meshStandardMaterial color="#7a7a82" metalness={0.9} roughness={0.5} />
      </mesh>
      {/* Bottom rim */}
      <mesh position={[0, -0.479, 0]}>
        <torusGeometry args={[0.3, 0.012, 8, 64]} />
        <meshStandardMaterial color="#666" metalness={1} roughness={0.35} />
      </mesh>
      {/* Condensation droplets on can surface */}
      <Condensation count={Math.floor(220 * quality.particlesMultiplier)} />
    </group>
  );
}

/* ============================================================
   WET FLOOR — reflective with red glow
   ============================================================ */
function WetFloor() {
  return (
    <group position={[0, -0.49, 0]}>
      {/* Main dark reflective plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshPhysicalMaterial
          color="#080202"
          metalness={0.6}
          roughness={0.12}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* Red glow ring on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.7, 3.5, 64]} />
        <meshBasicMaterial color="#e61a27" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner bright red ring close to can */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.5, 1.5, 64]} />
        <meshBasicMaterial color="#ff3030" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Water ripples (concentric rings) */}
      {[0.4, 0.7, 1.0, 1.3, 1.6, 1.9, 2.2].map((r, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.003 + i * 0.0001, 0]}
        >
          <ringGeometry args={[r, r + 0.008, 64]} />
          <meshBasicMaterial color="#ff4040" transparent opacity={0.1 - i * 0.012} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   BACKLIGHT GLOW — rich red ambient behind can
   ============================================================ */
function BacklightGlow() {
  return (
    <group>
      {/* Main radial glow */}
      <mesh position={[0, 0, -1.5]}>
        <planeGeometry args={[5, 5]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{}}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              vec2 c = vUv - 0.5;
              float d = length(c) * 2.0;
              float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.5);
              vec3 col = mix(vec3(1.0, 0.15, 0.15), vec3(0.4, 0.0, 0.0), d);
              gl_FragColor = vec4(col, a * 0.65);
            }
          `}
        />
      </mesh>
      {/* Side red glows (cinematic rim) */}
      <mesh position={[-1.5, 0, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3, 3]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{}}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              float d = length(vUv - 0.5) * 2.0;
              float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.0);
              gl_FragColor = vec4(0.9, 0.1, 0.1, a * 0.4);
            }
          `}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   SHARED ENVIRONMENT
   ============================================================ */
function SharedEnv() {
  const { gl } = useThree();
  const envTex = useMemo(() => getSharedEnvMap(gl), [gl]);
  return <primitive object={envTex} attach="environment" />;
}

/* ============================================================
   SCENE
   ============================================================ */
function HeroCanScene({ pointer }: { pointer: { x: number; y: number } }) {
  const quality = useMemo(() => getQualitySettings(), []);

  return (
    <>
      <color attach="background" args={['#050000']} />
      <fog attach="fog" args={['#1a0000', 5, 15]} />

      <SharedEnv />

      {/* DRAMATIC 3-POINT LIGHTING (matches commercial look) */}
      <ambientLight intensity={0.15} color="#ffffff" />
      {/* Key: warm white from top-left - strong highlight on aluminum */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={2.4}
        color="#ffe8d0"
        castShadow={quality.shadows}
      />
      {/* Rim: bright RED from back-right - signature look */}
      <directionalLight position={[-4, 1, -3]} intensity={2.2} color="#ff2030" />
      {/* Fill: red glow from below floor (bounce light) */}
      <pointLight position={[0, -0.4, 1.5]} intensity={2.0} color="#ff3030" distance={6} />
      {/* Backlight: red glow from behind can */}
      <pointLight position={[0, 0, -1.5]} intensity={2.5} color="#ff4040" distance={8} />
      {/* Subtle warm fill from front-right */}
      <pointLight position={[2, 1, 2]} intensity={0.6} color="#ffaa88" distance={6} />

      <BacklightGlow />
      <Can pointer={pointer} />
      <Bubbles />
      <WetFloor />

      {quality.postprocessing ? (
        <EffectComposer multisampling={quality.antialias ? 2 : 0}>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.8}
            mipmapBlur
            kernelSize={KernelSize.LARGE}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.88} />
        </EffectComposer>
      ) : null}
    </>
  );
}

/* ============================================================
   TOP NAVIGATION (HTML, outside Canvas)
   ============================================================ */
function TopNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-6 md:px-12">
      <div className="pointer-events-auto flex items-center gap-3">
        <span className="font-display text-2xl font-black italic tracking-tight text-cc-red">
          Coca‑Cola
        </span>
      </div>
      <nav className="pointer-events-auto hidden items-center gap-10 md:flex">
        <a href="#flavors" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Collection
        </a>
        <a href="#refresh" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Experience
        </a>
        <a href="#legacy" data-hover className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          History
        </a>
        <a href="#shop" data-hover className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 transition-colors hover:text-white">
          Shop
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </nav>
      <button data-hover className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-white hover:bg-white/5">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/* ============================================================
   EXPORTED COMPONENTS
   ============================================================ */
export function HeroCan({ pointer = { x: 0, y: 0 } }: { pointer?: { x: number; y: number } }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 1.4], fov: 32 }}
      gl={{
        antialias: getQualitySettings().antialias,
        alpha: true,
        powerPreference: getQualitySettings().tier === 'low' ? 'low-power' : 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={getQualitySettings().dpr}
      style={{ background: 'transparent' }}
      shadows={getQualitySettings().shadows}
    >
      <Suspense fallback={null}>
        <HeroCanScene pointer={pointer} />
      </Suspense>
    </Canvas>
  );
}

export { TopNav };
export default HeroCan;
