import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Problem } from '../types/workspace'
import { formatDate, daysAgo } from '../types/workspace'
import { fetchProblem } from '../lib/api/problem'
import { c, font } from '../styles/notion'

export default function ProblemDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        fetchProblem(Number(id))
            .then((p) => setProblem(p))
            .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
            .finally(() => setLoading(false))
    }, [id])

    const handleGeminiExplain = () => {
        console.log('Gemini解説リクエスト:', problem)
    }

    if (loading) return <div style={loadingWrap}><p style={mutedText}>読み込み中...</p></div>
    if (error || !problem) return <div style={loadingWrap}><p style={errorText}>{error ?? '問題が見つかりませんでした'}</p></div>

    const subCategoryName = problem.subCategory

    const proficiencyColor: Record<string, string> = {
        '○': '#3a7a2a',
        '△': '#c8860a',
        '×': c.red,
    }

    return (
        <div style={container}>
            <div style={stickyHeader}>
                <div style={headerInner}>
                    <button onClick={() => navigate(-1)} style={backBtn} aria-label="戻る">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>戻る</span>
                    </button>
                    <span style={headerTitle}>問題詳細</span>
                    <div style={{ width: '60px' }} />
                </div>
            </div>

            <div style={content}>
                {/* メタ情報 */}
                <div style={metaRow}>
                    <span style={subjectTag}>{problem.subject}</span>
                    {subCategoryName && <span style={subCatTag}>{subCategoryName}</span>}
                    {problem.material && <span style={materialTag}>{problem.material}</span>}
                </div>

                {/* 問題番号 */}
                <h1 style={questionRefStyle}>{problem.questionRef}</h1>

                {/* 日付・習熟度 */}
                <div style={statsRow}>
                    <div style={statItem}>
                        <span style={statLabel}>解いた日</span>
                        <span style={statValue}>{formatDate(problem.solvedAt)}</span>
                    </div>
                    <div style={statItem}>
                        <span style={statLabel}>経過日数</span>
                        <span style={statValue}>{daysAgo(problem.solvedAt)}日前</span>
                    </div>
                    <div style={statItem}>
                        <span style={statLabel}>習熟度</span>
                        <span style={{ ...statValue, color: proficiencyColor[problem.proficiency] ?? c.text, fontWeight: 700, fontSize: '18px' }}>
                            {problem.proficiency}
                        </span>
                    </div>
                </div>

                <div style={divider} />

                {/* ミスの種類 */}
                {problem.failureTypes.length > 0 && (
                    <div style={section}>
                        <p style={sectionLabel}>ミスの種類</p>
                        <div style={pillsRow}>
                            {problem.failureTypes.map((ft) => (
                                <span key={ft} style={pill}>{ft}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 良問マーク */}
                {problem.isGoodQuestion && (
                    <div style={goodQuestionBadge}>
                        ★ 良問
                    </div>
                )}

                {/* 敗因 */}
                {problem.defeatReason && (
                    <div style={section}>
                        <p style={sectionLabel}>敗因</p>
                        <div style={{ ...noteBox, color: c.red, borderColor: 'rgba(235,87,87,0.2)', background: 'rgba(235,87,87,0.03)' }}>
                            {problem.defeatReason}
                        </div>
                    </div>
                )}

                {/* 分析・メモ */}
                {problem.note && (
                    <div style={section}>
                        <p style={sectionLabel}>分析・メモ</p>
                        <div style={noteBox}>{problem.note}</div>
                    </div>
                )}

                <div style={divider} />

                {/* Gemini解説ボタン */}
                <button style={geminiBtn} onClick={handleGeminiExplain}>
                    <GeminiIcon />
                    <span>Geminiの解説</span>
                </button>
            </div>
        </div>
    )
}

function GeminiIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"
                fill="currentColor" />
        </svg>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
    minHeight: '100vh', backgroundColor: c.bg, color: c.text,
}

const loadingWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh',
}

const stickyHeader: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${c.border}`,
}

const headerInner: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: '720px', margin: '0 auto', padding: '12px 16px',
}

const headerTitle: React.CSSProperties = {
    fontSize: font.base, fontWeight: 600,
}

const backBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '4px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: c.textSub, fontSize: font.sm, padding: '4px 0', minWidth: '60px',
}

const content: React.CSSProperties = {
    maxWidth: '720px', margin: '0 auto', padding: '24px 16px 120px',
}

const metaRow: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px',
}

const subjectTag: React.CSSProperties = {
    padding: '3px 10px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 700, backgroundColor: 'rgba(35,131,226,0.08)',
    color: c.blue, letterSpacing: '0.04em',
}

const subCatTag: React.CSSProperties = {
    padding: '3px 10px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 600, backgroundColor: 'rgba(55,53,47,0.06)', color: c.textSub,
}

const materialTag: React.CSSProperties = {
    padding: '3px 10px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 500, backgroundColor: 'rgba(55,53,47,0.04)', color: c.textFaint,
}

const questionRefStyle: React.CSSProperties = {
    fontSize: '20px', fontWeight: 700, margin: '0 0 20px',
    letterSpacing: '-0.01em', lineHeight: 1.3,
}

const statsRow: React.CSSProperties = {
    display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px',
}

const statItem: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '4px',
}

const statLabel: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 700, color: c.textFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase',
}

const statValue: React.CSSProperties = {
    fontSize: font.base, fontWeight: 500, color: c.text,
}

const divider: React.CSSProperties = {
    height: '1px', backgroundColor: c.border, margin: '20px 0',
}

const section: React.CSSProperties = { marginBottom: '20px' }

const sectionLabel: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 700, color: c.textFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px',
}

const pillsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' }

const pill: React.CSSProperties = {
    padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
    backgroundColor: 'rgba(55,53,47,0.06)', color: c.text,
    border: '1px solid rgba(55,53,47,0.09)',
}

const goodQuestionBadge: React.CSSProperties = {
    display: 'inline-flex', marginBottom: '20px',
    padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
    backgroundColor: '#fdf3df', color: '#c8860a',
    border: '1px solid #e8c97a', fontWeight: 600,
}

const noteBox: React.CSSProperties = {
    padding: '14px 16px', borderRadius: '6px',
    backgroundColor: 'rgba(55,53,47,0.02)',
    border: `1px solid ${c.border}`,
    fontSize: font.base, lineHeight: 1.7, color: c.text,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
}

const geminiBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '6px',
    backgroundColor: 'rgba(35,131,226,0.06)',
    border: '1px solid rgba(35,131,226,0.2)',
    color: c.blue, fontSize: font.base, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s',
    width: '100%', justifyContent: 'center',
}

const mutedText: React.CSSProperties = { color: c.textSub, fontSize: font.base }
const errorText: React.CSSProperties = { color: c.red, fontSize: font.base }
