import { ROOM, CAT_COLLIDERS, type AABB } from '../layout'

/**
 * 円形の当たり判定（半径 r）を部屋の内側と家具の外へ押し出す。
 * 「めり込み量が最小の軸」方向へ押し出すため、壁や家具に沿って
 * 滑らかに滑るような動きになる。
 * 猫の移動（CatController）とランダム地点のサンプリング（scheduler）で共用。
 */
export function resolveCircle(x: number, z: number, r: number, colliders: AABB[] = CAT_COLLIDERS): [number, number] {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  // まず部屋の内側に制限する
  let nx = clamp(x, -ROOM.W / 2 + r, ROOM.W / 2 - r)
  let nz = clamp(z, -ROOM.D / 2 + r, ROOM.D / 2 - r)

  // 家具のフットプリント（AABB）から押し出す
  for (const c of colliders) {
    const minX = c.minX - r
    const maxX = c.maxX + r
    const minZ = c.minZ - r
    const maxZ = c.maxZ + r
    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      const pushX = Math.min(nx - minX, maxX - nx)
      const pushZ = Math.min(nz - minZ, maxZ - nz)
      if (pushX < pushZ) nx = nx - minX < maxX - nx ? minX : maxX
      else nz = nz - minZ < maxZ - nz ? minZ : maxZ
    }
  }
  return [nx, nz]
}
