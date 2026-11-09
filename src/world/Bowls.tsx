import { useMemo } from 'react'
import * as THREE from 'three'
import { FEEDING_MAT, FOUNTAIN } from '../layout'

/**
 * 給餌コーナー: マットの上の餌皿と、給水器。
 * v1.1.0 では給水器（タンク式）を独立した施設として東側の壁際に配置する。
 * 将来の「食べる/飲む」インタラクション（ハイライト等）は
 * それぞれのコンポーネントに個別に追加できる。
 */

function useBowlMaterials() {
  return useMemo(() => {
    const ceramic = new THREE.MeshStandardMaterial({ color: '#e8e2d4', roughness: 0.35 })
    const ceramicIn = new THREE.MeshStandardMaterial({ color: '#cfc7b5', roughness: 0.5 })
    const mat = new THREE.MeshStandardMaterial({ color: '#5d5348', roughness: 0.95 })
    const kibble = new THREE.MeshStandardMaterial({ color: '#8a5a2e', roughness: 0.85 })
    const water = new THREE.MeshPhysicalMaterial({
      color: '#9fc4d8',
      transparent: true,
      opacity: 0.75,
      roughness: 0.08,
      metalness: 0,
    })
    const plastic = new THREE.MeshStandardMaterial({ color: '#9aa8a0', roughness: 0.4 })
    return { ceramic, ceramicIn, mat, kibble, water, plastic }
  }, [])
}

const KIBBLE = Array.from({ length: 14 }, (_, i) => ({
  x: Math.sin(i * 2.4) * 0.045 + (i % 3) * 0.012,
  z: Math.cos(i * 1.7) * 0.045 + (i % 4) * 0.01,
  s: 0.014 + ((i * 7) % 5) * 0.002,
  yRot: i * 1.3,
}))

/** 給餌マット + 餌皿（空腹度の回復場所） */
export function FeedingCorner() {
  const { ceramic, ceramicIn, mat, kibble } = useBowlMaterials()

  return (
    <group position={[FEEDING_MAT.x, 0, FEEDING_MAT.z]} rotation={[0, FEEDING_MAT.yaw, 0]}>
      {/* マット */}
      <mesh position={[0, 0.006, 0]} material={mat} receiveShadow castShadow>
        <boxGeometry args={[0.72, 0.012, 0.52]} />
      </mesh>
      {/* 餌皿 */}
      <group>
        <mesh position={[0, 0.045, 0]} material={ceramic} castShadow receiveShadow>
          <cylinderGeometry args={[0.105, 0.075, 0.07, 28]} />
        </mesh>
        <mesh position={[0, 0.082, 0]} material={ceramicIn}>
          <cylinderGeometry args={[0.09, 0.09, 0.008, 28]} />
        </mesh>
        {/* ドライフードの山 */}
        {KIBBLE.map((k, i) => (
          <mesh key={i} position={[k.x, 0.086 + k.s * 0.6, k.z]} rotation={[k.yRot, k.yRot * 0.7, 0]} material={kibble} castShadow>
            <dodecahedronGeometry args={[k.s, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** 給水器（タンク式 — 喉の渇きの回復場所） */
export function WaterFountain() {
  const { ceramic, ceramicIn, water, plastic } = useBowlMaterials()

  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]} rotation={[0, -0.5, 0]}>
      {/* 受け皿 */}
      <mesh position={[0, 0.035, 0]} material={ceramic} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.13, 0.06, 28]} />
      </mesh>
      {/* 水面 */}
      <mesh position={[0, 0.062, 0]} material={water}>
        <cylinderGeometry args={[0.135, 0.135, 0.006, 28]} />
      </mesh>
      {/* タンク（後ろに立つボトル） */}
      <mesh position={[0, 0.21, -0.09]} material={plastic} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.32, 20]} />
      </mesh>
      {/* タンクの注ぎ口 */}
      <mesh position={[0, 0.1, -0.02]} rotation={[0.5, 0, 0]} material={plastic} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.1, 12]} />
      </mesh>
      {/* タンクの蓋 */}
      <mesh position={[0, 0.375, -0.09]} material={ceramicIn}>
        <cylinderGeometry args={[0.078, 0.078, 0.012, 20]} />
      </mesh>
    </group>
  )
}
