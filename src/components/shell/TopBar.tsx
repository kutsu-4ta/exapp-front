import Link from 'next/link'

export function TopBar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #edeae6',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
      }}
    >
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#1a1108',
          letterSpacing: '0.04em',
        }}
      >
        診断士 学習管理
      </span>
      <Link
        href="/login"
        style={{
          fontSize: '0.75rem',
          color: '#b5a99a',
          letterSpacing: '0.04em',
          textDecoration: 'none',
        }}
      >
        ログアウト
      </Link>
    </header>
  )
}
