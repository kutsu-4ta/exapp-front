import Link from 'next/link'

const FONT = 'var(--font-noto-serif), serif'

export default function Page() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f2ec',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        color: '#2a1c10',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.5em', color: '#a89888', marginBottom: 16 }}>
          中小企業診断士 学習管理
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          Exapp
        </h1>
        <p style={{ fontSize: 13, letterSpacing: '0.2em', color: '#7a6858', marginBottom: 48 }}>
          机では演習に全振り、出先で弱点克服。
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '12px 40px',
            backgroundColor: '#5c3a1e',
            color: '#fdf8f2',
            fontSize: 12,
            letterSpacing: '0.4em',
            borderRadius: 3,
            textDecoration: 'none',
          }}
        >
          ログイン
        </Link>
      </div>
    </div>
  )
}
