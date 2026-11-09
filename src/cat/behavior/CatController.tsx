import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CatModel } from '../model'
import { chooseNextAction, randomFloorPoint, isSpotAction, respondToStimulus, type CatAction } from './scheduler'
import { useCatStore, type CatPhase } from '../../sim/catStore'
import { getPersonality } from '../../sim/personality'
import { drainStimuli } from '../../sim/stimulusQueue'
import { resolveCircle } from '../../systems/collision'
import { CAT_START, CAT_RADIUS } from '../../layout'
import { catRuntime } from '../runtime'

/**
 * 猫の行動コントローラ (v1.2.0)。
 *
 * 役割分担:
 * - scheduler.chooseNextAction() が出した「1 行動」を実行する
 *   （移動の積分・旋回・衝突解決・施設の使用・完了判定）
 * - 意思決定そのものは scheduler 側にあり、ここにはない
 * - v1.2.0: 性格（PersonalityProfile）が移動速度・ランダム地点の
 *   選好・行動の切替やすさに効く。性格変更は実行中でも即座に反映
 * - 外部刺激（来客イベント等）は刺激キュー経由で受け付け、
 *   性格に応じた反応行動へ差し替える
 * - 高頻度の値は Ref / シングルトン経由で渡し、React の再描画は
 *   「フェーズが変わった瞬間の 1 回」だけ発生させる
 */

const BASE_WALK_SPEED = 0.55 // 基礎歩行速度 (m/s)（性格の倍率が掛かる）
const TURN_RATE = 3.0 // 旋回速度 (rad/s)
const ARRIVE_DIST = 0.09 // 到達判定の距離
const TICK_INTERVAL = 0.25 // ストア更新（UI 更新）の間隔

