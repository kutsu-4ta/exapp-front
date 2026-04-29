'use client'

import { useRouter, usePathname } from 'next/navigation' // usePathnameを追加
import { useTimer } from '@/context/TimerContext'
import { useAuthStore } from '@/lib/store/auth'
import { logout as apiLogout } from '@/lib/api/authenticate'

export function TopBar() {
    const router = useRouter()
    const pathname = usePathname() // パス取得
    const { time, isActive } = useTimer()

    const token = useAuthStore((state) => state.token)
    const clearAuth = useAuthStore((state) => state.logout)

    // 非表示にするパスの判定
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/terms' || pathname === '/privacy'

    // ログアウト中または認証関連ページでは表示しない
    if (!token || isAuthPage) {
        return null
    }

    const handleLogout = async () => {
        // APIを叩く際は明示的にPOSTを指定（apiFetch側の実装に合わせて調整してください）
        await apiLogout().catch(() => {})
        clearAuth()
        router.push('/login')
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

            <button
                onClick={handleLogout}
                style={{
                    fontSize: '12px',
                    color: 'rgba(55, 53, 47, 0.45)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                ログアウト
            </button>

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