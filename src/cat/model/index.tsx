import { CAT_MODEL } from './config'
import { ProceduralCat } from './ProceduralCat'
import { GltfCat } from './GltfCat'
import type { CatModelProps } from './types'

/**
 * 猫モデルのエントリポイント。
 * `config.ts` の CAT_MODEL 設定 1 行の書き換えでモデルを差し替えられる。
 */
export function CatModel(props: CatModelProps) {
  if (CAT_MODEL.kind === 'gltf') {
    return <GltfCat config={CAT_MODEL} {...props} />
  }
  return <ProceduralCat {...props} />
}
