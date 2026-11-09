import { useMemo } from 'react'
import * as THREE from 'three'
import { ROOM, WINDOW } from '../layout'
import { makeFloorTexture, makeWallTexture } from '../systems/textures'
import { AutoHide, behindNorth, behindSouth, behindWest, behindEast, aboveRoof } from '../systems/AutoHide'

const WT = ROOM.T
const Z_N = -ROOM.D / 2 - WT / 2 // 北の壁（窓）の中心 z
const Z_S = ROOM.D / 2 + WT / 2
const X_W = -ROOM.W / 2 - WT / 2
const X_E = ROOM.W / 2 + WT / 2

function WallBox({
  size,
  position,
  material,
}: {
  size: [number, number, number]
  position: [number, number, number]
  material: THREE.Material
}) {
  return (
    <mesh position={position} castShadow receiveShadow material={material}>
      <boxGeometry args={size} />
    </mesh>
  )
}

export function Room() {
  const floorMap = useMemo(() => {
    const t = makeFloorTexture()
    t.repeat.set(2.2, 1.8)
    return t
  }, [])
  const wallMap = useMemo(() => {
    const t = makeWallTexture()
    t.repeat.set(3, 1.5)
    return t
  }, [])

  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.7, metalness: 0 }),
    [floorMap],
  )
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wallMap, roughness: 0.95, metalness: 0 }),
    [wallMap],
  )
  const trimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e7e0d2', roughness: 0.85 }),
    [],
  )
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.6 }),
    [],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d5e6ee',
        transparent: true,
        opacity: 0.14,
        roughness: 0.05,
        metalness: 0,
        depthWrite: false,
      }),
    [],
  )
  const curtainMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b9a88f', roughness: 1 }),
    [],
  )
  const rodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6b5138', roughness: 0.5, metalness: 0.4 }),
    [],
  )
  const groundMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7e9a63', roughness: 1 }),
    [],
  )
  const hedgeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#55703f', roughness: 1 }),
    [],
  )
  const trunkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6e4f35', roughness: 1 }),
    [],
  )
  const leafMatA = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5c7a45', roughness: 1 }),
    [],
  )
  const leafMatB = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#63854b', roughness: 1 }),
    [],
  )

  const { cx, halfW, sillY, topY } = WINDOW
  const openH = topY - sillY
  const midY = (sillY + topY) / 2
  const segW = ROOM.W / 2 - halfW // 両脇の segment は壁の角まで伸びる

  return (
    <group>
      {/* 床 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[ROOM.W, ROOM.D]} />
      </mesh>

      {/* 天井 — 真上からのドールハウス視点では隠す */}
      <AutoHide hide={aboveRoof}>
        <mesh position={[0, ROOM.H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ROOM.W, ROOM.D]} />
          <meshStandardMaterial color="#f5f1e8" roughness={1} />
        </mesh>
      </AutoHide>

      {/* North wall (window) — built around the opening; hidden only when the
          camera goes outside through it */}
      <AutoHide hide={behindNorth}>
        <WallBox size={[ROOM.W, sillY, WT]} position={[0, sillY / 2, Z_N]} material={wallMat} />
        <WallBox
          size={[ROOM.W, ROOM.H - topY, WT]}
          position={[0, (topY + ROOM.H) / 2, Z_N]}
          material={wallMat}
        />
        <WallBox size={[segW, openH, WT]} position={[-(halfW + segW / 2), midY, Z_N]} material={wallMat} />
        <WallBox size={[segW, openH, WT]} position={[halfW + segW / 2, midY, Z_N]} material={wallMat} />
        <mesh position={[0, 0.045, -ROOM.D / 2 + 0.01]} material={trimMat}>
          <boxGeometry args={[ROOM.W - 0.02, 0.09, 0.025]} />
        </mesh>

        {/* 窓枠・格子・敷居・ガラス */}
        <WallBox size={[0.08, openH + 0.16, 0.18]} position={[cx - halfW - 0.04, midY, Z_N]} material={frameMat} />
        <WallBox size={[0.08, openH + 0.16, 0.18]} position={[cx + halfW + 0.04, midY, Z_N]} material={frameMat} />
        <WallBox size={[halfW * 2 + 0.16, 0.08, 0.18]} position={[cx, topY + 0.04, Z_N]} material={frameMat} />
        <WallBox size={[halfW * 2 + 0.16, 0.08, 0.18]} position={[cx, sillY - 0.04, Z_N]} material={frameMat} />
        <WallBox size={[0.04, openH, 0.05]} position={[cx, midY, Z_N]} material={frameMat} />
        <WallBox size={[halfW * 2, 0.04, 0.05]} position={[cx, midY, Z_N]} material={frameMat} />
        <mesh position={[cx, sillY - 0.025, -ROOM.D / 2 + 0.07]} castShadow receiveShadow material={frameMat}>
          <boxGeometry args={[halfW * 2 + 0.3, 0.05, 0.22]} />
        </mesh>
        <mesh position={[cx, midY, Z_N + 0.01]} material={glassMat}>
          <planeGeometry args={[halfW * 2, openH]} />
        </mesh>

        {/* カーテンレールとカーテン */}
        <mesh position={[cx, 2.44, -ROOM.D / 2 + 0.2]} rotation={[0, 0, Math.PI / 2]} material={rodMat}>
          <cylinderGeometry args={[0.015, 0.015, 3.1, 12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[cx + s * 1.32, 1.55, -ROOM.D / 2 + 0.22]}
            rotation={[0, -s * 0.04, 0]}
            castShadow
            material={curtainMat}
          >
            <boxGeometry args={[0.36, 1.72, 0.09]} />
          </mesh>
        ))}
      </AutoHide>

      {/* 南の壁 + 幅木 */}
      <AutoHide hide={behindSouth}>
        <WallBox size={[ROOM.W, ROOM.H, WT]} position={[0, ROOM.H / 2, Z_S]} material={wallMat} />
        <mesh position={[0, 0.045, ROOM.D / 2 - 0.01]} material={trimMat}>
          <boxGeometry args={[ROOM.W - 0.02, 0.09, 0.025]} />
        </mesh>
      </AutoHide>

      {/* 西の壁 + 幅木 */}
      <AutoHide hide={behindWest}>
        <WallBox size={[WT, ROOM.H, ROOM.D]} position={[X_W, ROOM.H / 2, 0]} material={wallMat} />
        <mesh position={[-ROOM.W / 2 + 0.01, 0.045, 0]} material={trimMat}>
          <boxGeometry args={[0.025, 0.09, ROOM.D - 0.02]} />
        </mesh>
      </AutoHide>

      {/* 東の壁 + 幅木 */}
      <AutoHide hide={behindEast}>
        <WallBox size={[WT, ROOM.H, ROOM.D]} position={[X_E, ROOM.H / 2, 0]} material={wallMat} />
        <mesh position={[ROOM.W / 2 - 0.01, 0.045, 0]} material={trimMat}>
          <boxGeometry args={[0.025, 0.09, ROOM.D - 0.02]} />
        </mesh>
      </AutoHide>

      {/* 窓の外: 芝生・生垣・木 1 本（窓から見える） */}
      <group>
        <mesh position={[0, -0.03, -20]} rotation={[-Math.PI / 2, 0, 0]} material={groundMat}>
          <planeGeometry args={[90, 90]} />
        </mesh>
        <mesh position={[0, 0.45, -5.4]} castShadow material={hedgeMat}>
          <boxGeometry args={[8, 0.9, 0.6]} />
        </mesh>
        <mesh position={[-2.4, 0.8, -4.2]} castShadow material={trunkMat}>
          <cylinderGeometry args={[0.1, 0.16, 1.6, 8]} />
        </mesh>
        <mesh position={[-2.4, 2.1, -4.2]} castShadow material={leafMatA}>
          <sphereGeometry args={[0.95, 16, 12]} />
        </mesh>
        <mesh position={[-1.7, 1.7, -4.5]} castShadow material={leafMatB}>
          <sphereGeometry args={[0.6, 14, 10]} />
        </mesh>
      </group>
    </group>
  )
}
