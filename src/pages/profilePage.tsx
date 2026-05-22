import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '../lib/store/auth'
import {logout as apiLogout} from '../lib/api/authenticate'
import {backBtn, c, font, pageHeading} from '../styles/notion'
import {ProfileInfoSection} from '../components/profile/ProfileInfoSection'
import {GeminiSettingsSection} from '../components/profile/GeminiSettingsSection'
import {MaterialsSection} from '../components/profile/MaterialsSection'
import {SubjectsSection} from '../components/profile/SubjectsSection'
import {TicketTemplateSection} from '../components/profile/TicketTemplateSection'

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

  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div style={pageWrapper}>
      <div style={content}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 style={pageHeading}>プロフィール</h1>

        <div style={avatarWrap}>
          <div style={avatar}>{initial}</div>
        </div>

        <div style={card}>
          <div style={cardRow}>
            <span style={cardLabel}>名前 / メールアドレス</span>
            <span style={cardValue}>{user.name} ({user.email})</span>
          </div>
        </div>

        <SectionHeading>AI・パーソナライズ設定</SectionHeading>
        <ProfileInfoSection />

        <SectionHeading>高度な設定</SectionHeading>
        <GeminiSettingsSection />

        <SectionHeading>アプリ設定</SectionHeading>
        <MaterialsSection />
        <SubjectsSection />

        <SectionHeading>チケットテンプレート</SectionHeading>
        <TicketTemplateSection />

        <button style={logoutBtn} onClick={handleLogout}>ログアウト</button>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {children}
      </span>
    </div>
  )
}

const pageWrapper: React.CSSProperties = { backgroundColor: c.bg, minHeight: '100vh', color: c.text }
const content: React.CSSProperties = { maxWidth: '480px', margin: '0 auto', padding: '48px 20px 120px' }
const avatarWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '32px' }
const avatar: React.CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#2383e2', color: '#fff', fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const card: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }
const cardRow: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px' }
const cardLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }
const cardValue: React.CSSProperties = { fontSize: font.base, color: c.text, fontWeight: 500 }
const logoutBtn: React.CSSProperties = { width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid rgba(55,53,47,0.16)', borderRadius: '6px', fontSize: font.sm, color: 'rgba(55,53,47,0.6)', cursor: 'pointer', fontWeight: 500, marginTop: '16px' }
