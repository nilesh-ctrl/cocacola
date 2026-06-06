'use client';

import { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { getQualitySettings } from '@/lib/performance';

/* ===========================================================
   INTERACTIVE 3D GLOBE WITH LIGHT TRAILS
   =========================================================== */
export function GlobeScene() {
  const quality = useMemo(() => getQualitySettings(), []);
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.tier === 'low' ? 'low-power' : 'high-performance',
        stencil: false,
      }}
      dpr={quality.dpr}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, 3]} intensity={1.5} color="#ff2030" />
      <pointLight position={[5, 2, -2]} intensity={0.8} color="#ff8080" />

      <Globe />
      <LightTrails />
      <Atmosphere />
    </Canvas>
  );
}

function Globe() {
  const ref = useRef<THREE.Mesh>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  const pointCount = Math.floor(200 * quality.particlesMultiplier);

  // Generate dotted land masses as InstancedMesh
  const landPoints = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    // pseudo continents via clusters
    const clusters = [
      { c: [0.3, 0.5], w: 1.2, h: 0.8 },  // North America
      { c: [-0.5, 0.0], w: 0.5, h: 1.0 }, // South America
      { c: [0.0, 0.6], w: 0.7, h: 0.5 },  // Europe
      { c: [0.2, 0.2], w: 1.0, h: 0.8 },  // Africa
      { c: [0.7, 0.4], w: 1.0, h: 0.6 },  // Asia
      { c: [0.9, -0.4], w: 0.4, h: 0.2 }, // Australia
    ];
    clusters.forEach((cl) => {
      for (let i = 0; i < pointCount; i++) {
        const x = (Math.random() - 0.5) * cl.w;
        const y = (Math.random() - 0.5) * cl.h;
        const z = (Math.random() - 0.5) * 0.2;
        const v = new THREE.Vector3(
          cl.c[0] + x,
          cl.c[1] + y,
          z
        );
        if (v.length() < 0.95) arr.push(v);
      }
    });
    return arr;
  }, [pointCount]);

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set instance matrices once after the ref is attached
  useLayoutEffect(() => {
    if (!instancedRef.current) return;
    const m = instancedRef.current;
    landPoints.forEach((p, i) => {
      dummy.position.copy(p.normalize().multiplyScalar(1.5));
      dummy.lookAt(0, 0, 0);
      dummy.scale.setScalar(0.012);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [landPoints, dummy]);

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group>
      {/* Solid sphere base */}
      <mesh ref={ref}>
        <sphereGeometry args={[1.5, quality.geometrySegments, quality.geometrySegments]} />
        <meshStandardMaterial
          color="#0a0a14"
          metalness={0.4}
          roughness={0.6}
          emissive="#1a0000"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Glowing wireframe */}
      <mesh>
        <sphereGeometry args={[1.52, 16, 8]} />
        <meshBasicMaterial color="#ff2030" wireframe transparent opacity={0.15} />
      </mesh>
      {/* Dotted continents */}
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, landPoints.length]}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ff4040" />
      </instancedMesh>
      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.58, 32]} />
        <meshBasicMaterial color="#ff2030" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Atmosphere() {
  const quality = useMemo(() => getQualitySettings(), []);
  return (
    <mesh>
      <sphereGeometry args={[1.7, 16, 16]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{
          uColor: { value: new THREE.Color('#ff2030') },
        }}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(uColor, intensity * 0.7);
          }
        `}
      />
    </mesh>
  );
}

function LightTrails() {
  const groupRef = useRef<THREE.Group>(null);
  const trailsRef = useRef<THREE.Group>(null);

  // 12 connection arcs
  const arcs = useMemo(() => {
    const pts: THREE.Vector3[][] = [];
    const cities: [number, number][] = [
      [0.3, 0.5], [-0.5, 0.0], [0.0, 0.6], [0.2, 0.2], [0.7, 0.4],
      [0.9, -0.4], [-0.4, 0.7], [0.5, 0.7], [-0.2, 0.4], [0.6, -0.2],
    ];
    for (let i = 0; i < 18; i++) {
      const a = cities[Math.floor(Math.random() * cities.length)];
      const b = cities[Math.floor(Math.random() * cities.length)];
      const va = new THREE.Vector3(a[0], a[1], 0).normalize().multiplyScalar(1.55);
      const vb = new THREE.Vector3(b[0], b[1], 0).normalize().multiplyScalar(1.55);
      const mid = va.clone().add(vb).multiplyScalar(0.5);
      const dist = va.distanceTo(vb);
      mid.normalize().multiplyScalar(1.55 + dist * 0.5);
      const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
      pts.push(curve.getPoints(40));
    }
    return pts;
  }, []);

  useFrame((s) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = s.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {arcs.map((points, i) => {
        // Build lineSegments geometry from polyline
        const positions: number[] = [];
        for (let j = 0; j < points.length - 1; j++) {
          positions.push(
            points[j].x, points[j].y, points[j].z,
            points[j + 1].x, points[j + 1].y, points[j + 1].z
          );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return (
          // @ts-ignore - R3F lineSegments works at runtime
          <lineSegments key={i} geometry={geo}>
            <lineBasicMaterial color="#ff5050" transparent opacity={0.5} />
          </lineSegments>
        );
      })}
      {/* City markers */}
      {[
        [0.3, 0.5], [-0.5, 0.0], [0.0, 0.6], [0.2, 0.2], [0.7, 0.4],
        [0.9, -0.4], [-0.4, 0.7], [0.5, 0.7],
      ].map(([x, y], i) => {
        const v = new THREE.Vector3(x, y, 0).normalize().multiplyScalar(1.55);
        return (
          <mesh key={i} position={v}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#ff8080" />
          </mesh>
        );
      })}
    </group>
  );
}

export default GlobeScene;
