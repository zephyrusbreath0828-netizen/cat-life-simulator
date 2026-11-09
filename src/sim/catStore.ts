import { create } from 'zustand'
import { launchParams } from './launchParams'

/**
 * 猫とシミュレーションの状態を一元管理する Zustand ストア。
 *
 * 設計メモ:
 * - 毎フレーム更新される高頻度の値（位置・姿勢など）はここに置かず、
 *   `cat/runtime.ts` のシングルトンで扱う（再描画コストの分離）。
 * - 欲求は「駆動力モデル」: 数値が高いほど切実（0〜100）。
 *   時間経過で増え、対応する行動（食事・睡眠など）で減る。
 * - 新しい欲求を追加する場合は NEED_KEYS / GROWTH_PER_SECOND /
 *   scheduler の DRIVES に項目を足すだけで UI・AI が追従する
 *   （複数猫・性格などの拡張も、このストアを猫インスタンス毎に
 *     持つ形へ発展させられる）。
 */

/** 猫の行動フェーズ（状態システム） */
export type CatPhase =
  | 'idle' // 待機
  | 'walk' // 移動
  | 'sit' // 座る
  | 'sleep' // 寝る
  | 'eat' // 食事
  | 'drink' // 飲水
  | 'play' // 遊ぶ
  | 'window' // 窓の外を見る

/** カメラモード（自由視点 / 猫を追跡） */
export type CameraMode = 'free' | 'follow'

/** 猫の欲求一覧（駆動力: 高いほど切実） */
export type NeedKey = 'hunger' | 'thirst' | 'sleepy' | 'play' | 'curiosity'
export type Needs = Record<NeedKey, number>

/** 欲求キーの固定順（UI 表示・走査に使用） */
export const NEED_KEYS: NeedKey[] = ['hunger', 'thirst', 'sleepy', 'play', 'curiosity']

/** 欲求の増加率（毎秒・デモ速度。行動AIのチューニング後に調整する） */
const GROWTH_PER_SECOND: Needs = {
  hunger: 0.28, // 空腹度
  thirst: 0.33, // 喉の渇き
  sleepy: 0.2, // 眠気
  play: 0.3, // 遊びたい度
  curiosity: 0.35, // 好奇心
}

/** 欲求の既定値（起動直後） */
const DEFAULT_NEEDS: Needs = { hunger: 45, thirst: 40, sleepy: 25, play: 55, curiosity: 50 }

interface CatStore {
  /** 猫の名前（UI 表示用） */
  name: string
  /** 現在の行動フェーズ */
  phase: CatPhase
  /** 一時停止中か */
  paused: boolean
  /** カメラモード */
  cameraMode: CameraMode
  /** 起動からの経過秒（一時停止中は進まない） */
  elapsedSeconds: number
  /** 欲求（0〜100、高いほど切実） */
  needs: Needs

  setPhase: (phase: CatPhase) => void
  togglePause: () => void
  setCameraMode: (mode: CameraMode) => void
  /** シミュレーションを進める（フレームループから 4Hz で呼ばれる） */
  tick: (dt: number) => void
  /** 欲求を回復させる（= 駆動力を下げる）。行動の実行中に毎フレーム呼ぶ */
  decreaseNeed: (key: NeedKey, amount: number, floor?: number) => void
  /** 欲求を即時設定する（デバッグメニュー用） */
  setNeed: (key: NeedKey, value: number) => void
}

// URL パラメータによる初期値の上書き（デバッグ・自動テスト用）
const initialNeeds = { ...DEFAULT_NEEDS }
for (const key of NEED_KEYS) {
  const v = launchParams.initialNeeds[key]
  if (v !== undefined) initialNeeds[key] = v
}

export const useCatStore = create<CatStore>()((set) => ({
  name: 'ミケ',
  phase: 'idle',
  paused: launchParams.pause,
  cameraMode: launchParams.follow ? 'follow' : 'free',
  elapsedSeconds: 0,
  needs: initialNeeds,

  setPhase: (phase) => set({ phase }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setCameraMode: (cameraMode) => set({ cameraMode }),

  tick: (dt) =>
    set((s) => {
      if (s.paused) return s
      const needs = { ...s.needs }
      for (const key of NEED_KEYS) {
        needs[key] = Math.min(100, needs[key] + GROWTH_PER_SECOND[key] * dt)
      }
      return { elapsedSeconds: s.elapsedSeconds + dt, needs }
    }),

  decreaseNeed: (key, amount, floor = 0) =>
    set((s) => ({
      needs: { ...s.needs, [key]: Math.max(floor, s.needs[key] - amount) },
    })),

  setNeed: (key, value) =>
    set((s) => ({ needs: { ...s.needs, [key]: Math.min(100, Math.max(0, value)) } })),
}))

/**
 * 欲求の切実さ段位（駆動力モデル: 値が大きいほど緊急）。
 * HUD のバーの色分けと、行動AIのチューニング時に使う。
 */
export function driveLevel(value: number): 'calm' | 'attention' | 'urge' | 'urgent' {
  if (value >= 80) return 'urgent'
  if (value >= 60) return 'urge'
  if (value >= 35) return 'attention'
  return 'calm'
}
