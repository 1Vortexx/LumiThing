import React, { useEffect, useState } from 'react'
import styles from './SettingsView.module.css'

export type SleepTimer = '0' | '60' | '300' | '600'
export type ScreensaverType = 'bubbles' | 'clock'

export interface SettingsValues {
  sleepTimer: SleepTimer
  visualizer: boolean
}

const DEFAULTS: SettingsValues = {
  sleepTimer: '300',
  visualizer: true,
}

export function loadSettings(): SettingsValues {
  try {
    return {
      sleepTimer: (localStorage.getItem('lumi_sleep') as SleepTimer) ?? DEFAULTS.sleepTimer,
      visualizer: localStorage.getItem('lumi_visualizer') !== 'false',
    }
  } catch {
    return DEFAULTS
  }
}

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

interface SettingsViewProps {
  onChange: (v: SettingsValues) => void
}

const SettingsView: React.FC<SettingsViewProps> = ({ onChange }) => {
  const [v, setV] = useState<SettingsValues>(loadSettings)

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
    const next = { ...v, [key]: value }
    setV(next)
    onChange(next)
    if (key === 'sleepTimer') persist('lumi_sleep', value as string)
    if (key === 'visualizer') persist('lumi_visualizer', String(value))
  }

  useEffect(() => { onChange(v) }, [])

  return (
    <div className={styles.view}>
      <p className={styles.heading}>Settings</p>

      {/* Display */}
      <div className={styles.group}>
        <p className={styles.groupLabel}>Display</p>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Visualizer</span>
          <button
            className={styles.toggle}
            data-on={v.visualizer}
            onClick={() => set('visualizer', !v.visualizer)}
            aria-label="Toggle visualizer"
          >
            <div className={styles.thumb} />
          </button>
        </div>
      </div>

      {/* Power */}
      <div className={styles.group}>
        <p className={styles.groupLabel}>Power</p>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Sleep Timer</span>
          <div className={styles.seg}>
            {([['0','Off'],['60','1m'],['300','5m'],['600','10m']] as [SleepTimer, string][]).map(([val, lbl]) => (
              <button
                key={val}
                className={styles.segBtn}
                data-active={v.sleepTimer === val}
                onClick={() => set('sleepTimer', val)}
              >{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {/* About */}
      <div className={styles.group}>
        <p className={styles.groupLabel}>About</p>

        <div className={styles.aboutRow}>
          <span className={styles.aboutKey}>App</span>
          <span className={styles.aboutVal}>LumiThing Astra</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutKey}>Release</span>
          <span className={styles.aboutVal}>Beta 1</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutKey}>Version</span>
          <span className={styles.aboutVal}>1.2.6</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutKey}>Build</span>
          <span className={styles.aboutVal}>1.2.6.3461</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutKey}>Platform</span>
          <span className={styles.aboutVal}>Android ADB</span>
        </div>
      </div>

      {/* Credits */}
      <div className={styles.group}>
        <p className={styles.groupLabel}>Credits</p>

        <div className={styles.credit}>
          <a className={styles.creditName} href="https://itsvortexx.space" target="_blank" rel="noreferrer">1Vortexx</a>
          <div className={styles.creditRole}>Primary LumiThing Developer</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.credit}>
          <div className={styles.creditName}>BluDood</div>
          <div className={styles.creditRole}>Developer and creator of GlanceThing, LumiThing's base and inspiration</div>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
