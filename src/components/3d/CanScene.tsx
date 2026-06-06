'use client';

import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { getQualitySettings } from '@/lib/performance';

/* A can is a tall cylinder with a custom label texture */
type CanFlavor = {
  name: string;
  primary: string;
  accent: string;
  accent2: string;
  tagline: string;
};

const FLAVORS: CanFlavor[] = [
  { name: 'Coca‑Cola', primary: '#e61a27', accent: '#7a0000', accent2: '#ff4040', tagline: 'THE ORIGINAL' },
  { name: 'Zero Sugar', primary: '#0a0a0a', accent: '#3a3a3a', accent2: '#ffffff', tagline: 'ZERO CALORIES' },
  { name: 'Diet Coke', primary: '#c0c0c8', accent: '#5a5a60', accent2: '#ffffff', tagline: 'LIGHT & CRISP' },
  { name: 'Cherry', primary: '#a0001a', accent: '#3a0008', accent2: '#ff4060', tagline: 'BOLD CHERRY' },
];

function makeCanTexture(flavor: CanFlavor) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 2048);
  g.addColorStop(0, flavor.primary);
  g.addColorStop(0.6, flavor.primary);
  g.addColorStop(1, flavor.accent);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 2048);
  // highlight strip
  const hl = ctx.createLinearGradient(0, 0, 1024, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.18)');
  hl.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  hl.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 600, 1024, 800);
  // wave
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, 1100);
  for (let x = 0; x <= 1024; x += 4) {
    ctx.lineTo(x, 1100 + Math.sin(x * 0.015) * 30);
  }
  ctx.lineTo(1024, 2048);
  ctx.lineTo(0, 2048);
  ctx.closePath();
  ctx.fill();
  // text
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 900 280px "Playfair Display", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(flavor.name, 512, 800);
  ctx.font = '500 60px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.fillText(flavor.tagline, 512, 1300);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

export function CanScene({ flavorIndex = 0 }: { flavorIndex?: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 30 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
        stencil: false,
      }}
      dpr={quality.dpr}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, 2, 3]} intensity={0.8} color={FLAVORS[flavorIndex].accent2} />
      <pointLight position={[0, 2, 3]} intensity={1} color="#ff4040" />
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
        <Can flavor={FLAVORS[flavorIndex]} />
      </Float>
    </Canvas>
  );
}

function Can({ flavor }: { flavor: CanFlavor }) {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(() => makeCanTexture(flavor), [flavor]);
  const quality = useMemo(() => getQualitySettings(), []);
  const segs = quality.geometrySegments;

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group ref={ref} scale={0.7}>
      {/* body */}
      <mesh>
        <cylinderGeometry args={[0.6, 0.6, 1.8, segs, 1, true]} />
        <meshStandardMaterial
          map={tex}
          metalness={0.85}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* top */}
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, segs]} />
        <meshStandardMaterial color="#aaaaaa" metalness={1} roughness={0.3} />
      </mesh>
      {/* bottom */}
      <mesh position={[0, -0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, segs]} />
        <meshStandardMaterial color="#888888" metalness={1} roughness={0.4} />
      </mesh>
      {/* top rim */}
      <mesh position={[0, 0.91, 0]}>
        <torusGeometry args={[0.6, 0.02, 8, segs]} />
        <meshStandardMaterial color="#888" metalness={1} roughness={0.2} />
      </mesh>
      {/* pull tab */}
      <group position={[0, 0.92, 0.1]}>
        <mesh>
          <ringGeometry args={[0.06, 0.12, Math.max(8, Math.floor(segs / 4))]} />
          <meshStandardMaterial color="#bbbbbb" metalness={1} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.18, 0, 0]}>
          <boxGeometry args={[0.25, 0.02, 0.04]} />
          <meshStandardMaterial color="#bbbbbb" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default CanScene;
