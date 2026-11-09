import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SoftShadows } from '@react-three/drei'
import { Scene } from './world/Scene'
import { HUD } from './ui/HUD'
import { launchParams } from './sim/launchParams'

/**
 * アプリのルート。
 * Canvas（3D 描画）と HUD（日本語 UI）を重ねて表示する。
 */
export default function App() {
  // ?nointro=1（または window.__CATSIM_NOINTRO__）で導入カードを省略
  const [entered, setEntered] = useState(launchParams.nointro)
  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ fov: 55, near: 0.05, far: 300, position: [1.2, 2.2, 4.6] }}
      >
        {/* PCSS ソフトシャドウ — 影キャスターは太陽 1 ライトのみ */}
        <SoftShadows size={26} samples={12} focus={0.5} />
        <Scene />
      </Canvas>
      <HUD entered={entered} onEnter={() => setEntered(true)} />
    </div>
  )
}
