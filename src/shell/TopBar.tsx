import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../lib/store/auth'
import { useTimer } from '../context/TimerContext'

export function TopBar() {
    const location = useLocation()
    const pathname = location.pathname
    const { time, isActive } = useTimer()

    const token = useAuthStore((state) => state.token)
    const user = useAuthStore((state) => state.user)

    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/terms' || pathname === '/privacy'

    if (!token || isAuthPage) {
        return null
    }

    const formatShortTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000)
        const minutes = Math.floor((ms % 3600000) / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        const h = hours > 0 ? `${hours}:` : ''
        const m = minutes < 10 && hours > 0 ? `0${minutes}` : minutes
        const s = seconds < 10 ? `0${seconds}` : seconds
        return `${h}${m}:${s}`
    }

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(55, 53, 47, 0.08)',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#37352f', letterSpacing: '-0.01em' }}>
                    examapp
                </span>

                {time > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 8px',
                        backgroundColor: isActive ? 'rgba(35, 131, 226, 0.07)' : 'rgba(55, 53, 47, 0.05)',
                        borderRadius: '4px',
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#2383e2' : 'rgba(55, 53, 47, 0.3)',
                            animation: isActive ? 'pulse 2s infinite' : 'none',
                        }} />
                        <span style={{
                            fontSize: '13px',
                            fontFamily: 'ia-writer-mono, "SF Mono", monospace',
                            fontWeight: 600,
                            color: isActive ? '#2383e2' : 'rgba(55, 53, 47, 0.5)',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {formatShortTime(time)}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link
                    to="/profile"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#2383e2',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                    title="プロフィール"
                    onClick={() => {}}
                >
                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Link>
            </div>
        </header>
    )
}
