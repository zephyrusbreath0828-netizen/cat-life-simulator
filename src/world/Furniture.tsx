import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { mulberry32, makeArtTexture, makeFabricTexture } from '../systems/textures'

/* ---------------------------------- ソファ ---------------------------------- */

export function Sofa() {
  const fabric = useMemo(() => makeFabricTexture('#96a48d'), [])
  const fabricLight = useMemo(() => makeFabricTexture('#a4b19a'), [])
  const sofaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: fabric, roughness: 0.95 }),
    [fabric],
  )
  const cushionMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: fabricLight, roughness: 0.95 }),
    [fabricLight],
  )
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5f4429', roughness: 0.55 }),
    [],
  )
  const pillowA = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c47a4e', roughness: 0.95 }),
    [],
  )
  const pillowB = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e8dcc4', roughness: 0.95 }),
    [],
  )

  return (
    <group position={[0, 0, 1.9]}>
      {/* 脚 */}
      {[
        [-1.05, 0.4],
        [1.05, 0.4],
        [-1.05, -0.4],
        [1.05, -0.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} material={woodMat} castShadow>
          <boxGeometry args={[0.07, 0.08, 0.07]} />
        </mesh>
      ))}
      {/* 土台 */}
      <RoundedBox args={[2.3, 0.34, 0.95]} radius={0.05} smoothness={3} position={[0, 0.25, 0]} material={sofaMat} castShadow receiveShadow />
      {/* 肘掛け */}
      <RoundedBox args={[0.22, 0.62, 0.95]} radius={0.07} smoothness={3} position={[-1.04, 0.39, 0]} material={sofaMat} castShadow />
      <RoundedBox args={[0.22, 0.62, 0.95]} radius={0.07} smoothness={3} position={[1.04, 0.39, 0]} material={sofaMat} castShadow />
      {/* 背もたれ */}
      <RoundedBox args={[2.3, 0.72, 0.2]} radius={0.06} smoothness={3} position={[0, 0.78, 0.37]} material={sofaMat} castShadow receiveShadow />
      {/* 座面クッション */}
      <RoundedBox args={[1.0, 0.16, 0.78]} radius={0.05} smoothness={3} position={[-0.53, 0.5, -0.03]} material={cushionMat} castShadow />
      <RoundedBox args={[1.0, 0.16, 0.78]} radius={0.05} smoothness={3} position={[0.53, 0.5, -0.03]} material={cushionMat} castShadow />
      {/* 背もたれクッション */}
      <RoundedBox args={[0.96, 0.42, 0.14]} radius={0.06} smoothness={3} position={[-0.53, 0.76, 0.28]} rotation={[-0.08, 0, 0]} material={cushionMat} castShadow />
      <RoundedBox args={[0.96, 0.42, 0.14]} radius={0.06} smoothness={3} position={[0.53, 0.76, 0.28]} rotation={[-0.08, 0, 0]} material={cushionMat} castShadow />
      {/* 投げクッション */}
      <RoundedBox args={[0.4, 0.4, 0.13]} radius={0.07} smoothness={4} position={[-0.92, 0.63, 0.16]} rotation={[-0.15, 0.3, 0.12]} material={pillowA} castShadow />
      <RoundedBox args={[0.38, 0.38, 0.13]} radius={0.07} smoothness={4} position={[0.92, 0.62, 0.16]} rotation={[-0.15, -0.25, -0.1]} material={pillowB} castShadow />
      {/* 西側の肘掛けにかけた毛布 */}
      <mesh position={[-1.04, 0.72, 0.02]} rotation={[0, 0, 0.04]} material={pillowB} castShadow>
        <boxGeometry args={[0.26, 0.05, 0.8]} />
      </mesh>
      <mesh position={[-1.04, 0.6, -0.32]} rotation={[0, 0, 0.02]} material={pillowB} castShadow>
        <boxGeometry args={[0.24, 0.22, 0.06]} />
      </mesh>
    </group>
  )
}

/* --------------------------------- ローテーブル --------------------------------- */

