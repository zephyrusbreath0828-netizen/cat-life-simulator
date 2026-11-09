import type { CatPhase } from '../../sim/catStore'

/**
 * 猫モデルの抽象インターフェース。
 *
 * モデルの実装（手続きメッシュ / GLTF）によらず、CatController が
 * 同じ方法で猫を動かせるようにするための契約。
 * - 位置・向きは CatController が親グループに適用する
 * - モデル側は「自分の中の見た目（アニメーション）」だけを担当する
 */

/** 毎フレーム書き換わる値を受け渡すための最小限の Ref 型 */
export type MutRef<T> = { current: T }

export interface CatModelProps {
  /** 現在の行動フェーズ（アニメーション選択に使用） */
  phaseRef: MutRef<CatPhase>
  /** 実移動速度 (m/s)（歩行サイクルの速度合わせに使用） */
  speedRef: MutRef<number>
  /** シミュレーション時間（一時停止で止まる。手続きアニメ用） */
  simTimeRef: MutRef<number>
  /** 一時停止フラグ（GLTF の AnimationMixer を止めるのに使用） */
  pausedRef: MutRef<boolean>
}
