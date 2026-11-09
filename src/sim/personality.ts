import type { Needs } from './catStore'

/**
 * 性格システム (v1.2.0)。
 *
 * 猫の行動傾向を「補正プロファイル」として 1 か所に定義する。
 * - 欲求の成長率（遊びたい度の上昇が速い、など）
 * - 自由行動の重み（移動頻度が高い、など）
 * - 歩行速度・ひとつの場所に留まる長さ
 * - ランダム地点の選好（部屋全体 / 隅 / 中央）
 * - 突然の状態変化への耐性（臆病は行動を急に変えない）
 *
 * 新しい性格を足す場合は PROFILES に 1 つ追加するだけで
 * 行動 AI（scheduler）と欲求システム（catStore）に自動で反映される。
 * 将来の「性格を学習で変化させる」機能も、このプロファイルの
 * 数値を時間とともに書き換えるだけで実現できる。
 */

export type PersonalityId = 'active' | 'mypeace' | 'timid' | 'affectionate'

/** ランダム地点の選好 */
export type TargetBias =
  | 'anywhere' // 部屋全体からランダム
  | 'corners' // 部屋の隅を好む（臆病）
  | 'center' // 中央付近に集まりやすい（甘えん坊・飼い主未実装の仮行動）

/** 性別 JSON ではなく ID で管理する */
export type FreeActionKind = 'idle' | 'walk' | 'sit' | 'sleep' | 'play' | 'window'

export interface PersonalityProfile {
  id: PersonalityId
  /** 欲求の成長率: 全体の掛け目 */
  growthAll: number
  /** 欲求の成長率: 欲求別の掛け目（未指定は 1） */
  growth: Partial<Needs>
  /** 自由行動の重み倍率（未指定の行動は 1） */
  weights: Partial<Record<FreeActionKind, number>>
  /** 歩行速度の倍率（活発: ×1.5 など） */
  walkSpeedMul: number
  /** ひとつの行動に留まる長さの倍率（マイペースは長い） */
  dwellMul: number
  /** ランダム地点の選好 */
  targetBias: TargetBias
  /** 突然の状態変化への耐性（大きいほど行動を急に変えない・臆病は高め） */
  calmness: number
}

export const PROFILES: Record<PersonalityId, PersonalityProfile> = {
  /** 活発: 移動頻度が高く、遊びと探索が好き */
  active: {
    id: 'active',
    growthAll: 1.1,
    growth: { play: 1.6, curiosity: 1.3 },
    weights: { walk: 1.6, play: 1.5, window: 1.2 },
    walkSpeedMul: 1.5, // 移動距離 ×1.5
    dwellMul: 0.8,
    targetBias: 'anywhere',
    calmness: 1.0,
  },
  /** マイペース: 行動変化が少なく、長く同じ場所に留まる */
  mypeace: {
    id: 'mypeace',
    growthAll: 0.9,
    growth: {},
    weights: { idle: 2.2, sit: 2.0, walk: 0.5, sleep: 1.2 },
    walkSpeedMul: 0.85,
    dwellMul: 1.8,
    targetBias: 'anywhere',
    calmness: 1.3,
  },
  /** 臆病: 部屋の隅を好み、探索範囲が狭く、急な変化を避ける */
  timid: {
    id: 'timid',
    growthAll: 1.0,
    growth: { play: 0.7, curiosity: 0.7 },
    weights: { walk: 0.8, sit: 1.4, idle: 1.2, play: 0.6, window: 0.7 },
    walkSpeedMul: 0.9,
    dwellMul: 1.25,
    targetBias: 'corners',
    calmness: 1.6,
  },
  /** 甘えん坊: 飼い主が未実装のため、仮行動として中央付近へ集まりやすい */
  affectionate: {
    id: 'affectionate',
    growthAll: 1.0,
    growth: { play: 0.9 },
    weights: { walk: 0.9, sit: 1.3, idle: 1.1 },
    walkSpeedMul: 1.0,
    dwellMul: 1.1,
    targetBias: 'center',
    calmness: 1.0,
  },
}

/** 性格 ID からプロファイルを取得する（未知の ID は活発にフォールバック） */
export function getPersonality(id: PersonalityId | string): PersonalityProfile {
  return PROFILES[(id as PersonalityId) in PROFILES ? (id as PersonalityId) : 'active']
}

export const PERSONALITY_IDS: PersonalityId[] = ['active', 'mypeace', 'timid', 'affectionate']
