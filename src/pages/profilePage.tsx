import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store/auth'
import { useSettingsStore } from '../lib/store/settings'
import { logout as apiLogout } from '../lib/api/authenticate'
import { renameSubject, deleteSubject } from '../lib/api/subjects'
import { c, font } from '../styles/notion'

export default function ProfilePage() {
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const clearAuth = useAuthStore((state) => state.logout)

    const subjects = useSettingsStore((s) => s.subjects)
    const setSubjects = useSettingsStore((s) => s.setSubjects)
    const loadSubjects = useSettingsStore((s) => s.loadSubjects)

    const [editingSubject, setEditingSubject] = useState<string | null>(null)
    const [editingValue, setEditingValue] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const editInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadSubjects()
    }, [])

    useEffect(() => {
        if (editingSubject !== null) {
            editInputRef.current?.focus()
        }
    }, [editingSubject])

    const handleLogout = async () => {
        await apiLogout().catch(() => {})
        clearAuth()
        navigate('/login')
    }

    const startEdit = (name: string) => {
        setEditingSubject(name)
        setEditingValue(name)
        setActionError(null)
    }

    const cancelEdit = () => {
        setEditingSubject(null)
        setEditingValue('')
    }

    const handleRenameSave = async () => {
        const newName = editingValue.trim()
        if (!editingSubject || !newName) return
        if (newName === editingSubject) { cancelEdit(); return }
        setActionLoading(true)
        setActionError(null)
        try {
            await renameSubject(editingSubject, newName)
            setSubjects(subjects.map((s) => (s === editingSubject ? newName : s)))
            setEditingSubject(null)
        } catch (e) {
            setActionError(e instanceof Error ? e.message : '変更に失敗しました')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setActionLoading(true)
        setActionError(null)
        try {
            await deleteSubject(deleteTarget)
            setSubjects(subjects.filter((s) => s !== deleteTarget))
            setDeleteTarget(null)
        } catch (e) {
            setActionError(e instanceof Error ? e.message : '削除に失敗しました')
        } finally {
            setActionLoading(false)
        }
    }

    if (!user) return null

    const initial = user.name?.charAt(0).toUpperCase() ?? '?'

    return (
        <div style={pageWrapper}>
            <div style={content}>
                <h1 style={heading}>プロフィール</h1>

                <div style={avatarWrap}>
                    <div style={avatar}>{initial}</div>
                </div>

                <div style={card}>
                    <div style={row}>
                        <span style={label}>名前</span>
                        <span style={value}>{user.name}</span>
                    </div>
                    <div style={divider} />
                    <div style={row}>
                        <span style={label}>メールアドレス</span>
                        <span style={value}>{user.email}</span>
                    </div>
                </div>

                {/* アプリ設定 */}
                <div style={sectionHeadingWrap}>
                    <span style={sectionHeading}>アプリ設定</span>
                </div>

                <div style={settingsBlock}>
                    <p style={settingsSubLabel}>科目管理</p>
                    <p style={settingsNote}>科目を削除すると、それに紐づく学習記録・苦手問題・試験記録がすべて削除されます。</p>

                    {actionError && (
                        <p style={errorText}>{actionError}</p>
                    )}

                    <div style={subjectList}>
                        {subjects.map((name) => (
                            <div key={name}>
                                {editingSubject === name ? (
                                    <div style={subjectEditRow}>
                                        <input
                                            ref={editInputRef}
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameSave()
                                                if (e.key === 'Escape') cancelEdit()
                                            }}
                                            style={editInput}
                                            disabled={actionLoading}
                                        />
                                        <button
                                            onClick={handleRenameSave}
                                            disabled={actionLoading || !editingValue.trim()}
                                            style={saveBtn}
                                        >
                                            保存
                                        </button>
                                        <button onClick={cancelEdit} disabled={actionLoading} style={cancelBtn}>
                                            キャンセル
                                        </button>
                                    </div>
                                ) : deleteTarget === name ? (
                                    <div style={deleteConfirmRow}>
                                        <span style={deleteConfirmText}>
                                            「{name}」と紐づくデータをすべて削除しますか？
                                        </span>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            disabled={actionLoading}
                                            style={destructiveBtn}
                                        >
                                            {actionLoading ? '削除中...' : '削除する'}
                                        </button>
                                        <button
                                            onClick={() => { setDeleteTarget(null); setActionError(null) }}
                                            disabled={actionLoading}
                                            style={cancelBtn}
                                        >
                                            キャンセル
                                        </button>
                                    </div>
                                ) : (
                                    <div style={subjectRow}>
                                        <span style={subjectName}>{name}</span>
                                        <div style={subjectActions}>
                                            <button
                                                onClick={() => startEdit(name)}
                                                style={iconBtn}
                                                title="科目名を変更"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => { setDeleteTarget(name); setActionError(null) }}
                                                style={{ ...iconBtn, color: c.red }}
                                                title="科目を削除"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div style={divider} />
                            </div>
                        ))}

                        {subjects.length === 0 && (
                            <p style={emptyText}>科目が登録されていません</p>
                        )}
                    </div>
                </div>

                <button style={logoutBtn} onClick={handleLogout}>
                    ログアウト
                </button>
            </div>
        </div>
    )
}

