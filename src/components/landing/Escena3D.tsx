import { Canvas, useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Grafo 3D: posiciones de los nodos y aristas (índices). La ruta resaltada recorre los nodos de CAMINO.
const NODOS: [number, number, number][] = [
  [-3.2, 0.2, 0.4], [-1.8, 1.6, -0.6], [-1.6, -1.4, 0.8], [0, 2.0, 0.4], [0.2, -0.2, -1.0],
  [0.1, -2.0, 0.6], [1.9, 1.3, -0.4], [2.0, -1.2, 0.5], [3.3, 0.1, 0],
];
const ARISTAS: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [3, 4]];
const CAMINO = [0, 2, 4, 7, 8];
const esRuta = (a: number, b: number): boolean => CAMINO.some((n, i) => i < CAMINO.length - 1 && ((n === a && CAMINO[i + 1] === b) || (n === b && CAMINO[i + 1] === a)));

function GrafoFlotante() {
  const grupo = useRef<THREE.Group>(null);
  const nodos = useRef<THREE.InstancedMesh>(null);
  const aristas = useRef<THREE.InstancedMesh>(null);
  const pulso = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    const color = new THREE.Color();
    NODOS.forEach((p, i) => {
      m.position.set(...p);
      m.scale.setScalar(CAMINO.includes(i) ? 1.35 : 1);
      m.updateMatrix();
      nodos.current?.setMatrixAt(i, m.matrix);
      nodos.current?.setColorAt(i, color.set(CAMINO.includes(i) ? '#fbbf24' : '#60a5fa'));
    });
    ARISTAS.forEach(([a, b], i) => {
      const pa = new THREE.Vector3(...NODOS[a]);
      const pb = new THREE.Vector3(...NODOS[b]);
      const dir = pb.clone().sub(pa);
      m.position.copy(pa).add(pb).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      m.scale.set(esRuta(a, b) ? 1.8 : 1, dir.length(), esRuta(a, b) ? 1.8 : 1);
      m.updateMatrix();
      aristas.current?.setMatrixAt(i, m.matrix);
      aristas.current?.setColorAt(i, color.set(esRuta(a, b) ? '#fbbf24' : '#3b82f6'));
    });
    [nodos.current, aristas.current].forEach((x) => {
      if (x) {
        x.instanceMatrix.needsUpdate = true;
        if (x.instanceColor) x.instanceColor.needsUpdate = true;
      }
    });
  }, []);

  const puntosCamino = useMemo(() => CAMINO.map((i) => new THREE.Vector3(...NODOS[i])), []);

  useFrame(({ pointer, clock }, dt) => {
    const g = grupo.current;
    if (g) {
      g.rotation.y += dt * 0.12;
      g.rotation.x += (pointer.y * 0.35 - g.rotation.x) * 0.05; // parallax con el puntero
      g.position.x += (pointer.x * 0.4 - g.position.x) * 0.05;
    }
    if (pulso.current) {
      const t = (clock.elapsedTime * 0.28) % 1;
      const f = t * (puntosCamino.length - 1);
      const i = Math.min(puntosCamino.length - 2, Math.floor(f));
      pulso.current.position.lerpVectors(puntosCamino[i], puntosCamino[i + 1], f - i);
    }
  });

  return (
    <group ref={grupo}>
      <instancedMesh ref={nodos} args={[undefined, undefined, NODOS.length]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial emissive="#1d4ed8" emissiveIntensity={0.6} roughness={0.3} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={aristas} args={[undefined, undefined, ARISTAS.length]}>
        <cylinderGeometry args={[0.035, 0.035, 1, 8]} />
        <meshBasicMaterial transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <mesh ref={pulso}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
        <pointLight color="#fbbf24" intensity={6} distance={4} />
      </mesh>
    </group>
  );
}

function Estrellas() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(360 * 3);
    for (let i = 0; i < p.length; i++) p[i] = (Math.random() - 0.5) * 18;
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.03} color="#93c5fd" transparent opacity={0.7} />
    </points>
  );
}

/** Escena 3D del hero: grafo flotante con un pulso de luz recorriendo la ruta más corta. */
export default function Escena3D() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 7.5], fov: 50 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} aria-label="Grafo tridimensional animado">
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={40} />
      <GrafoFlotante />
      <Estrellas />
    </Canvas>
  );
}
