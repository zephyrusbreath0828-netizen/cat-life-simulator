import { ROOM, POI, CAT_COLLIDERS } from '../../layout'
import type { CatPhase, NeedKey, Needs } from '../../sim/catStore'

/**
 * 行動の「意思決定レイヤー」(v1.1.0)。
 *
 * 方針: 一定時間ごとに呼ばれ、最も切実な欲求（閾値 80 以上）を優先し、
 * 該当する施設（餌皿・給水器・猫ベッド・ボール・窓辺）へ向かう行動を返す。
 * どの欲求も閾値に達していなければ、重み付きランダムで自由行動を選ぶ。
 *
 * 意思決定はこの関数 1 本に集約されているため、今後の拡張
 * （性格による重み補正、学習機能、複数猫）はこのファイルの
 * 差し替えで完結する。実行側（CatController）は戻り値を実行するだけ。
 */

/** 猫が実行すべき 1 回分の行動 */
export type CatAction =
  | { kind: 'idle'; duration: number }
  | { kind: 'sit'; duration: number }
  /** 床上の目標点への移動（timeout は安全弁） */
  | { kind: 'walk'; target: { x: number; z: number }; timeout: number }
  /** 施設を使う行動（移動 → 実行を 1 つのアクションとして表現） */
  | {
      kind: 'sleepSpot' | 'eat' | 'drink' | 'play' | 'window'
      /** 猫が立つ（または丸くなる）位置 */
      spot: { x: number; z: number }
      /** 実行中に向く対象 */
      look: { x: number; z: number }
      /** 全体のタイムアウト（安全弁・秒） */
      timeout: number
      /** 実行フェーズの最短時間（秒） */
      minPerform: number
      /** 実行中に減らす欲求 */
      drain: { key: NeedKey; rate: number; floor: number }
    }

/** 施設を使う行動かどうかの判定 */
export function isSpotAction(a: CatAction): a is Extract<CatAction, { kind: 'sleepSpot' | 'eat' | 'drink' | 'play' | 'window' }> {
  return a.kind !== 'idle' && a.kind !== 'sit' && a.kind !== 'walk'
}

export interface DecisionContext {
  phase: CatPhase
  pos: { x: number; z: number }
  /** 現在の欲求（駆動力: 高いほど切実） */
  needs: Needs
}

/** 行動の継続時間（秒）のランダム範囲 */
const DURATIONS: Record<'idle' | 'sit' | 'sleep', [number, number]> = {
  idle: [1.5, 5.5],
  sit: [6, 16],
  sleep: [12, 32],
}

/** 歩行のタイムアウト（到達できなかった場合の安全弁） */
const WALK_TIMEOUT: [number, number] = [10, 16]

/** 猫が家具にぶつからないよう、見た目より少し太めの当たり判定 */
const CAT_CLEARANCE = 0.34

/**
 * 欲求 → 行動の対応表（要件の閾値ロジック）。
 * 例: 空腹度 80 以上 → 餌皿へ移動 → 食事 → 空腹度が減る
 * 新しい欲求・施設を追加する場合はここに 1 行足すだけでよい。
 */
const DRIVE_ACTIONS: {
  key: NeedKey
  threshold: number
  build: () => CatAction
}[] = [
  {
    key: 'hunger',
    threshold: 80,
    build: () => ({
      kind: 'eat',
      spot: POI.foodBowl.stand,
      look: POI.foodBowl.look,
      timeout: 30,
      minPerform: 3,
      drain: { key: 'hunger', rate: 16, floor: 10 },
    }),
  },
  {
    key: 'thirst',
    threshold: 80,
    build: () => ({
      kind: 'drink',
      spot: POI.waterFountain.stand,
      look: POI.waterFountain.look,
      timeout: 30,
      minPerform: 3,
      drain: { key: 'thirst', rate: 18, floor: 10 },
    }),
  },
  {
    key: 'sleepy',
    threshold: 80,
    build: () => ({
      kind: 'sleepSpot',
      spot: POI.catBed.stand,
      look: POI.catBed.look,
      timeout: 60,
      minPerform: 4,
      drain: { key: 'sleepy', rate: 4.5, floor: 8 },
    }),
  },
  {
    key: 'play',
    threshold: 80,
    build: () => ({
      kind: 'play',
      spot: POI.ball.stand,
      look: POI.ball.look,
      timeout: 30,
      minPerform: 4,
      drain: { key: 'play', rate: 10, floor: 15 },
    }),
  },
  {
    key: 'curiosity',
    threshold: 80,
    build: () => ({
      kind: 'window',
      spot: POI.windowSpot.stand,
      look: POI.windowSpot.look,
      timeout: 40,
      minPerform: 4,
      drain: { key: 'curiosity', rate: 9, floor: 15 },
    }),
  },
]