export function CoffeeTable() {
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.55 }),
    [],
  )
  const bookA = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3f6b5e', roughness: 0.7 }),
    [],
  )
  const bookB = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a4553f', roughness: 0.7 }),
    [],
  )
  const mugMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d95d39', roughness: 0.4 }),
    [],
  )
  return (
    <group position={[0, 0, 0.5]}>
      <RoundedBox args={[1.2, 0.05, 0.6]} radius={0.02} smoothness={3} position={[0, 0.44, 0]} material={woodMat} castShadow receiveShadow />
      {[
        [-0.53, -0.24],
        [0.53, -0.24],
        [-0.53, 0.24],
        [0.53, 0.24],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.21, z]} material={woodMat} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, 0.16, 0]} material={woodMat} castShadow>
        <boxGeometry args={[1.0, 0.028, 0.44]} />
      </mesh>
      {/* 本の山 + マグカップ */}
      <mesh position={[-0.25, 0.479, 0.02]} rotation={[0, 0.15, 0]} castShadow material={bookA}>
        <boxGeometry args={[0.26, 0.028, 0.19]} />
      </mesh>
      <mesh position={[-0.25, 0.505, 0.02]} rotation={[0, 0.45, 0]} castShadow material={bookB}>
        <boxGeometry args={[0.22, 0.024, 0.17]} />
      </mesh>
      <group position={[0.38, 0.515, 0.12]}>
        <mesh castShadow material={mugMat}>
          <cylinderGeometry args={[0.042, 0.038, 0.1, 20]} />
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={mugMat}>
          <torusGeometry args={[0.032, 0.01, 10, 20, Math.PI]} />
        </mesh>
      </group>
    </group>
  )
}

/* ----------------------------------- ラグ ----------------------------------- */

export function Rug() {
  const outer = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c8b492', roughness: 1 }),
    [],
  )
  const inner = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a8927a', roughness: 1 }),
    [],
  )
  return (
    <group position={[0, 0, 0.9]}>
      <mesh position={[0, 0.006, 0]} scale={[1, 1, 0.68]} receiveShadow material={outer}>
        <cylinderGeometry args={[1.5, 1.5, 0.012, 48]} />
      </mesh>
      <mesh position={[0, 0.013, 0]} scale={[1, 1, 0.68]} receiveShadow material={inner}>
        <cylinderGeometry args={[1.18, 1.18, 0.012, 48]} />
      </mesh>
    </group>
  )
}

/* ---------------------------------- 観葉植物 ---------------------------------- */

const LEAF_COLORS = ['#4d7a3e', '#567f3a', '#477040', '#5e8443']

export function Plant() {
  const leaves = useMemo(() => {
    const rand = mulberry32(31)
    return Array.from({ length: 7 }, (_, i) => ({
      yaw: i * (Math.PI * 2 / 7) + rand() * 0.4,
      tilt: 0.25 + rand() * 0.4,
      len: 0.4 + rand() * 0.25,
      color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
    }))
  }, [])
  const potMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b4634b', roughness: 0.8 }),
    [],
  )
  const soilMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a2e24', roughness: 1 }),
    [],
  )
  const stemMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a6b34', roughness: 0.9 }),
    [],
  )
  const leafMats = useMemo(
    () => LEAF_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })),
    [],
  )
  return (
    <group position={[-2.55, 0, -2.0]}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow material={potMat}>
        <cylinderGeometry args={[0.2, 0.26, 0.34, 24]} />
      </mesh>
      <mesh position={[0, 0.345, 0]} material={soilMat}>
        <cylinderGeometry args={[0.185, 0.185, 0.02, 24]} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} rotation={[0, l.yaw, 0]}>
          <group rotation={[0, 0, l.tilt]}>
            <mesh position={[0, l.len / 2, 0]} castShadow material={stemMat}>
              <cylinderGeometry args={[0.008, 0.012, l.len, 6]} />
            </mesh>
            <mesh position={[0, l.len, 0]} scale={[0.16, 0.22, 0.05]} castShadow material={leafMats[LEAF_COLORS.indexOf(l.color)]}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

/* --------------------------------- フロアランプ --------------------------------- */

export function FloorLamp() {
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3a3630', roughness: 0.5, metalness: 0.6 }),
    [],
  )
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#efe2c8',
        roughness: 0.9,
        side: THREE.DoubleSide,
        emissive: '#ffdca0',
        emissiveIntensity: 0.35,
      }),
    [],
  )
  const bulb = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fff3da', emissive: '#ffe9c0', emissiveIntensity: 2 }),
    [],
  )
  return (
    <group position={[-2.6, 0, 1.6]}>
      <mesh position={[0, 0.02, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 0.79, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 1.5, 12]} />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow material={shade}>
        <cylinderGeometry args={[0.13, 0.21, 0.28, 32, 1, true]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={bulb}>
        <sphereGeometry args={[0.04, 12, 10]} />
      </mesh>
      <pointLight position={[0, 1.48, 0]} intensity={5} distance={5.5} decay={2} color="#ffd9a3" />
    </group>
  )
}

