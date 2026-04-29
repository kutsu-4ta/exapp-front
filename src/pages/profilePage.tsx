import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store/auth'
import { logout as apiLogout } from '../lib/api/authenticate'
import { c, font } from '../styles/notion'

export default function ProfilePage() {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const clearAuth = useAuthStore((state) => state.logout)

    const handleLogout = async () => {
        await apiLogout().catch(() => {})
        clearAuth()
        navigate('/login')
    }

    if (!user) return null

    const initial = user.name?.charAt(0).toUpperCase() ?? '?'

    return (
        <div style={pageWrapper}>
            <div style={content}>
                <h1 style={heading}>プロフィール</h1>

                <div style={avatarWrap}>
                    <div style={avatar}>{initial}</div>
                </div>

                <div style={card}>
                    <div style={row}>
                        <span style={label}>名前</span>
                        <span style={value}>{user.name}</span>
                    </div>
                    <div style={divider} />
                    <div style={row}>
                        <span style={label}>メールアドレス</span>
                        <span style={value}>{user.email}</span>
                    </div>
                </div>

                <button style={logoutBtn} onClick={handleLogout}>
                    ログアウト
                </button>
            </div>
        </div>
    )
}

const pageWrapper: React.CSSProperties = { backgroundColor: c.bg, minHeight: '100vh', color: c.text }
const content: React.CSSProperties = { maxWidth: '480px', margin: '0 auto', padding: '48px 20px 120px' }
const heading: React.CSSProperties = { fontSize: '20px', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.01em' }
const avatarWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '32px' }
const avatar: React.CSSProperties = {
    width: '72px', height: '72px', borderRadius: '50%',
    backgroundColor: '#2383e2', color: '#fff',
    fontSize: '28px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const card: React.CSSProperties = { border: `1px solid rgba(55, 53, 47, 0.09)`, borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }
const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.06)' }
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }
const value: React.CSSProperties = { fontSize: font.base, color: c.text, fontWeight: 500 }
const logoutBtn: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '6px',
    fontSize: font.sm, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 500,
}