export function CatController() {
  const root = useRef<THREE.Group>(null)
  const acc = useRef(0)

  // モデルへ渡す高頻度 Ref
  const phaseRef = useRef<CatPhase>('idle')
  const speedRef = useRef(0)
  const simTimeRef = useRef(0)
  const pausedRef = useRef(false)

  // 行動ランタイム（再描画と無関係に毎フレーム更新される値）
  const rt = useRef({
    action: chooseNextAction({
      phase: 'idle',
      pos: { x: CAT_START.x, z: CAT_START.z },
      needs: useCatStore.getState().needs,
      personality: getPersonality(useCatStore.getState().personality),
    }),
    phaseStart: 0, // 現在の行動を開始した時刻
    performStart: 0, // 施設の「実行フェーズ」に入った時刻
    inPerform: false, // 施設アクションで実行フェーズ中か
    yaw: CAT_START.yaw,
    stuck: 0,
    lastX: CAT_START.x,
    lastZ: CAT_START.z,
    lastPhase: 'idle' as CatPhase,
    lastPid: useCatStore.getState().personality,
  })

  /** 目標角度へ最短経路で旋回する */
  const steer = (r: { yaw: number }, targetYaw: number, dt: number) => {
    let diff = targetYaw - r.yaw
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    r.yaw += THREE.MathUtils.clamp(diff, -TURN_RATE * dt, TURN_RATE * dt)
  }

  useFrame((_, rawDt) => {
    const store = useCatStore.getState()
    const dt = Math.min(rawDt, 0.05)
    pausedRef.current = store.paused
    if (store.paused || !root.current) return

    // シミュレーション時間とストア（欲求・経過時間）を進める
    simTimeRef.current += dt
    acc.current += dt
    if (acc.current >= TICK_INTERVAL) {
      store.tick(acc.current)
      acc.current = 0
    }

    // 性格（現在のプロファイル）。実行中でも変更が即座に反映される
    const p = getPersonality(store.personality)
    const r = rt.current
    const pos = root.current.position

    // ---- 性格が変更された → 自由行動の最中なら新しい傾向で再決定する ----
    if (r.lastPid !== store.personality) {
      r.lastPid = store.personality
      if (!isSpotAction(r.action)) {
        r.action = chooseNextAction({ phase: phaseRef.current, pos: { x: pos.x, z: pos.z }, needs: store.needs, personality: p })
        r.phaseStart = simTimeRef.current
        r.inPerform = false
        r.stuck = 0
      }
    }

    // ---- 外部刺激（来客イベント等）の処理 ----
    const stim = drainStimuli()
    if (stim.length > 0) {
      r.action = respondToStimulus(p, stim[0].at)
      r.phaseStart = simTimeRef.current
      r.inPerform = false
      r.stuck = 0
      r.lastX = pos.x
      r.lastZ = pos.z
    }

    const a = r.action
    let done = false

    if (isSpotAction(a)) {
      // ---- 施設アクション: 移動フェーズ → 実行フェーズ ----
      const dxs = a.spot.x - pos.x
      const dzs = a.spot.z - pos.z
      const dist = Math.hypot(dxs, dzs)

      if (!r.inPerform && dist > ARRIVE_DIST) {
        // 移動フェーズ: 目標点へ向かう（性格で速度が変わる）
        phaseRef.current = 'walk'
        steer(r, Math.atan2(dxs, dzs), dt)
        const align = Math.max(0, Math.cos(Math.atan2(dxs, dzs) - r.yaw))
        const speed = BASE_WALK_SPEED * p.walkSpeedMul * align
        if (dist > ARRIVE_DIST) {
          pos.x += Math.sin(r.yaw) * speed * dt
          pos.z += Math.cos(r.yaw) * speed * dt
        }
        speedRef.current = speed
        const [nx, nz] = resolveCircle(pos.x, pos.z, CAT_RADIUS)
        pos.x = nx
        pos.z = nz
        // 引っかかり判定（前進できていなければ累積する）
        const moved = Math.hypot(pos.x - r.lastX, pos.z - r.lastZ)
        r.lastX = pos.x
        r.lastZ = pos.z
        r.stuck = moved < speed * dt * 0.35 ? r.stuck + dt : 0
        if (r.stuck > 1.5 || simTimeRef.current - r.phaseStart > a.timeout) done = true
      } else {
        // 実行フェーズ: 施設を使い、欲求を回復させる
        if (!r.inPerform) {
          r.inPerform = true
          r.performStart = simTimeRef.current
        }
        phaseRef.current = a.kind === 'sleepSpot' ? 'sleep' : a.kind
        speedRef.current += (0 - speedRef.current) * (1 - Math.exp(-8 * dt))
        // 実行中は対象の方向へゆっくり向く
        steer(r, Math.atan2(a.look.x - pos.x, a.look.z - pos.z), dt * 0.6)
        // 欲求の回復（= 駆動力を下げる）
        store.decreaseNeed(a.drain.key, a.drain.rate * dt, a.drain.floor)
        const performed = simTimeRef.current - r.performStart
        const need = useCatStore.getState().needs[a.drain.key]
        if ((need <= a.drain.floor + 0.5 && performed > a.minPerform) || performed > a.timeout) {
          done = true
        }
      }
    } else if (a.kind === 'walk') {
      // ---- ランダム移動（性格で速度と選好が変わる） ----
      phaseRef.current = 'walk'
      const dx = a.target.x - pos.x
      const dz = a.target.z - pos.z
      const dist = Math.hypot(dx, dz)
      steer(r, Math.atan2(dx, dz), dt)
      const align = Math.max(0, Math.cos(Math.atan2(dx, dz) - r.yaw))
      const speed = BASE_WALK_SPEED * p.walkSpeedMul * align
      if (dist > ARRIVE_DIST) {
        pos.x += Math.sin(r.yaw) * speed * dt
        pos.z += Math.cos(r.yaw) * speed * dt
      }
      speedRef.current = speed
      const [nx, nz] = resolveCircle(pos.x, pos.z, CAT_RADIUS)
      pos.x = nx
      pos.z = nz
      const moved = Math.hypot(pos.x - r.lastX, pos.z - r.lastZ)
      r.lastX = pos.x
      r.lastZ = pos.z
      r.stuck = moved < speed * dt * 0.35 ? r.stuck + dt : 0
      if (dist <= ARRIVE_DIST || simTimeRef.current - r.phaseStart > a.timeout || r.stuck > 1.5) {
        done = true
      }
    } else {
      // ---- 待機 / お座り: 指定時間だけ継続 ----
      phaseRef.current = a.kind
      speedRef.current += (0 - speedRef.current) * (1 - Math.exp(-8 * dt))
      if (simTimeRef.current - r.phaseStart >= a.duration) done = true
    }

    if (done) {
      r.inPerform = false
      r.stuck = 0
      r.phaseStart = simTimeRef.current
      if (a.kind === 'window') {
        // 窓を見た後は部屋を探索する
        r.action = { kind: 'walk', target: randomFloorPoint(p), timeout: 12 }
      } else {
        r.action = chooseNextAction({
          phase: phaseRef.current,
          pos: { x: pos.x, z: pos.z },
          needs: useCatStore.getState().needs,
          personality: p,
        })
      }
      // その場で眠る自由行動は、開始時の現在地を spot に固定する
      if (r.action.kind === 'sleepSpot') {
        const here = { x: pos.x, z: pos.z }
        r.action.spot = here
        r.action.look = here
      }
      r.lastX = pos.x
      r.lastZ = pos.z
    }

    // 位置・向きを適用し、追跡カメラ用のシングルトンへも反映
    root.current.rotation.y = r.yaw
    catRuntime.pos.set(pos.x, 0, pos.z)
    catRuntime.yaw = r.yaw

    // フェーズが変わったときだけストアを更新（→ HUD が再描画される）
    if (r.lastPhase !== phaseRef.current) {
      r.lastPhase = phaseRef.current
      store.setPhase(phaseRef.current)
    }
  })

  return (
    <group ref={root} position={[CAT_START.x, 0, CAT_START.z]} rotation={[0, CAT_START.yaw, 0]}>
      <CatModel phaseRef={phaseRef} speedRef={speedRef} simTimeRef={simTimeRef} pausedRef={pausedRef} />
    </group>
  )
}
