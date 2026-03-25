import React from 'react'
import styles from './TabBar.module.css'

export type Tab = 'home' | 'nowplaying' | 'library' | 'settings'

interface TabBarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home',       icon: 'home',        label: 'Home'    },
  { id: 'nowplaying', icon: 'music_note',  label: 'Player'  },
  { id: 'library',    icon: 'queue_music', label: 'Recents' },
  { id: 'settings',   icon: 'tune',        label: 'Settings'},
]

const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => (
  <nav className={styles.bar}>
    {TABS.map(t => (
      <button
        key={t.id}
        className={styles.tab}
        data-active={active === t.id}
        onClick={() => onChange(t.id)}
        aria-label={t.label}
      >
        <span className="material-icons">{t.icon}</span>
        <span className={styles.label}>{t.label}</span>
      </button>
    ))}
  </nav>
)

export default TabBar
