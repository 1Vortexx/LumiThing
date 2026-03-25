import React from 'react'
import styles from './Background.module.css'

export type BgStyle = 'full' | 'thumbnail'

interface BackgroundProps {
  image: string | null
  useStatic?: boolean
  bgStyle?: BgStyle
}

const Background: React.FC<BackgroundProps> = ({ image, useStatic, bgStyle = 'full' }) => {
  if (bgStyle === 'thumbnail' && !useStatic) {
    return (
      <div className={styles.root}>
        <div className={styles.black} />
        {image && (
          <img
            src={image}
            className={styles.thumbnail}
            alt=""
            aria-hidden
          />
        )}
      </div>
    )
  }

  const bg = useStatic ? 'url(/background.png)' : (image ? `url(${image})` : undefined)
  return (
    <div className={styles.root}>
      <div
        className={useStatic ? styles.staticImage : styles.image}
        style={bg ? { backgroundImage: bg } : undefined}
        data-loaded={useStatic || !!image}
      />
      {!useStatic && <div className={styles.overlay} />}
    </div>
  )
}

export default Background
