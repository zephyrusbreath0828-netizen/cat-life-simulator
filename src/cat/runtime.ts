import * as THREE from 'three'

/**
 * 猫のランタイム値（毎フレーム書き換わる高頻度データ）。
 *
 * Zustand ストアに入れると再描画が毎フレーム走ってしまうため、
 * 位置のような連続値はこのモジュール単位のシングルトンで共有する。
 * - 書き込み: CatController（移動の積分結果）
 * - 読み取り: CameraRig（追跡カメラ）と、将来の行動AI
 */
export const catRuntime = {
  /** 猫の現在位置（床平面、y は 0 固定） */
  pos: new THREE.Vector3(0.8, 0, 0.7),
  /** 現在の向き（ラジアン） */
  yaw: Math.PI,
}
