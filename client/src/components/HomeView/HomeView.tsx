import { useContext, useEffect, useState } from 'react'
import { MediaContext } from '@/contexts/MediaContext.tsx'
import { SocketContext } from '@/contexts/SocketContext.tsx'
import { Tab } from '@/App.tsx'
import Visualizer from '@/components/Visualizer/Visualizer.tsx'
import ScrollText from '@/components/ScrollText/ScrollText.tsx'
import styles from './HomeView.module.css'

interface App { id: string; name?: string; path: string }

interface HomeViewProps {
  onNavigate: (tab: Tab) => void
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { playerData, image } = useContext(MediaContext)
  const { ready, socket } = useContext(SocketContext)

  const [apps, setApps] = useState<App[]>([])
  const [appImages, setAppImages] = useState<Record<string, string>>({})

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
  const isPlaying = playerData?.isPlaying ?? false

  return (
    <div className={styles.home}>

      {/* ── Top: Now Playing card (70%) ── */}
      <div
        className={styles.playerCard}
        onClick={() => onNavigate('nowplaying')}
        role="button"
        aria-label="Open Now Playing"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        <div className={styles.playerOverlay} />

        <div className={styles.playingBadge} data-playing={isPlaying} data-nothing={!playerData}>
          <span>{playerData ? (isPlaying ? 'Now Playing' : 'Paused') : 'No Media Playing'}</span>
        </div>

        <div className={styles.playerInfo}>
          <div className={styles.playerText}>
            {playerData ? (
              <>
                <ScrollText className={styles.playerName}>{playerData.track.name}</ScrollText>
                <ScrollText className={styles.playerArtist}>{playerData.track.artists.join(', ')}</ScrollText>
              </>
            ) : (
              <p className={styles.emptyLabel}>Pretty quiet here...</p>
            )}
          </div>
          {playerData && (
            <div className={styles.visualizerWrap}>
              <Visualizer isPlaying={isPlaying} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Bottom: shortcuts strip (30%) ── */}
      <div className={styles.shortcuts}>
        {slots.map((app, i) =>
          app ? (
            <button
              key={app.id}
              className={styles.shortcut}
              onClick={() => openApp(app.id)}
              aria-label={app.name ?? app.id}
            >
              {appImages[app.id]
                ? <img src={appImages[app.id]} alt={app.name ?? app.id} className={styles.shortcutIcon} />
                : <span className="material-icons">apps</span>
              }
              <span className={styles.shortcutLabel}>{app.name ?? app.id}</span>
            </button>
          ) : (
            <div key={i} className={styles.shortcutEmpty} />
          )
        )}
      </div>

    </div>
  )
}

export default HomeView
