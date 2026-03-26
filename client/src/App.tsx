import { useContext, useEffect, useRef, useState } from 'react'

import { AppBlurContext } from '@/contexts/AppBlurContext.tsx'
import { SocketContext } from '@/contexts/SocketContext.tsx'
import { MediaContext } from '@/contexts/MediaContext.tsx'
import { SleepContext } from '@/contexts/SleepContext.tsx'

import Background, { BgStyle } from '@/components/Background/Background.tsx'
import TopBar from '@/components/TopBar/TopBar.tsx'
import HomeView from '@/components/HomeView/HomeView.tsx'
import NowPlaying from '@/components/NowPlaying/NowPlaying.tsx'
import LibraryView from '@/components/LibraryView/LibraryView.tsx'
import SettingsView, { loadSettings, SettingsValues } from '@/components/SettingsView/SettingsView.tsx'
import LoadingScreen from '@/components/LoadingScreen/LoadingScreen.tsx'
import Menu from '@/components/Menu/Menu.tsx'
import ButtonToast from '@/components/ButtonToast/ButtonToast.tsx'

import { extractAccentColor } from '@/lib/colorExtract.ts'

import styles from './App.module.css'

export type Tab = 'home' | 'nowplaying' | 'library' | 'settings'

type ButtonShortcuts = Record<'1' | '2' | '3' | '4', string | null>
interface ShortcutInfo { id: string; name?: string }

const App: React.FC = () => {
  const { blurred } = useContext(AppBlurContext)
  const { ready, socket } = useContext(SocketContext)
  const { image, playerData, actions } = useContext(MediaContext)
  const { setSleepState } = useContext(SleepContext)

  const [activeTab, setActiveTab] = useState<Tab>('home')
  const activeTabRef = useRef<Tab>('home')
  const navigate = (tab: Tab) => { activeTabRef.current = tab; setActiveTab(tab) }

  const [settings, setSettings] = useState<SettingsValues>(loadSettings)

  const [buttonShortcuts, setButtonShortcuts] = useState<ButtonShortcuts>({ '1': null, '2': null, '3': null, '4': null })
  const [serverTime, setServerTime] = useState<{ time: string; date: string } | null>(null)
  const [bgStyle, setBgStyle] = useState<BgStyle>('full')
  const [weather, setWeather] = useState<{ temp: number; unit: 'F' | 'C'; icon: string; condition: string; city: string } | null>(null)
  const buttonShortcutsRef = useRef(buttonShortcuts)
  buttonShortcutsRef.current = buttonShortcuts

  // Shortcut name + icon lookup
  const [shortcutMap, setShortcutMap] = useState<Record<string, ShortcutInfo>>({})
  const [shortcutIcons, setShortcutIcons] = useState<Record<string, string>>({})
  const shortcutMapRef = useRef(shortcutMap)
  const shortcutIconsRef = useRef(shortcutIcons)
  shortcutMapRef.current = shortcutMap
  shortcutIconsRef.current = shortcutIcons

  // Toast state
  const [toast, setToast] = useState<{ btn: string; name: string; icon: string | null } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const actionsRef = useRef(actions)
  const socketRef = useRef(socket)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastImageRef = useRef<string | null>(null)
  const lastEscapeRef = useRef<number>(0)

  actionsRef.current = actions
  socketRef.current = socket

  // Listen for apps list, buttons assignments, and app icons
  useEffect(() => {
    if (!socket) return
    const listener = (e: MessageEvent) => {
      const { type, action, data } = JSON.parse(e.data)
      if (type === 'time') {
        setServerTime(data)
      } else if (type === 'bgstyle') {
        setBgStyle(data as BgStyle)
      } else if (type === 'screensaverstyle') {
        try { localStorage.setItem('lumi_screensaver_type', data as string) } catch {}
      } else if (type === 'weather') {
        setWeather(data)
      } else if (type === 'buttons') {
        setButtonShortcuts(data)
      } else if (type === 'apps' && !action) {
        const map: Record<string, ShortcutInfo> = {}
        for (const s of data as ShortcutInfo[]) map[s.id] = s
        setShortcutMap(map)
      } else if (type === 'apps' && action === 'image') {
        setShortcutIcons(prev => ({ ...prev, [data.id]: data.image }))
      }
    }
    socket.addEventListener('message', listener)
    socket.send(JSON.stringify({ type: 'time' }))
    socket.send(JSON.stringify({ type: 'bgstyle' }))
    socket.send(JSON.stringify({ type: 'screensaverstyle' }))
    socket.send(JSON.stringify({ type: 'weather' }))
    return () => socket.removeEventListener('message', listener)
  }, [socket])

  // Dynamic accent color from album art
  useEffect(() => {
    if (!image || image === lastImageRef.current) return
    lastImageRef.current = image
    extractAccentColor(image).then(color => {
      document.documentElement.style.setProperty('--accent', color)
      const m = color.match(/\d+/g)
      if (m) document.documentElement.style.setProperty('--accent-rgb', `${m[0]}, ${m[1]}, ${m[2]}`)
    })
  }, [image])

  // Sleep timer
  useEffect(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    const secs = parseInt(settings.sleepTimer, 10)
    if (secs > 0 && ready) {
      sleepTimerRef.current = setTimeout(() => setSleepState('screensaver'), secs * 1000)
    }
    return () => { if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current) }
  }, [settings.sleepTimer, ready, playerData?.track.name, setSleepState])

  // Dial / keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          actionsRef.current.playPause()
          break
        case 'ArrowRight':
          e.preventDefault(); actionsRef.current.skipForward(); break
        case 'ArrowLeft':
          e.preventDefault(); actionsRef.current.skipBackward(); break
        case 'Escape': {
          e.preventDefault()
          const now = Date.now()
          if (now - lastEscapeRef.current < 400) {
            lastEscapeRef.current = 0
            navigate('library')
          } else {
            lastEscapeRef.current = now
            if (activeTabRef.current === 'home') navigate('nowplaying')
            else navigate('home')
          }
          break
        }
        case '1': case '2': case '3': case '4': {
          const id = buttonShortcutsRef.current[e.key as '1'|'2'|'3'|'4']
          if (!id) break
          socketRef.current?.send(JSON.stringify({ type: 'apps', action: 'open', data: id }))
          const info = shortcutMapRef.current[id]
          const name = info?.name ?? info?.id ?? id
          const icon = shortcutIconsRef.current[id] ?? null
          setToast({ btn: e.key, name, icon })
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
          toastTimerRef.current = setTimeout(() => setToast(null), 1800)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className={styles.app} data-blurred={blurred || !ready}>
        <Background image={image} useStatic={activeTab !== 'nowplaying'} bgStyle={bgStyle} />
        <TopBar clockFormat="12h" serverTime={serverTime} mediaPlayerActive={activeTab === 'nowplaying'} weather={weather} />

        <main className={styles.content}>
          {activeTab === 'home'       && <HomeView onNavigate={navigate} weather={weather} serverTime={serverTime} clockFormat="12h" />}
          {activeTab === 'nowplaying' && <NowPlaying showVisualizer={settings.visualizer} bgStyle={bgStyle} />}
          {activeTab === 'library'    && <LibraryView />}
          {activeTab === 'settings'   && <SettingsView onChange={setSettings} />}
        </main>
      </div>

      <ButtonToast
        buttonNum={toast?.btn ?? null}
        name={toast?.name ?? null}
        icon={toast?.icon ?? null}
      />
      <LoadingScreen />
      <Menu onNavigate={navigate} />
    </>
  )
}

export default App
