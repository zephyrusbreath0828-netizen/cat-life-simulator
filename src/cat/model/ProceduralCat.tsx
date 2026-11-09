import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CatModelProps } from './types'

/**
 * 手続き生成の茶猫「ミケ」（デフォルトモデル・v1.1.0）。
 *
 * 外部アセットに依存せず、ポーズチャンネルの補間だけで
 * 待機 / 歩行 / お座り / 睡眠 / 食事 / 飲水 / 遊ぶ / 窓見 の
 * 8 アニメーションを実現する。GLTF モデルに差し替えた後も
 * フォールバックとして使えるよう、CatModelProps の契約にのみ依存する。
 */

// ---------- 共有マテリアル（再マウントでも再生成しない） ----------
const furMat = new THREE.MeshStandardMaterial({ color: '#d98a4d', roughness: 0.9 })
const furDarkMat = new THREE.MeshStandardMaterial({ color: '#c97e42', roughness: 0.9 })
const creamMat = new THREE.MeshStandardMaterial({ color: '#f2e3c8', roughness: 0.9 })
const earMat = new THREE.MeshStandardMaterial({ color: '#b96f3a', roughness: 0.9 })
const eyeMat = new THREE.MeshStandardMaterial({ color: '#2c2620', roughness: 0.25 })
const noseMat = new THREE.MeshStandardMaterial({ color: '#c96a6a', roughness: 0.5 })

/** ポーズのチャンネル定義（状態ごとの目標値を d amp して滑らかに遷移させる） */
interface PoseChannels {
  bodyY: number // 胴体の高さ
  bodyPitch: number // 胴体の前後傾き（座りで前上がり・食べるで前下がり）
  headPitch: number
  headFwd: number // 頭の前後位置（睡眠で格納）
  tailLiftX: number // 付け根の上下
  tailWrapZ: number // 付け根の横方向（寝るとき体側に巻く）
  tailCurl2X: number // 尻尾の先端の巻き
  eyeOpen: number // 目の開き（0 で閉眼）
  breatheAmp: number // 呼吸の振幅
  breatheRate: number // 呼吸の速さ
  lookAmp: number // 頭のきょろきょろ振幅
  swayAmp: number // 尻尾のゆれ振幅
  chewAmp: number // あごの動き（食事・飲水）
  pawAmp: number // 前脚で叩く動き（遊ぶ）
}

/** フェーズごとの目標ポーズ（差分のみ記述） */
const POSES: Record<string, Partial<PoseChannels>> = {
  idle: { bodyY: 0.215, bodyPitch: 0, headPitch: 0.04, headFwd: 0, tailLiftX: -0.85, tailWrapZ: 0, tailCurl2X: -0.35, eyeOpen: 1, breatheAmp: 0.02, breatheRate: 1.7, lookAmp: 1, swayAmp: 1, chewAmp: 0, pawAmp: 0 },
  walk: { bodyY: 0.215, bodyPitch: 0, headPitch: 0.02, headFwd: 0, tailLiftX: -0.55, tailWrapZ: 0, tailCurl2X: -0.2, eyeOpen: 1, breatheAmp: 0.015, breatheRate: 2.2, lookAmp: 0.25, swayAmp: 0.4, chewAmp: 0, pawAmp: 0 },
  sit: { bodyY: 0.235, bodyPitch: -0.62, headPitch: -0.08, headFwd: 0.01, tailLiftX: -1.05, tailWrapZ: -0.55, tailCurl2X: 0.9, eyeOpen: 1, breatheAmp: 0.025, breatheRate: 1.5, lookAmp: 0.7, swayAmp: 0.55, chewAmp: 0, pawAmp: 0 },
  sleep: { bodyY: 0.1, bodyPitch: -0.08, headPitch: 0.8, headFwd: -0.045, tailLiftX: -1.45, tailWrapZ: -1.15, tailCurl2X: 1.5, eyeOpen: 0.07, breatheAmp: 0.05, breatheRate: 1.0, lookAmp: 0, swayAmp: 0, chewAmp: 0, pawAmp: 0 },
  // 食事: 頭をボウルへ 深 に下げてかじる
  eat: { bodyY: 0.2, bodyPitch: 0.34, headPitch: 0.62, headFwd: 0.05, tailLiftX: -0.5, tailWrapZ: -0.1, tailCurl2X: -0.2, eyeOpen: 1, breatheAmp: 0.015, breatheRate: 2, lookAmp: 0, swayAmp: 0.2, chewAmp: 1, pawAmp: 0 },
  // 飲水: さらに低く、速くちろちろ舐める
  drink: { bodyY: 0.2, bodyPitch: 0.38, headPitch: 0.72, headFwd: 0.055, tailLiftX: -0.5, tailWrapZ: -0.1, tailCurl2X: -0.2, eyeOpen: 1, breatheAmp: 0.015, breatheRate: 2, lookAmp: 0, swayAmp: 0.15, chewAmp: 1.5, pawAmp: 0 },
  // 遊ぶ: お尻を上げた構えで前脚をバタバタさせる
  play: { bodyY: 0.185, bodyPitch: 0.16, headPitch: 0.18, headFwd: 0.02, tailLiftX: -0.3, tailWrapZ: 0, tailCurl2X: 0, eyeOpen: 1, breatheAmp: 0.02, breatheRate: 2.6, lookAmp: 0.5, swayAmp: 1.6, chewAmp: 0, pawAmp: 1 },
  // 窓見: 座って顔を上げ、空の外を見る
  window: { bodyY: 0.235, bodyPitch: -0.62, headPitch: -0.38, headFwd: 0.01, tailLiftX: -1.05, tailWrapZ: -0.55, tailCurl2X: 0.9, eyeOpen: 1, breatheAmp: 0.02, breatheRate: 1.6, lookAmp: 0.3, swayAmp: 0.4, chewAmp: 0, pawAmp: 0 },
}