const pageWrapper: React.CSSProperties = { backgroundColor: c.bg, minHeight: '100vh', color: c.text }
const content: React.CSSProperties = { maxWidth: '480px', margin: '0 auto', padding: '48px 20px 120px' }
const heading: React.CSSProperties = { fontSize: '20px', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.01em' }
const avatarWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '32px' }
const avatar: React.CSSProperties = {
    width: '72px', height: '72px', borderRadius: '50%',
    backgroundColor: '#2383e2', color: '#fff',
    fontSize: '28px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const card: React.CSSProperties = { border: `1px solid rgba(55, 53, 47, 0.09)`, borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }
const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55, 53, 47, 0.06)' }
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }
const value: React.CSSProperties = { fontSize: font.base, color: c.text, fontWeight: 500 }

const sectionHeadingWrap: React.CSSProperties = { marginBottom: '12px' }
const sectionHeading: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }

const settingsBlock: React.CSSProperties = {
    border: `1px solid rgba(55, 53, 47, 0.09)`, borderRadius: '8px',
    padding: '16px 20px', marginBottom: '32px',
}
const settingsSubLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: c.text }
const settingsNote: React.CSSProperties = { fontSize: '11px', color: 'rgba(55, 53, 47, 0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }

const subjectList: React.CSSProperties = { display: 'flex', flexDirection: 'column' }

const subjectRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0',
}
const subjectName: React.CSSProperties = { fontSize: font.base, fontWeight: 500, color: c.text }
const subjectActions: React.CSSProperties = { display: 'flex', gap: '8px' }
const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    fontSize: '12px', fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.45)', cursor: 'pointer', padding: '2px 6px',
}

const subjectEditRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
}
const editInput: React.CSSProperties = {
    flex: 1, border: `1px solid rgba(55, 53, 47, 0.2)`, borderRadius: '4px',
    padding: '6px 8px', fontSize: font.base, color: c.text, outline: 'none',
    backgroundColor: 'rgba(55, 53, 47, 0.02)',
}

const deleteConfirmRow: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '8px 0',
}
const deleteConfirmText: React.CSSProperties = {
    flex: '1 1 100%', fontSize: '12px', color: c.red, fontWeight: 500,
}

const saveBtn: React.CSSProperties = {
    padding: '5px 12px', backgroundColor: '#2383e2', color: '#fff',
    border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
    padding: '5px 12px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '4px',
    fontSize: '12px', color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 500,
}
const destructiveBtn: React.CSSProperties = {
    padding: '5px 12px', backgroundColor: c.red, color: '#fff',
    border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
}

const emptyText: React.CSSProperties = { fontSize: font.base, color: 'rgba(55, 53, 47, 0.35)', padding: '12px 0' }

const logoutBtn: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: 'transparent',
    border: `1px solid rgba(55, 53, 47, 0.16)`, borderRadius: '6px',
    fontSize: font.sm, color: 'rgba(55, 53, 47, 0.6)', cursor: 'pointer', fontWeight: 500,
}
