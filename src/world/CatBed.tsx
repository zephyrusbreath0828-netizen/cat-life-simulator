import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAT_BED, BALL_SPOT } from '../layout'
import { useCatStore } from '../sim/catStore'

/**
 * 猫ベッドとボールのおもちゃ。
 * - CatBed: 眠気の回復場所（猫が上に入るので衝突リストには含めない）
 * - BallToy: 遊びたい度の回復場所。ミケが「遊び中」の間は転がる
 */

const cushionMat = new THREE.MeshStandardMaterial({ color: '#c98a6a', roughness: 1 })
const cushionInner = new THREE.MeshStandardMaterial({ color: '#e0c2a8', roughness: 1 })
const ballMat = new THREE.MeshStandardMaterial({ color: '#c25d4f', roughness: 0.55 })
const ballStripe = new THREE.MeshStandardMaterial({ color: '#efe2c8', roughness: 0.6 })

/** 猫ベッド（楕円形のクッション bed） */
export function CatBed() {
  return (
    <group position={[CAT_BED.x, 0, CAT_BED.z]} rotation={[0, 0.3, 0]}>
      {/* 外周のリム */}
      <mesh position={[0, 0.055, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow material={cushionMat}>
        <torusGeometry args={[0.3, 0.075, 14, 40]} />
      </mesh>
      {/* 底のクッション */}
      <mesh position={[0, 0.045, 0]} scale={[1, 1, 0.92]} receiveShadow castShadow material={cushionInner}>
        <cylinderGeometry args={[0.29, 0.26, 0.07, 32]} />
      </mesh>
    </group>
  )
}

/** ボールのおもちゃ（遊び中は転がる） */
export function BallToy() {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((s, dt) => {
    const playing = useCatStore.getState().phase === 'play'
    if (!playing) {
      // 普段は静かに置かれている
      if (group.current) group.current.position.set(BALL_SPOT.x, 0.046, BALL_SPOT.z)
      if (mesh.current) mesh.current.rotation.x = 0
      return
    }
    // 遊び中: ミケの前でコロコロ転がる
    const t = s.clock.elapsedTime
    if (group.current) {
      group.current.position.set(
        BALL_SPOT.x + Math.sin(t * 2.6) * 0.06,
        0.046 + Math.abs(Math.sin(t * 5)) * 0.02,
        BALL_SPOT.z + Math.cos(t * 3.1) * 0.06,
      )
    }
    if (mesh.current) mesh.current.rotation.x += dt * 6
  })

  return (
    <group ref={group} position={[BALL_SPOT.x, 0.046, BALL_SPOT.z]}>
      <mesh ref={mesh} castShadow material={ballMat}>
        <sphereGeometry args={[0.046, 20, 16]} />
      </mesh>
      {/* 縞模様の帯 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={ballStripe}>
        <torusGeometry args={[0.046, 0.008, 8, 32]} />
      </mesh>
    </group>
  )
}
