/**
 * 日本語リソース定義（v1.2.0）。
 *
 * 将来的な多言語化に備え、UI に表示する文字列はすべてこのファイルに集約する。
 * 新しい言語を追加する場合は `src/i18n/index.ts` のレジストリに登録し、
 * `Dict` 型と同じ構造を持つ辞書を作成するだけでよい。
 */

/** 経過時間を日本語表記に整形する（例: 45秒 / 12分30秒 / 1時間5分） */
function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  if (s < 60) return `${s}秒`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m < 60) return r > 0 ? `${m}分${r}秒` : `${m}分`
  const h = Math.floor(m / 60)
  return `${h}時間${m % 60}分`
}

export const ja = {
  localeName: '日本語',
  /** toLocaleTimeString 用のロケール ID */
  timeLocale: 'ja-JP',
  formatDuration,

  appName: '猫部屋シミュレータ',
  intro: {
    kicker: 'バーチャルペットシミュレータ · v1.2.0',
    title: '猫部屋シミュレータ',
    sub: '太陽が差し込むアパートの一室で、猫が暮らし始めます。名前と性格を決めてください。',
    controls: {
      orbit: '視点回転',
      zoom: 'ズーム',
      pan: '視点移動',
    },
    enter: '部屋に入る',
    note: 'ブラウザ内で完全に動作 · 学習機能などの拡張に対応した設計',
  },
  /** 猫作成カード */
  create: {
    title: '猫を作成',
    nameLabel: '名前',
    namePlaceholder: 'ミケ',
    personalityLabel: '性格を選んでください',
    personalityNote: '性格はあとから設定画面でも変更できます。',
  },
  /** 性格の表示名と説明 */
  personalities: {
    active: { name: '活発', desc: 'よく動き回り、遊びと探索が大好き。移動が速く、遊びたい度の上昇が速い。' },
    mypeace: { name: 'マイペース', desc: '自分のリズムを大切にする。同じ場所にじっくり留まり、行動の変化は少なめ。' },
    timid: { name: '臆病', desc: '部屋の隅を好み、慎重。急な変化は苦手で、お気に入りの隅で過ごすことが多い。' },
    affectionate: { name: '甘えん坊', desc: '飼い主（実装予定）が大好き。今は仮行動として部屋の中央付近に集まりやすい。' },
  } as Record<string, { name: string; desc: string }>,
  panel: {
    nameLabel: '名前',
    personalityLabel: '性格',
    stateLabel: '状態',
    elapsedLabel: '経過時間',
    clockLabel: '現在時刻',
  },
  /** 行動フェーズの日本語表示名 */
  states: {
    idle: '待機中',
    walk: '移動中',
    sit: 'お座り中',
    sleep: '睡眠中',
    eat: '食事中',
    drink: '飲水中',
    play: '遊び中',
    window: '窓見中',
  } as Record<string, string>,
  /** 欲求の表示名（UI・デバッグメニュー共用） */
  needs: {
    hunger: '空腹度',
    thirst: '喉の渇き',
    sleepy: '眠気',
    play: '遊びたい度',
    curiosity: '好奇心',
  } as Record<string, string>,
  /** 欲求が高まったときの状態コメント（key: 欲求キー） */
  needNotes: {
    hunger: 'お腹を空かせています。',
    thirst: '喉が渇いています。',
    sleepy: '眠そうです。',
    play: '遊びたくてうずうずしています。',
    curiosity: '何か気になる様子です。',
    calm: '落ち着いて過ごしています。',
  } as Record<string, string>,
  buttons: {
    free: '自由視点',
    follow: '猫を追跡',
    pause: '一時停止',
    resume: '再開',
    settings: '設定',
    close: '閉じる',
    resetNeeds: '全てリセット',
  },
  settings: {
    title: '設定',
    camera: 'カメラ',
    personality: '性格（いつでも変更できます）',
    debug: '開発用デバッグ',
    debugNote: 'ボタンを押すと対応する欲求が 100 になり、猫がすぐに行動を始めます。',
    about: '情報',
  },
  tooltips: {
    free: 'ドラッグで回転・スクロールでズーム・WASDで移動できます',
    follow: 'カメラが猫を追かけます（ドラッグで角度調整も可能）',
    pause: '猫の行動と時間を止めます / 再開します',
    settings: 'カメラ・性格・デバッグメニューを開きます',
  },
  pausedBadge: '一時停止中',
  hints: 'ドラッグ:回転 · スクロール:ズーム · WASD:移動',
}

export type Dict = typeof ja