/** 現在値チャンネル（フェーズ切替時にスムーズに遷移する） */
function initialChannels(): PoseChannels {
  return { bodyY: 0.215, bodyPitch: 0, headPitch: 0, headFwd: 0, tailLiftX: -0.85, tailWrapZ: 0, tailCurl2X: -0.35, eyeOpen: 1, breatheAmp: 0.02, breatheRate: 1.7, lookAmp: 1, swayAmp: 1, chewAmp: 0, pawAmp: 0 }
}

/** 脚 4 本の構成（位置と名前） */
const LEGS = [
  { key: 'FL', x: 0.085, z: 0.135 },
  { key: 'FR', x: -0.085, z: 0.135 },
  { key: 'BL', x: 0.095, z: -0.125 },
  { key: 'BR', x: -0.095, z: -0.125 },
] as const

function Ear({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 0.055, 0.075, 0.005]} rotation={[0, 0, side * -0.28]}>
      <mesh material={earMat} castShadow>
        <coneGeometry args={[0.036, 0.07, 8]} />
      </mesh>
    </group>
  )
}

export function ProceduralCat({ phaseRef, speedRef, simTimeRef }: CatModelProps) {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail1 = useRef<THREE.Group>(null)
  const tail2 = useRef<THREE.Group>(null)
  const legRefs = useRef<Record<string, THREE.Group | null>>({})
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)
  const earL = useRef<THREE.Group>(null)

  const ch = useRef<PoseChannels>(initialChannels())
  // 歩行ブレンド（0〜1）: フェーズ切替でも脚の振りが急に消えないようにする
  const walkBlend = useRef(0)

  useFrame(() => {
    const t = simTimeRef.current
    const phase = phaseRef.current
    const c = ch.current
    const target = { ...initialChannels(), ...POSES[phase] }

    // ---- チャンネルを目標値へ滑らかに寄せる ----
    const rate = 1 - Math.exp(-6 * 0.016) // 60fps 前提の簡易減衰
    for (const key of Object.keys(c) as (keyof PoseChannels)[]) {
      c[key] += (target[key] - c[key]) * rate * 1.6
    }

    // ---- 歩行ブレンドの更新 ----
    const wb = phase === 'walk' ? 1 : 0
    walkBlend.current += (wb - walkBlend.current) * rate
    const W = walkBlend.current
    const speedNorm = Math.min(1, speedRef.current / 0.55)
    const freq = 9 * Math.max(0.25, speedNorm)

    // ---- 胴体 ----
    if (body.current) {
      const bob = Math.sin(t * freq * 2) * 0.008 * W
      body.current.position.y = c.bodyY + bob
      body.current.rotation.x = c.bodyPitch
      // 呼吸
      const breathe = 1 + Math.sin(t * c.breatheRate) * c.breatheAmp
      body.current.scale.set(1, breathe, 1)
    }

    // ---- 脚: 状態ごとの折り畳み + 歩行の対角振り + 遊びの前脚バッティング ----
    const swing = Math.sin(t * freq) * 0.55 * W * (0.4 + 0.6 * speedNorm)
    const frontFold =
      phase === 'sit' || phase === 'window' ? 0.62 : phase === 'sleep' ? 1.35 : phase === 'eat' || phase === 'drink' ? 0.2 : 0
    const backFold = phase === 'sit' || phase === 'window' ? 1.3 : phase === 'sleep' ? 1.35 : 0
    const bat = Math.sin(t * 7.5) * 0.55 * c.pawAmp
    const offsets: Record<string, number> = { FL: 0, BR: 0, FR: Math.PI, BL: Math.PI }
    for (const leg of LEGS) {
      const g = legRefs.current[leg.key]
      if (!g) continue
      const fold = leg.z > 0 ? frontFold : backFold
      g.rotation.x = fold + swing * (offsets[leg.key] === 0 ? 1 : -1)
      // 遊び中は前脚だけ叩く動きを上乗せする
      if (c.pawAmp > 0.02 && leg.z > 0) g.rotation.x += bat * (leg.key === 'FL' ? 1 : -0.7)
    }

    // ---- 頭（きょろきょろ + 食事のかじり + 眠りで格納） ----
    if (head.current) {
      head.current.position.y = 0.16
      head.current.position.z = 0.185 + c.headFwd
      head.current.rotation.x = c.headPitch + Math.sin(t * 11) * 0.05 * c.chewAmp
      head.current.rotation.y = Math.sin(t * 0.35) * 0.32 * c.lookAmp
    }

    // ---- 尻尾 ----
    if (tail1.current) {
      tail1.current.rotation.x = c.tailLiftX
      tail1.current.rotation.z = c.tailWrapZ
      tail1.current.rotation.y = Math.sin(t * 1.8) * 0.22 * c.swayAmp
    }
    if (tail2.current) tail2.current.rotation.x = c.tailCurl2X + Math.sin(t * 2.4) * 0.1 * c.swayAmp

    // ---- 目（まばたき / 睡眠時は閉眼） ----
    const blinkPulse = Math.max(0, Math.sin(t * 1.1)) ** 40
    const eyeScale = c.eyeOpen * (1 - blinkPulse * 0.9)
    if (eyeL.current) eyeL.current.scale.y = Math.max(0.05, eyeScale)
    if (eyeR.current) eyeR.current.scale.y = Math.max(0.05, eyeScale)

    // ---- 耳のぱくぱく（たまに） ----
    if (earL.current) earL.current.rotation.x = Math.max(0, Math.sin(t * 1.9 + 1)) ** 32 * 0.45
  })

  return (
    <group scale={1.15}>
      <group ref={body}>
        {/* 胴体 */}
        <mesh scale={[0.85, 0.78, 1.18]} castShadow material={furMat}>
          <sphereGeometry args={[0.16, 24, 18]} />
        </mesh>
        {/* 後ろ脚の付け根（腰） */}
        <mesh position={[0, -0.03, -0.1]} scale={[0.92, 0.95, 1]} castShadow material={furMat}>
          <sphereGeometry args={[0.15, 20, 16]} />
        </mesh>
        {/* 胸元の白 */}
        <mesh position={[0, -0.02, 0.1]} scale={[0.7, 0.75, 0.9]} material={creamMat}>
          <sphereGeometry args={[0.1, 16, 14]} />
        </mesh>

        {/* 脚 4 本（pivot は付け根） */}
        {LEGS.map((leg) => (
          <group
            key={leg.key}
            ref={(g) => {
              legRefs.current[leg.key] = g
            }}
            position={[leg.x, -0.03, leg.z]}
          >
            <mesh position={[0, -0.08, 0]} castShadow material={furMat}>
              <cylinderGeometry args={[0.028, 0.033, 0.16, 12]} />
            </mesh>
            <mesh position={[0, -0.158, 0.012]} scale={[1, 0.8, 1.3]} castShadow material={creamMat}>
              <sphereGeometry args={[0.036, 12, 10]} />
            </mesh>
          </group>
        ))}

        {/* 頭 */}
        <group ref={head} position={[0, 0.16, 0.185]}>
          <mesh castShadow material={furMat}>
            <sphereGeometry args={[0.096, 20, 16]} />
          </mesh>
          {/* 鼻口部 */}
          <mesh position={[0, -0.015, 0.075]} scale={[0.8, 0.65, 0.7]} material={creamMat}>
            <sphereGeometry args={[0.055, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.005, 0.128]} material={noseMat}>
            <sphereGeometry args={[0.012, 8, 8]} />
          </mesh>
          <Ear side={-1} />
          <group ref={earL}>
            <Ear side={1} />
          </group>
          {/* 目（scale.y でまばたき） */}
          <mesh ref={eyeL} position={[0.04, 0.015, 0.082]} material={eyeMat}>
            <sphereGeometry args={[0.015, 10, 10]} />
          </mesh>
          <mesh ref={eyeR} position={[-0.04, 0.015, 0.082]} material={eyeMat}>
            <sphereGeometry args={[0.015, 10, 10]} />
          </mesh>
          {/* ひげ */}
          {[-1, 1].map((sx) =>
            [-1, 1].map((sy) => (
              <mesh
                key={`${sx}${sy}`}
                position={[sx * 0.05, -0.012 + sy * 0.012, 0.088]}
                rotation={[0, 0, sy * 0.35]}
                material={creamMat}
              >
                <boxGeometry args={[0.05, 0.003, 0.003]} />
              </mesh>
            )),
          )}
        </group>

        {/* 尻尾（2 関節） */}
        <group ref={tail1} position={[0, 0.03, -0.185]}>
          <mesh position={[0, 0.1, 0]} castShadow material={furDarkMat}>
            <cylinderGeometry args={[0.024, 0.03, 0.2, 12]} />
          </mesh>
          <group ref={tail2} position={[0, 0.2, 0]}>
            <mesh position={[0, 0.09, 0]} castShadow material={furDarkMat}>
              <cylinderGeometry args={[0.017, 0.024, 0.18, 12]} />
            </mesh>
            <mesh position={[0, 0.185, 0]} castShadow material={creamMat}>
              <sphereGeometry args={[0.02, 10, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
