import { ja, type Dict } from './ja'

/**
 * 多言語レジストリ。
 * 現在は日本語のみ。言語を追加する場合はここに辞書を登録し、
 * `LOCALE` を切り替えるだけで UI 全体が追随する。
 */
const DICTS: Record<string, Dict> = { ja }

let LOCALE = 'ja'

/** 現在の言語の辞書を取得する */
export function t(): Dict {
  return DICTS[LOCALE] ?? ja
}

/** 言語を切り替える（未登録の言語は無視される） */
export function setLocale(locale: string) {
  if (DICTS[locale]) LOCALE = locale
}

export type { Dict }
