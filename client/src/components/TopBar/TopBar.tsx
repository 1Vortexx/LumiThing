import React, { useEffect, useState } from 'react'
import styles from './TopBar.module.css'

interface WeatherInfo {
  temp: number
  unit: 'F' | 'C'
  icon: string
  condition: string
}

interface TopBarProps {
  clockFormat: '12h' | '24h'
  serverTime: { time: string; date: string } | null
  mediaPlayerActive?: boolean
  weather?: WeatherInfo | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatClock(now: Date, clockFormat: '12h' | '24h') {
  if (clockFormat === '12h') {
    let h = now.getHours()
    const m = now.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  } else {
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }
}

function formatDate(now: Date) {
  return `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
}

const TopBar: React.FC<TopBarProps> = ({ clockFormat, serverTime, mediaPlayerActive, weather }) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const displayTime = serverTime?.time ?? formatClock(now, clockFormat)
  const displayDate = serverTime?.date ?? formatDate(now)

  return (
    <div className={styles.bar} data-media-active={mediaPlayerActive}>
      <div className={styles.left}>
        <span className={styles.date}>{displayDate}</span>
        <span className={styles.clock}>{displayTime}</span>
      </div>
      {weather && (
        <div className={styles.weather}>
          <span className={`material-icons ${styles.weatherIcon}`}>{weather.icon}</span>
          <span className={styles.weatherTemp}>{weather.temp}°{weather.unit}</span>
        </div>
      )}
      <span className={styles.build}>LumiThing Astra 1.1.4</span>
    </div>
  )
}

export default TopBar
