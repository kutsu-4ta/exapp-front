import { useEffect, useRef, useState } from 'react'
import type { Problem } from '../../types/workspace'
import { c, font } from '../../styles/notion'
import { deleteProblem } from '../../lib/api/problem'
import { updateProblem } from '../../lib/api/problem'

type Props = {
    problem: Problem
    onClose: () => void
    onDelete: (id: number) => void
}

// const PROFICIENCY_STYLE: Record<string, { color: string; bg: string }> = {
//     '○': { color: '#19a576', bg: '#e6f6eb' },
//     '△': { color: '#f2ab26', bg: '#fff5e0' },
//     '×': { color: c.red,    bg: 'rgba(235,87,87,0.08)' },
// }

export function ProblemQuickModal({ problem, onClose,onDelete }: Props) {
    const [note, setNote] = useState(problem.note ?? '')
    const [saved, setSaved] = useState(true)

    const timerRef = useRef<number | null>(null)
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    useEffect(() => {
        return () => {
            window.clearTimeout(timerRef.current ?? 0)
        }
    }, [])

    function scheduleSave(value: string) {
        setSaved(false)

        window.clearTimeout(timerRef.current ?? 0)

        timerRef.current = window.setTimeout(async () => {
            await updateProblem(problem.id, {
                ...problem,
                note: value,
            })

            setSaved(true)
        }, 500)
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
                    <div style={metaRow}>
                        <span style={subjectTag}>{problem.subject}</span>
                        <span style={subCatTag}>{problem.materialName} {problem.questionRef}</span>
                        {problem.isGoodQuestion && (
                            <span style={starTag}>★ 良問</span>
                        )}
                    </div>

                    <p style={questionRefStyle}>
                        {problem.subCategory}
                    </p>

                    {problem.failureTypes.length > 0 && (
                        <div style={section}>
                            <div style={pillsRow}>
                                {problem.failureTypes.map((ft) => (
                                    <span key={ft} style={pill}>
                        {ft}
                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {problem.defeatReason && (
                        <div style={section}>
                            <p style={sectionLbl}>敗因</p>

                            <div style={defeatBox}>
                                {problem.defeatReason}
                            </div>
                        </div>
                    )}

                    <div style={section}>
                        <p style={sectionLbl}>メモ</p>

                        <textarea
                            value={note}
                            onChange={(e) => {
                                const value = e.target.value
                                setNote(value)
                                scheduleSave(value)
                            }}
                            style={noteTextarea}
                            placeholder="メモを書く..."
                        />

                        <div style={saveLabel}>
                            {saved ? '自動保存済み' : '保存中...'}
                        </div>
                    </div>

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
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '16px 16px 0 0',
    height: '95vh', // maxHeight → height に変更
    display: 'flex',
    flexDirection: 'column',
}

const handle: React.CSSProperties = {
    width: '36px', height: '4px', borderRadius: '2px',
    backgroundColor: 'rgba(55,53,47,0.15)',
    margin: '10px auto 0',
}

const header: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px 8px',
    borderBottom: `1px solid ${c.border}`,
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1,
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

const body: React.CSSProperties = {
    padding: '20px 16px',
    overflowY: 'auto',
    flex: 1,
}

const metaRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
}

const subjectTag: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '6px',
    background: '#eef5ff',
    color: c.blue,
    fontSize: font.sm,
}

const subCatTag: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '6px',
    background: '#f6f6f6',
    color: c.textSub,
    fontSize: font.sm,
}

const starTag: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '6px',
    background: '#fff8df',
    color: '#c8860a',
    fontSize: font.sm,
}

const questionRefStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '20px',
}

const section: React.CSSProperties = {
    marginBottom: '20px',
}

const sectionLbl: React.CSSProperties = {
    fontSize: '12px',
    color: c.textSub,
    marginBottom: '8px',
}

const pillsRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
}

const pill: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: '999px',
    background: '#f3f3f3',
    fontSize: '12px',
}

const noteBox: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.7,
    padding: '12px',
    borderRadius: '8px',
    background: '#fafafa',
    border: `1px solid ${c.border}`,
}

const defeatBox: React.CSSProperties = {
    ...noteBox,
    color: c.red,
    background: 'rgba(235,87,87,0.04)',
}

const noteTextarea: React.CSSProperties = {
    width: '100%',
    minHeight: '220px',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${c.border}`,
    background: '#fafafa',
    fontSize: '15px',
    lineHeight: 1.7,
    resize: 'vertical',
}

const saveLabel: React.CSSProperties = {
    marginTop: '6px',
    fontSize: '12px',
    color: c.textSub,
}