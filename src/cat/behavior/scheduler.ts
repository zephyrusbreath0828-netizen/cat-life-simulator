import { ROOM, POI, CAT_COLLIDERS } from '../../layout'
import type { CatPhase, NeedKey, Needs } from '../../sim/catStore'
import type { PersonalityProfile, FreeActionKind } from '../../sim/personality'

/**
 * 行動の「意思決定レイヤー」(v1.2.0)。
 *
 * 方針: 一定時間ごとに呼ばれ、最も切実な欲求（閾値 80 以上）を優先し、
 * 該当する施設（餌皿・給水器・猫ベッド・ボール・窓辺）へ向かう行動を返す。
 * どの欲求も閾値に達していなければ、性格の重み倍率を掛けた
 * 重み付きランダムで自由行動を選ぶ。
 *
 * v1.2.0 で性格（PersonalityProfile）を導入:
 * - 自由行動の重み・継続時間・移動先の選好が性格で変化する
 * - respondToStimulus() で外部刺激（来客イベント等）への反応も定義
 *
 * 意思決定はこの関数群 1 か所に集約されているため、将来の拡張
 * （学習機能、複数猫、来客イベント実装）はこのファイルの差し替えで完結する。
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
  /** 猫の性格プロファイル */
  personality: PersonalityProfile
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

/** 自由行動の基礎重み（性格の倍率がこれに掛かる） */
const BASE_WEIGHTS: Record<FreeActionKind, number> = {
  idle: 28,
  walk: 38,
  sit: 15,
  sleep: 10,
  play: 5,
  window: 4,
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
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

/**
 * ランダムな床の一点を選ぶ。性格の targetBias に応じて選好が変わる:
 * - anywhere: 部屋全体から一様ランダム
 * - corners: いずれかの隅の周辺を好む（臆病）
 * - center: 中央付近に集まりやすい（甘えん坊・飼い主未実装の仮行動）
 * 家具の上にならないようリジェクトサンプリングする。
 */
export function randomFloorPoint(profile?: PersonalityProfile): { x: number; z: number } {
  const margin = CAT_CLEARANCE
  const bias = profile?.targetBias ?? 'anywhere'
  for (let i = 0; i < 40; i++) {
    let x: number
    let z: number
    if (bias === 'corners') {
      // 4 隅のどれかの周辺をサンプルする
      const sx = Math.random() < 0.5 ? -1 : 1
      const sz = Math.random() < 0.5 ? -1 : 1
      x = sx * (ROOM.W / 2 - 0.8) + (Math.random() - 0.5) * 1.6
      z = sz * (ROOM.D / 2 - 0.8) + (Math.random() - 0.5) * 1.6
    } else if (bias === 'center') {
      // 中央付近（ローテーブルの周り）に集まる
      x = 0.2 + (Math.random() - 0.5) * 2.4
      z = 0.5 + (Math.random() - 0.5) * 2.0
    } else {
      x = -ROOM.W / 2 + margin + Math.random() * (ROOM.W - margin * 2)
      z = -ROOM.D / 2 + margin + Math.random() * (ROOM.D - margin * 2)
    }
    x = clamp(x, -ROOM.W / 2 + margin, ROOM.W / 2 - margin)
    z = clamp(z, -ROOM.D / 2 + margin, ROOM.D / 2 - margin)
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

/** 自由行動を組み立てる（性格の dwellMul で継続時間が伸びる） */
function buildFreeAction(kind: FreeActionKind, p: PersonalityProfile): CatAction {
  switch (kind) {
    case 'walk':
      return {
        kind: 'walk',
        target: randomFloorPoint(p),
        timeout: randomBetween(WALK_TIMEOUT) * Math.max(1, p.dwellMul),
      }
    case 'sit':
      return { kind: 'sit', duration: randomBetween(DURATIONS.sit) * p.dwellMul }
    case 'sleep': {
      // ランダムのお昼寝: その場で丸くなり、眠気を少し回復する
      return {
        kind: 'sleepSpot',
        spot: { x: 0, z: 0 }, // 実行開始時の現在地へ置き換えられる（Controller側）
        look: { x: 0, z: 0 },
        timeout: randomBetween(DURATIONS.sleep) * p.dwellMul,
        minPerform: randomBetween(DURATIONS.sleep) * p.dwellMul,
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
      return { kind: 'idle', duration: randomBetween(DURATIONS.idle) * p.dwellMul }
  }
}

/**
 * 次の 1 行動を決定する。
 * 1) 閾値 (80) を超えた欲求のうち最も高いもの → 対応施設への行動
 * 2) なければ性格の重み倍率を掛けた重み付きランダムの自由行動
 */
export function chooseNextAction(ctx: DecisionContext): CatAction {
  const p = ctx.personality

  // 閾値以上の欲求を高い順に並べ、最も切実なものから優先する
  const urgent = DRIVE_ACTIONS.filter((d) => ctx.needs[d.key] >= d.threshold).sort(
    (a, b) => ctx.needs[b.key] - ctx.needs[a.key],
  )
  if (urgent.length > 0) return urgent[0].build()

  // 眠気だけは閾値手前（60 以上）でもベッドに行きたがることがある
  if (ctx.needs.sleepy >= 60 && Math.random() < 0.4 / p.calmness) return buildFreeAction('sleep', p)

  const items = (Object.keys(BASE_WEIGHTS) as FreeActionKind[]).map((kind) => ({
    kind,
    weight: BASE_WEIGHTS[kind] * (p.weights[kind] ?? 1),
  }))
  return buildFreeAction(pickWeighted(items).kind, p)
}

/**
 * 外部刺激（来客・物音など）への反応。
 * 将来の来客イベントは sim/stimulusQueue.ts の pushStimulus() から呼ばれる。
 * - 臆病: 刺激から最も遠い隅へ避難する
 * - 甘えん坊: 刺激の近くへ寄っていく（人懐っこい）
 * - その他: 少し身構えて（待機）から様子を見る
 */
export function respondToStimulus(p: PersonalityProfile, at?: { x: number; z: number }): CatAction {
  const sx = at?.x ?? 3 // 省略時は玄関（東）方向を刺激源とみなす
  const sz = at?.z ?? 0
  if (p.targetBias === 'corners') {
    // 刺激から最も遠い隅を探して避難する
    const corners = [
      { x: -ROOM.W / 2 + 0.8, z: -ROOM.D / 2 + 0.8 },
      { x: ROOM.W / 2 - 0.8, z: -ROOM.D / 2 + 0.8 },
      { x: -ROOM.W / 2 + 0.8, z: ROOM.D / 2 - 0.8 },
      { x: ROOM.W / 2 - 0.8, z: ROOM.D / 2 - 0.8 },
    ]
    const far = corners.reduce((a, b) =>
      Math.hypot(b.x - sx, b.z - sz) > Math.hypot(a.x - sx, a.z - sz) ? b : a,
    )
    return { kind: 'walk', target: far, timeout: 12 * p.calmness }
  }
  if (p.targetBias === 'center') {
    // 人懐っこい: 刺激の近くへ寄っていく
    return { kind: 'walk', target: { x: sx * 0.5, z: sz * 0.5 }, timeout: 10 }
  }
  return { kind: 'idle', duration: 2.5 * p.calmness }
}
