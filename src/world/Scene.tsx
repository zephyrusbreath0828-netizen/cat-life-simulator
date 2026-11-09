import { Sky } from '@react-three/drei'
import { Room } from './Room'
import { Sofa, CoffeeTable, Rug, Plant, FloorLamp, Bookshelf, WallArt, Door } from './Furniture'
import { CatTower } from './CatTower'
import { FeedingCorner, WaterFountain } from './Bowls'
import { CatBed, BallToy } from './CatBed'
import { CatController } from '../cat/behavior/CatController'
import { CameraRig } from '../systems/CameraRig'
import { AutoHide, behindSouth, behindEast } from '../systems/AutoHide'
import { SUN_POSITION } from '../layout'

/**
 * ワールドの構成 + ライティング (v1.1.0)。
 * すべての配置値は layout.ts から来るので、部屋の再配置は定数の変更だけで済む。
 */
export function Scene() {
  const [sx, sy, sz] = SUN_POSITION
  return (
    <>
      {/* 窓から見える空。太陽光の方向と一致させる */}
      <Sky
        sunPosition={[sx * 10, sy * 10, sz * 10]}
        turbidity={3.2}
        rayleigh={1.4}
        mieCoefficient={0.006}
        mieDirectionalG={0.95}
      />

      <hemisphereLight args={['#cfe0f5', '#8a7a66', 0.55]} />
      <ambientLight intensity={0.14} />

      {/* 太陽光 — 唯一の影キャスター。壁が遮るため光は窓の開口部からだけ入る */}
      <directionalLight
        position={[sx, sy, sz]}
        intensity={3.4}
        color="#ffedc9"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00012}
        shadow-normalBias={0.025}
        shadow-camera-near={3}
        shadow-camera-far={30}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
      />

      {/* 部屋と家具 */}
      <Room />
      <Rug />
      <Sofa />
      <CoffeeTable />
      <FeedingCorner />
      <WaterFountain />
      <CatBed />
      <BallToy />
      <CatTower />
      <Plant />
      <FloorLamp />
      <Bookshelf />

      {/* 壁に掛けた物は、その壁が隠れたときに一緒に隠す（ドールハウス表示） */}
      <AutoHide hide={behindSouth}>
        <WallArt />
      </AutoHide>
      <AutoHide hide={behindEast}>
        <Door />
      </AutoHide>

      {/* 猫（行動コントローラ + モデル） */}
      <CatController />

      <CameraRig />
    </>
  )
}
