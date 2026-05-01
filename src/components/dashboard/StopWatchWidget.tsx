import { Link } from 'react-router-dom'
import { todayString } from '../../types/workspace'
import { useStopwatchSync } from '../../hooks/useStopwatchSync'

export function StopWatchWidget() {
    const { time, isActive, syncing, syncError, handleToggle, reset } = useStopwatchSync()
    const minutes = Math.ceil(time / 60000)
    const logUrl = `/workspace/${todayString()}?minutes=${minutes}`

    const formatTime = () => {
        const hours = Math.floor(time / 3600000)
        const mins = Math.floor((time % 3600000) / 60000)
        const secs = Math.floor((time % 60000) / 1000)
        const ms = Math.floor((time % 1000) / 10)
        const h = hours > 0 ? `${hours}:` : ''
        const m = mins < 10 && hours > 0 ? `0${mins}` : mins
        const s = secs < 10 ? `0${secs}` : secs
        const msStr = ms < 10 ? `0${ms}` : ms
        return { main: `${h}${m}:${s}`, sub: `.${msStr}` }
    }

    const { main, sub } = formatTime()

    return (
        <div style={container}>
            <div style={widgetCard}>
                <div style={displaySection}>
                    <span style={label}>STUDY TIMER</span>
                    {isActive ? (
                        <div style={timeWrapper}>
                            <span style={mainTime}>{main}</span>
                            <span style={subTime}>{sub}</span>
                        </div>
                    ) : time > 0 ? (
                        <Link to={logUrl} style={timeLink}>
                            <div style={timeWrapper}>
                                <span style={mainTime}>{main}</span>
                                <span style={subTime}>{sub}</span>
                            </div>
                            <span style={saveHint}>記録する →</span>
                        </Link>
                    ) : (
                        <div style={timeWrapper}>
                            <span style={mainTime}>0:00</span>
                            <span style={subTime}>.00</span>
                        </div>
                    )}
                    {syncError && <span style={errorHint}>{syncError}</span>}
                </div>

                <div style={controls}>
                    {time > 0 && !isActive && (
                        <button onClick={reset} style={iconBtn} title="リセット" disabled={syncing}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={handleToggle}
                        style={toggleBtn(isActive, syncing)}
                        disabled={syncing}
                        aria-label={isActive ? '停止' : '開始'}
                    >
                        {syncing ? <SyncSpinner /> : isActive ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
    )
}

function PauseIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </svg>
    )
}

export function SyncSpinner() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ animation: 'sw-spin 0.7s linear infinite' }}
        >
            <style>{`@keyframes sw-spin { to { transform: rotate(360deg) } }`}</style>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
    padding: '0 16px',
    marginBottom: '32px',
}

const widgetCard: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid rgba(55, 53, 47, 0.09)',
    borderRadius: '12px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
}

const displaySection: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
    fontSize: '32px',
    fontWeight: 500,
    color: '#37352f',
    fontVariantNumeric: 'tabular-nums',
}

const subTime: React.CSSProperties = {
    fontSize: '18px',
    color: 'rgba(55, 53, 47, 0.2)',
    fontVariantNumeric: 'tabular-nums',
}

const timeLink: React.CSSProperties = {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
}

const saveHint: React.CSSProperties = {
    fontSize: '11px',
    color: '#2383e2',
    fontWeight: 600,
    marginTop: '-2px',
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
    width: '52px',
    height: '52px',
    borderRadius: '26px',
    border: 'none',
    backgroundColor: syncing
        ? 'rgba(55, 53, 47, 0.04)'
        : active ? 'rgba(55, 53, 47, 0.05)' : '#37352f',
    color: active || syncing ? 'rgba(55, 53, 47, 0.4)' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: syncing ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: syncing ? 0.7 : 1,
})

const iconBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(55, 53, 47, 0.3)',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background 0.2s',
}
