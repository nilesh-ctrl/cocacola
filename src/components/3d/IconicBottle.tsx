'use client';

import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { getQualitySettings } from '@/lib/performance';

/* ============================================================
   ICONIC COCA-COLA CONTOUR BOTTLE
   - Accurate narrow-waist silhouette
   - Tall, elegant proportions (~3.2:1 height:width)
   - Realistic glass thickness
   - Premium reflections
   ============================================================ */

/* The contour profile, hand-tuned to match the iconic 1915 design
   y goes from base (negative) to neck (positive)
   x is radius at each height */
const contourPoints: [number, number][] = [
  [0.0,  -1.60],   // base center
  [0.42, -1.60],   // base outer
  [0.46, -1.55],   // base bevel
  [0.49, -1.45],   // hip start
  [0.52, -1.30],   // hip
  [0.54, -1.10],   // waist upper hip
  [0.52, -0.85],   // lower waist transition
  [0.46, -0.60],   // WAIST (narrowest)
  [0.42, -0.35],   // waist upper
  [0.40, -0.10],   // shoulder rise
  [0.42,  0.15],   // upper shoulder
  [0.46,  0.40],   // shoulder peak
  [0.50,  0.65],   // neck base flare
  [0.42,  0.85],   // neck start
  [0.30,  1.00],   // neck
  [0.27,  1.15],   // neck mid
  [0.28,  1.32],   // upper neck
  [0.32,  1.45],   // collar
  [0.30,  1.50],   // lip base
  [0.0,   1.50],   // top center
];

function buildContourLathe() {
  return contourPoints.map(([x, y]) => new THREE.Vector2(x, y));
}

/* Subtle label - a thin red band on the lower half (the iconic ribbon) */
function BottleLabel() {
  const labelTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 384;
    const ctx = c.getContext('2d')!;
    // transparent background - just the Coca-Cola logo
    ctx.clearRect(0, 0, 2048, 384);
    // subtle red band as backdrop hint
    ctx.fillStyle = 'rgba(230,26,39,0.0)';
    ctx.fillRect(0, 0, 2048, 384);
    // Coca-Cola text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 200px "Playfair Display", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Coca‑Cola', 1024, 180);
    // EST tagline
    ctx.font = '500 32px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('EST · 1886', 1024, 310);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
  }, []);

  return (
    <mesh position={[0, -0.1, 0]}>
      <cylinderGeometry args={[0.45, 0.5, 0.55, 96, 1, true]} />
      <meshStandardMaterial
        map={labelTex}
        roughness={0.4}
        metalness={0.1}
        side={THREE.DoubleSide}
        transparent
        alphaTest={0.05}
        depthWrite={false}
      />
    </mesh>
  );
}

