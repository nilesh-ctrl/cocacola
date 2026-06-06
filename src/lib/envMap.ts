/**
 * Shared procedural environment map.
 * Built ONCE and cached — reused across all 3D scenes.
 */
import * as THREE from 'three';

let cachedEnvTexture: THREE.Texture | null = null;
let cachedGenerator: THREE.PMREMGenerator | null = null;

export function getSharedEnvMap(gl: THREE.WebGLRenderer): THREE.Texture {
  if (cachedEnvTexture) return cachedEnvTexture;

  const pmrem = new THREE.PMREMGenerator(gl);
  cachedGenerator = pmrem;
  const envScene = new THREE.Scene();

  // Backdrop sphere with gradient
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
          float rim = pow(1.0 - abs(n.y), 3.0);
          c += vec3(0.5, 0.05, 0.05) * rim * 0.6;
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    })
  );
  envScene.add(sphere);

  // Bright lights for highlights
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

  // Strip lights (3 instead of 4 — minor cost saving)
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
  cachedEnvTexture = rt.texture;
  return cachedEnvTexture;
}

/** Cleanup on hot reload */
export function disposeSharedEnvMap() {
  if (cachedEnvTexture) {
    cachedEnvTexture.dispose();
    cachedEnvTexture = null;
  }
  if (cachedGenerator) {
    cachedGenerator.dispose();
    cachedGenerator = null;
  }
}
