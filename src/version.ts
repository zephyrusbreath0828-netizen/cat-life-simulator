/**
 * アプリのバージョン情報。
 * 表示（画面右下・設定画面）と README の版数をここで一元管理する。
 * リリース時は package.json の version と併せて更新する。
 */
export const APP_NAME = '猫部屋シミュレータ'
export const APP_VERSION = '1.1.0'
/** 画面・設定画面に表示する形式（例: "Version v1.1.0"） */
export const VERSION_LABEL = `Version v${APP_VERSION}`