/* Inner liquid — slightly inset from glass */
function Liquid() {
  const quality = useMemo(() => getQualitySettings(), []);
  const liquidPoints = useMemo(
    () =>
      contourPoints
        .filter(([_, y]) => y < 1.0) // don't fill the neck
        .map(([x, y]) => new THREE.Vector2(x * 0.95, y * 0.97)),
    []
  );
  const liquidGeo = useMemo(
    () => new THREE.LatheGeometry(liquidPoints, quality.geometrySegments),
    [liquidPoints, quality.geometrySegments]
  );
  return (
    <mesh geometry={liquidGeo}>
      <meshPhysicalMaterial
        color="#1a0000"
        metalness={0}
        roughness={0.05}
        transmission={quality.transmission ? 0.92 : 0}
        thickness={2.5}
        ior={1.36}
        attenuationColor={new THREE.Color('#0a0000')}
        attenuationDistance={0.25}
        envMapIntensity={0.5}
        clearcoat={quality.transmission ? 0.8 : 0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* Carbonation bubbles inside the liquid */
function Carbonation({ count = 180 }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds, baseY } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const baseY = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = -1.5 + Math.random() * 2.3; // liquid range
      const maxR = 0.4 - (y + 1.5) * 0.08;
      const r = Math.sqrt(Math.random()) * Math.max(0.05, maxR);
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      baseY[i] = y;
      speeds[i] = 0.004 + Math.random() * 0.018;
    }
    return { positions, speeds, baseY };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * 60 * delta;
      pos[i * 3] += Math.sin(t * 3 + i) * 0.0006;
      pos[i * 3 + 2] += Math.cos(t * 2.5 + i * 0.7) * 0.0006;
      if (pos[i * 3 + 1] > 1.0) {
        const theta = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(theta) * 0.1;
        pos[i * 3 + 1] = baseY[i];
        pos[i * 3 + 2] = Math.sin(theta) * 0.1;
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
        color="#ffcccc"
        size={0.018}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* Condensation droplets streaming down the glass surface */
function Condensation({ count = 320 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const droplets = useMemo(() => {
    const arr: { theta: number; y: number; scale: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        theta: Math.random() * Math.PI * 2,
        y: -1.55 + Math.random() * 2.8,
        scale: 0.003 + Math.random() * 0.009,
        speed: 0.0002 + Math.random() * 0.0008,
      });
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < droplets.length; i++) {
      const d = droplets[i];
      d.y += d.speed * 60 * delta;
      if (d.y > 1.4) d.y = -1.55;
      // radius from contour at this height
      let r = 0.45;
      const y = d.y;
      if (y < -1.0) r = 0.5;
      else if (y < -0.5) r = 0.52;
      else if (y < 0) r = 0.45;
      else if (y < 0.5) r = 0.42;
      else r = 0.32;
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
      <sphereGeometry args={[1, 6, 6]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.5}
        roughness={0.05}
        metalness={0}
        transmission={0.7}
        ior={1.33}
        thickness={0.05}
      />
    </instancedMesh>
  );
}

/* Cold vapor particles drifting around bottle base */
function Vapor({ count = 100 }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 1] = -1.5 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, offsets };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.002 + Math.random() * 0.001;
      pos[i * 3] += Math.sin(t * 0.3 + data.offsets[i]) * 0.001;
      if (pos[i * 3 + 1] > 0.5) {
        pos[i * 3 + 1] = -1.5;
        pos[i * 3] = (Math.random() - 0.5) * 2;
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
        color="#aac8e0"
        size={0.06}
        transparent
        opacity={0.25}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* Reflective black floor with subtle red rim glow */
function ReflectiveFloor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.85}
          roughness={0.2}
          envMapIntensity={0.4}
        />
      </mesh>
      {/* Red rim glow ring on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.61, 0]}>
        <ringGeometry args={[1.5, 4, 64]} />
        <meshBasicMaterial
          color="#e61a27"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

/* The full bottle composition (inside Canvas) */
function BottleComposition({ pointer }: { pointer: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  const contour = useMemo(buildContourLathe, []);
  const bodyGeo = useMemo(
    () => new THREE.LatheGeometry(contour, quality.geometrySegments),
    [contour, quality.geometrySegments]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Slow premium rotation
    groupRef.current.rotation.y = t * 0.12 + pointer.x * 0.3;
    groupRef.current.rotation.x = pointer.y * 0.08;
    // Subtle floating
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.03;
  });

  return (
    <>
      <BottleCap />
      {/* The glass body */}
      <mesh geometry={bodyGeo} castShadow={quality.shadows}>
        <meshPhysicalMaterial
          color="#5a0008"
          metalness={0}
          roughness={0.06}
          transmission={quality.transmission ? 0.85 : 0}
          thickness={1.0}
          ior={1.5}
          attenuationColor={new THREE.Color('#3a0005')}
          attenuationDistance={0.45}
          envMapIntensity={1.8}
          clearcoat={quality.transmission ? 1 : 0.4}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
          transparent
          opacity={0.95}
        />
      </mesh>
      <Liquid />
      <BottleLabel />
      <Carbonation count={Math.floor(180 * quality.particlesMultiplier)} />
      <Condensation count={Math.floor(320 * quality.particlesMultiplier)} />
      <Vapor />
    </>
  );
}

function BottleCap() {
  return (
    <group position={[0, 1.58, 0]}>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 32]} />
        <meshStandardMaterial color="#b80000" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Cap ridges */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.165, 0, Math.sin(a) * 0.165]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.006, 0.16, 0.015]} />
            <meshStandardMaterial color="#880000" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

/* Procedural environment for glass reflections */
function ProceduralEnv() {
  const { gl, scene } = useThree();
  const envTex = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    // Backdrop
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `varying vec3 vWorld; void main() { vWorld = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          varying vec3 vWorld;
          void main() {
            vec3 n = normalize(vWorld);
            float v = n.y * 0.5 + 0.5;
            vec3 top = vec3(0.05, 0.0, 0.0);
            vec3 mid = vec3(0.15, 0.0, 0.0);
            vec3 bot = vec3(0.0);
            vec3 c = mix(bot, mix(mid, top, smoothstep(0.4, 1.0, v)), smoothstep(0.0, 0.6, v));
            // red rim from above
            float rim = pow(1.0 - abs(n.y), 3.0);
            c += vec3(0.5, 0.05, 0.05) * rim * 0.6;
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      })
    );
    envScene.add(sphere);
    // bright lights for highlights
    const l1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 8, 6) })
    );
    l1.position.set(8, 8, 5);
    envScene.add(l1);
    const l2 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 1, 1) })
    );
    l2.position.set(-7, 2, 3);
    envScene.add(l2);
    const l3 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(12, 10, 8) })
    );
    l3.position.set(0, -6, 4);
    envScene.add(l3);
    // strip lights
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 5, 0.2),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4, 3) })
      );
      strip.position.set(Math.cos(a) * 6, 3, Math.sin(a) * 6);
      envScene.add(strip);
    }
    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  }, [gl]);

  return <primitive object={envTex} attach="environment" />;
}

/* Scene with camera + lights + bottle + floor + post */
function HeroBottleScene({ pointer }: { pointer: { x: number; y: number } }) {
  const quality = useMemo(() => getQualitySettings(), []);

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 8, 25]} />

      <ProceduralEnv />

      <ambientLight intensity={0.15} color="#ffffff" />
      {/* Key light - warm */}
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.6}
        color="#fff0d8"
        castShadow={quality.shadows}
      />
      {/* Red rim light */}
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#ff2030" />
      {/* Front fill */}
      <pointLight position={[0, 2, 5]} intensity={0.6} color="#ffffff" distance={15} />
      {/* Red ambient bottom */}
      <pointLight position={[0, -1, 2]} intensity={1.2} color="#ff4040" distance={8} />
      {/* Top spot for hero glow */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.4}
        penumbra={0.7}
        intensity={1.5}
        color="#ffffff"
        distance={15}
        castShadow={quality.shadows}
      />

      <ReflectiveFloor />

      {/* The bottle group - centered, premium presentation */}
      <group position={[0, 0, 0]}>
        <BottleComposition pointer={pointer} />
      </group>

      {quality.shadows && (
        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.6}
          scale={6}
          blur={2.5}
          far={3}
          color="#000000"
        />
      )}

      {quality.postprocessing ? (
        <EffectComposer multisampling={quality.antialias ? 4 : 0}>
          <PostEffects
            bloom={quality.enableBloom}
            chromatic={quality.enableChromatic}
            vignette={quality.enableVignette}
          />
        </EffectComposer>
      ) : null}
    </>
  );
}

/* Inner component to avoid the conditional Element type issue */
function PostEffects({
  bloom,
  chromatic,
  vignette,
}: {
  bloom: boolean;
  chromatic: boolean;
  vignette: boolean;
}) {
  return (
    <>
      {bloom ? (
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      ) : null}
      {chromatic ? (
        <ChromaticAberration
          offset={new THREE.Vector2(0.0005, 0.0005)}
          radialModulation={false}
          modulationOffset={0.5}
        />
      ) : null}
      {vignette ? <Vignette eskil={false} offset={0.3} darkness={0.6} /> : null}
    </>
  );
}

/* The exported wrapper - ready to drop into Hero */
export function IconicBottle({
  pointer = { x: 0, y: 0 },
}: {
  pointer?: { x: number; y: number };
}) {
  const quality = useMemo(() => getQualitySettings(), []);
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.2], fov: 28 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={quality.dpr}
      style={{ background: 'transparent' }}
      shadows={quality.shadows}
    >
      <Suspense fallback={null}>
        <HeroBottleScene pointer={pointer} />
      </Suspense>
    </Canvas>
  );
}

export default IconicBottle;
