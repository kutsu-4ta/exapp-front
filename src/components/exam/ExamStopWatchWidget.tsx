import {useStopwatchSync} from '../../hooks/useStopwatchSync'
import {SyncSpinner} from '../dashboard/StopWatchWidget'

// グローバルタイマーを参照する。props は不要。
export function ExamStopWatchWidget() {
  const { time, isActive, syncing, syncError, handleToggle } = useStopwatchSync()

  const formatTime = () => {
    const hours = Math.floor(time / 3600000)
    const minutes = Math.floor((time % 3600000) / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const ms = Math.floor((time % 1000) / 10)
    const h = hours > 0 ? `${hours}:` : ''
    const m = minutes < 10 && hours > 0 ? `0${minutes}` : minutes
    const s = seconds < 10 ? `0${seconds}` : seconds
    const msStr = ms < 10 ? `0${ms}` : ms
    return { main: `${h}${m}:${s}`, sub: `.${msStr}` }
  }

  const { main, sub } = formatTime()

  return (
    <div style={container}>
      <div style={widgetCard}>
        <div style={displaySection}>
          <span style={label}>EXAM TIMER</span>
          <div style={timeWrapper}>
            <span style={mainTime}>{main}</span>
            <span style={subTime}>{sub}</span>
          </div>
          {syncError && <span style={errorHint}>{syncError}</span>}
        </div>

        <div style={controls}>
          <button
            onClick={handleToggle}
            style={toggleBtn(isActive, syncing)}
            disabled={syncing}
            aria-label={isActive ? '停止' : '開始'}
          >
            {syncing ? (
              <SyncSpinner />
            ) : isActive ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  padding: '0 16px',
  marginBottom: '12px',
}

const widgetCard: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid rgba(55, 53, 47, 0.09)',
  borderRadius: '12px',
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
}

const displaySection: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const label: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.3)',
  letterSpacing: '0.1em',
}

const timeWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  fontFamily: 'ia-writer-mono, "SF Mono", Menlo, monospace',
}

const mainTime: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 500,
  color: '#37352f',
  fontVariantNumeric: 'tabular-nums',
}

const subTime: React.CSSProperties = {
  fontSize: '16px',
  color: 'rgba(55, 53, 47, 0.2)',
  fontVariantNumeric: 'tabular-nums',
}

const errorHint: React.CSSProperties = {
  fontSize: '11px',
  color: '#eb5757',
  marginTop: '2px',
}

const controls: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const toggleBtn = (active: boolean, syncing: boolean): React.CSSProperties => ({
  width: '44px',
  height: '44px',
  borderRadius: '22px',
  border: 'none',
  backgroundColor: syncing
    ? 'rgba(55, 53, 47, 0.04)'
    : active
      ? 'rgba(55, 53, 47, 0.05)'
      : '#37352f',
  color: active || syncing ? 'rgba(55, 53, 47, 0.4)' : '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: syncing ? 'default' : 'pointer',
  transition: 'all 0.2s ease',
  opacity: syncing ? 0.7 : 1,
})
