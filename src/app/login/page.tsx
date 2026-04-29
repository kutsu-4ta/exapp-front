'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'
import { login, googleLogin } from '@/lib/api/authenticate'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup } from 'firebase/auth'

const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'

export default function LoginPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Googleログイン処理
    const handleGoogleLogin = async () => {
        setError(null)
        setLoading(true)
        try {
            // Firebase SDKでGoogle認証
            const result = await signInWithPopup(auth, googleProvider)
            const idToken = await await result.user.getIdToken(true)

            // 自前バックエンドへ検証＆トークン発行を依頼
            const { token, user } = await googleLogin(idToken)

            setAuth(user, token)
            router.push('/')
        } catch (err) {
            console.error(err)
            setError('Googleログインに失敗しました。')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={pageWrapper}>
            <nav style={navBar}>
                <div style={breadcrumb}>
                    <span style={navIcon}>📝</span>
                    <span style={activeNav}>Login</span>
                </div>
            </nav>

            <div style={mainContent}>
                <div style={loginCard}>
                    <header style={headerSection}>
                        <h1 style={title}>Welcome back</h1>
                        <p style={description}>今日も一歩、合格へ。</p>
                    </header>

                    {error && <div style={errorBanner}>{error}</div>}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={googleBtn}
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            style={{ width: '18px', height: '18px' }}
                        />
                        Continue with Google
                    </button>

                    <footer style={footerStyle}>
                        <div style={metaInfoSection}>
                            <div style={metaLinks}>
                                <Link href="/terms" style={metaLink}>利用規約</Link>
                                <span style={metaDivider}>•</span>
                                <Link href="/privacy" style={metaLink}>プライバシーポリシー</Link>
                            </div>

                            <div style={brandAndVersion}>
                                <span style={brandText}>by antapp</span>
                                <span style={metaDivider}>•</span>
                                <span style={versionText}>v1.0.4-stable</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    )
}

// ── 追加・更新したStyles ──────────────────────────────────────────────────────────

const googleBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid rgba(15, 15, 15, 0.15)',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#37352f',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'background 0.2s',
}
const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f', display: 'flex', flexDirection: 'column' }
const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }
const breadcrumb: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const navIcon: React.CSSProperties = { marginRight: '6px' }
const activeNav: React.CSSProperties = { fontWeight: 500, color: '#37352f' }
const mainContent: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
const loginCard: React.CSSProperties = { width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column' }
const headerSection: React.CSSProperties = { marginBottom: '32px' }
const title: React.CSSProperties = { fontSize: '30px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }
const description: React.CSSProperties = { fontSize: '14px', color: 'rgba(55, 53, 47, 0.6)', margin: 0 }
const errorBanner: React.CSSProperties = { marginBottom: '20px', padding: '10px 12px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', fontSize: '12px', color: '#cf1322' }
const footerStyle: React.CSSProperties = { marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)' }
const registerLink: React.CSSProperties = { color: '#2383e2', textDecoration: 'none', fontWeight: 500 }
const metaInfoSection: React.CSSProperties = { marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(55, 53, 47, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }
const metaLinks: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const metaLink: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }
const metaDivider: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.15)', fontSize: '10px' }
const brandAndVersion: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }
const brandText: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.4)', letterSpacing: '0.02em' }
const versionText: React.CSSProperties = { fontSize: '10px', color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.05em', fontFamily: 'monospace' }