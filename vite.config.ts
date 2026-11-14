import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile inlines the entire JS/CSS bundle into dist/index.html,
// so the built simulator is one self-contained file that runs offline.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // .glb をアセットとして扱い、data URI にインライン化する（単一 HTML 用）
  assetsInclude: ['**/*.glb'],
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 10_000,
  },
})
