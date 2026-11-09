import { useEffect, useState } from 'react'
import { t } from '../i18n'
import { useCatStore, driveLevel, NEED_KEYS, type NeedKey } from '../sim/catStore'
import { PERSONALITY_IDS, type PersonalityId } from '../sim/personality'
import { VERSION_LABEL } from '../version'

/**
 * HUD（画面 UI）v1.2.0。
 * 表示される文字列はすべて i18n リソース（src/i18n/ja.ts）から供給する。
 * - 起動時: 猫作成カード（名前入力 + 性格選択）
 * - 右上: 情報パネル（名前・性格・状態・経過時間・現在時刻・欲求 5 種）
 * - 下中央: 自由視点 / 猫を追跡 / 一時停止 / 設定
 * - 設定画面: カメラ・性格変更・開発用デバッグ・バージョン表示
 * - 右下: Version v1.2.0
 */

/** 現在時刻（1 秒ごとに更新） */
function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** 欲求バー 1 本分（数値表示付き） */
function NeedRow({ label, value }: { label: string; value: number }) {
  const level = driveLevel(value)
  const color =
    level === 'urgent' ? '#c25d4f' : level === 'urge' ? '#d97742' : level === 'attention' ? '#e8c13c' : '#8fbf6f'
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="bar">
        <span className="bar-fill" style={{ width: `${value}%`, background: color }} />
      </span>
      <span className="stat-value">{Math.round(value)}</span>
    </div>
  )
}

/** 性格選択グリッド（作成カードと設定画面で共用） */
function PersonalityGrid() {
  const dict = t()
  const personality = useCatStore((s) => s.personality)
  const setPersonality = useCatStore((s) => s.setPersonality)
  const selected = dict.personalities[personality]
  return (
    <>
      <div className="personality-grid">
        {PERSONALITY_IDS.map((id) => (
          <button
            key={id}
            className={`btn personality${personality === id ? ' active' : ''}`}
            onClick={() => setPersonality(id as PersonalityId)}
          >
            {dict.personalities[id].name}
          </button>
        ))}
      </div>
      {selected && <div className="personality-desc">{selected.desc}</div>}
    </>
  )
}

/** 設定画面（カメラ・性格・開発用デバッグ・バージョン） */
function SettingsScreen({ onClose }: { onClose: () => void }) {
  const dict = t()
  const cameraMode = useCatStore((s) => s.cameraMode)
  const setCameraMode = useCatStore((s) => s.setCameraMode)
  const setNeed = useCatStore((s) => s.setNeed)

  return (
    <div className="overlay settings-overlay" onClick={onClose}>
      <div className="card settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="kicker">{dict.appName}</div>
        <h2 className="settings-title">{dict.settings.title}</h2>

        <div className="settings-section">{dict.settings.camera}</div>
        <div className="btn-grid">
          <button
            className={`btn${cameraMode === 'free' ? ' active' : ''}`}
            title={dict.tooltips.free}
            onClick={() => setCameraMode('free')}
          >
            {dict.buttons.free}
          </button>
          <button
            className={`btn${cameraMode === 'follow' ? ' active' : ''}`}
            title={dict.tooltips.follow}
            onClick={() => setCameraMode('follow')}
          >
            {dict.buttons.follow}
          </button>
        </div>

        <div className="settings-section">{dict.settings.personality}</div>
        <PersonalityGrid />

        <div className="settings-section">{dict.settings.debug}</div>
        <div className="settings-note">{dict.settings.debugNote}</div>
        <div className="btn-grid">
          {NEED_KEYS.map((key) => (
            <button key={key} className="btn debug" onClick={() => setNeed(key as NeedKey, 100)}>
              {dict.needs[key]}100
            </button>
          ))}
          <button
            className="btn debug"
            onClick={() => NEED_KEYS.forEach((key) => setNeed(key as NeedKey, 20))}
          >
            {dict.buttons.resetNeeds}
          </button>
        </div>

        <div className="settings-section">{dict.settings.about}</div>
        <div className="version-row">{VERSION_LABEL}</div>

        <button className="btn close" onClick={onClose}>
          {dict.buttons.close}
        </button>
      </div>
    </div>
  )
}

