'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function IconHome({ active }: { active: boolean }) {
  const c = active ? '#5c3a1e' : '#b5a99a'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

function IconLog({ active }: { active: boolean }) {
  const c = active ? '#5c3a1e' : '#b5a99a'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function IconWeak({ active }: { active: boolean }) {
  const c = active ? '#5c3a1e' : '#b5a99a'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L2 21h20L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.5" fill={c} />
    </svg>
  )
}

function IconExam({ active }: { active: boolean }) {
  const c = active ? '#5c3a1e' : '#b5a99a'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l5.5 9.5L12 22 6.5 11.5 12 2z" />
    </svg>
  )
}

const TABS = [
  { href: '/', label: 'ホーム', Icon: IconHome, exact: true },
  { href: '/workspace', label: 'ログ', Icon: IconLog, exact: false },
  { href: '/weak', label: '弱点', Icon: IconWeak, exact: false },
  { href: '/exam', label: '過去問', Icon: IconExam, exact: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #edeae6',
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              color: active ? '#5c3a1e' : '#b5a99a',
              textDecoration: 'none',
              fontSize: '0.625rem',
              letterSpacing: '0.05em',
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon active={active} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
