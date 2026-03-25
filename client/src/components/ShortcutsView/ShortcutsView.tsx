import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '@/contexts/SocketContext.tsx'
import styles from './ShortcutsView.module.css'

interface App {
  id: string
  path: string
}

const ShortcutsView: React.FC = () => {
  const { ready, socket } = useContext(SocketContext)
  const [apps, setApps] = useState<App[] | null>(null)
  const [images, setImages] = useState<Record<string, string>>({})

  function openApp(id: string) {
    socket?.send(JSON.stringify({ type: 'apps', action: 'open', data: id }))
  }

  function lock() {
    socket?.send(JSON.stringify({ type: 'lock' }))
  }

  useEffect(() => {
    if (!ready || !socket) return

    const listener = (e: MessageEvent) => {
      const { type, action, data } = JSON.parse(e.data)
      if (type !== 'apps') return
      if (action === 'image') {
        setImages(prev => ({ ...prev, [data.id]: data.image }))
      } else {
        setApps(data)
        for (const app of data) {
          socket.send(JSON.stringify({ type: 'apps', action: 'image', data: app.id }))
        }
      }
    }

    socket.addEventListener('message', listener)
    socket.send(JSON.stringify({ type: 'apps' }))

    return () => socket.removeEventListener('message', listener)
  }, [ready, socket])

  return (
    <div className={styles.view}>
      <p className={styles.heading}>Shortcuts</p>

      <div className={styles.grid}>
        {/* App shortcuts from server */}
        {apps && apps.length > 0 ? (
          apps.map(app => (
            <button
              key={app.id}
              className={styles.appBtn}
              onClick={() => openApp(app.id)}
              aria-label={app.id}
            >
              {images[app.id] ? (
                <img src={images[app.id]} alt={app.id} className={styles.appIcon} />
              ) : (
                <span className="material-icons">apps</span>
              )}
              <span className={styles.appLabel}>{app.id}</span>
            </button>
          ))
        ) : apps && apps.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-icons">workspaces</span>
            <p>No shortcuts yet</p>
            <p className={styles.hint}>Add them in the desktop app</p>
          </div>
        ) : null}

        {/* Lock button — always present */}
        <button
          className={`${styles.appBtn} ${styles.lockBtn}`}
          onClick={lock}
          aria-label="Lock"
        >
          <span className="material-icons">lock</span>
          <span className={styles.appLabel}>Lock</span>
        </button>
      </div>
    </div>
  )
}

export default ShortcutsView