export function HUD({ entered, onEnter }: { entered: boolean; onEnter: () => void }) {
  // Zustand のセレクタで必要な値だけ購読する
  const name = useCatStore((s) => s.name)
  const personality = useCatStore((s) => s.personality)
  const phase = useCatStore((s) => s.phase)
  const elapsed = useCatStore((s) => s.elapsedSeconds)
  const needs = useCatStore((s) => s.needs)
  const paused = useCatStore((s) => s.paused)
  const cameraMode = useCatStore((s) => s.cameraMode)
  const setCameraMode = useCatStore((s) => s.setCameraMode)
  const togglePause = useCatStore((s) => s.togglePause)
  const setName = useCatStore((s) => s.setName)

  const dict = t()
  const now = useClock()
  const [settingsOpen, setSettingsOpen] = useState(false)
  // 猫作成カードの名前入力（確定は「部屋に入る」を押したとき）
  const [draftName, setDraftName] = useState(name)

  // 最も高い欲求に応じた状態コメント
  const strongest = NEED_KEYS.reduce((a, b) => (needs[b] > needs[a] ? b : a), NEED_KEYS[0] as NeedKey)
  const note = needs[strongest] >= 60 ? dict.needNotes[strongest] : dict.needNotes.calm

  return (
    <div className="hud">
      {/* 猫作成カード（起動時） */}
      {!entered && (
        <div className="overlay">
          <div className="card">
            <div className="kicker">{dict.intro.kicker}</div>
            <h1>{dict.intro.title}</h1>
            <p className="sub">{dict.intro.sub}</p>

            <div className="create-section">{dict.create.title}</div>
            <div className="name-row">
              <span className="k">{dict.create.nameLabel}</span>
              <input
                className="name-input"
                value={draftName}
                maxLength={12}
                placeholder={dict.create.namePlaceholder}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </div>
            <div className="create-section">{dict.create.personalityLabel}</div>
            <PersonalityGrid />
            <div className="settings-note">{dict.create.personalityNote}</div>

            <button className="cta" onClick={() => { setName(draftName); onEnter() }}>
              {dict.intro.enter}
            </button>
            <ul className="controls">
              <li>
                <span className="keys">
                  <kbd>{dict.intro.controls.orbit}</kbd>
                </span>
                <span className="label">マウスドラッグ</span>
              </li>
              <li>
                <span className="keys">
                  <kbd>{dict.intro.controls.zoom}</kbd>
                </span>
                <span className="label">マウスホイール</span>
              </li>
              <li>
                <span className="keys">
                  <kbd>W</kbd>
                  <kbd>A</kbd>
                  <kbd>S</kbd>
                  <kbd>D</kbd>
                </span>
                <span className="label">{dict.intro.controls.pan}</span>
              </li>
            </ul>
            <div className="note">{dict.intro.note}</div>
          </div>
        </div>
      )}

      {/* 情報パネル（右上） */}
      {entered && (
        <div className="panel">
          <div className="info-row">
            <span className="k">{dict.panel.nameLabel}</span>
            <span className="v">{name}</span>
          </div>
          <div className="info-row">
            <span className="k">{dict.panel.personalityLabel}</span>
            <span className="v">{dict.personalities[personality]?.name ?? personality}</span>
          </div>
          <div className="info-row">
            <span className="k">{dict.panel.stateLabel}</span>
            <span className="v">{dict.states[phase]}</span>
          </div>
          <div className="info-row">
            <span className="k">{dict.panel.elapsedLabel}</span>
            <span className="v">{dict.formatDuration(elapsed)}</span>
          </div>
          <div className="info-row">
            <span className="k">{dict.panel.clockLabel}</span>
            <span className="v">
              {now.toLocaleTimeString(dict.timeLocale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="divider" />
          <NeedRow label={dict.needs.hunger} value={needs.hunger} />
          <NeedRow label={dict.needs.thirst} value={needs.thirst} />
          <NeedRow label={dict.needs.sleepy} value={needs.sleepy} />
          <NeedRow label={dict.needs.play} value={needs.play} />
          <NeedRow label={dict.needs.curiosity} value={needs.curiosity} />
          <div className="panel-note">{note}</div>
        </div>
      )}

      {/* 操作ボタン（下中央） */}
      {entered && !settingsOpen && (
        <div className="btnbar">
          <button
            className={`btn${cameraMode === 'free' ? ' active' : ''}`}
            title={dict.tooltips.free}
            onClick={() => setCameraMode('free')}
          >
            {dict.buttons.free}
          </button>
          <button
            className={`btn${cameraMode === 'follow' ? ' active' : ''}`}
            title={dict.tooltips.follow}
            onClick={() => setCameraMode('follow')}
          >
            {dict.buttons.follow}
          </button>
          <button
            className={`btn danger${paused ? ' active' : ''}`}
            title={dict.tooltips.pause}
            onClick={togglePause}
          >
            {paused ? dict.buttons.resume : dict.buttons.pause}
          </button>
          <button className="btn" title={dict.tooltips.settings} onClick={() => setSettingsOpen(true)}>
            {dict.buttons.settings}
          </button>
        </div>
      )}

      {/* 設定画面 */}
      {settingsOpen && <SettingsScreen onClose={() => setSettingsOpen(false)} />}

      {/* 一時停止中のバッジ */}
      {entered && paused && !settingsOpen && <div className="badge">{dict.pausedBadge}</div>}

      {/* 操作ヒント（左下） */}
      {entered && <div className="hints">{dict.hints}</div>}

      {/* バージョン表示（右下） */}
      {entered && <div className="version-label">{VERSION_LABEL}</div>}
    </div>
  )
}
