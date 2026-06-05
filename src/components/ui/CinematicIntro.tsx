'use client';

import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { getQualitySettings } from '@/lib/performance';
import { getSharedEnvMap } from '@/lib/envMap';

/* ============================================================
   CINEMATIC INTRO — 5-PHASE APPLE-LAUNCH STYLE REVEAL

   PHASE 1 (0–4s)    : Black → mist + droplets + red beam
                       Camera 5cm from bottle surface
   PHASE 2 (4–10s)   : Temperature 20°C → 0°C countdown
                       Ice particles, vapor, glass freezing
   PHASE 3 (10–13s)  : Bottle fully illuminates
                       Ice crystals on screen edges
                       Carbonation bubbles activate
   PHASE 4 (13–17s)  : Rapid camera dolly out
                       Reflective floor revealed
                       Volumetric red lighting fills scene
   PHASE 5 (17–21s)  : TASTE THE FEELING typography fade-in
                       Subheadline reveals
                       Transition out → main site
   ============================================================ */

const TOTAL_DURATION = 21; // seconds

type Phase = 1 | 2 | 3 | 4 | 5 | 'done';

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>(1);
  const [temp, setTemp] = useState(20);
  const [progress, setProgress] = useState(0);
  const quality = useMemo(() => getQualitySettings(), []);

  // Master timeline
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, elapsed / TOTAL_DURATION);
      setProgress(t);
      // Phase transitions
      if (elapsed < 4) setPhase(1);
      else if (elapsed < 10) setPhase(2);
      else if (elapsed < 13) setPhase(3);
      else if (elapsed < 17) setPhase(4);
      else if (elapsed < 21) setPhase(5);
      else {
        setPhase('done');
        onComplete();
        return;
      }
      // Temperature interpolation during phase 2
      if (elapsed >= 4 && elapsed < 10) {
        const t2 = (elapsed - 4) / 6;
        const eased = 1 - Math.pow(1 - t2, 2.5);
        setTemp(20 - eased * 20);
      } else if (elapsed >= 10) {
        setTemp(0);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[9999] overflow-hidden bg-black"
        >
          {/* 3D Scene */}
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0, 4], fov: 28 }}
              gl={{
                antialias: quality.antialias,
                alpha: false,
                powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
                stencil: false,
              }}
              dpr={quality.dpr}
            >
              <color attach="background" args={['#000000']} />
              <Suspense fallback={null}>
                <IntroScene phase={phase} temp={temp} progress={progress} />
                <PostFX phase={phase} />
              </Suspense>
            </Canvas>
          </div>

          {/* Screen-edge ice overlay (HTML, outside Canvas) */}
          <ScreenIce phase={phase} />

          {/* HUD overlay — temperature, phase text, branding */}
          <HUD phase={phase} temp={temp} progress={progress} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   POST-PROCESSING — Bloom + Vignette only (DOF removed - too expensive)
   ============================================================ */
function PostFX({ phase }: { phase: Phase }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const phaseNum = typeof phase === 'number' ? phase : 5;
  const bloomIntensity = phaseNum === 3 || phaseNum === 4 ? 1.4 : phaseNum === 1 ? 0.4 : 0.9;

  // On low-end, ONLY show bloom + vignette (the cinematic essentials)
  // Skip chromatic aberration (very subtle) - saves a GPU pass
  if (!quality.postprocessing) {
    return null;
  }

  return (
    <EffectComposer multisampling={quality.antialias ? 2 : 0}>
      <PostFXPasses
        bloom={quality.enableBloom}
        vignette={quality.enableVignette}
        bloomIntensity={bloomIntensity}
      />
    </EffectComposer>
  );
}

function PostFXPasses({
  bloom,
  vignette,
  bloomIntensity,
}: {
  bloom: boolean;
  vignette: boolean;
  bloomIntensity: number;
}) {
  return (
    <>
      {bloom ? (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
      ) : null}
      {vignette ? <Vignette eskil={false} offset={0.15} darkness={0.85} /> : null}
    </>
  );
}

/* ============================================================
   INTRO SCENE — orchestrates all visual elements
   ============================================================ */
function IntroScene({
  phase,
  temp,
  progress,
}: {
  phase: Phase;
  temp: number;
  progress: number;
}) {
  return (
    <>
      <CameraRig phase={phase} progress={progress} />
      <LightingRig phase={phase} />
      <Bottle phase={phase} temp={temp} />
      <VolumetricBeam phase={phase} />
      <Mist phase={phase} />
      <Droplets phase={phase} />
      <IceParticles phase={phase} temp={temp} />
      <Vapor phase={phase} temp={temp} />
      <ReflectiveFloor phase={phase} />
      <FloatingIceCubes phase={phase} />
    </>
  );
}

