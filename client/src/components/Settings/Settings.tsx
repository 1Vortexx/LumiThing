import React, { useEffect, useState } from 'react'
import styles from './Settings.module.css'

type ClockFormat = '12h' | '24h'
type SleepTimer = '0' | '60' | '300' | '600'

export interface SettingsValues {
  clockFormat: ClockFormat
  sleepTimer: SleepTimer
  visualizer: boolean
}

const DEFAULTS: SettingsValues = {
  clockFormat: '12h',
  sleepTimer: '300',
  visualizer: true,
}

export function loadSettings(): SettingsValues {
  try {
    return {
      clockFormat: (localStorage.getItem('lumi_clock') as ClockFormat) ?? DEFAULTS.clockFormat,
      sleepTimer: (localStorage.getItem('lumi_sleep') as SleepTimer) ?? DEFAULTS.sleepTimer,
      visualizer: localStorage.getItem('lumi_visualizer') !== 'false',
    }
  } catch {
    return DEFAULTS
  }
}

function save(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

interface SettingsProps {
  open: boolean
  onClose: () => void
  onChange: (values: SettingsValues) => void
}

const Settings: React.FC<SettingsProps> = ({ open, onClose, onChange }) => {
  const [values, setValues] = useState<SettingsValues>(loadSettings)

  const update = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    onChange(next)
    if (key === 'clockFormat') save('lumi_clock', value as string)
    if (key === 'sleepTimer') save('lumi_sleep', value as string)
    if (key === 'visualizer') save('lumi_visualizer', String(value))
  }

  // close on backdrop tap
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    onChange(values)
  }, [])

  return (
    <div className={styles.overlay} data-open={open} onClick={handleBackdrop}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>DISPLAY</p>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Clock Format</span>
            <div className={styles.segmented}>
              {(['12h', '24h'] as ClockFormat[]).map(f => (
                <button
                  key={f}
                  className={styles.segment}
                  data-active={values.clockFormat === f}
                  onClick={() => update('clockFormat', f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Visualizer</span>
            <button
              className={styles.toggle}
              data-on={values.visualizer}
              onClick={() => update('visualizer', !values.visualizer)}
              aria-label="Toggle visualizer"
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>POWER</p>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Sleep Timer</span>
            <div className={styles.segmented}>
              {([['0', 'Off'], ['60', '1m'], ['300', '5m'], ['600', '10m']] as [SleepTimer, string][]).map(([val, label]) => (
                <button
                  key={val}
                  className={styles.segment}
                  data-active={values.sleepTimer === val}
                  onClick={() => update('sleepTimer', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={styles.version}>LumiThing</p>
      </div>
    </div>
  )
}

export default Settings
