import {useEffect, useRef, useState} from 'react'
import {Link, useLocation} from 'react-router-dom'
import {useAuthStore} from '../lib/store/auth'
import {useTimer} from '../context/TimerContext'
import {StopWatchWidget} from '../components/dashboard/StopWatchWidget'
import {SnippetPanel} from '../components/common/SnippetPanel'

// TopBar の高さ（ダイアログの top 座標と合わせる）
const TOPBAR_HEIGHT = 38

export function TopBar() {
  const location = useLocation()
  const pathname = location.pathname
  const { time, isActive } = useTimer()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [snippetOpen, setSnippetOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef<number>(0)

  const toggleDialog = () => {
    setSnippetOpen(false)
    setDialogOpen((prev) => !prev)
  }
  const toggleSnippet = () => {
    setDialogOpen(false)
    setSnippetOpen((prev) => !prev)
  }

  // ドラッグ中はページスクロールを無効化する
  useEffect(() => {
    document.body.style.overflow = isDragging ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDragging])

  const isAuthPage = ['/login', '/register', '/terms', '/privacy'].includes(pathname)
  if (!token || isAuthPage) return null

  const formatShortTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const h = hours > 0 ? `${hours}:` : ''
    const m = minutes < 10 && hours > 0 ? `0${minutes}` : minutes
    const s = seconds < 10 ? `0${seconds}` : seconds
    return `${h}${m}:${s}`
  }

  const handleDialogTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleDialogTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false)
    const deltaY = touchStartY.current - e.changedTouches[0].clientY
    // 上方向に 60px 以上スワイプで閉じる
    if (deltaY > 60) setDialogOpen(false)
  }

  return (
    <>
      {/* ── ヘッダーバー ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(55, 53, 47, 0.08)',
          height: `${TOPBAR_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#37352f',
                letterSpacing: '-0.02em',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
              }}
            >
              tsumiki
            </span>
          </Link>

          {/*<AiTrafficIndicator />*/}

          {/* タイマーチップ：タップでダイアログを開閉 */}
          <button
            onClick={toggleDialog}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              backgroundColor: dialogOpen
                ? 'rgba(55, 53, 47, 0.08)'
                : isActive
                  ? 'rgba(35, 131, 226, 0.07)'
                  : 'rgba(55, 53, 47, 0.05)',
              borderRadius: '4px',
              marginLeft: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            aria-label="ストップウォッチを開く"
            aria-expanded={dialogOpen}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#2383e2' : 'rgba(55, 53, 47, 0.3)',
                animation: isActive ? 'pulse 2s infinite' : 'none',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontFamily: 'ia-writer-mono, "SF Mono", monospace',
                fontWeight: 600,
                color: isActive ? '#2383e2' : 'rgba(55, 53, 47, 0.5)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatShortTime(time)}
            </span>
          </button>
        </div>

        {/* 右側: スニペット + プロフィールアイコン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleSnippet}
            aria-label="スニペット"
            aria-expanded={snippetOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: snippetOpen
                ? 'rgba(55,53,47,0.1)'
                : 'rgba(55,53,47,0.05)',
              cursor: 'pointer',
              color: snippetOpen ? '#37352f' : 'rgba(55,53,47,0.45)',
              transition: 'background 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </button>

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
        >
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </Link>
        </div>
      </header>

      {/* ── ストップウォッチダイアログ ──
                position: fixed で TopBar の直下に配置。
                translateY(-100%) で TopBar の裏に隠れ、
                translateY(0) でスライドダウンして表示される。
                背景タップでは閉じない（pointer-events 制御のみ）。
            ── */}
      <div
        onTouchStart={handleDialogTouchStart}
        onTouchEnd={handleDialogTouchEnd}
        style={{
          position: 'fixed',
          top: `${TOPBAR_HEIGHT}px`,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          // 閉じた状態では TopBar の裏に隠れる
          transform: dialogOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // 隠れているときはポインターイベントを無効化
          pointerEvents: dialogOpen ? 'auto' : 'none',
          paddingTop: '4px',
          touchAction: 'none',
        }}
      >
        <StopWatchWidget />

        {/* スワイプハンドル：「上にスワイプで閉じる」の視覚的ヒント */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            paddingBottom: '14px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'rgba(55, 53, 47, 0.12)',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(55, 53, 47, 0.3)',
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}
          ></span>
        </div>
      </div>

      <SnippetPanel
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        topbarHeight={TOPBAR_HEIGHT}
      />
    </>
  )
}
