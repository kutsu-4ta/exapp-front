'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore} from '@/lib/store/auth'
import {register} from '@/lib/api/authenticate'

const FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'

export default function RegisterPage() {
    const router = useRouter()

    // Zustandからアクションを取得
    const setAuth = useAuthStore((state) => state.setAuth)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const validateForm = () => {
        if (!name || !email || !password || !passwordConfirmation) {
            setError('すべての項目を入力してください。')
            return false
        }
        if (password.length < 8) {
            setError('パスワードは8文字以上必要です。')
            return false
        }
        if (password !== passwordConfirmation) {
            setError('パスワードが一致しません。')
            return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('有効なメールアドレスを入力してください。')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!validateForm()) return
        setLoading(true)

        try {
            // API実行（戻り値に user も含めるよう api/auth.ts を調整している前提）
            const { token, user } = await register(name, email, password, passwordConfirmation)

            // ストアに保存（自動で localStorage にも永続化される）
            setAuth(user, token)

            router.push('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : '登録に失敗しました。')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={pageWrapper}>
            {/* ナビゲーション */}
            <nav style={navBar}>
                <div style={breadcrumb}>
                    <span style={navIcon}>📝</span>
                    <span style={activeNav}>Sign up</span>
                </div>
                <Link href="/login" style={topBackLink}>
                    ← ログインに戻る
                </Link>
            </nav>

            <div style={mainContent}>
                <div style={loginCard}>
                    <header style={headerSection}>
                        <h1 style={title}>Create account</h1>
                        <p style={description}>学習の記録を、ここから始める。</p>
                    </header>

                    {error && <div style={errorBanner}>{error}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div style={formGroup}>
                            <div style={inputWrapper}>
                                <label style={labelStyle}>お名前</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="山田 太郎"
                                    style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                                    onBlur={(e) => (e.currentTarget.style.backgroundColor = 'rgba(242, 241, 238, 0.6)')}
                                />
                            </div>

                            <div style={inputWrapper}>
                                <label style={labelStyle}>メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                                    onBlur={(e) => (e.currentTarget.style.backgroundColor = 'rgba(242, 241, 238, 0.6)')}
                                />
                            </div>

                            <div style={inputWrapper}>
                                <label style={labelStyle}>パスワード (8文字以上)</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                                    onBlur={(e) => (e.currentTarget.style.backgroundColor = 'rgba(242, 241, 238, 0.6)')}
                                />
                            </div>

                            <div style={inputWrapper}>
                                <label style={labelStyle}>パスワード（確認）</label>
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                    style={inputStyle}
                                    onFocus={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                                    onBlur={(e) => (e.currentTarget.style.backgroundColor = 'rgba(242, 241, 238, 0.6)')}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <footer style={footerStyle}>
                        すでにアカウントをお持ちの方は{' '}
                        <Link href="/login" style={registerLink}>
                            ログイン
                        </Link>
                    </footer>
                </div>
            </div>
        </div>
    )
}

// ── Styles (変更なし) ──────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { width: '100%', backgroundColor: 'rgba(242, 241, 238, 0.6)', border: '1px solid rgba(15, 15, 15, 0.1)', borderRadius: '4px', padding: '8px 12px', color: '#37352f', fontSize: '14px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box', transition: 'background 0.2s ease' }
const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f', display: 'flex', flexDirection: 'column' }
const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }
const breadcrumb: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const navIcon: React.CSSProperties = { marginRight: '6px' }
const activeNav: React.CSSProperties = { fontWeight: 500, color: '#37352f' }
const topBackLink: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.45)', fontSize: '12px', textDecoration: 'none' }
const mainContent: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
const loginCard: React.CSSProperties = { width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column' }
const headerSection: React.CSSProperties = { marginBottom: '32px' }
const title: React.CSSProperties = { fontSize: '30px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }
const description: React.CSSProperties = { fontSize: '14px', color: 'rgba(55, 53, 47, 0.6)', margin: 0 }
const errorBanner: React.CSSProperties = { marginBottom: '20px', padding: '10px 12px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', fontSize: '12px', color: '#cf1322' }
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }
const inputWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'rgba(55, 53, 47, 0.6)' }
const submitBtn: React.CSSProperties = { width: '100%', padding: '10px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }
const footerStyle: React.CSSProperties = { marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)' }
const registerLink: React.CSSProperties = { color: '#2383e2', textDecoration: 'none', fontWeight: 500 }