/* ============================================================
   CAMERA RIG — cinematic dolly motion
   - Phase 1: extreme close-up, slow orbit
   - Phase 4: rapid dolly out
   - Phase 5: hold on full hero
   ============================================================ */
function CameraRig({ phase, progress }: { phase: Phase; progress: number }) {
  const { camera } = useThree();
  const tRef = useRef(0);

  useFrame((state) => {
    tRef.current = state.clock.elapsedTime;
    const t = tRef.current;
    const p = progress;

    if (phase === 1) {
      // Close-up orbit: camera 0.4 units from bottle surface
      const angle = t * 0.15;
      const radius = 0.42;
      camera.position.x = Math.sin(angle) * radius;
      camera.position.y = Math.cos(t * 0.2) * 0.1;
      camera.position.z = Math.cos(angle) * radius;
      camera.lookAt(0, 0, 0);
    } else if (phase === 2 || phase === 3) {
      // Slow pull back
      const eased = Math.min(1, (p - 0.19) / 0.28);
      const radius = 0.42 + eased * 0.8;
      const angle = t * 0.1;
      camera.position.x = Math.sin(angle) * radius;
      camera.position.y = eased * 0.05;
      camera.position.z = Math.cos(angle) * radius;
      camera.lookAt(0, 0, 0);
    } else if (phase === 4) {
      // Rapid dolly out + slight rise for hero shot
      const t4 = Math.min(1, (p - 0.62) / 0.19);
      const eased = 1 - Math.pow(1 - t4, 3);
      const startZ = 1.2;
      const endZ = 4.5;
      camera.position.z = startZ + (endZ - startZ) * eased;
      camera.position.y = eased * 0.4;
      camera.position.x = 0;
      camera.lookAt(0, 0.2, 0);
    } else if (phase === 5) {
      // Hold on hero, very slow push
      camera.position.set(0, 0.4, 4.5 - progress * 0.2);
      camera.lookAt(0, 0.2, 0);
    }
  });

  return null;
}

/* ============================================================
   LIGHTING RIG — evolves across phases
   - Phase 1: very dark, single red beam
   - Phase 2: cool blue rim from above
   - Phase 3: bottle illuminates, warm key
   - Phase 4: full red volumetric
   - Phase 5: balanced cinematic
   ============================================================ */
function LightingRig({ phase }: { phase: Phase }) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const beamRef = useRef<THREE.SpotLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phaseNum = typeof phase === 'number' ? phase : 5;
    if (keyRef.current) {
      let intensity = 0.05;
      if (phaseNum === 1) intensity = 0.05;
      else if (phaseNum === 2) intensity = 0.2;
      else if (phaseNum === 3) intensity = 1.2;
      else if (phaseNum === 4) intensity = 1.8;
      else if (phaseNum === 5) intensity = 1.5;
      keyRef.current.intensity = intensity;
    }
    if (beamRef.current) {
      beamRef.current.intensity = phaseNum === 1 ? 18 : phaseNum === 2 ? 8 : phaseNum >= 3 ? 3 : 6;
    }
    if (rimRef.current) {
      rimRef.current.intensity = phaseNum === 1 ? 0 : phaseNum === 2 ? 0.6 : phaseNum >= 3 ? 1.4 : 1.0;
      rimRef.current.color.set(phaseNum === 1 || phaseNum === 2 ? '#88aaff' : '#ff3030');
    }
  });

  return (
    <>
      <ambientLight intensity={0.06} color="#ffffff" />
      <directionalLight
        ref={keyRef}
        position={[3, 4, 3]}
        intensity={0.05}
        color="#fff5e0"
      />
      <spotLight
        ref={beamRef}
        position={[0, 5, 0]}
        target-position={[0, 0, 0]}
        angle={0.25}
        penumbra={0.6}
        intensity={18}
        color="#ff2020"
        distance={20}
        decay={1.2}
      />
      <pointLight
        ref={rimRef}
        position={[-2, 1, 2]}
        intensity={0}
        color="#88aaff"
        distance={8}
      />
    </>
  );
}

/* ============================================================
   BOTTLE — the hero asset
   ============================================================ */
