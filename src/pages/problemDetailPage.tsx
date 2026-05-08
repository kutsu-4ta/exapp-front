import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Problem, ProblemInput, SubCategory } from '../types/workspace'
import { formatDate, daysAgo } from '../types/workspace'
import { fetchProblem, updateProblem, deleteProblem } from '../lib/api/problem'
import { fetchSubCategories } from '../lib/api/subcategory'
import { ProblemForm } from '../components/weak/ProblemForm'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { c, font } from '../styles/notion'

export default function ProblemDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!id) return
        Promise.all([fetchProblem(Number(id)), fetchSubCategories()])
            .then(([p, sc]) => { setProblem(p); setSubCategories(sc) })
            .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
            .finally(() => setLoading(false))
    }, [id])

    const handleUpdate = async (input: ProblemInput) => {
        if (!problem) return
        const updated = await updateProblem(problem.id, input)
        setProblem(updated)
        setEditing(false)
    }

    const handleDelete = async () => {
        if (!problem) return
        if (!confirm('この問題を削除しますか？')) return
        setDeleting(true)
        try {
            await deleteProblem(problem.id)
            navigate(-1)
        } finally {
            setDeleting(false)
        }
    }

    const buildPrompt = () => {
        if (!problem) return ''
        const lines: string[] = [
            `【問題】${problem.questionRef}`,
            `【科目】${problem.subject}`,
        ]
        if (problem.material) lines.push(`【教材】${problem.material}`)
        if (problem.subCategory) lines.push(`【分野】${problem.subCategory}`)
        if (problem.failureTypes.length > 0) lines.push(`【ミスの種類】${problem.failureTypes.join('、')}`)
        if (problem.defeatReason) lines.push(`【敗因】${problem.defeatReason}`)
        if (problem.note) lines.push(`【メモ】${problem.note}`)
        lines.push('')
        lines.push('この問題について解説してください。なぜ間違えやすいのか、正しいアプローチ、次回に向けた復習のポイントを教えてください。')
        return lines.join('\n')
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(buildPrompt())
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch { /* silent */ }
    }

    const handleGeminiExplain = async () => {
        try { await navigator.clipboard.writeText(buildPrompt()) } catch { /* silent */ }
        window.open('https://gemini.google.com/app', '_blank')
    }

    if (loading) return <LoadingSpinner fullPage />
    if (error || !problem) return <div style={loadingWrap}><p style={errorText}>{error ?? '問題が見つかりませんでした'}</p></div>

    if (editing) {
        return (
            <div style={container}>
                <div style={stickyHeader}>
                    <div style={headerInner}>
                        <button onClick={() => setEditing(false)} style={backBtn} aria-label="キャンセル">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>キャンセル</span>
                        </button>
                        <span style={headerTitle}>編集</span>
                        <div style={{ width: '60px' }} />
                    </div>
                </div>
                <div style={content}>
                    <ProblemForm
                        initial={{
                            subject: problem.subject,
                            materialId: null,
                            materialName: problem.material,
                            subCategory: problem.subCategory,
                            questionRef: problem.questionRef,
                            note: problem.note,
                            defeatReason: problem.defeatReason,
                            proficiency: problem.proficiency,
                            failureTypes: problem.failureTypes,
                            isGoodQuestion: problem.isGoodQuestion,
                            solvedAt: problem.solvedAt,
                        }}
                        subCategories={subCategories}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                    />
                </div>
            </div>
        )
    }

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
                    <div style={headerActions}>
                        <button style={headerEditBtn} onClick={() => setEditing(true)}>編集</button>
                        <button style={headerDeleteBtn} onClick={handleDelete} disabled={deleting}>削除</button>
                    </div>
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

                {/* アクションボタン行 */}
                <div style={actionRow}>
                    <button style={copyBtn} onClick={handleCopy} title="プロンプトをコピー">
                        {copied ? <CheckIcon /> : <ClipboardIcon />}
                        <span>{copied ? 'コピー済み' : 'コピー'}</span>
                    </button>
                    <button style={geminiBtn} onClick={handleGeminiExplain}>
                        <GeminiIcon />
                        <span>Gemini</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function GeminiIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"
                fill="currentColor" />
        </svg>
    )
}

function ClipboardIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
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

const headerActions: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '4px', minWidth: '60px', justifyContent: 'flex-end',
}

const headerEditBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: font.sm, color: c.textSub, fontWeight: 600, padding: '4px 6px',
}

const headerDeleteBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: font.sm, color: c.red, fontWeight: 600, padding: '4px 6px',
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

const actionRow: React.CSSProperties = {
    display: 'flex', gap: '8px',
}

const copyBtn: React.CSSProperties = {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 16px', borderRadius: '6px',
    backgroundColor: 'rgba(55,53,47,0.04)',
    border: `1px solid ${c.border}`,
    color: c.textSub, fontSize: font.sm, fontWeight: 600,
    cursor: 'pointer',
}

const geminiBtn: React.CSSProperties = {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 16px', borderRadius: '6px',
    backgroundColor: 'rgba(35,131,226,0.06)',
    border: '1px solid rgba(35,131,226,0.2)',
    color: c.blue, fontSize: font.sm, fontWeight: 600,
    cursor: 'pointer',
}

const errorText: React.CSSProperties = { color: c.red, fontSize: font.base }

