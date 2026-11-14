import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CatModelProps } from './types'
import type { CatModelConfig } from './config'
import type { CatPhase } from '../../sim/catStore'

/**
 * GLTF / GLB モデルを読み込むアダプタ (v1.1.1)。
 *
 * - **自動サイズ調整**: bbox の最大寸法が adjust.targetSize（体長）に
 *   なるようスケールを自動計算する
 * - **自動接地**: スケール・回転適用後の bbox 下端を y=0（床面）に合わせる
 * - **向き補正**: adjust.rotY で前方向きを補正する（標準猫は -Z 向き → π）
 * - **影**: 全メッシュに castShadow / receiveShadow を設定
 * - フェーズごとの AnimationClip があればクロスフェード再生、
 *   なければ（静的モデル）手続きの疑似アニメ（歩行のボブ・呼吸）で補う
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

function GltfCatInner({ config, phaseRef, speedRef, simTimeRef, pausedRef }: Props) {
  const { scene, animations } = useGLTF(config.url)
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene])
  const current = useRef<THREE.AnimationAction | null>(null)
  // クリップが無い場合の疑似アニメ用ラッパー
  const wrapper = useRef<THREE.Group>(null)

  // ---- モデルの前処理: 向き補正 → 自動スケール → 自動接地 → 影設定 ----
  useEffect(() => {
    const adj = config.adjust ?? {}
    // 1) 向き補正（回転してから寸法を測る）
    scene.rotation.set(0, adj.rotY ?? 0, 0)
    // 2) 自動スケール: 最大寸法を体長 (targetSize) に合わせる
    scene.updateWorldMatrix(true, true)
    const box0 = new THREE.Box3().setFromObject(scene)
    const size = box0.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = adj.scale ?? (adj.targetSize ? adj.targetSize / maxDim : 1)
    scene.scale.setScalar(scale)
    // 3) 自動接地: 回転・スケール適用後の bbox 下端を y=0 へ
    scene.updateWorldMatrix(true, true)
    const box1 = new THREE.Box3().setFromObject(scene)
    scene.position.set(0, -box1.min.y + (adj.y ?? 0), 0)
    // 4) 影を落とす / 影を受ける
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        obj.frustumCulled = false // スケルトン越しの判定漏れを防ぐ
      }
    })
  }, [scene, config])

  // ---- フェーズ → アニメーションアクション の対応表 ----
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

  // 初期状態で待機を再生しておく（クリップがある場合のみ）
  useEffect(() => {
    if (animations.length === 0) return
    const idle = actions.idle
    if (idle) {
      idle.reset().play()
      current.current = idle
    }
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer, animations])

  useFrame((_, rawDt) => {
    if (pausedRef.current) return

    if (animations.length > 0) {
      // ---- クリップ再生（クロスフェード切替） ----
      mixer.update(rawDt)
      const next = actions[phaseRef.current]
      if (next && next !== current.current) {
        current.current?.fadeOut(0.3)
        next.reset().fadeIn(0.3).play()
        current.current = next
      }
      if (current.current && phaseRef.current === 'walk') {
        current.current.timeScale = THREE.MathUtils.clamp(speedRef.current / 0.55, 0.4, 2.2)
      } else if (current.current) {
        current.current.timeScale = 1
      }
      return
    }

    // ---- 静的モデル用の疑似アニメ（クリップが無い場合） ----
    const w = wrapper.current
    if (!w) return
    const t = simTimeRef.current
    const phase = phaseRef.current
    const speed = speedRef.current
    // 呼吸（全体をわずかに膨らませる）
    const breathe = 1 + Math.sin(t * 1.7) * 0.012
    w.scale.set(breathe, breathe, breathe)
    if (phase === 'walk') {
      // 歩行: 上下のボブ + 左右の揺れ（ speed に同期 ）
      const freq = 11 * Math.max(0.3, speed / 0.55)
      w.position.y = Math.abs(Math.sin(t * freq)) * 0.018 * (0.4 + 0.6 * Math.min(1, speed / 0.55))
      w.rotation.z = Math.sin(t * freq) * 0.04
    } else {
      // 立ち止まったら滑らかに戻す
      w.position.y += (0 - w.position.y) * 0.15
      w.rotation.z += (0 - w.rotation.z) * 0.15
    }
  })

  return (
    <group ref={wrapper}>
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
