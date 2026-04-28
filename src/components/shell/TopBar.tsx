'use client'

import Link from 'next/link'
import { useTimer } from '@/context/TimerContext'

export function TopBar() {
    const { time, isActive } = useTimer()

    // 表示用の時間をフォーマット
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
        <span
            style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#37352f',
                letterSpacing: '-0.01em',
            }}
        >
            examapp
        </span>

                {/* タイマー稼働中または一時停止中（時間が0でない）場合に表示 */}
                {time > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 8px',
                        backgroundColor: isActive ? 'rgba(35, 131, 226, 0.07)' : 'rgba(55, 53, 47, 0.05)',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease',
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

            <Link
                href="/login"
                style={{
                    fontSize: '12px',
                    color: 'rgba(55, 53, 47, 0.45)',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                }}
            >
                ログアウト
            </Link>

            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
        </header>
    )
}