import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

/**
 * キャットタワー。揺れるポンポンのおもちゃ付き。
 * プラットフォームは意図的に空にしてある — 猫（cat/behavior/CatController）は
 * 独立して動くアクターなので、AI 拡張でここへ登れるようになる。
 * プラットフォームのワールド座標は登りアンカーとして書き出し済み。
 */

const carpet = new THREE.MeshStandardMaterial({ color: '#d8cfc0', roughness: 1 })
const sisal = new THREE.MeshStandardMaterial({ color: '#c2a06b', roughness: 1 })
const string = new THREE.MeshStandardMaterial({ color: '#7d6a55', roughness: 0.8 })
const pom = new THREE.MeshStandardMaterial({ color: '#c25d4f', roughness: 0.9 })

/** 登りアンカー（ワールド座標・タワー原点は 2.3, -1.85）— AI 拡張用。 */
export const CAT_TOWER = {
  origin: [2.3, 0, -1.85] as const,
  midPlatform: [2.38, 0.6, -1.77] as const,
  topPlatform: [2.28, 1.13, -1.83] as const,
}

export function CatTower() {
  const toy = useRef<THREE.Group>(null)

  useFrame((s) => {
    if (toy.current) {
      toy.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.4) * 0.12
      toy.current.rotation.x = Math.cos(s.clock.elapsedTime * 1.1) * 0.08
    }
  })

  return (
    <group position={[2.3, 0, -1.85]}>
      {/* 土台 */}
      <RoundedBox args={[0.78, 0.05, 0.78]} radius={0.02} smoothness={3} position={[0, 0.025, 0]} material={carpet} castShadow receiveShadow />
      {/* 下段の柱 + 中段プラットフォーム */}
      <mesh position={[-0.18, 0.3, -0.18]} castShadow material={sisal}>
        <cylinderGeometry args={[0.055, 0.055, 0.5, 16]} />
      </mesh>
      <RoundedBox args={[0.56, 0.045, 0.44]} radius={0.02} smoothness={3} position={[0.08, 0.575, 0.08]} material={carpet} castShadow receiveShadow />
      {/* 上段の柱 + 最上段プラットフォーム */}
      <mesh position={[0.2, 0.845, -0.1]} castShadow material={sisal}>
        <cylinderGeometry args={[0.05, 0.05, 0.47, 16]} />
      </mesh>
      <RoundedBox args={[0.64, 0.05, 0.52]} radius={0.02} smoothness={3} position={[-0.02, 1.105, 0.02]} material={carpet} castShadow receiveShadow />
      {/* ぶら下がるポンポンのおもちゃ */}
      <group position={[-0.12, 0.553, 0.24]} ref={toy}>
        <mesh position={[0, -0.1, 0]} material={string}>
          <cylinderGeometry args={[0.004, 0.004, 0.2, 6]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow material={pom}>
          <sphereGeometry args={[0.04, 12, 10]} />
        </mesh>
      </group>
    </group>
  )
}
