import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSettingsStore } from '../lib/store/settings'
import { renameSubject, deleteSubject } from '../lib/api/subjects'
import { addSubCategory, updateSubCategory, deleteSubCategory } from '../lib/api/subcategory'
import { fetchProblems } from '../lib/api/problem'
import { ProblemCard } from '../components/weak/ProblemCard'
import type { SubCategory, Problem } from '../types/workspace'
import {backBtn, c} from '../styles/notion'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export default function SubjectPage() {
    const { name: encodedName } = useParams<{ name: string }>()
    const subjectName = decodeURIComponent(encodedName ?? '')
    const navigate = useNavigate()

    const subjects = useSettingsStore((s) => s.subjects)
    const setSubjects = useSettingsStore((s) => s.setSubjects)
    const subCategories = useSettingsStore((s) => s.subCategories)
    const setSubCategories = useSettingsStore((s) => s.setSubCategories)

    const items = subCategories.filter((sc) => sc.subject === subjectName)

    useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(subjectName)) {
            navigate('/', { replace: true })
        }
    }, [subjects, subjectName])


    // ── Title Inline Rename ──────────────────────────────────────────────────
    const [titleValue, setTitleValue] = useState(subjectName)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleLoading, setTitleLoading] = useState(false)
    const [renameError, setRenameError] = useState<string | null>(null)
    const titleInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { setTitleValue(subjectName) }, [subjectName])

    const handleTitleRename = async () => {
        const newName = titleValue.trim()
        if (!newName || newName === subjectName) {
            setIsEditingTitle(false)
            setTitleValue(subjectName)
            return
        }
        setTitleLoading(true)
        setRenameError(null)
        try {
            await renameSubject(subjectName, newName)
            setSubjects(subjects.map((s) => (s === subjectName ? newName : s)))
            setSubCategories(subCategories.map((sc) =>
                sc.subject === subjectName ? { ...sc, subject: newName } : sc
            ))
            setIsEditingTitle(false)
            navigate(`/subjects/${encodeURIComponent(newName)}`, { replace: true })
        } catch (e) {
            setRenameError(e instanceof Error ? e.message : '変更に失敗しました')
            setTitleValue(subjectName)
        } finally {
            setTitleLoading(false)
        }
    }

    // ── SubCategory Logic ─────────────────────────────────────────────────────
    const [addValue, setAddValue] = useState('')
    const [addLoading, setAddLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingValue, setEditingValue] = useState('')
    const [editLoading, setEditLoading] = useState(false)
    const [deleteSubCatTarget, setDeleteSubCatTarget] = useState<SubCategory | null>(null)
    const [deleteSubCatLoading, setDeleteSubCatLoading] = useState(false)
    const editRef = useRef<HTMLInputElement>(null)

    const handleAdd = async () => {
        const name = addValue.trim()
        if (!name) return
        setAddLoading(true)
        try {
            const created = await addSubCategory({ subject: subjectName, name })
            setSubCategories([...subCategories, created])
            setAddValue('')
        } finally { setAddLoading(false) }
    }

    const startEdit = (sc: SubCategory) => {
        setEditingId(sc.id)
        setEditingValue(sc.name) // オブジェクトではなく sc.name (string) を渡す
    }

    const handleEditSave = async () => {
        const newName = editingValue.trim()
        const target = subCategories.find((sc) => sc.id === editingId)
        if (!target || !newName || newName === target.name) { setEditingId(null); return }
        setEditLoading(true)
        try {
            const updated = await updateSubCategory(target.id, { subject: target.subject, name: newName })
            setSubCategories(subCategories.map((sc) => (sc.id === updated.id ? updated : sc)))
            setEditingId(null)
        } finally { setEditLoading(false) }
    }

    const handleSubCatDelete = async () => {
        if (!deleteSubCatTarget) return
        setDeleteSubCatLoading(true)
        try {
            await deleteSubCategory(deleteSubCatTarget.id)
            setSubCategories(subCategories.filter((sc) => sc.id !== deleteSubCatTarget.id))
            setDeleteSubCatTarget(null)
        } finally { setDeleteSubCatLoading(false) }
    }

    // ── Weak Problems ────────────────────────────────────────────────────────
    const [problems, setProblems] = useState<Problem[]>([])
    const [problemsLoading, setProblemsLoading] = useState(true)

    useEffect(() => {
        fetchProblems()
            .then((all) => setProblems(all.filter((p) => p.subject === subjectName)))
            .catch(() => {})
            .finally(() => setProblemsLoading(false))
    }, [subjectName])

    // ── Delete Subject ────────────────────────────────────────────────────────
    const [deleteConfirming, setDeleteConfirming] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const handleDelete = async () => {
        setDeleteLoading(true)
        try {
            await deleteSubject(subjectName)
            setSubjects(subjects.filter((s) => s !== subjectName))
            setSubCategories(subCategories.filter((sc) => sc.subject !== subjectName))
            navigate('/', { replace: true })
        } finally { setDeleteLoading(false) }
    }

    return (
        <div style={pageWrapper}>
            <div style={contentWrap}>
                <button style={backBtn} onClick={() => navigate(-1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}>
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back
                </button>

                {/* Editable Page Title */}
                <div style={titleContainer}>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            autoFocus
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleTitleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleRename()
                                if (e.key === 'Escape') { setIsEditingTitle(false); setTitleValue(subjectName) }
                            }}
                            style={titleInput}
                            disabled={titleLoading}
                        />
                    ) : (
                        <h1
                            style={heading}
                            onClick={() => setIsEditingTitle(true)}
                            title="クリックして編集"
                        >
                            {titleLoading ? '...' : subjectName}
                        </h1>
                    )}
                    {renameError && <p style={errorText}>{renameError}</p>}
                </div>

                {/* Section: SubCategories */}
                <div style={sectionHeadingWrap}>
                    <span style={sectionHeading}>SUB-CATEGORIES</span>
                </div>
                <div style={block}>
                    <p style={note}>論点ごとの正答率分析に使用されます。</p>

                    <div style={subCatList}>
                        {items.map((sc, idx) => (
                            <div key={sc.id}>
                                {editingId === sc.id ? (
                                    <div style={editRow}>
                                        <input
                                            ref={editRef}
                                            autoFocus
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleEditSave()
                                                if (e.key === 'Escape') setEditingId(null)
                                            }}
                                            style={smallEditInput}
                                        />
                                        <button onClick={handleEditSave} disabled={editLoading} style={saveBtn}>保存</button>
                                    </div>
                                ) : deleteSubCatTarget?.id === sc.id ? (
                                    <div style={deleteConfirmRow}>
                                        <span style={deleteConfirmText}>「{sc.name}」を削除しますか？</span>
                                        <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                            <button onClick={handleSubCatDelete} disabled={deleteSubCatLoading} style={destructiveBtn}>削除</button>
                                            <button onClick={() => setDeleteSubCatTarget(null)} style={cancelBtn}>やめる</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={itemRow}>
                                        <span style={itemName}>{sc.name}</span>
                                        <div style={itemActions}>
                                            <button onClick={() => startEdit(sc)} style={iconBtn}>編集</button>
                                            <button onClick={() => setDeleteSubCatTarget(sc)} style={{ ...iconBtn, color: 'rgba(235, 87, 87, 0.6)' }}>削除</button>
                                        </div>
                                    </div>
                                )}
                                {idx !== items.length - 1 && <div style={divider} />}
                            </div>
                        ))}
                        {items.length === 0 && <p style={emptyText}>小分類がありません</p>}
                    </div>

                    <div style={addRow}>
                        <input
                            value={addValue}
                            onChange={(e) => setAddValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                            placeholder="論点名を入力..."
                            style={addInput}
                            disabled={addLoading}
                        />
                        <button onClick={handleAdd} disabled={addLoading || !addValue.trim()} style={addBtn}>追加</button>
                    </div>
                </div>

                {/* Section: Weak Problems */}
                <div style={sectionHeadingWrap}>
                    <span style={sectionHeading}>WEAK PROBLEMS</span>
                </div>
                <div style={{ ...block, padding: problems.length === 0 ? '20px' : '12px', marginBottom: '32px' }}>
                    {problemsLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><LoadingSpinner size="sm" /></div>
                    ) : problems.length === 0 ? (
                        <p style={emptyText}>この科目の苦手問題はありません</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {problems.map((p) => (
                                <ProblemCard key={p.id} problem={p} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Danger Zone */}
                <div style={sectionHeadingWrap}>
                    <span style={dangerSectionHeading}>DANGER ZONE</span>
                </div>
                <div style={dangerBlock}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <p style={dangerTitle}>この科目を完全に削除</p>
                        <p style={dangerNote}>関連する学習ログ、苦手問題、試験成績を含むすべてのデータが消去されます。</p>
                    </div>

                    {deleteConfirming ? (
                        <div style={deleteConfirmRow}>
                            <p style={deleteConfirmText}>本当に削除しますか？この操作は戻せません。</p>
                            <div style={{display: 'flex', gap: '8px'}}>
                                <button onClick={handleDelete} disabled={deleteLoading} style={destructiveBtn}>削除を確定</button>
                                <button onClick={() => setDeleteConfirming(false)} style={cancelBtn}>キャンセル</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setDeleteConfirming(true)} style={dangerBtn}>科目を削除する</button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = {
    backgroundColor: c.bg, minHeight: '100vh', color: c.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
}
const contentWrap: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '48px 24px 120px' }

const titleContainer: React.CSSProperties = { marginBottom: '40px' }
const heading: React.CSSProperties = {
    fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em',
    cursor: 'text', padding: '4px 0', borderBottom: '1px solid transparent',
    transition: 'border-color 0.2s',
}
const titleInput: React.CSSProperties = {
    fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em',
    width: '100%', border: 'none', borderBottom: `1px solid ${c.blue}`,
    outline: 'none', padding: '4px 0', backgroundColor: 'transparent',
    color: c.text,
}

const sectionHeadingWrap: React.CSSProperties = { marginBottom: '8px', paddingLeft: '2px' }
const sectionHeading: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.35)', letterSpacing: '0.06em' }
const dangerSectionHeading: React.CSSProperties = { ...sectionHeading, color: 'rgba(235, 87, 87, 0.5)' }

const block: React.CSSProperties = {
    border: `1px solid rgba(55, 53, 47, 0.08)`, borderRadius: '10px',
    padding: '20px', marginBottom: '32px', backgroundColor: '#ffffff',
}

const dangerBlock: React.CSSProperties = {
    border: `1px solid rgba(235, 87, 87, 0.15)`, borderRadius: '10px',
    padding: '20px', marginBottom: '32px', backgroundColor: 'rgba(235, 87, 87, 0.02)',
}

const note: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)', marginBottom: '16px', lineHeight: 1.5 }
const dangerTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 700, color: 'rgba(235, 87, 87, 0.8)' }
const dangerNote: React.CSSProperties = { fontSize: '12px', color: 'rgba(235, 87, 87, 0.5)', marginBottom: '16px', lineHeight: 1.5 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginTop: '8px', fontWeight: 500 }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.05)', margin: '4px 0' }

