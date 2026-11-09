import type { CatPhase } from '../../sim/catStore'

/**
 * 猫モデルの差し替え設定。
 *
 * ◆ デフォルト（手続きメッシュ）
 *   外部アセット不要で、このまま単一 HTML で動作する。
 *
 * ◆ GLTF / GLB に差し替える場合
 *   1. `public/models/cat.glb` などにモデルファイルを置く
 *      （public 以下のファイルはビルド時にコピーされ、単一 HTML とは別に配布される）
 *   2. 下の CAT_MODEL を次のように書き換える
 *
 *       export const CAT_MODEL: CatModelConfig = {
 *         kind: 'gltf',
 *         url: 'models/cat.glb',
 *         clips: { idle: 'Idle', walk: 'Walk', sit: 'Sit', sleep: 'Sleep' },
 *         adjust: { scale: 1, y: 0 },
 *       }
 *
 *   3. clips は省略可能（省略時は Idle/Walk/Sit/Sleep などの一般的な
 *      クリップ名を自動検出する。対応するクリップが無いフェーズは
 *      待機クリップで代用される）
 *
 * コンポーネント側は `cat/model/index.tsx` が設定に応じて
 * ProceduralCat / GltfCat を選択するため、他の場所は一切変更不要。
 */
export type CatModelConfig =
  | { kind: 'procedural' }
  | {
      kind: 'gltf'
      /** モデルの URL（public フォルダ基準 or 絶対 URL） */
      url: string
      /** フェーズ → クリップ名の明示マッピング（任意） */
      clips?: Partial<Record<CatPhase, string>>
      /** サイズ・接地位置の調整（任意） */
      adjust?: { scale?: number; y?: number }
    }

export const CAT_MODEL: CatModelConfig = { kind: 'procedural' }
