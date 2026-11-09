import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { ROOM } from '../layout'
import { useCatStore, type CameraMode } from '../sim/catStore'
import { catRuntime } from '../cat/runtime'

/**
 * カメラリグ（自由視点 / 猫を追跡の 2 モード）。
 *
 * - 自由視点: ドラッグで回転・スクロールでズーム・WASD で視点ごとパン
 * - 猫を追跡: ターゲットを猫へ滑らかに寄せる。ユーザーの回転・ズームは
 *   そのまま保持されるので「追いかけ回している引きの目線」になる
 * - モードは Zustand ストア（catStore.cameraMode）で管理し、
 *   ボタンや URL パラメータから切り替えられる
 */

const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _delta = new THREE.Vector3()
const _desired = new THREE.Vector3()

/** 追跡モードで狙う高さ（猫の体の中心あたり） */
const FOLLOW_HEIGHT = 0.32
/** 追跡モードへ切り替えたときに寄せる距離（m）— ソファの背などに猫が隠れないようにする */
const FOLLOW_DISTANCE = 2.2

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const keys = useRef<Record<string, boolean>>({})
  const { camera } = useThree()
  // モード切替の検出用（前フレームのモード）
  const prevMode = useRef<CameraMode>(useCatStore.getState().cameraMode)
  // 切替直後の引き寄せアニメ中の目標距離（null = アニメーション終了）
  const pullDist = useRef<number | null>(null)

  useEffect(() => {
    const set = (v: boolean) => (e: KeyboardEvent) => {
      keys.current[e.code] = v
    }
    const down = set(true)
    const up = set(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const c = controls.current
    if (!c) return
    const { cameraMode } = useCatStore.getState()

    // モードが切り替わったら、追跡側は一度だけカメラを猫へ寄せる
    if (cameraMode !== prevMode.current) {
      prevMode.current = cameraMode
      pullDist.current = cameraMode === 'follow' ? FOLLOW_DISTANCE : null
    }

    // ---- 猫を追跡モード ----
    if (cameraMode === 'follow') {
      _desired.set(catRuntime.pos.x, FOLLOW_HEIGHT, catRuntime.pos.z)
      c.target.lerp(_desired, 1 - Math.exp(-5 * dt))
      // 切替直後だけ、オフセットの向きを保ったまま距離を寄せる
      if (pullDist.current != null) {
        const offset = camera.position.clone().sub(c.target)
        const dist = offset.length()
        const next = THREE.MathUtils.damp(dist, pullDist.current, 3, dt)
        camera.position.copy(c.target).addScaledVector(offset.normalize(), next)
        if (Math.abs(next - pullDist.current) < 0.05) pullDist.current = null
      }
      c.update()
      return
    }

    // ---- 自由視点モード: WASD でターゲットごとパンする ----
    let ix = 0
    let iz = 0
    if (keys.current['KeyW']) iz -= 1
    if (keys.current['KeyS']) iz += 1
    if (keys.current['KeyA']) ix -= 1
    if (keys.current['KeyD']) ix += 1
    if (ix === 0 && iz === 0) return

    // カメラの地面平面に沿ってパンする
    camera.getWorldDirection(_fwd)
    _fwd.y = 0
    if (_fwd.lengthSq() > 0) _fwd.normalize()
    _right.crossVectors(_fwd, THREE.Object3D.DEFAULT_UP).normalize()

    // ズームアウト時は大きく動かす（距離に比例）
    const speed = 2.6 * (c.getDistance() / 4 + 0.4)
    _delta
      .set(0, 0, 0)
      .addScaledVector(_fwd, -iz * speed * dt)
      .addScaledVector(_right, ix * speed * dt)

    c.target.add(_delta)
    // ターゲットを部屋の内側に留める
    c.target.x = THREE.MathUtils.clamp(c.target.x, -ROOM.W / 2 + 0.3, ROOM.W / 2 - 0.3)
    c.target.z = THREE.MathUtils.clamp(c.target.z, -ROOM.D / 2 + 0.3, ROOM.D / 2 - 0.3)
    c.target.y = THREE.MathUtils.clamp(c.target.y, 0.2, 1.6)
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.6}
      maxDistance={11}
      minPolarAngle={0.15}
      maxPolarAngle={1.5}
      target={[0.4, 0.7, 0.4]}
    />
  )
}
