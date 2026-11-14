# 猫部屋シミュレータ v1.1.1

太陽が差し込むアパートの一室を舞台に、猫の「ミケ」が欲求と性格に従って
自律的に動き回るバーチャルペットシミュレータ。

**スタック:** React 19 · TypeScript · React Three Fiber 9 · drei 10 · Three.js 0.187 · Zustand 5
テクスチャは実行時に Canvas へ描画。猫モデルは GLTF（Poly by Google の Cat）を
使用し、ビルド時に data URI へインライン化されるため、本番ビルドは
**単一の自己完結 HTML** としてブラウザ内だけで動作する。

## 変更履歴

### v1.1.1 — GLTF 猫モデルの採用
- 標準猫モデルとして「Cat by Poly by Google」（`cat.glb`）を採用し、
  簡易（手続き）モデルを置き換え
- Three.js / React Three Fiber（drei `useGLTF`）で読み込み
- **自動サイズ調整**: bbox 最大寸法を体長 約55cm に自動スケール
- **自動接地**: bbox 下端を床面 y=0 に合わせる
- **向き補正**: モデルは -Z 向きのため π ラジアン回転して前方向きを一致
- **影**: 全メッシュが影を落とし、影も受ける
- アニメーション クリップを持たない静的モデルのため、手続きの
  疑似アニメ（歩行のボブ・揺れ・呼吸）で自然さを補う。
  クリップ付き GLTF に差し替えた場合は自動でクロスフェード再生に切替わる
- `public/models/cat.glb` にソースファイルを配置（`src/assets/cat.glb` は
  単一 HTML へのインライン化用の同一场コピー）

### v1.2.0 — 性格システム（本バージョンに機能はすべて含まれる）
- 性格 4 種（活発 / マイペース / 臆病 / 甘えん坊）: 行動傾向が変化
- 猫作成カード（名前入力・性格選択）、設定画面での性格変更
- 来客イベントに向けた外部刺激キュー（臆病は隅へ避難）

### v1.1.0 — 欲求システムと家具インタラクション
- 欲求 5 種（空腹度・喉の渇き・眠気・遊びたい度・好奇心）。時間で増加
- 行動 AI: 最も高い欲求が閾値 80 を超えると施設へ移動して行動
  （空腹→餌皿で食事 / 渇き→給水器で飲水 / 眠気→猫ベッドで睡眠 /
    遊びたい→ボールで遊ぶ / 好奇心→窓を見て探索）
- 家具追加: 給水器・猫ベッド・ボール。アニメーション追加: 食事・飲水・遊ぶ・窓見
- UI: 情報パネル（欲求数値・現在時刻）、設定画面、デバッグメニュー

### v1.0.0 — 3D アパートと基本行動
- 3D 部屋（窓・ソファ・キャットタワー・餌皿・給水器ほか）、自由視点/追跡カメラ、
  待機・歩行・お座り・睡眠のアニメーション、ランダム行動ロジック、日本語 UI

## 操作

| 操作 | 動作 |
|---|---|
| ドラッグ | 視点回転 |
| スクロール | ズーム（0.6〜11 m） |
| `W A S D` | 視点のパン（自由視点モード時） |

画面下のボタン: **自由視点** / **猫を追跡** / **一時停止** / **設定**

URL パラメータ（デバッグ・自動テスト用）:
`?nointro=1` 導入カード省略 · `?follow=1` 追跡カメラで開始 · `?pause=1` 一時停止で開始 ·
`?personality=timid` 性格指定 · `?hunger=100` など欲求の初期値指定

## アーキテクチャ（今後の拡張を前提した設計）

```
src/
  version.ts             ★ アプリ名・バージョン（画面表示と共通の一元管理）
  i18n/
    ja.ts                日本語リソース（表示文字列 + 時間の整形）
    index.ts             言語レジストリ（setLocale で切替）
  sim/
    catStore.ts          Zustand ストア: 名前・性格・フェーズ・一時停止・
                         カメラモード・経過時間・欲求 5 種
    personality.ts       ★ 性格プロファイル（4 性格の補正値）
    stimulusQueue.ts     外部刺激キュー（来客イベントの受け口）
    launchParams.ts      URL パラメータ（デバッグ・テスト用）
  cat/
    runtime.ts           毎フレーム更新される高頻度値（位置・向き）のシングルトン
    behavior/
      scheduler.ts       意思決定レイヤー: 最欲求優先 + 性格補正つきランダム
      CatController.tsx  行動の実行: 移動積分・旋回・衝突解決・施設の使用
    model/
      config.ts          ★ モデル設定（現在: GLTF 標準猫 / procedural へ 1 行で戻せる）
      types.ts           CatModelProps（モデル実装の共通契約）
      ProceduralCat.tsx  手続き猫（GLTF 差し替え前のフォールバック）
      GltfCat.tsx        GLTF/GLB アダプタ（自動スケール・接地・向き補正・
                         影・クリップ自動検出・クロスフェード・疑似アニメ）
      index.tsx          設定に応じてモデルを選択
  systems/
    CameraRig.tsx        自由視点 / 猫を追跡カメラ
    AutoHide.tsx         ドールハウス表示（壁の自動非表示）
    collision.ts         円 vs AABB の衝突解決
    textures.ts          手続きテクスチャ
  world/                 部屋・家具・餌皿/給水器・猫ベッド/ボール・キャットタワー
  ui/HUD.tsx             日本語 UI（猫作成・情報パネル・ボタン・設定画面）
public/
  models/cat.glb         標準猫モデル（Cat by Poly by Google）
```

### モデルの差し替え

`src/cat/model/config.ts` を参照。
- 別の GLTF: `src/assets/` に置いて import を変える（クリップの有無は自動判別）
- 手続き猫へ戻す: `CAT_MODEL` を `{ kind: 'procedural' }` に

### 今後の拡張（複数猫・年齢・体重・飼い主・学習）に向けて

1. **猫プロファイルの分離**: ストアの name / personality を CatProfile
   （name / personality / age / weight / owner...）へ発展させ、
   猫 1 匹 = プロファイル 1 つ + ランタイム 1 つに。複数猫は
   CatController をインスタンス毎にマウントするだけでよい。
2. **学習機能**: chooseNextAction の結果（行動後の欲求変化）を記録し、
   重みを補正する履歴テーブルを scheduler に追加する。
3. **来客イベント**: stimulusQueue.pushStimulus() を UI や
   イベントスケジューラから呼ぶだけで性格別の反応が発火する。
4. **新しい施設・欲求**: layout.ts の POI と scheduler の DRIVE_ACTIONS に
   1 行ずつ追加するだけで、移動→行動→欲求回復のループが自動で効く。

## ビルド

```bash
npm install
npm run dev       # 開発サーバー
npm run build     # -> dist/index.html（単一ファイル・モデル同梱）
```
