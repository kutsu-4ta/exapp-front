'use client'

import Link from 'next/link'

export function TopBar() {
    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000, // Z-indexを整理
                backgroundColor: 'rgba(255, 255, 255, 0.8)', // 透過させて背景と馴染ませる
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(55, 53, 47, 0.08)',
                height: '48px', // 少し高さを抑えてタイトに
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* ロゴやアイコンが必要な場合はここに追加 */}
                <span
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#37352f', // Notionの基本黒
                        letterSpacing: '-0.01em',
                    }}
                >
          診断士 一発合格
        </span>
            </div>

            <Link
                href="/login"
                style={{
                    fontSize: '12px',
                    color: 'rgba(55, 53, 47, 0.45)', // 控えめなログアウトリンク
                    letterSpacing: '0.02em',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                ログアウト
            </Link>
        </header>
    )
}