/* ----------------------------------- 本棚 ----------------------------------- */

const BOOK_COLORS = ['#a4553f', '#3f6b5e', '#c9a24b', '#5b6b8a', '#7d4b3a', '#96784f', '#465a4e', '#b8875a']

const bookMats = BOOK_COLORS.map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }),
)

function BookRow({ y }: { y: number }) {
  const books = useMemo(() => {
    const rand = mulberry32(y * 1000 + 5)
    const out: { x: number; w: number; h: number; m: THREE.MeshStandardMaterial }[] = []
    let x = -0.5
    while (x < 0.42) {
      const w = 0.026 + rand() * 0.03
      out.push({
        x: x + w / 2,
        w,
        h: 0.2 + rand() * 0.13,
        m: bookMats[Math.floor(rand() * bookMats.length)],
      })
      x += w + 0.004
      if (rand() < 0.15) x += 0.05
    }
    return out
  }, [y])
  return (
    <group>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, y + b.h / 2, 0.01]} castShadow material={b.m}>
          <boxGeometry args={[b.w, b.h, 0.19]} />
        </mesh>
      ))}
    </group>
  )
}

export function Bookshelf() {
  const wood = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6f4f33', roughness: 0.65 }),
    [],
  )
  const backWood = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5d4229', roughness: 0.8 }),
    [],
  )
  return (
    <group position={[-2.82, 0, 0.1]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[-0.59, 0.95, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.9, 0.3]} />
      </mesh>
      <mesh position={[0.59, 0.95, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.9, 0.3]} />
      </mesh>
      <mesh position={[0, 1.88, 0]} material={wood} castShadow>
        <boxGeometry args={[1.22, 0.04, 0.3]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={wood} castShadow>
        <boxGeometry args={[1.22, 0.04, 0.3]} />
      </mesh>
      <mesh position={[0, 0.95, -0.145]} material={backWood} receiveShadow>
        <boxGeometry args={[1.22, 1.9, 0.02]} />
      </mesh>
      {[0.5, 0.95, 1.4].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={wood} castShadow>
          <boxGeometry args={[1.1, 0.03, 0.28]} />
        </mesh>
      ))}
      <BookRow y={0.06} />
      <BookRow y={0.53} />
      <BookRow y={0.98} />
      <BookRow y={1.43} />
    </group>
  )
}

/* ---------------------------------- 壁の絵 ---------------------------------- */

function ArtFrame({
  position,
  size,
  variant,
}: {
  position: [number, number, number]
  size: [number, number]
  variant: number
}) {
  const art = useMemo(() => makeArtTexture(variant), [variant])
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.6 }),
    [],
  )
  const canvasMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: art, roughness: 0.9 }),
    [art],
  )
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh material={frame} castShadow>
        <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.035]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={canvasMat}>
        <planeGeometry args={size} />
      </mesh>
    </group>
  )
}

export function WallArt() {
  return (
    <group>
      <ArtFrame position={[-0.62, 1.72, 2.47]} size={[0.52, 0.66]} variant={0} />
      <ArtFrame position={[0.62, 1.64, 2.47]} size={[0.66, 0.5]} variant={1} />
    </group>
  )
}

/* ----------------------------------- ドア ----------------------------------- */

export function Door() {
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: 0.7 }),
    [],
  )
  const panel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e7e0d3', roughness: 0.75 }),
    [],
  )
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b08d3e', roughness: 0.3, metalness: 0.8 }),
    [],
  )
  return (
    <group position={[2.985, 0, -0.9]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[-0.5, 1.03, 0]} material={frame} castShadow receiveShadow>
        <boxGeometry args={[0.07, 2.06, 0.1]} />
      </mesh>
      <mesh position={[0.5, 1.03, 0]} material={frame} castShadow receiveShadow>
        <boxGeometry args={[0.07, 2.06, 0.1]} />
      </mesh>
      <mesh position={[0, 2.04, 0]} material={frame} castShadow>
        <boxGeometry args={[1.07, 0.07, 0.1]} />
      </mesh>
      <mesh position={[0, 1.0, -0.005]} material={panel} castShadow receiveShadow>
        <boxGeometry args={[0.94, 2.0, 0.05]} />
      </mesh>
      <mesh position={[0.36, 1.02, 0.045]} material={brass} castShadow>
        <sphereGeometry args={[0.03, 14, 12]} />
      </mesh>
      <mesh position={[0.36, 1.02, -0.045]} material={brass} castShadow>
        <sphereGeometry args={[0.03, 14, 12]} />
      </mesh>
    </group>
  )
}
