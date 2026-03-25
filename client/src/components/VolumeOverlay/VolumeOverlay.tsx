import React from 'react'
import styles from './VolumeOverlay.module.css'

interface VolumeOverlayProps {
  volume: number
  visible: boolean
}

const VolumeOverlay: React.FC<VolumeOverlayProps> = ({ volume, visible }) => (
  <div className={styles.overlay} data-visible={visible} aria-hidden>
    <span className="material-icons">
      {volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
    </span>
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${volume}%` }} />
    </div>
    <span className={styles.pct}>{Math.round(volume)}</span>
  </div>
)

export default VolumeOverlay
