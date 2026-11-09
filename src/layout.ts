// 部屋の寸法と配置の共有定数。
// 単位はすべてメートル。x: -3..3（西..東）、z: -2.5..2.5（窓側の壁..ソファ側の壁）

export const ROOM = { W: 6, D: 5, H: 2.8, T: 0.15 }

// 北の壁（z = -2.5）にある窓の開口部
export const WINDOW = { cx: 0, halfW: 1.1, sillY: 0.9, topY: 2.3 }

// 太陽は窓の外（北東・高所）から照らす
export const SUN_POSITION: [number, number, number] = [4, 7, -9]

// 猫（ミケ）の初期位置と向き
export const CAT_START = { x: -1.3, z: -0.2, yaw: -1.75 }
// 猫の当たり判定の半径（移動・衝突解決で使用）
export const CAT_RADIUS = 0.16

/** 施設（インタラクション地点）: 猫が行動のために向かう場所。
 *  stand = 猫が立つ位置、look = その場で向く対象の中心。 */
export const POI = {
  /** 餌皿（食事） */
  foodBowl: { stand: { x: 1.0, z: 0.35 }, look: { x: 1.54, z: 0.35 } },
  /** 給水器（飲水） */
  waterFountain: { stand: { x: 1.9, z: 0.95 }, look: { x: 2.45, z: 0.95 } },
  /** 猫ベッド（睡眠）— ベッドの上に入る */
  catBed: { stand: { x: -1.75, z: -1.35 }, look: { x: -1.75, z: -1.35 } },
  /** 窓辺（好奇心: 窓の外を見る） */
  windowSpot: { stand: { x: -0.6, z: -1.9 }, look: { x: -0.6, z: -2.5 } },
  /** ボール（遊ぶ） */
  ball: { stand: { x: 0.55, z: -1.0 }, look: { x: 1.0, z: -1.0 } },
}

// 給餌コーナー（餌皿がマットの上に載る）
export const FEEDING_MAT = { x: 1.7, z: 0.35, yaw: -0.12 }
// 給水器の設置位置
export const FOUNTAIN = { x: 2.45, z: 0.95 }
// 猫ベッドの設置位置
export const CAT_BED = { x: -1.75, z: -1.35 }
// ボールのおもちゃの置き位置
export const BALL_SPOT = { x: 1.0, z: -1.0 }

export type AABB = { minX: number; maxX: number; minZ: number; maxZ: number }

// 猫が侵入できない家具のフットプリント（猫ベッドとボールは上に乗れる/触れるので含めない）
export const CAT_COLLIDERS: AABB[] = [
  { minX: -1.25, maxX: 1.25, minZ: 1.35, maxZ: 2.5 },     // ソファ
  { minX: -0.68, maxX: 0.68, minZ: 0.12, maxZ: 0.88 },    // ローテーブル
  { minX: 1.82, maxX: 2.78, minZ: -2.32, maxZ: -1.38 },   // キャットタワー
  { minX: -2.88, maxX: -2.22, minZ: -2.32, maxZ: -1.68 }, // 観葉植物
  { minX: -2.85, maxX: -2.35, minZ: 1.35, maxZ: 1.85 },   // フロアランプ
  { minX: -3, maxX: -2.6, minZ: -0.6, maxZ: 0.8 },        // 本棚
  { minX: 1.34, maxX: 2.06, minZ: 0.09, maxZ: 0.61 },     // 給餌マット + 餌皿
  { minX: 2.27, maxX: 2.63, minZ: 0.77, maxZ: 1.13 },     // 給水器
]
