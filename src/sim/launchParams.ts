/**
 * 起動時パラメータ。
 * URL クエリと window フラグ（自動テスト用の注入）の両方を許容する。
 *   ?nointro=1            導入（猫作成）カードを省略
 *   ?follow=1             猫追跡カメラで開始
 *   ?pause=1              一時停止状態で開始
 *   ?personality=timid    性格を指定して開始（active/mypeace/timid/affectionate）
 *   ?hunger=100 など      欲求の初期値を指定
 */
const params = new URLSearchParams(window.location.search)
const w = window as unknown as Record<string, unknown>

const flag = (param: string, winKey: string) => params.has(param) || w[winKey] === true

/** ?hunger=100 形式の欲求初期値を読み取る（0〜100 に丸める） */
function needParam(key: string): number | undefined {
  const raw =
    params.get(key) ??
    (typeof w[`__CATSIM_${key.toUpperCase()}__`] !== 'undefined'
      ? String(w[`__CATSIM_${key.toUpperCase()}__`])
      : null)
  if (raw == null) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : undefined

}

export const launchParams = {
  nointro: flag('nointro', '__CATSIM_NOINTRO__'),
  follow: flag('follow', '__CATSIM_FOLLOW__'),
  pause: flag('pause', '__CATSIM_PAUSE__'),
  /** 性格の初期値（active / mypeace / timid / affectionate） */
  personality:
    params.get('personality') ??
    (typeof w.__CATSIM_PERSONALITY__ === 'string' ? (w.__CATSIM_PERSONALITY__ as string) : 'active'),
  /** 欲求の初期値（指定のないものはストアの既定値を使う） */
  initialNeeds: {
    hunger: needParam('hunger'),
    thirst: needParam('thirst'),
    sleepy: needParam('sleepy'),
    play: needParam('play'),
    curiosity: needParam('curiosity'),
  },
}