/** 自由行動の重みテーブル（欲求が閾値未達のときの過ごし方） */
const NEXT_WEIGHTS: { kind: 'idle' | 'walk' | 'sit' | 'sleep' | 'play' | 'window'; weight: number }[] = [
  { kind: 'walk', weight: 38 },
  { kind: 'idle', weight: 28 },
  { kind: 'sit', weight: 15 },
  { kind: 'sleep', weight: 10 },
  { kind: 'play', weight: 5 },
  { kind: 'window', weight: 4 },
]

/** 部屋の中から家具の上にならない床の一点をランダムに選ぶ（リジェクトサンプリング） */
export function randomFloorPoint(): { x: number; z: number } {
  const margin = CAT_CLEARANCE
  for (let i = 0; i < 40; i++) {
    const x = -ROOM.W / 2 + margin + Math.random() * (ROOM.W - margin * 2)
    const z = -ROOM.D / 2 + margin + Math.random() * (ROOM.D - margin * 2)
    const blocked = CAT_COLLIDERS.some(
      (c) =>
        x > c.minX - CAT_CLEARANCE &&
        x < c.maxX + CAT_CLEARANCE &&
        z > c.minZ - CAT_CLEARANCE &&
        z < c.maxZ + CAT_CLEARANCE,
    )
    if (!blocked) return { x, z }
  }
  // 40 回試しても空きが見つからない場合は部屋の中央付近を返す
  return { x: 0, z: -0.5 }
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, it) => sum + it.weight, 0)
  let roll = Math.random() * total
  for (const it of items) {
    roll -= it.weight
    if (roll <= 0) return it
  }
  return items[items.length - 1]
}

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min)
}

/** 自由行動を組み立てる */
function buildFreeAction(kind: 'idle' | 'walk' | 'sit' | 'sleep' | 'play' | 'window'): CatAction {
  switch (kind) {
    case 'walk':
      return { kind: 'walk', target: randomFloorPoint(), timeout: randomBetween(WALK_TIMEOUT) }
    case 'sit':
      return { kind: 'sit', duration: randomBetween(DURATIONS.sit) }
    case 'sleep':
      // ランダムのお昼寝: その場で丸くなり、眠気を少し回復する
      {
        const here = { x: 0, z: 0 } // spot は実行開始時の現在地へ置き換えられる（Controller側）
        return {
          kind: 'sleepSpot',
          spot: here,
          look: here,
          timeout: randomBetween(DURATIONS.sleep),
          minPerform: randomBetween(DURATIONS.sleep),
          drain: { key: 'sleepy', rate: 3, floor: 20 },
        }
      }
    case 'play':
      return {
        kind: 'play',
        spot: POI.ball.stand,
        look: POI.ball.look,
        timeout: 30,
        minPerform: 4,
        drain: { key: 'play', rate: 10, floor: 15 },
      }
    case 'window':
      return {
        kind: 'window',
        spot: POI.windowSpot.stand,
        look: POI.windowSpot.look,
        timeout: 40,
        minPerform: 4,
        drain: { key: 'curiosity', rate: 9, floor: 15 },
      }
    default:
      return { kind: 'idle', duration: randomBetween(DURATIONS.idle) }
  }
}

/**
 * 次の 1 行動を決定する。
 * 1) 閾値 (80) を超えた欲求のうち最も高いもの → 対応施設への行動
 * 2) なければ重み付きランダムの自由行動（眠気 60 以上なら時々お昼寝）
 */
export function chooseNextAction(ctx: DecisionContext): CatAction {
  // 閾値以上の欲求を高い順に並べ、最も切実なものから優先する
  const urgent = DRIVE_ACTIONS.filter((d) => ctx.needs[d.key] >= d.threshold).sort(
    (a, b) => ctx.needs[b.key] - ctx.needs[a.key],
  )
  if (urgent.length > 0) return urgent[0].build()

  if (ctx.needs.sleepy >= 60 && Math.random() < 0.4) return buildFreeAction('sleep')

  return buildFreeAction(pickWeighted(NEXT_WEIGHTS).kind)
}
