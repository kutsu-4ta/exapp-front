import { useState } from 'react'
import type { Problem, ProblemInput, SubCategory } from '../../types/workspace'
import { daysAgo, formatDate } from '../../types/workspace'
import { c, font } from '../../styles/notion'
import { updateProblem, deleteProblem } from '../../lib/api/problem'
import { ProblemForm } from './ProblemForm'

type Props = {
    problem: Problem
    subCategories: SubCategory[]
    onClose: () => void
    onUpdate: (p: Problem) => void
    onDelete: (id: number) => void
}

const PROFICIENCY_STYLE: Record<string, { color: string; bg: string }> = {
    '○': { color: '#19a576', bg: '#e6f6eb' },
    '△': { color: '#f2ab26', bg: '#fff5e0' },
    '×': { color: c.red,    bg: 'rgba(235,87,87,0.08)' },
}

export function ProblemQuickModal({ problem, subCategories, onClose, onUpdate, onDelete }: Props) {
    const [copied, setCopied] = useState(false)
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const prof = PROFICIENCY_STYLE[problem.proficiency] ?? { color: c.textSub, bg: c.surface }

    const buildPrompt = () => {
        const lines = [`【問題】${problem.questionRef}`, `【科目】${problem.subject}`]
        if (problem.material)              lines.push(`【教材】${problem.material}`)
        if (problem.subCategory)           lines.push(`【分野】${problem.subCategory}`)
        if (problem.failureTypes.length)   lines.push(`【属性】${problem.failureTypes.join('、')}`)
        if (problem.defeatReason)          lines.push(`【敗因】${problem.defeatReason}`)
        if (problem.note)                  lines.push(`【メモ】${problem.note}`)
        lines.push('', 'この問題について解説してください。なぜ間違えやすいのか、正しいアプローチ、次回に向けた復習のポイントを教えてください。')
        return lines.join('\n')
    }

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(buildPrompt()); setCopied(true); setTimeout(() => setCopied(false), 2500) }
        catch { /* silent */ }
    }

    const handleGemini = async () => {
        try { await navigator.clipboard.writeText(buildPrompt()) } catch { /* silent */ }
        window.open('https://gemini.google.com/app', '_blank')
    }

    const handleUpdate = async (input: ProblemInput) => {
        const updated = await updateProblem(problem.id, input)
        onUpdate(updated)
        setEditing(false)
    }

    const handleDelete = async () => {
        if (!confirm('この問題を削除しますか？')) return
        setDeleting(true)
        try {
            await deleteProblem(problem.id)
            onDelete(problem.id)
            onClose()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div style={overlay} onClick={onClose}>
            <div style={sheet} onClick={(e) => e.stopPropagation()}>
                <div style={handle} />

                <div style={header}>
                    <button style={closeBtn} onClick={onClose} aria-label="閉じる">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button style={editBtn} onClick={() => setEditing(v => !v)}>
                            {editing ? 'キャンセル' : '編集'}
                        </button>
                        <button style={deleteBtn} onClick={handleDelete} disabled={deleting}>
                            削除
                        </button>
                    </div>
                </div>

                <div style={body}>
                    {editing ? (
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
                    ) : (
                        <>
                            <div style={metaRow}>
                                <span style={subjectTag}>{problem.subject}</span>
                                {problem.subCategory && <span style={subCatTag}>{problem.subCategory}</span>}
                                {problem.material    && <span style={materialTag}>{problem.material}</span>}
                                {problem.isGoodQuestion && <span style={starTag}>★ 良問</span>}
                            </div>

                            <p style={questionRefStyle}>{problem.questionRef}</p>

                            <div style={statsRow}>
                                <div style={statItem}>
                                    <span style={statLbl}>解いた日</span>
                                    <span style={statVal}>{formatDate(problem.solvedAt)}</span>
                                </div>
                                <div style={statItem}>
                                    <span style={statLbl}>経過</span>
                                    <span style={statVal}>{daysAgo(problem.solvedAt)}日前</span>
                                </div>
                                <div style={statItem}>
                                    <span style={statLbl}>習熟度</span>
                                    <span style={{ ...profBadge, color: prof.color, backgroundColor: prof.bg }}>
                                        {problem.proficiency}
                                    </span>
                                </div>
                            </div>

                            {problem.failureTypes.length > 0 && (
                                <div style={section}>
                                    <p style={sectionLbl}>属性</p>
                                    <div style={pillsRow}>
                                        {problem.failureTypes.map((ft) => <span key={ft} style={pill}>{ft}</span>)}
                                    </div>
                                </div>
                            )}

                            {problem.defeatReason && (
                                <div style={section}>
                                    <p style={sectionLbl}>敗因</p>
                                    <div style={{ ...noteBox, color: c.red, borderColor: 'rgba(235,87,87,0.2)', background: 'rgba(235,87,87,0.03)' }}>
                                        {problem.defeatReason}
                                    </div>
                                </div>
                            )}

                            {problem.note && (
                                <div style={section}>
                                    <p style={sectionLbl}>メモ</p>
                                    <div style={noteBox}>{problem.note}</div>
                                </div>
                            )}

                            <div style={actionRow}>
                                <button style={copyBtn} onClick={handleCopy}>
                                    {copied
                                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/></svg>
                                    }
                                    {copied ? 'コピー済み' : 'コピー'}
                                </button>
                                <button style={geminiBtn} onClick={handleGemini}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"/></svg>
                                    Gemini
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'flex-end',
}

const sheet: React.CSSProperties = {
    width: '100%', maxWidth: '720px', margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '16px 16px 0 0',
    maxHeight: '85vh', overflowY: 'auto',
    paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
}

const handle: React.CSSProperties = {
    width: '36px', height: '4px', borderRadius: '2px',
    backgroundColor: 'rgba(55,53,47,0.15)',
    margin: '10px auto 0',
}

const header: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px 8px',
    borderBottom: `1px solid ${c.border}`,
}

const closeBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: c.textSub, padding: '4px', display: 'flex', alignItems: 'center',
}

const editBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: font.sm, fontWeight: 600, color: c.blue, padding: '4px 6px',
}

const deleteBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: font.sm, fontWeight: 600, color: c.red, padding: '4px 6px',
}

const body: React.CSSProperties = { padding: '16px 16px 8px' }

const metaRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }

const subjectTag: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 700, backgroundColor: 'rgba(35,131,226,0.08)', color: c.blue,
}

const subCatTag: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 600, backgroundColor: 'rgba(55,53,47,0.06)', color: c.textSub,
}

const materialTag: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 500, backgroundColor: 'rgba(55,53,47,0.04)', color: c.textFaint,
}

const starTag: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '4px', fontSize: font.xs,
    fontWeight: 600, backgroundColor: '#fff5e0', color: '#f2ab26',
}

const questionRefStyle: React.CSSProperties = {
    fontSize: '18px', fontWeight: 700, margin: '0 0 14px',
    letterSpacing: '-0.01em', lineHeight: 1.4, color: c.text,
}

const statsRow: React.CSSProperties = {
    display: 'flex', gap: '20px', marginBottom: '16px',
    paddingBottom: '14px', borderBottom: `1px solid ${c.border}`,
}

const statItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '3px' }

const statLbl: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 700, color: c.textFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase',
}

const statVal: React.CSSProperties = { fontSize: font.sm, fontWeight: 500, color: c.text }

const profBadge: React.CSSProperties = {
    display: 'inline-block', padding: '1px 8px', borderRadius: '4px',
    fontSize: '15px', fontWeight: 700,
}

const section: React.CSSProperties = { marginBottom: '14px' }

const sectionLbl: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 700, color: c.textFaint,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
}

const pillsRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' }

const pill: React.CSSProperties = {
    padding: '3px 10px', borderRadius: '4px', fontSize: '12px',
    backgroundColor: 'rgba(55,53,47,0.06)', color: c.text,
    border: `1px solid ${c.border}`,
}

const noteBox: React.CSSProperties = {
    padding: '12px 14px', borderRadius: '6px',
    backgroundColor: 'rgba(55,53,47,0.02)', border: `1px solid ${c.border}`,
    fontSize: font.sm, lineHeight: 1.7, color: c.text,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
}

const actionRow: React.CSSProperties = {
    display: 'flex', gap: '8px', marginTop: '16px', paddingBottom: '8px',
}

const copyBtn: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px', borderRadius: '6px',
    backgroundColor: 'rgba(55,53,47,0.04)', border: `1px solid ${c.border}`,
    color: c.textSub, fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
}

const geminiBtn: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px', borderRadius: '6px',
    backgroundColor: 'rgba(35,131,226,0.06)', border: '1px solid rgba(35,131,226,0.2)',
    color: c.blue, fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
}
