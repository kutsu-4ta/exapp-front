import {useEffect, useRef, useState} from 'react'
import {deleteMaterial, renameMaterial} from '../../lib/api/materials'
import {useSettingsStore} from '../../lib/store/settings'
import {c, font} from '../../styles/notion'

export function MaterialsSection() {
  const materials = useSettingsStore((s) => s.materials)
  const setMaterials = useSettingsStore((s) => s.setMaterials)

  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingMaterial !== null) editRef.current?.focus()
  }, [editingMaterial])

  const startEdit = (name: string) => { setEditingMaterial(name); setEditingValue(name); setError(null) }
  const cancelEdit = () => { setEditingMaterial(null); setEditingValue('') }

  const handleRenameSave = async () => {
    const newName = editingValue.trim()
    if (!editingMaterial || !newName) return
    if (newName === editingMaterial) { cancelEdit(); return }
    setLoading(true)
    setError(null)
    try {
      await renameMaterial(editingMaterial, newName)
      setMaterials(materials.map((m) => (m === editingMaterial ? newName : m)))
      setEditingMaterial(null)
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
      await deleteMaterial(deleteTarget)
      setMaterials(materials.filter((m) => m !== deleteTarget))
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={block}>
      <p style={subLabel}>Manage Materials</p>
      <p style={note}>教材を削除すると、記録の教材フィールドが空になります。</p>
      {error && <p style={errorText}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {materials.map((name) => (
          <div key={name}>
            {editingMaterial === name ? (
              <div style={editRow}>
                <input
                  ref={editRef}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') cancelEdit() }}
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
                <span style={itemName}>{name}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(name)} style={iconBtn}>Edit</button>
                  <button onClick={() => setDeleteTarget(name)} style={{ ...iconBtn, color: c.red }}>Delete</button>
                </div>
              </div>
            )}
            <div style={divider} />
          </div>
        ))}
        {materials.length === 0 && <p style={{ fontSize: font.base, color: 'rgba(55,53,47,0.35)', padding: '12px 0' }}>No materials registered</p>}
      </div>
    </div>
  )
}

const block: React.CSSProperties = { border: '1px solid rgba(55,53,47,0.09)', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px', backgroundColor: '#fff' }
const subLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: c.text }
const note: React.CSSProperties = { fontSize: '11px', color: 'rgba(55,53,47,0.45)', marginBottom: '16px', lineHeight: 1.6 }
const errorText: React.CSSProperties = { fontSize: '12px', color: c.red, marginBottom: '12px' }
const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }
const itemName: React.CSSProperties = { fontSize: font.base, fontWeight: 600, color: c.text }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.45)', cursor: 'pointer', padding: '2px 6px' }
const editRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }
const editInput: React.CSSProperties = { flex: 1, border: '1px solid rgba(55,53,47,0.2)', borderRadius: '4px', padding: '6px 8px', fontSize: font.base, color: c.text, outline: 'none', backgroundColor: 'rgba(55,53,47,0.02)' }
const deleteRow: React.CSSProperties = { display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '8px', padding: '8px 0' }
const deleteText: React.CSSProperties = { flex: 1, fontSize: '12px', color: c.red, fontWeight: 500 }
const saveBtn: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: 'transparent', border: '1px solid rgba(55,53,47,0.16)', borderRadius: '4px', fontSize: '11px', color: 'rgba(55,53,47,0.6)', cursor: 'pointer', fontWeight: 500 }
const destructiveBtn: React.CSSProperties = { padding: '4px 10px', backgroundColor: c.red, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }
const divider: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(55,53,47,0.06)', margin: '8px 0' }
