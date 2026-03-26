import { useContext, useEffect, useRef, useState } from 'react'
import { MediaContext } from '@/contexts/MediaContext.tsx'
import { SocketContext } from '@/contexts/SocketContext.tsx'
import { Tab } from '@/App.tsx'
import ScrollText from '@/components/ScrollText/ScrollText.tsx'
import styles from './HomeView.module.css'

interface App { id: string; name?: string; path: string }

interface WeatherInfo {
  temp: number
  unit: 'F' | 'C'
  icon: string
  condition: string
  city: string
}

interface HomeViewProps {
  onNavigate: (tab: Tab) => void
  weather?: WeatherInfo | null
  serverTime?: { time: string; date: string } | null
  clockFormat?: '12h' | '24h'
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildClock(now: Date, fmt: '12h' | '24h'): { time: string; ampm: string } {
  if (fmt === '12h') {
    let h = now.getHours()
    const m = now.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return { time: `${h}:${m}`, ampm }
  }
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  return { time: `${h}:${m}`, ampm: '' }
}

function formatRemaining(current: number, total: number): string {
  const remaining = Math.max(0, total - current)
  const secs = Math.floor(remaining / 1000)
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toString().padStart(2, '0')
  return `-${m}:${s}`
}

const TABS = ['Shortcuts', 'Library', 'Weather', 'Clock'] as const

const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  weather,
  serverTime,
  clockFormat = '12h',
}) => {
  const { playerData, image } = useContext(MediaContext)
  const { ready, socket } = useContext(SocketContext)

  const [apps, setApps] = useState<App[]>([])
  const [appImages, setAppImages] = useState<Record<string, string>>({})
  const [tab, setTab] = useState(3)
  const [localNow, setLocalNow] = useState(() => new Date())
  const touchStartX = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setLocalNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!ready || !socket) return
    const listener = (e: MessageEvent) => {
      const { type, action, data } = JSON.parse(e.data)
      if (type !== 'apps') return
      if (action === 'image') {
        setAppImages(prev => ({ ...prev, [data.id]: data.image }))
      } else {
        const pinned = (data as App[]).slice(0, 4)
        setApps(pinned)
        for (const app of pinned) {
          socket.send(JSON.stringify({ type: 'apps', action: 'image', data: app.id }))
        }
      }
    }
    socket.addEventListener('message', listener)
    socket.send(JSON.stringify({ type: 'apps' }))
    return () => socket.removeEventListener('message', listener)
  }, [ready, socket])

  function openApp(id: string) {
    socket?.send(JSON.stringify({ type: 'apps', action: 'open', data: id }))
  }

  const slots = Array.from({ length: 4 }, (_, i) => apps[i] ?? null)

  const clockResult = serverTime
    ? { time: serverTime.time, ampm: '' }
    : buildClock(localNow, clockFormat)
  const displayDate = serverTime?.date
    ?? `${DAYS[localNow.getDay()]}, ${MONTHS[localNow.getMonth()]} ${localNow.getDate()}`

  return (
    <div
      className={styles.home}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const delta = touchStartX.current - e.changedTouches[0].clientX
        if (delta > 50)  setTab(t => Math.min(t + 1, TABS.length - 1))
        if (delta < -50) setTab(t => Math.max(t - 1, 0))
      }}
    >

      {/* ── Banner ────────────────────────────── */}
      <div className={styles.banner} onClick={() => onNavigate('nowplaying')}>
        <div className={styles.artThumb}>
          {image
            ? <img src={image} alt="" className={styles.artImg} />
            : <span className="material-icons">music_note</span>
          }
        </div>
        <div className={styles.bannerInfo}>
          {playerData ? (
            <>
              <ScrollText className={styles.bannerName}>{playerData.track.name}</ScrollText>
              <p className={styles.bannerArtist}>{playerData.track.artists.join(', ')}</p>
            </>
          ) : (
            <p className={styles.emptyLabel}>Nothing playing</p>
          )}
        </div>
        {playerData && (
          <span className={styles.bannerTime}>
            {formatRemaining(playerData.track.duration.current, playerData.track.duration.total)}
          </span>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────── */}
      <div className={styles.tabBar}>
        {TABS.map((label, i) => (
          <button
            key={label}
            className={styles.tabBtn}
            data-active={tab === i}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Sliding sections ──────────────────── */}
      <div className={styles.sectionViewport}>
        <div className={styles.sectionTrack} style={{ transform: `translateX(-${tab * 25}%)` }}>

          {/* 0 — Shortcuts */}
          <div className={styles.section}>
            {apps.length === 0 ? (
              <div className={styles.placeholder}>
                <span className="material-icons">apps</span>
                <p>Add shortcuts in the LumiThing app</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {slots.map((app, i) =>
                  app ? (
                    <button key={app.id} className={styles.gridBtn} onClick={() => openApp(app.id)} aria-label={app.name ?? app.id}>
                      <div className={styles.gridIcon}>
                        {appImages[app.id]
                          ? <img src={appImages[app.id]} alt="" className={styles.gridImg} />
                          : <span className="material-icons">apps</span>
                        }
                      </div>
                      <span className={styles.gridLabel}>{app.name ?? app.id}</span>
                    </button>
                  ) : (
                    <div key={i} className={styles.gridEmpty} />
                  )
                )}
              </div>
            )}
          </div>

          {/* 1 — Library */}
          <div className={styles.section}>
            <div className={styles.grid}>
              {([
                { label: 'Recently Played', icon: 'access_time'  },
                { label: 'Liked Songs',     icon: 'favorite'     },
                { label: 'Playlists',       icon: 'queue_music'  },
                { label: 'Albums',          icon: 'album'        },
              ] as const).map(item => (
                <button key={item.label} className={styles.gridBtn} onClick={() => onNavigate('library')}>
                  <div className={styles.gridIcon}>
                    <span className="material-icons">{item.icon}</span>
                  </div>
                  <span className={styles.gridLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2 — Weather */}
          <div className={styles.section}>
            {weather ? (
              <div className={styles.weatherCard}>
                <span className={`material-icons ${styles.weatherIcon}`}>{weather.icon}</span>
                <div className={styles.weatherTemp}>{weather.temp}°{weather.unit}</div>
                <div className={styles.weatherCondition}>{weather.condition}</div>
                <div className={styles.weatherCity}>{weather.city}</div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <span className="material-icons">cloud_off</span>
                <p>No weather data</p>
              </div>
            )}
          </div>

          {/* 3 — Clock */}
          <div className={styles.section}>
            <div className={styles.clockCard}>
              <div className={styles.clockTime}>
                {clockResult.time}
                {clockResult.ampm && <span className={styles.clockAmpm}>{clockResult.ampm}</span>}
              </div>
              <div className={styles.clockDate}>{displayDate}</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default HomeView
