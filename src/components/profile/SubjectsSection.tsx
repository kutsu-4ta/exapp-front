import {useEffect, useRef, useState} from 'react'
import {deleteSubject, fetchAllSubjectsWithVisibility, renameSubject, setSubjectHidden, type SubjectWithVisibility} from '../../lib/api/subjects'
import {useSettingsStore} from '../../lib/store/settings'
import {c, font} from '../../styles/notion'

export function SubjectsSection() {
  const setSubjects = useSettingsStore((s) => s.setSubjects)

  const [subjects, setLocalSubjects] = useState<SubjectWithVisibility[]>([])
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingSubject !== null) editRef.current?.focus()
  }, [editingSubject])

  useEffect(() => {
    fetchAllSubjectsWithVisibility()
      .then(setLocalSubjects)
      .catch(() => setError('科目の取得に失敗しました'))
  }, [])

  const syncVisibleSubjects = (next: SubjectWithVisibility[]) => {
    setSubjects(next.filter((s) => !s.isHidden).map((s) => s.name))
  }

  const startEdit = (name: string) => { setEditingSubject(name); setEditingValue(name); setError(null) }
  const cancelEdit = () => { setEditingSubject(null); setEditingValue('') }

  const handleRenameSave = async () => {
    const newName = editingValue.trim()
    if (!editingSubject || !newName) return
    if (newName === editingSubject) { cancelEdit(); return }
    setLoading(true)
    setError(null)
    try {
      await renameSubject(editingSubject, newName)
      const next = subjects.map((s) => (s.name === editingSubject ? { ...s, name: newName } : s))
      setLocalSubjects(next)
      syncVisibleSubjects(next)
      setEditingSubject(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setLoading(true)
    setError(null)
    try {
      await deleteSubject(deleteTarget)
      const next = subjects.filter((s) => s.name !== deleteTarget)
      setLocalSubjects(next)
      syncVisibleSubjects(next)
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleHidden = async (name: string, hidden: boolean) => {
    setLoading(true)
    setError(null)
    try {
      await setSubjectHidden(name, hidden)
      const next = subjects.map((s) => (s.name === name ? { ...s, isHidden: hidden } : s))
      setLocalSubjects(next)
      syncVisibleSubjects(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '表示設定の変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={block}>
      <p style={subLabel}>Manage Subjects</p>
      <p style={note}>科目を削除すると、紐づく全ての問題データが削除されます。</p>
      {error && <p style={errorText}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {subjects.map(({ name, isHidden }) => (
          <div key={name}>
            {editingSubject === name ? (
              <div style={editRow}>
                <input
                  ref={editRef}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSave()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  style={editInput}
                  disabled={loading}
                />
                <button onClick={handleRenameSave} disabled={loading || !editingValue.trim()} style={saveBtn}>Save</button>
                <button onClick={cancelEdit} disabled={loading} style={cancelBtn}>Cancel</button>
              </div>
            ) : deleteTarget === name ? (
              <div style={deleteRow}>
                <span style={deleteText}>「{name}」を削除しますか？</span>
                <button onClick={handleDeleteConfirm} disabled={loading} style={destructiveBtn}>Delete</button>
                <button onClick={() => setDeleteTarget(null)} disabled={loading} style={cancelBtn}>Cancel</button>
              </div>
            ) : (
              <div style={itemRow}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span style={{ ...itemName, opacity: isHidden ? 0.4 : 1 }}>{name}</span>
                  {isHidden && <span style={hiddenBadge}>非表示</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleToggleHidden(name, !isHidden)} disabled={loading} style={iconBtn}>
                    {isHidden ? '再表示' : '非表示'}
                  </button>
                  <button onClick={() => startEdit(name)} style={iconBtn}>Edit</button>
                  <button onClick={() => setDeleteTarget(name)} style={{ ...iconBtn, color: c.red }}>Delete</button>
                </div>
              </div>
            )}
            <div style={divider} />
          </div>
        ))}
        {subjects.length === 0 && (
          <p style={{ fontSize: font.base, color: 'rgba(55,53,47,0.35)', padding: '12px 0' }}>
            No subjects registered
          </p>
        )}
      </div>
    </div>
  )
}

const block: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px', backgroundColor: '#fff' }
const subLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#37352f' }
const note: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }
const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }
const itemName: React.CSSProperties = { fontSize: font.base, fontWeight: 600, color: '#37352f' }
const hiddenBadge: React.CSSProperties = { fontSize: '10px', fontWeight: 600, color: 'rgba(55,53,47,0.5)', backgroundColor: 'rgba(55,53,47,0.06)', borderRadius: '4px', padding: '2px 6px' }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.45)', cursor: 'pointer', padding: '2px 6px' }
const editRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }
const editInput: React.CSSProperties = { flex: 1, border: '1px solid rgba(55,53,47,0.2)', borderRadius: '4px', padding: '6px 8px', fontSize: font.base, color: '#37352f', outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)' }
const deleteRow: React.CSSProperties = { display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '8px', padding: '8px 0' }
const deleteText: React.CSSProperties = { flex: 1, fontSize: '12px', color: c.red, fontWeight: 500 }
const saveBtn: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: 'transparent', border: '1px solid rgba(55,53,47,0.16)', borderRadius: '4px', fontSize: '11px', color: 'rgba(55,53,47,0.6)', cursor: 'pointer', fontWeight: 500 }
const destructiveBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: c.red, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55,53,47,0.06)', margin: '8px 0' }
