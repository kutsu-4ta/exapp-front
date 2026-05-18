// カラー定義を共通化
import {useAuthStore} from '../lib/store/auth'
import {Link, useLocation, useSearchParams} from 'react-router-dom'

const COLOR_ACTIVE = '#37352f'
const COLOR_INACTIVE = 'rgba(55, 53, 47, 0.4)'

function IconHome({ active }: { active: boolean }) {
  const c = active ? COLOR_ACTIVE : COLOR_INACTIVE
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconLog({ active }: { active: boolean }) {
  const c = active ? COLOR_ACTIVE : COLOR_INACTIVE
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconWeak({ active }: { active: boolean }) {
  const c = active ? COLOR_ACTIVE : COLOR_INACTIVE
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconSprint({ active }: { active: boolean }) {
  const c = active ? COLOR_ACTIVE : COLOR_INACTIVE
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="11" rx="1" />
      <rect x="17" y="4" width="5" height="13" rx="1" />
    </svg>
  )
}

function IconExam({ active }: { active: boolean }) {
  const c = active ? COLOR_ACTIVE : COLOR_INACTIVE
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

const TABS = [
  { href: '/', label: 'ホーム', Icon: IconHome, matchPrefix: '/', exact: true },
  {
    href: '/workspace/daily-logs',
    label: 'デイリー',
    Icon: IconLog,
    matchPrefix: '/workspace',
    exact: false,
  },
  { href: '/sprint', label: 'スプリント', Icon: IconSprint, matchPrefix: '/sprint', exact: false },
  { href: '/notelist', label: 'ノート', Icon: IconWeak, matchPrefix: '/note', exact: false },
  { href: '/exam', label: '過去問', Icon: IconExam, matchPrefix: '/exam', exact: false },
]

export function BottomNav() {
  const location = useLocation()
  const pathname = location.pathname
  const [searchParams] = useSearchParams()

  const token = useAuthStore((state) => state.token)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/terms' ||
    pathname === '/privacy'

  const isExamInput = pathname.startsWith('/exam') && searchParams.get('view') === 'input'

  if (!token || isAuthPage || isExamInput) {
    return null
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(55, 53, 47, 0.08)',
        display: 'flex',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxSizing: 'content-box',
      }}
    >
      {TABS.map(({ href, label, Icon, matchPrefix, exact }) => {
        const active = exact ? pathname === matchPrefix : pathname.startsWith(matchPrefix)
        return (
          <Link
            key={href}
            to={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: active ? COLOR_ACTIVE : COLOR_INACTIVE,
              textDecoration: 'none',
              fontSize: '10px',
              fontWeight: active ? 600 : 500,
              transition: 'color 0.15s ease',
            }}
          >
            <Icon active={active} />
            <span style={{ transform: 'scale(0.9)' }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
