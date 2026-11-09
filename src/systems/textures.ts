import * as THREE from 'three'

/** 決定論的乱数（シード固定）— 手続きテクスチャがリロード間で安定する。 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** オーク材のフローリング: 木目・継ぎ目・段違いジョイント。 */
export function makeFloorTexture(): THREE.CanvasTexture {
  return makeTexture(512, (ctx, s) => {
    const rand = mulberry32(7)
    const plankH = 64
    for (let row = 0; row * plankH < s; row++) {
      const y = row * plankH
      const tone = 150 + Math.floor(rand() * 30)
      ctx.fillStyle = `rgb(${tone + 22},${Math.floor(tone * 0.74)},${Math.floor(tone * 0.52)})`
      ctx.fillRect(0, y, s, plankH)
      for (let g = 0; g < 14; g++) {
        ctx.strokeStyle = `rgba(80,50,30,${0.05 + rand() * 0.08})`
        ctx.lineWidth = 1 + rand() * 1.2
        ctx.beginPath()
        const gy = y + 6 + rand() * (plankH - 12)
        ctx.moveTo(0, gy)
        for (let x = 0; x <= s; x += 64) ctx.lineTo(x, gy + (rand() - 0.5) * 5)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(60,38,22,0.55)'
      ctx.fillRect(0, y, s, 2)
      ctx.fillRect(rand() * s, y, 2, plankH)
    }
  })
}

/** 壁の質感用のさりげない漆喰ノイズ。 */
export function makeWallTexture(): THREE.CanvasTexture {
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#efe9dd'
    ctx.fillRect(0, 0, s, s)
    const rand = mulberry32(11)
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(120,105,88,0.05)' : 'rgba(255,255,255,0.05)'
      ctx.fillRect(rand() * s, rand() * s, 1.5, 1.5)
    }
  })
}

/** 生地の織り目ノイズ（base の色で着色）。 */
export function makeFabricTexture(base: string): THREE.CanvasTexture {
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, s, s)
    const rand = mulberry32(23)
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect(rand() * s, rand() * s, 2, 1)
    }
  })
}

/** 壁飾り用の小さな抽象画。 */
export function makeArtTexture(variant: number): THREE.CanvasTexture {
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f0e7d6'
    ctx.fillRect(0, 0, s, s)
    const terracotta = 'rgba(200,110,70,0.92)'
    const pine = 'rgba(60,90,80,0.9)'
    const ochre = 'rgba(220,170,80,0.9)'
    if (variant === 0) {
      ctx.fillStyle = terracotta
      ctx.beginPath()
      ctx.arc(s * 0.5, s * 0.42, s * 0.22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = pine
      ctx.fillRect(s * 0.2, s * 0.68, s * 0.6, 8)
      ctx.fillStyle = ochre
      ctx.beginPath()
      ctx.arc(s * 0.32, s * 0.62, s * 0.09, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = pine
      ctx.beginPath()
      ctx.moveTo(s * 0.2, s * 0.75)
      ctx.lineTo(s * 0.5, s * 0.25)
      ctx.lineTo(s * 0.8, s * 0.75)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = terracotta
      ctx.beginPath()
      ctx.arc(s * 0.68, s * 0.34, s * 0.1, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}
