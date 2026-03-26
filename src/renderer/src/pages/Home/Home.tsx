import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DevModeContext } from '@/contexts/DevModeContext.js'
import { ChannelContext } from '@/contexts/ChannelContext.js'
import styles from './Home.module.css'

enum CarThingState {
  NotFound = 'not_found',
  NotInstalled = 'not_installed',
  Installing = 'installing',
  Ready = 'ready'
}

const stateConfig = {
  [CarThingState.NotFound]: { icon: 'usb_off', label: 'Not Found', desc: 'Reconnect your CarThing or run setup again.', color: '#ff4f4f' },
  [CarThingState.NotInstalled]: { icon: 'install_mobile', label: 'Not Installed', desc: 'CarThing found, but LumiThing is not installed.', color: '#ffb347' },
  [CarThingState.Installing]: { icon: 'downloading', label: 'Installing...', desc: 'Installing LumiThing to your CarThing.', color: '#00b4d8' },
  [CarThingState.Ready]: { icon: 'check_circle', label: 'Ready', desc: 'CarThing is connected and running LumiThing.', color: '#00e5a0' },
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { devMode } = useContext(DevModeContext)
  const { channel } = useContext(ChannelContext)
  const [hasCustomClient, setHasCustomClient] = useState(false)
  const [carThingState, setCarThingState] = useState<CarThingState | null>(null)
  const carThingStateRef = useRef(carThingState)
  const [needsPlaybackSetup, setNeedsPlaybackSetup] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ currentVersion: string; latestVersion: string; downloadUrl: string } | null>(null)
  const [updateState, setUpdateState] = useState<'idle' | 'downloading' | 'ready'>('idle')
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updateLogs, setUpdateLogs] = useState<string[]>([])
  const [showUpdateLog, setShowUpdateLog] = useState(false)
  const [carThingNeedsUpdate, setCarThingNeedsUpdate] = useState(false)
  const [installingToCarThing, setInstallingToCarThing] = useState(false)

  useEffect(() => {
    window.api.getStorageValue('setupComplete').then(setupComplete => {
      if (!setupComplete) navigate('/setup')
    })

    const removeListener = window.api.on('carThingState', async s => {
      const state = s as CarThingState
      setCarThingState(state)
      carThingStateRef.current = state
    })

    const stateTimeout = setTimeout(() => {
      if (carThingStateRef.current !== null) return
      window.api.triggerCarThingStateUpdate()
    }, 200)

    window.api.getStorageValue('playbackHandler').then(handler => {
      if (handler === null) setNeedsPlaybackSetup(true)
    })

    window.api.checkUpdate().then(setUpdateInfo)
    const checkUpdateInterval = setInterval(() => window.api.checkUpdate().then(setUpdateInfo), 1000 * 60 * 30)

    Promise.all([
      window.api.getVersion(),
      window.api.getStorageValue('lastInstalledClientVersion')
    ]).then(([current, last]) => {
      setCarThingNeedsUpdate(!!last && last !== current)
    })

    const removeProgressListener = window.api.on('updateProgress', (pct: unknown) => setUpdateProgress(pct as number))
    const removeDownloadedListener = window.api.on('updateDownloaded', () => setUpdateState('ready'))
    const removeLogListener = window.api.on('updateLog', (msg: unknown) => {
      setUpdateLogs(prev => [...prev, msg as string])
      setShowUpdateLog(true)
    })

    return () => {
      removeListener()
      clearTimeout(stateTimeout)
      clearInterval(checkUpdateInterval)
      removeProgressListener()
      removeDownloadedListener()
      removeLogListener()
    }
  }, [])

  const updateHasCustomClient = async () => setHasCustomClient(await window.api.hasCustomClient())
  useEffect(() => { updateHasCustomClient() }, [devMode])

  const cfg = carThingState ? stateConfig[carThingState] : null

  return (
    <div className={styles.home}>
      {/* Device status card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className="material-icons" style={{ color: 'rgba(0,180,216,0.6)', fontSize: 16 }}>devices</span>
          <span className={styles.cardTitle}>Device</span>
        </div>
        <div className={styles.statusRow}>
          {cfg ? (
            <>
              <span className="material-icons" style={{ color: cfg.color, fontSize: 36 }}>{cfg.icon}</span>
              <div className={styles.statusText}>
                <p className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</p>
                <p className={styles.statusDesc}>{cfg.desc}</p>
              </div>
            </>
          ) : (
            <>
              <span className="material-icons" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 36 }}>search</span>
              <div className={styles.statusText}>
                <p className={styles.statusLabel}>Searching...</p>
                <p className={styles.statusDesc}>Looking for your CarThing</p>
              </div>
            </>
          )}
        </div>
        {(carThingState === CarThingState.NotFound || carThingState === CarThingState.NotInstalled) && (
          <button className={styles.actionBtn} onClick={() => navigate('/setup')}>
            <span className="material-icons">arrow_forward</span>
            Run Setup
          </button>
        )}
        {carThingState === CarThingState.Ready && (
          <button
            className={styles.actionBtn}
            disabled={installingToCarThing}
            onClick={async () => {
              setInstallingToCarThing(true)
              await window.api.installApp()
              setInstallingToCarThing(false)
            }}
          >
            <span className="material-icons">refresh</span>
            {installingToCarThing ? 'Reinstalling...' : 'Reinstall'}
          </button>
        )}
      </div>

      {/* Notices */}
      {needsPlaybackSetup && carThingState === CarThingState.Ready && (
        <div className={styles.notice}>
          <span className="material-icons">music_off</span>
          <div className={styles.noticeText}>
            <p className={styles.noticeTitle}>No Playback Handler</p>
            <p className={styles.noticeDesc}>Set up a media source to control playback.</p>
          </div>
          <button className={styles.noticeBtn} onClick={() => navigate('/setup?step=3')}>Set Up</button>
        </div>
      )}

      {devMode && hasCustomClient && (
        <div className={styles.notice} data-type="warning">
          <span className="material-icons">warning</span>
          <div className={styles.noticeText}>
            <p className={styles.noticeTitle}>Custom Client Active</p>
            <p className={styles.noticeDesc}>A custom client is installed on your device.</p>
          </div>
          <button className={styles.noticeBtn} data-type="danger" onClick={() => window.api.removeCustomClient().then(updateHasCustomClient)}>Remove</button>
        </div>
      )}

      {carThingNeedsUpdate && (carThingState === CarThingState.Ready || carThingState === CarThingState.NotInstalled) && (
        <div className={styles.notice} data-type="update">
          <span className="material-icons">phonelink_setup</span>
          <div className={styles.noticeText}>
            <p className={styles.noticeTitle}>CarThing Needs Update</p>
            <p className={styles.noticeDesc}>You have the latest LumiThing app, but your CarThing hasn't been updated yet.</p>
          </div>
          <button
            className={styles.noticeBtn}
            disabled={installingToCarThing}
            onClick={async () => {
              setInstallingToCarThing(true)
              await window.api.installApp()
              setCarThingNeedsUpdate(false)
              setInstallingToCarThing(false)
            }}
          >
            {installingToCarThing ? 'Updating...' : 'Update CarThing'}
          </button>
        </div>
      )}

      {updateInfo && updateInfo.latestVersion !== updateInfo.currentVersion && (
        <div className={styles.updateCard}>
          <div className={styles.notice} data-type="update">
            <span className="material-icons">{updateState === 'ready' ? 'check_circle' : 'download'}</span>
            <div className={styles.noticeText}>
              <p className={styles.noticeTitle}>
                {updateState === 'idle' && 'Update Available'}
                {updateState === 'downloading' && `Downloading... ${updateProgress}%`}
                {updateState === 'ready' && 'Ready to Install'}
              </p>
              <p className={styles.noticeDesc}>{updateInfo.currentVersion} → {updateInfo.latestVersion}</p>
            </div>
            {updateState === 'idle' && (
              <button className={styles.noticeBtn} onClick={() => { setUpdateState('downloading'); setUpdateLogs([]); window.api.downloadUpdate() }}>
                Download
              </button>
            )}
            {updateState === 'ready' && (
              <button className={styles.noticeBtn} onClick={() => window.api.quitAndInstall()}>
                Install
              </button>
            )}
            {updateLogs.length > 0 && (
              <button className={styles.noticeBtn} onClick={() => setShowUpdateLog(s => !s)}>
                <span className="material-icons" style={{ fontSize: 16 }}>{showUpdateLog ? 'expand_less' : 'expand_more'}</span>
              </button>
            )}
          </div>
          {showUpdateLog && updateLogs.length > 0 && (
            <div className={styles.updateLog}>
              {updateLogs.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Home
