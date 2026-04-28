'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, setToken } from '@/lib/auth'


const FONT = 'var(--font-noto-serif), serif'

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#ffffff',
  border: '1px solid #e4dbd0',
  borderRadius: 3,
  padding: '11px 14px',
  color: '#2a1c10',
  fontSize: 13,
  letterSpacing: '0.05em',
  fontFamily: FONT,
  outline: 'none',
  boxSizing: 'border-box',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { token } = await login(email, password)
      setToken(token)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f2ec',
        color: '#2a1c10',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ヘッダー */}
      <header
        style={{
          borderBottom: '1px solid #e4dbd0',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              color: '#2a1c10',
              fontFamily: FONT,
            }}
          >
            学習管理
          </span>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#a89888', marginLeft: 2 }}>
            EXAPP
          </span>
        </div>
        <Link
          href="/"
          style={{
            color: '#7a6858',
            fontSize: 12,
            letterSpacing: '0.15em',
            fontFamily: FONT,
            textDecoration: 'none',
          }}
        >
          ← トップに戻る
        </Link>
      </header>

      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* タイトル */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: '0.5em',
                color: '#a89888',
                marginBottom: 12,
                fontFamily: FONT,
              }}
            >
              ログイン
            </p>
            <p
              style={{
                fontSize: 13,
                letterSpacing: '0.2em',
                color: '#7a6858',
                fontFamily: FONT,
              }}
            >
              今日も一歩、合格へ。
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div
              style={{
                marginBottom: 20,
                padding: '10px 14px',
                backgroundColor: '#fff0f0',
                border: '1px solid #f5c6c6',
                borderRadius: 3,
                fontSize: 12,
                color: '#c0392b',
                fontFamily: FONT,
                letterSpacing: '0.05em',
              }}
            >
              {error}
            </div>
          )}

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    color: '#7a6858',
                    marginBottom: 8,
                    fontFamily: FONT,
                  }}
                >
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@exapp.jp"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    color: '#7a6858',
                    marginBottom: 8,
                    fontFamily: FONT,
                  }}
                >
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: loading ? '#a89888' : '#5c3a1e',
                border: 'none',
                borderRadius: 3,
                color: '#fdf8f2',
                fontSize: 12,
                letterSpacing: '0.4em',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>

          {/* 新規登録リンク */}
          <p
            style={{
              marginTop: 32,
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: '0.15em',
              color: '#7a6858',
              fontFamily: FONT,
            }}
          >
            アカウントをお持ちでない方は{' '}
            <Link
              href="/register"
              style={{ color: '#5c3a1e', textDecoration: 'none' }}
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
