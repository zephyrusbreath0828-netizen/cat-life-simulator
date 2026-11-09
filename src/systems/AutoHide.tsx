import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ReactNode } from 'react'
import { ROOM } from '../layout'

/**
 * ドールハウス表示: カメラが壁の外側へ回ったときだけその面を隠す。
 * 4 面の壁・天井・壁掛け装飾・ドアに使用する。
 */
export function AutoHide({ hide, children }: { hide: (p: THREE.Vector3) => boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = !hide(camera.position)
  })
  return <group ref={ref}>{children}</group>
}

// カメラがこの壁/屋根の平面より外側にいるかどうか
// （0.05 のマージンは壁ぎわでの表示切れ点滅を防ぐため）
export const behindNorth = (p: THREE.Vector3) => p.z < -ROOM.D / 2 - 0.05
export const behindSouth = (p: THREE.Vector3) => p.z > ROOM.D / 2 + 0.05
export const behindWest = (p: THREE.Vector3) => p.x < -ROOM.W / 2 - 0.05
export const behindEast = (p: THREE.Vector3) => p.x > ROOM.W / 2 + 0.05
export const aboveRoof = (p: THREE.Vector3) => p.y > ROOM.H + 0.05
