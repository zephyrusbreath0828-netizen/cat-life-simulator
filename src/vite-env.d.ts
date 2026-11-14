/// <reference types="vite/client" />

// GLB モデルを import で読み込めるようにする型宣言。
// import された GLB はビルド時に data URI へインライン化され、
// 単一 HTML ファイルの自己完結性を保てる。
declare module '*.glb' {
  const src: string
  export default src
}