const subCatList: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: '16px' }
const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px' }
const itemName: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: c.text }
const itemActions: React.CSSProperties = { display: 'flex', gap: '4px' }
const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '12px', fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.4)', cursor: 'pointer', padding: '4px 8px',
}
const emptyText: React.CSSProperties = { fontSize: '14px', color: 'rgba(55, 53, 47, 0.3)', padding: '24px 0', textAlign: 'center' }

const editRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }
const smallEditInput: React.CSSProperties = {
    flex: 1, border: `1px solid ${c.blue}`, borderRadius: '6px',
    padding: '6px 10px', fontSize: '14px', color: c.text, outline: 'none',
}

const addRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '16px', padding: '12px 0 0', borderTop: '1px solid rgba(55, 53, 47, 0.05)'
}
const addInput: React.CSSProperties = {
    flex: 1, border: 'none', padding: '8px 4px', fontSize: '14px', outline: 'none', backgroundColor: 'transparent'
}

const deleteConfirmRow: React.CSSProperties = { padding: '12px 0' }
const deleteConfirmText: React.CSSProperties = { fontSize: '13px', color: c.red, fontWeight: 600, marginBottom: '8px' }

const saveBtn: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: c.blue, color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const addBtn: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: 'rgba(55, 53, 47, 0.05)', color: c.text,
    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.12)`, borderRadius: '6px',
    fontSize: '12px', color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 600,
}
const destructiveBtn: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: c.red, color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const dangerBtn: React.CSSProperties = {
    padding: '10px 16px', backgroundColor: 'transparent', color: 'rgba(235, 87, 87, 0.8)',
    border: `1px solid rgba(235, 87, 87, 0.25)`, borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
}