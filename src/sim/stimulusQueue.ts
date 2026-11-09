import type { CatAction } from '../cat/behavior/scheduler'
import { respondToStimulus } from '../cat/behavior/scheduler'
import type { PersonalityProfile } from './personality'

/**
 * 外部刺激キュー（来客イベントなどの入り口）。
 *
 * v1.2.0 では臆病な猫が急な状態変化（刺激）を避ける指標として使う。
 * 将来の「来客イベント」は:
 *   pushStimulus({ kind: 'visitor', at: { x, z } })
 * を呼ぶだけで、性格に応じた反応（臆病 → 隅へ避難、など）が発火する。
 * UI やイベントスケジューラはまだ実装しないが、受け口だけ先に用意する。
 */

export type Stimulus = {
  kind: 'visitor' | 'loudNoise' | 'flash'
  /** 刺激の発生位置（省略時は部屋の外＝玄関方向） */
  at?: { x: number; z: number }
}

const queue: Stimulus[] = []

/** 刺激を予約する（来客イベントなど、外部システムから呼ぶ） */
export function pushStimulus(s: Stimulus) {
  queue.push(s)
}

/** 予約された刺激をすべて取り出す（CatController が毎フレーム呼ぶ） */
export function drainStimuli(): Stimulus[] {
  return queue.length > 0 ? queue.splice(0) : []
}

/** 刺激に対する性格別の反応行動を組み立てる（scheduler へ委譲） */
export function actionForStimulus(profile: PersonalityProfile, s: Stimulus): CatAction {
  return respondToStimulus(profile, s.at)
}
