import {useEffect, useRef, useState} from 'react'
import {deleteSubject, fetchFlashcards, renameSubject} from '../../lib/api/subjects'
import {useSettingsStore} from '../../lib/store/settings'
import {c, font} from '../../styles/notion'
import type {Flashcard} from '../../types/workspace'

export function SubjectsSection() {
  const subjects = useSettingsStore((s) => s.subjects)
  const setSubjects = useSettingsStore((s) => s.setSubjects)
  const subCategories = useSettingsStore((s) => s.subCategories)
  const setSubCategories = useSettingsStore((s) => s.setSubCategories)

  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchFlashcards().then(setFlashcards).catch(() => {})
  }, [])

  useEffect(() => {
    if (editingSubject !== null) editRef.current?.focus()
  }, [editingSubject])

  const countBySubject = (name: string) => flashcards.filter((f) => f.subject === name).length

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
      setSubjects(subjects.map((s) => (s === editingSubject ? newName : s)))
      setSubCategories(subCategories.map((sc) => sc.subject === editingSubject ? { ...sc, subject: newName } : sc))
      setFlashcards((prev) => prev.map((f) => f.subject === editingSubject ? { ...f, subject: newName } : f))
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
      setSubjects(subjects.filter((s) => s !== deleteTarget))
      setSubCategories(subCategories.filter((sc) => sc.subject !== deleteTarget))
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
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
        {subjects.map((name) => (
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
                  <span style={itemName}>{name}</span>
                  <span style={countBadge}>({countBySubject(name)})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
const countBadge: React.CSSProperties = { fontSize: '12px', color: 'rgba(55,53,47,0.4)', fontWeight: 400 }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.45)', cursor: 'pointer', padding: '2px 6px' }
const editRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }
const editInput: React.CSSProperties = { flex: 1, border: '1px solid rgba(55,53,47,0.2)', borderRadius: '4px', padding: '6px 8px', fontSize: font.base, color: '#37352f', outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)' }
const deleteRow: React.CSSProperties = { display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '8px', padding: '8px 0' }
const deleteText: React.CSSProperties = { flex: 1, fontSize: '12px', color: c.red, fontWeight: 500 }
const saveBtn: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: 'transparent', border: '1px solid rgba(55,53,47,0.16)', borderRadius: '4px', fontSize: '11px', color: 'rgba(55,53,47,0.6)', cursor: 'pointer', fontWeight: 500 }
const destructiveBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: c.red, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55,53,47,0.06)', margin: '8px 0' }
