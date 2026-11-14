import type { CatPhase } from '../../sim/catStore'
import catModelUrl from '../../assets/cat.glb'

/**
 * 猫モデルの差し替え設定。
 *
 * ◆ 現在の設定（v1.1.1）: GLTF モデル
 *   「Cat by Poly by Google」(public/models/cat.glb) を標準モデルとして採用。
 *   import 経由で data URI としてバンドルされるため、単一 HTML でも動作する。
 *   ソースファイルは public/models/cat.glb にも同じものを置いてある
 *   （dev サーバや外部ツールから参照する場合用）。
 *
 * ◆ 手続き猫に戻す場合
 *   CAT_MODEL を { kind: 'procedural' } に書き換えるだけ。
 *
 * ◆ 別の GLTF に差し替える場合
 *   1. モデルファイルを src/assets/ に置いて import を変える
 *      （または url に public 基準のパス / 絶対 URL を指定する）
 *   2. clips は省略可能（省略時は Idle/Walk/Sit/Sleep などの一般的な
 *      クリップ名を自動検出。対応クリップが無いフェーズは待機で代用）
 *   3. adjust.targetSize で猫の体長（最大寸法・メートル）を指定する。
 *      スケールは自動計算され、床面にも自動で接地する。
 *      rotY は前方向きの補正（ラジアン）。このモデルは -Z 向きなので π。
 */
export type CatModelConfig =
  | { kind: 'procedural' }
  | {
      kind: 'gltf'
      /** モデルの URL（import したアセット / public 基準パス / 絶対 URL） */
      url: string
      /** フェーズ → クリップ名の明示マッピング（任意） */
      clips?: Partial<Record<CatPhase, string>>
      /** サイズ・接地・向きの調整（任意） */
      adjust?: {
        /** 体長（最大寸法・メートル）に合わせて自動スケール */
        targetSize?: number
        /** 直接スケールを指定する場合（targetSize より優先） */
        scale?: number
        /** 床面からのオフセット（自動接地に上乗せ） */
        y?: number
        /** 前方向きの補正（ラジアン）。標準猫は -Z 向きなので π */
        rotY?: number
      }
    }

export const CAT_MODEL: CatModelConfig = {
  kind: 'gltf',
  url: catModelUrl,
  adjust: {
    targetSize: 0.55, // 体長 約55cm に自動調整
    rotY: Math.PI, // モデルは -Z 向き → 前方 (+Z) へ補正
  },
}
