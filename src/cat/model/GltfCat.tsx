import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CatModelProps } from './types'
import type { CatModelConfig } from './config'
import type { CatPhase } from '../../sim/catStore'

/**
 * GLTF / GLB モデルを読み込むアダプタ。
 *
 * - フェーズごとに AnimationClip を再生し、切替時はクロスフェードする
 * - クリップ名は config.clips で明示指定できる（未指定なら一般的な
 *   名前を自動検出: Idle / Walk / Sit / Sleep など。日本語名にも対応）
 * - 対応クリップが無いフェーズは「待機」クリップで代用する
 * - 歩行クリップは実際の移動速度に合わせて timeScale を調整する
 */

// クリップ名の自動検出パターン（config.clips の指定が優先される）
const FALLBACK_PATTERNS: Record<CatPhase, RegExp> = {
  idle: /idle|待機|stand/i,
  walk: /walk|移動|歩行|走|run/i,
  sit: /sit|座/i,
  sleep: /sleep|眠|寝|lie/i,
  eat: /eat|食|feed|餌/i,
  drink: /drink|飲/i,
  play: /play|遊/i,
  window: /window|窓|look/i,
}

type Props = CatModelProps & { config: Extract<CatModelConfig, { kind: 'gltf' }> }

function GltfCatInner({ config, phaseRef, speedRef, pausedRef }: Props) {
  const { scene, animations } = useGLTF(config.url)
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene])
  const current = useRef<THREE.AnimationAction | null>(null)

  // フェーズ → アクション の対応表を作る
  const actions = useMemo(() => {
    const map: Partial<Record<CatPhase, THREE.AnimationAction>> = {}
    const phases: CatPhase[] = ['idle', 'walk', 'sit', 'sleep', 'eat', 'drink', 'play', 'window']
    for (const phase of phases) {
      const explicit = config.clips?.[phase]
      const clip =
        (explicit && animations.find((a) => a.name === explicit)) ||
        animations.find((a) => FALLBACK_PATTERNS[phase].test(a.name))
      if (clip) map[phase] = mixer.clipAction(clip)
    }
    // 見つからないフェーズは待機で代用
    const idle = map.idle ?? (animations[0] ? mixer.clipAction(animations[0]) : undefined)
    for (const phase of phases) {
      if (!map[phase] && idle) map[phase] = idle
    }
    return map
  }, [animations, config.clips, mixer])

  // 影の設定と姿勢調整
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.frustumCulled = false // スケルトン越しの判定漏れを防ぐ
      }
    })
  }, [scene])

  useEffect(() => {
    // 初期状態で待機を再生しておく
    const idle = actions.idle
    if (idle) {
      idle.reset().play()
      current.current = idle
    }
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer])

  useFrame((_, rawDt) => {
    if (pausedRef.current) return
    mixer.update(rawDt)
    const next = actions[phaseRef.current]
    if (next && next !== current.current) {
      current.current?.fadeOut(0.3)
      next.reset().fadeIn(0.3).play()
      current.current = next
    }
    // 歩行クリップの速度を実移動速度に追従させる
    if (current.current && phaseRef.current === 'walk') {
      current.current.timeScale = THREE.MathUtils.clamp(speedRef.current / 0.55, 0.4, 2.2)
    } else if (current.current) {
      current.current.timeScale = 1
    }
  })

  return (
    <group
      scale={config.adjust?.scale ?? 1}
      position={[0, config.adjust?.y ?? 0, 0]}
    >
      <primitive object={scene} />
    </group>
  )
}

export function GltfCat(props: Props) {
  return (
    <Suspense fallback={null}>
      <GltfCatInner {...props} />
    </Suspense>
  )
}
