'use client'

import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div style={pageWrapper}>
            <nav style={navBar}>
                <div style={breadcrumb}>
                    <span style={navIcon}>🔒</span>
                    <Link href="/" style={navLink}>Top</Link>
                    <span style={sep}>/</span>
                    <span style={activeNav}>プライバシーポリシー</span>
                </div>
            </nav>

            <div style={content}>
                <header style={header}>
                    <h1 style={title}>プライバシーポリシー</h1>
                    <p style={updatedAt}>最終更新日: 2026年4月29日</p>
                </header>

                <article style={article}>
                    <section style={section}>
                        <h2 style={sectionTitle}>1. 個人情報の収集方法</h2>
                        <p style={paragraph}>
                            当方は、ユーザーが利用登録をする際に、氏名、メールアドレスなどの個人情報をお尋ねすることがあります。また、本サービスの利用状況（学習ログ、セッション時間等）を収集します。
                        </p>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>2. 個人情報を収集・利用する目的</h2>
                        <p style={paragraph}>当方が個人情報を収集・利用する目的は以下の通りです。</p>
                        <ul style={list}>
                            <li>本サービスの提供・運営のため</li>
                            <li>ユーザーからのお問い合わせに回答するため</li>
                            <li>学習データの分析および可視化を提供するため</li>
                            <li>メンテナンスや重要なお知らせのため</li>
                        </ul>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>3. 個人情報の第三者提供</h2>
                        <p style={paragraph}>
                            当方は、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
                        </p>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>4. セキュリティ</h2>
                        <p style={paragraph}>
                            当方は、個人情報の漏えい、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
                        </p>
                    </section>
                </article>

                <div style={footerAction}>
                    <Link href="/login" style={backBtn}>ログイン画面へ戻る</Link>
                </div>
            </div>
        </div>
    )
}

// ── レスポンシブ対応スタイル ──────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = {
    backgroundColor: '#fff',
    minHeight: '100vh',
    color: '#37352f',
    wordBreak: 'break-word' // 長い英単語などでレイアウトが崩れるのを防止
}

const navBar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    position: 'sticky', // スマホでスクロールしても位置がわかるように
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    zIndex: 10
}

const breadcrumb: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const navIcon: React.CSSProperties = { marginRight: '6px' }
const navLink: React.CSSProperties = { color: 'inherit', textDecoration: 'none' }
const sep: React.CSSProperties = { margin: '0 6px', color: 'rgba(55, 53, 47, 0.16)' }
const activeNav: React.CSSProperties = {
    fontWeight: 500,
    color: '#37352f',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
}

const content: React.CSSProperties = {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 20px 80px' // 上下のパディングをスマホ向けに調整
}

const header: React.CSSProperties = {
    marginBottom: '32px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    paddingBottom: '24px'
}

const title: React.CSSProperties = {
    fontSize: 'clamp(24px, 8vw, 40px)', // 画面幅に応じて可変（最小24px, 最大40px）
    fontWeight: 700,
    marginBottom: '12px',
    lineHeight: 1.2
}

const updatedAt: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.45)', fontSize: '13px' }

const article: React.CSSProperties = { lineHeight: 1.7 }

const section: React.CSSProperties = { marginBottom: '32px' }

const sectionTitle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#37352f',
    borderLeft: '3px solid #37352f', // 少しアクセントをつけて視認性向上
    paddingLeft: '12px'
}

const paragraph: React.CSSProperties = {
    fontSize: '15px',
    color: '#37352f',
    marginBottom: '16px',
    textAlign: 'justify' // テキストの端を揃えて綺麗に見せる
}

const list: React.CSSProperties = {
    paddingLeft: '20px',
    fontSize: '15px',
    color: '#37352f',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
}

const footerAction: React.CSSProperties = {
    marginTop: '40px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(55, 53, 47, 0.09)',
    textAlign: 'center'
}

const backBtn: React.CSSProperties = {
    display: 'block', // スマホでタップしやすいよう全幅に
    width: '100%',
    maxWidth: '280px',
    margin: '0 auto',
    padding: '12px 20px',
    backgroundColor: '#37352f',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600
}