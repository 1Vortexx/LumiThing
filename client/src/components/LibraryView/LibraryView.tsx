import React, { useContext, useEffect, useRef, useState } from 'react'
import { MediaContext } from '@/contexts/MediaContext.tsx'
import styles from './LibraryView.module.css'

interface TrackEntry {
  name: string
  artists: string[]
  album: string
  playedAt: number
}

const MAX_HISTORY = 20

const LibraryView: React.FC = () => {
  const { playerData, image } = useContext(MediaContext)
  const [history, setHistory] = useState<TrackEntry[]>([])
  const lastTrackRef = useRef<string | null>(null)
  const imageRef = useRef<string | null>(null)

  // Accumulate track history as songs change
  useEffect(() => {
    if (!playerData) return
    const name = playerData.track.name
    if (name === lastTrackRef.current) return
    lastTrackRef.current = name

    setHistory(prev => {
      const entry: TrackEntry = {
        name,
        artists: playerData.track.artists,
        album: playerData.track.album,
        playedAt: Date.now(),
      }
      // dedupe head, prepend
      const filtered = prev.filter(t => t.name !== name || t.artists.join() !== entry.artists.join())
      return [entry, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [playerData?.track.name])

  useEffect(() => { imageRef.current = image }, [image])

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <span className="material-icons">queue_music</span>
        <p>Play something to see your history</p>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      <p className={styles.heading}>Recents</p>
      <div className={styles.list}>
        {history.map((t, i) => (
          <div key={i} className={styles.row} data-current={i === 0}>
            <div className={styles.thumb}>
              {i === 0 && image ? (
                <img src={image} alt="" className={styles.thumbImg} />
              ) : (
                <span className="material-icons">music_note</span>
              )}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{t.name}</p>
              <p className={styles.sub}>{t.artists.join(', ')} · {t.album}</p>
            </div>
            {i === 0 && (
              <span className={styles.nowBadge}>Now</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LibraryView