function Bottle({ phase, temp }: { phase: Phase; temp: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  const contourPoints = useMemo(() => {
    return [
      [0.0, -1.5], [0.46, -1.5], [0.58, -1.38], [0.66, -1.05], [0.74, -0.55],
      [0.82, -0.05], [0.88, 0.42], [0.86, 0.82], [0.78, 1.12], [0.5, 1.32],
      [0.34, 1.42], [0.3, 1.52], [0.0, 1.52],
    ].map(([x, y]) => new THREE.Vector2(x, y));
  }, []);

  const quality = useMemo(() => getQualitySettings(), []);
  const bodyGeo = useMemo(
    () => new THREE.LatheGeometry(contourPoints, quality.geometrySegments),
    [contourPoints, quality.geometrySegments]
  );
  const liquidGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        contourPoints.map((p) => new THREE.Vector2(p.x * 0.93, p.y * 0.96)),
        quality.geometrySegments
      ),
    [contourPoints, quality.geometrySegments]
  );

  // Procedural environment for reflections - SHARED across scenes
  const { gl } = useThree();
  const envTex = useMemo(() => getSharedEnvMap(gl), [gl]);

  // Carbonation bubbles - activated in phase 3
  const bubbles = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = -1.4 + Math.random() * 2.4;
      const maxR = 0.45 - (y + 1.5) * 0.05;
      const r = Math.sqrt(Math.random()) * maxR;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      speeds[i] = 0.005 + Math.random() * 0.02;
    }
    return { positions, speeds, count };
  }, []);

  // Condensation droplets - grow with cooling
  const droplets = useMemo(() => {
    const count = Math.floor(400 * quality.particlesMultiplier);
    const data: { theta: number; y: number; scale: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        theta: Math.random() * Math.PI * 2,
        y: -1.4 + Math.random() * 2.6,
        scale: 0.003 + Math.random() * 0.01,
        speed: 0.0001 + Math.random() * 0.0008,
        phase: Math.random(),
      });
    }
    return data;
  }, []);

  const bubbleMeshRef = useRef<THREE.Points>(null);
  const dropMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const updateAcc = useRef(0);

  // Drive animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Bottle scale grows during phase 4
      const p4 = phase === 4 ? Math.min(1, (progressAsNumber(state, phase)) * 5) : 1;
      const targetScale = phase === 1 || phase === 2 || phase === 3 ? 1.4 : 1.0;
      const currentScale = groupRef.current.scale.x;
      groupRef.current.scale.x = currentScale + (targetScale - currentScale) * 0.1;
      groupRef.current.scale.y = groupRef.current.scale.x;
      groupRef.current.scale.z = groupRef.current.scale.x;
    }

    // Bubbles - active in phase 3+ (throttled to 30fps on low-end)
    if (bubbleMeshRef.current) {
      const q = getQualitySettings();
      const updateEvery = q.tier === 'low' ? 2 : 1;
      updateAcc.current += delta;
      const active = phase === 3 || phase === 4 || phase === 5;
      if (updateAcc.current >= 1 / 60 * updateEvery) {
        const dt = updateAcc.current;
        updateAcc.current = 0;
        const pos = bubbleMeshRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < bubbles.count; i++) {
          if (active) {
            pos[i * 3 + 1] += bubbles.speeds[i] * 60 * dt;
            if (pos[i * 3 + 1] > 1.3) {
              const theta = Math.random() * Math.PI * 2;
              const y = -1.4;
              const maxR = 0.4;
              pos[i * 3] = Math.cos(theta) * Math.sqrt(Math.random()) * maxR;
              pos[i * 3 + 1] = y;
              pos[i * 3 + 2] = Math.sin(theta) * Math.sqrt(Math.random()) * maxR;
            }
          }
        }
        bubbleMeshRef.current.geometry.attributes.position.needsUpdate = true;
      }
      (bubbleMeshRef.current.material as THREE.PointsMaterial).opacity = active
        ? Math.min(0.95, ((bubbleMeshRef.current.material as THREE.PointsMaterial).opacity || 0) + 0.02)
        : 0;
    }

    // Condensation droplets - grow with cooling
    if (dropMeshRef.current) {
      const coldness = Math.max(0, (20 - temp) / 20); // 0 = warm, 1 = frozen
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        if (phase !== 1) d.y += d.speed * 60 * delta;
        if (d.y > 1.4) d.y = -1.4;
        const t = (d.y + 1.5) / 3.0;
        const r = 0.5 + 0.35 * Math.sin(t * Math.PI);
        const x = Math.cos(d.theta) * r;
        const z = Math.sin(d.theta) * r;
        dummy.position.set(x, d.y, z);
        // Scale up with coldness
        const baseScale = 0.4 + coldness * 1.6;
        dummy.scale.setScalar(d.scale * baseScale);
        dummy.updateMatrix();
        dropMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      dropMeshRef.current.instanceMatrix.needsUpdate = true;
      // Glass frostiness - increase roughness and white tint with coldness
      const mat = dropMeshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.3 + coldness * 0.4;
    }
  });

  return (
    <group ref={groupRef} scale={1.4}>
      <primitive object={envTex} attach="environment" />
      {/* Glass body */}
      <mesh ref={bodyRef} geometry={bodyGeo}>
        <meshPhysicalMaterial
          color="#5a0008"
          metalness={0}
          roughness={0.05}
          transmission={0.85}
          thickness={1.2}
          ior={1.5}
          attenuationColor={new THREE.Color('#3a0005')}
          attenuationDistance={0.4}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      {/* Inner liquid */}
      <mesh ref={liquidRef} geometry={liquidGeo} scale={[0.98, 0.98, 0.98]}>
        <meshPhysicalMaterial
          color="#1a0000"
          metalness={0}
          roughness={0.05}
          transmission={0.95}
          thickness={2.5}
          ior={1.36}
          attenuationColor={new THREE.Color('#0a0000')}
          attenuationDistance={0.25}
          envMapIntensity={0.4}
          clearcoat={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Condensation droplets */}
      <instancedMesh ref={dropMeshRef} args={[undefined, undefined, droplets.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          roughness={0.05}
          metalness={0}
          transmission={0.7}
          ior={1.33}
          thickness={0.05}
        />
      </instancedMesh>
      {/* Carbonation bubbles - hidden until phase 3 */}
      <points ref={bubbleMeshRef} visible={true}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={bubbles.count}
            array={bubbles.positions}
            itemSize={3}
            args={[bubbles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffcccc"
          size={0.022}
          transparent
          opacity={0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Cap */}
      <group position={[0, 1.6, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 32]} />
          <meshStandardMaterial color="#b80000" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.05, 32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
      {/* Label - subtle */}
      <mesh>
        <cylinderGeometry args={[0.88, 0.88, 0.7, 96, 1, true]} />
        <meshStandardMaterial
          color="#e61a27"
          roughness={0.35}
          metalness={0.15}
          side={THREE.DoubleSide}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// helper to read progress in bottle (not needed actually)
function progressAsNumber(state: { clock: THREE.Clock }, _phase: Phase): number {
  return 0;
}

/* ============================================================
   VOLUMETRIC BEAM — god rays from above
   ============================================================ */
function VolumetricBeam({ phase }: { phase: Phase }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      mat.uniforms.uIntensity.value =
        phase === 1 ? 1.2 : phase === 2 ? 0.8 : phase === 3 ? 0.4 : 0.2;
    }
  });
  return (
    <mesh ref={ref} position={[0, 2.5, 0]} rotation={[0, 0, 0]}>
      <coneGeometry args={[1.2, 5, 32, 1, true]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        uniforms={{
          uTime: { value: 0 },
          uIntensity: { value: 1.2 },
        }}
        vertexShader={`
          varying vec2 vUv;
          varying float vDist;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDist = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          varying float vDist;
          void main() {
            float radial = 1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5));
            float vertical = pow(1.0 - vUv.y, 1.5);
            float noise = sin(vUv.y * 20.0 + uTime * 0.5) * 0.1 + 0.9;
            float alpha = radial * vertical * uIntensity * 0.25 * noise;
            vec3 col = mix(vec3(0.4, 0.0, 0.0), vec3(1.0, 0.2, 0.2), vUv.y);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

/* ============================================================
   MIST — drifting fog particles
   ============================================================ */
function Mist({ phase }: { phase: Phase }) {
  const ref = useRef<THREE.Points>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  const count = Math.floor(200 * quality.particlesMultiplier);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, offsets };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(t * 0.2 + data.offsets[i]) * 0.001;
      pos[i * 3 + 1] += 0.0008;
      if (pos[i * 3 + 1] > 1.5) pos[i * 3 + 1] = -1.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity =
      phase === 1 ? 0.6 : phase === 2 ? 0.5 : phase === 3 ? 0.2 : 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aabbcc"
        size={0.12}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================================
   DROPLETS — large floating water droplets in foreground
   ============================================================ */
function Droplets({ phase }: { phase: Phase }) {
  const count = 80;
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3 + 1; // closer to camera
      sizes[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions, sizes };
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.003 + data.sizes[i] * 0.05;
      pos[i * 3] += Math.sin(t * 0.5 + i) * 0.001;
      if (pos[i * 3 + 1] < -2) {
        pos[i * 3 + 1] = 2;
        pos[i * 3] = (Math.random() - 0.5) * 6;
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
          array={data.positions}
          itemSize={3}
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================================
   ICE PARTICLES — small frozen crystals
   ============================================================ */
function IceParticles({ phase, temp }: { phase: Phase; temp: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const count = Math.floor(200 * quality.particlesMultiplier);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sizes[i] = Math.random();
      velocities[i * 3] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = -0.005 - Math.random() * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { positions, sizes, velocities };
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const coldness = Math.max(0, (20 - temp) / 20);
    for (let i = 0; i < count; i++) {
      pos[i * 3] += data.velocities[i * 3] * 60 * delta;
      pos[i * 3 + 1] += data.velocities[i * 3 + 1] * 60 * delta;
      pos[i * 3 + 2] += data.velocities[i * 3 + 2] * 60 * delta;
      if (pos[i * 3 + 1] < -2) {
        pos[i * 3 + 1] = 2.5;
        pos[i * 3] = (Math.random() - 0.5) * 6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = coldness * 0.9;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#cce8ff"
        size={0.035}
        transparent
        opacity={0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================================
   VAPOR — rising cold vapor from the bottle top
   ============================================================ */
function Vapor({ phase, temp }: { phase: Phase; temp: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 60;
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = 1.5 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, offsets };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const coldness = Math.max(0, (20 - temp) / 20);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.008 + coldness * 0.01;
      pos[i * 3] += Math.sin(t + data.offsets[i]) * 0.002;
      if (pos[i * 3 + 1] > 2.5) {
        pos[i * 3 + 1] = 1.5;
        pos[i * 3] = (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = coldness * 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ============================================================
   SCREEN ICE — frost growing from screen edges
   ============================================================ */
function ScreenIce({ phase }: { phase: Phase }) {
  if (phase === 1 || phase === 2) return null;
  const intensity = phase === 3 ? 0.7 : phase === 4 ? 0.3 : 0.1;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top */}
      <div
        className="absolute left-0 right-0 top-0 h-32"
        style={{
          background: `linear-gradient(180deg, rgba(220,235,255,${intensity}) 0%, transparent 100%)`,
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 100%)',
        }}
      />
      {/* Bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(0deg, rgba(220,235,255,${intensity}) 0%, transparent 100%)`,
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 100%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 100%, black 0%, transparent 100%)',
        }}
      />
      {/* Corners */}
      <div className="absolute left-0 top-0 h-64 w-64" style={{
        background: `radial-gradient(circle at 0% 0%, rgba(200,230,255,${intensity * 1.2}) 0%, transparent 70%)`,
      }} />
      <div className="absolute right-0 top-0 h-64 w-64" style={{
        background: `radial-gradient(circle at 100% 0%, rgba(200,230,255,${intensity * 1.2}) 0%, transparent 70%)`,
      }} />
      <div className="absolute bottom-0 left-0 h-64 w-64" style={{
        background: `radial-gradient(circle at 0% 100%, rgba(200,230,255,${intensity * 1.2}) 0%, transparent 70%)`,
      }} />
      <div className="absolute bottom-0 right-0 h-64 w-64" style={{
        background: `radial-gradient(circle at 100% 100%, rgba(200,230,255,${intensity * 1.2}) 0%, transparent 70%)`,
      }} />
    </div>
  );
}

/* ============================================================
   REFLECTIVE FLOOR — revealed in phase 4
   ============================================================ */
function ReflectiveFloor({ phase }: { phase: Phase }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      const mat = ref.current.material as THREE.ShaderMaterial;
      const targetOpacity = phase === 1 || phase === 2 || phase === 3 ? 0 : phase === 4 ? 0.6 : 0.4;
      mat.uniforms.uOpacity.value += (targetOpacity - mat.uniforms.uOpacity.value) * 0.05;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5);
            float alpha = smoothstep(0.4, 0.0, d) * uOpacity;
            // grid for depth
            float grid = step(0.98, fract(vUv.x * 20.0)) + step(0.98, fract(vUv.y * 20.0));
            vec3 col = vec3(0.3, 0.0, 0.0) + grid * 0.05;
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

/* ============================================================
   FLOATING ICE CUBES — appear in phase 4
   ============================================================ */
function FloatingIceCubes({ phase }: { phase: Phase }) {
  const ref = useRef<THREE.Group>(null);
  const cubes = useMemo(() => {
    return [
      { x: 1.4, y: 0.3, z: 0.5, scale: 0.16, speed: 0.3, phase: 0 },
      { x: -1.3, y: -0.4, z: 0.3, scale: 0.13, speed: 0.4, phase: 1.5 },
      { x: 1.0, y: -0.6, z: -0.5, scale: 0.14, speed: 0.35, phase: 3.0 },
      { x: -1.1, y: 0.5, z: -0.4, scale: 0.12, speed: 0.45, phase: 4.5 },
      { x: 0.6, y: 0.9, z: 0.8, scale: 0.11, speed: 0.5, phase: 6.0 },
    ];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const visible = phase === 4 || phase === 5;
    ref.current.children.forEach((child, i) => {
      const c = cubes[i];
      const a = t * c.speed + c.phase;
      const radius = 1.2 + Math.sin(t * 0.3 + c.phase) * 0.1;
      child.position.x = Math.cos(a) * radius + c.x * 0.3;
      child.position.z = Math.sin(a) * radius + c.z * 0.3;
      child.position.y = c.y + Math.sin(t + c.phase) * 0.15;
      child.rotation.x = t * 0.4 * c.speed;
      child.rotation.y = t * 0.5 * c.speed;
      // Scale up when visible
      const targetScale = visible ? c.scale : 0;
      const s = child.scale.x;
      child.scale.setScalar(s + (targetScale - s) * 0.05);
    });
  });

  return (
    <group ref={ref}>
      {cubes.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} scale={0}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color="#e8f4ff"
            metalness={0}
            roughness={0.05}
            transmission={0.95}
            thickness={0.5}
            ior={1.31}
            attenuationColor="#cce6ff"
            attenuationDistance={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   HUD — temperature, phase text, brand mark
   ============================================================ */
function HUD({ phase, temp, progress }: { phase: Phase; temp: number; progress: number }) {
  const phaseText = {
    1: 'ATMOSPHERE',
    2: 'COOLING',
    3: 'CRYSTALLIZING',
    4: 'REVEAL',
    5: 'TASTE THE FEELING',
  }[phase as 1 | 2 | 3 | 4 | 5];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Top-left brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: (typeof phase === 'number' && phase >= 3) ? 1 : 0.4, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute left-8 top-8"
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/40">
          The Coca‑Cola Company
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
          Cinematic Experience
        </div>
      </motion.div>

      {/* Top-right progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute right-8 top-8 text-right"
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">
          {phaseText}
        </div>
        <div className="mt-2 h-px w-32 overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-cc-red"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-white/30">
          {Math.round(progress * 100)}%
        </div>
      </motion.div>

      {/* Bottom-center temperature display (phase 2) */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40">
              Core Temperature
            </div>
            <div className="mt-3 font-display text-7xl font-black text-white md:text-8xl">
              {temp.toFixed(0)}°<span className="text-cc-red">C</span>
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.4em] text-white/30">
              {temp > 15 ? 'AMBIENT' : temp > 8 ? 'CHILLED' : temp > 3 ? 'COLD' : 'FROZEN'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom scan line (always) */}
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">
          Reel · 001
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">
          {new Date().getFullYear()} · Atlanta · GA
        </div>
      </div>

      {/* Center hero text — phase 5 */}
      <AnimatePresence>
        {phase === 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-end pb-32 text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(3rem,10vw,9rem)] font-black leading-[0.85] tracking-tight"
            >
              <span className="block text-white">TASTE</span>
              <span className="block italic text-cc-red">THE</span>
              <span className="block bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent">
                FEELING
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-xl text-base text-white/70 md:text-lg"
            >
              Crafted for moments that matter.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3 reveal flash overlay */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.2, times: [0, 0.5, 1] }}
            className="pointer-events-none absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Cinematic letterbox bars */}
      <div className="absolute left-0 right-0 top-0 h-[6vh] bg-black" />
      <div className="absolute bottom-0 left-0 right-0 h-[6vh] bg-black" />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_black_90%)]" />
    </div>
  );
}

export default CinematicIntro;
