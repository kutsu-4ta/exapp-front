import {Link} from "react-router-dom";

export default function TermsPage() {
    return (
        <div style={pageWrapper}>
            <nav style={navBar}>
                <div style={breadcrumb}>
                    <span style={navIcon}>📜</span>
                    <Link to="/" style={navLink}>Top</Link>
                    <span style={sep}>/</span>
                    <span style={activeNav}>利用規約</span>
                </div>
            </nav>

            <div style={content}>
                <header style={header}>
                    <h1 style={title}>利用規約</h1>
                    <p style={updatedAt}>最終更新日: 2026年4月29日</p>
                </header>

                <article style={article}>
                    <section style={section}>
                        <h2 style={sectionTitle}>第1条（適用）</h2>
                        <p style={paragraph}>
                            本規約は、antapp（以下「当方」といいます。）が提供する学習管理アプリケーション「EXAPP」（以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
                        </p>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>第2条（利用登録）</h2>
                        <p style={paragraph}>
                            登録希望者が当方の定める方法によって利用登録を申請し、当方がこれを承認することによって、利用登録が完了するものとします。当方は、利用者として不適切と判断した場合、登録を拒絶することがあります。
                        </p>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>第3条（禁止事項）</h2>
                        <ul style={list}>
                            <li>法令または公序良俗に違反する行為</li>
                            <li>本サービスのサーバーまたはネットワークの機能を破壊・妨害する行為</li>
                            <li>他のユーザーの情報を不正に収集または蓄積する行為</li>
                            <li>その他、当方が不適切と判断する行為</li>
                        </ul>
                    </section>

                    <section style={section}>
                        <h2 style={sectionTitle}>第4条（サービス提供の停止等）</h2>
                        <p style={paragraph}>
                            当方は、保守点検、システム障害、天災、その他不可抗力により、事前の通知なく本サービスの提供を中断または停止できるものとします。これによって生じた損害について、当方は一切の責任を負いません。
                        </p>
                    </section>
                </article>

                <div style={footerAction}>
                    <Link to="/login" style={backBtn}>ログイン画面へ戻る</Link>
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
    wordBreak: 'break-word'
}

const navBar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    position: 'sticky',
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
    padding: '40px 20px 80px'
}

const header: React.CSSProperties = {
    marginBottom: '32px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
    paddingBottom: '24px'
}

const title: React.CSSProperties = {
    fontSize: 'clamp(24px, 8vw, 40px)',
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
    borderLeft: '3px solid #37352f',
    paddingLeft: '12px'
}

const paragraph: React.CSSProperties = {
    fontSize: '15px',
    color: '#37352f',
    marginBottom: '16px',
    textAlign: 'justify'
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
    display: 'block',
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