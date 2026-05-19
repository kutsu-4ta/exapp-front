import type {CSSProperties} from 'react'
import {useEffect, useRef, useState} from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {Settings} from 'lucide-react'

import type {SubCategory, SubCategoryRank} from '@/types/workspace.ts'
import {addSubCategory, deleteSubCategory, updateSubCategory,} from '@/lib/api/subcategory.ts'
import {
  BottomSheet,
  sheetBodyStyle,
  sheetCloseBtnStyle,
  sheetFlexHeaderStyle
} from '@/components/common/BottomSheet.tsx'
import {c, font} from '@/styles/notion.ts'

const RANK_VALUES: SubCategoryRank[] = ['A', 'B', 'C', 'D', 'E']

export const RANK_COLORS: Record<SubCategoryRank, string> = {
  A: '#2383e2',
  B: '#19a576',
  C: '#f2ab26',
  D: '#eb5757',
  E: 'rgba(55,53,47,0.4)',
}

type Zone = SubCategoryRank | 'unset'

type Props = {
  subjectName: string
  subCategories: SubCategory[]
  setSubCategories: (v: SubCategory[]) => void
}

export function SubCategoryList({
                                  subjectName,
                                  subCategories,
                                  setSubCategories,
                                }: Props) {
  const items = subCategories.filter(sc => sc.subject === subjectName)
  const itemsKey = items.map(sc => sc.id).join(',')

  const [draftRanks, setDraftRanks] = useState<Record<number, SubCategoryRank | null>>(
    () => Object.fromEntries(items.map(sc => [sc.id, sc.rank]))
  )
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  useEffect(() => {
    setDraftRanks(prev => {
      const next: Record<number, SubCategoryRank | null> = {}
      for (const sc of items) {
        next[sc.id] = sc.id in prev ? prev[sc.id] : sc.rank
      }
      return next
    })
  }, [itemsKey])

  const isDirty = items.some(sc => draftRanks[sc.id] !== sc.rank)

  const byZone: Record<Zone, SubCategory[]> = { unset: [], A: [], B: [], C: [], D: [], E: [] }
  for (const sc of items) {
    byZone[draftRanks[sc.id] ?? 'unset'].push(sc)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const id = Number(active.id)
    const zone = over.id as Zone
    setDraftRanks(prev => ({ ...prev, [id]: zone === 'unset' ? null : zone }))
  }

  const handleSave = async () => {
    const changed = items.filter(sc => draftRanks[sc.id] !== sc.rank)
    if (!changed.length) return
    setSaving(true)
    try {
      const results = await Promise.all(
        changed.map(sc =>
          updateSubCategory(sc.id, { subject: subjectName, name: sc.name, rank: draftRanks[sc.id] })
        ),
      )
      setSubCategories(subCategories.map(sc => results.find(r => r.id === sc.id) ?? sc))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div>
        <div style={headerRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={sectionTitle}>SUB CATEGORIES</span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              style={gearBtn}
              title="小分類の管理"
            >
              <Settings size={14} />
            </button>
          </div>

          <button
            style={isDirty && !saving ? saveBtn : saveBtnDisabled}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? '保存中…' : 'Save'}
          </button>
        </div>

        <div>
          <DropZone zone="unset" label="未設定" items={byZone.unset} />
          {RANK_VALUES.map(rank => (
            <DropZone key={rank} zone={rank} label={rank} color={RANK_COLORS[rank]} items={byZone[rank]} />
          ))}
        </div>
      </div>

      {showSettings && (
        <SubCategorySettingsSheet
          subjectName={subjectName}
          subCategories={subCategories}
          setSubCategories={setSubCategories}
          onClose={() => setShowSettings(false)}
        />
      )}
    </DndContext>
  )
}

// ── 設定 BottomSheet ──────────────────────────────────────────────────────────

function SubCategorySettingsSheet({
  subjectName,
  subCategories,
  setSubCategories,
  onClose,
}: {
  subjectName: string
  subCategories: SubCategory[]
  setSubCategories: (v: SubCategory[]) => void
  onClose: () => void
}) {
  const items = subCategories.filter(sc => sc.subject === subjectName)

  const [addValue, setAddValue] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus()
  }, [editingId])

  const startEdit = (sc: SubCategory) => {
    setEditingId(sc.id)
    setEditingValue(sc.name)
    setDeleteId(null)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  const handleRenameSave = async () => {
    const sc = items.find(x => x.id === editingId)
    if (!sc) return
    const newName = editingValue.trim()
    if (!newName) return
    if (newName === sc.name) { cancelEdit(); return }
    setLoading(true)
    setError(null)
    try {
      const updated = await updateSubCategory(sc.id, { subject: subjectName, name: newName, rank: sc.rank })
      setSubCategories(subCategories.map(x => x.id === updated.id ? updated : x))
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return
    setLoading(true)
    setError(null)
    try {
      await deleteSubCategory(deleteId)
      setSubCategories(subCategories.filter(x => x.id !== deleteId))
      setDeleteId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!addValue.trim()) return
    setAddLoading(true)
    setError(null)
    try {
      const created = await addSubCategory({ subject: subjectName, name: addValue.trim() })
      setSubCategories([...subCategories, created])
      setAddValue('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '追加に失敗しました')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <BottomSheet onClose={onClose} height="80vh">
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} style={sheetCloseBtnStyle}>×</button>
        <span style={sheetTitle}>小分類の管理</span>
        <div style={{ width: '28px' }} />
      </div>

      <div style={sheetBodyStyle}>
        {/* 追加フォーム */}
        <div style={addArea}>
          <input
            value={addValue}
            onChange={e => setAddValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="新しい小分類を追加..."
            style={addInput}
          />
          <button
            onClick={handleAdd}
            disabled={!addValue.trim() || addLoading}
            style={!addValue.trim() || addLoading ? addBtnDisabled : addBtnActive}
          >
            {addLoading ? '…' : '追加'}
          </button>
        </div>

        {error && <p style={errorText}>{error}</p>}

        <p style={noteText}>削除すると、紐づく全ての問題データが削除されます。</p>

        {/* 管理リスト */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(sc => (
            <div key={sc.id}>
              {editingId === sc.id ? (
                <div style={editRow}>
                  <input
                    ref={editRef}
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameSave()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    style={editInput}
                    disabled={loading}
                  />
                  <button onClick={handleRenameSave} disabled={loading || !editingValue.trim()} style={saveBtnSheet}>
                    保存
                  </button>
                  <button onClick={cancelEdit} disabled={loading} style={cancelBtnSheet}>
                    キャンセル
                  </button>
                </div>
              ) : deleteId === sc.id ? (
                <div style={deleteRow}>
                  <span style={deleteText}>「{sc.name}」を削除しますか？</span>
                  <button onClick={handleDeleteConfirm} disabled={loading} style={destructiveBtn}>
                    削除
                  </button>
                  <button onClick={() => setDeleteId(null)} disabled={loading} style={cancelBtnSheet}>
                    キャンセル
                  </button>
                </div>
              ) : (
                <div style={itemRow}>
                  <span style={itemName}>{sc.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEdit(sc)} style={iconBtn}>編集</button>
                    <button onClick={() => { setDeleteId(sc.id); setEditingId(null) }} style={{ ...iconBtn, color: c.red }}>
                      削除
                    </button>
                  </div>
                </div>
              )}
              <div style={divider} />
            </div>
          ))}
          {items.length === 0 && (
            <p style={{ fontSize: font.base, color: 'rgba(55,53,47,0.35)', padding: '12px 0' }}>
              小分類が登録されていません
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

// ── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  zone,
  label,
  color,
  items,
}: {
  zone: Zone
  label: string
  color?: string
  items: SubCategory[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zone })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...zoneRow,
        backgroundColor: isOver
          ? color ? `${color}10` : 'rgba(55,53,47,0.03)'
          : 'transparent',
      }}
    >
      <span style={zone === 'unset' ? zoneLabelUnset : { ...zoneLabelRank, color }}>
        {label}
      </span>
      <div style={chipRow}>
        {items.map(sc => (
          <Chip key={sc.id} sc={sc} accentColor={color} />
        ))}
      </div>
    </div>
  )
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ sc, accentColor }: { sc: SubCategory; accentColor?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: sc.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...chip,
        opacity: isDragging ? 0.35 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        borderColor: accentColor ? `${accentColor}30` : 'rgba(55,53,47,0.08)',
        color: accentColor ?? 'rgba(55,53,47,0.65)',
        backgroundColor: accentColor ? `${accentColor}0d` : 'rgba(55,53,47,0.03)',
      }}
    >
      <span style={dragHandle}>⠿</span>
      <span style={chipLabel}>{sc.name}</span>
    </div>
  )
}

/* ── styles ─────────────────────────────────────────────────────────────────── */

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
}

const sectionTitle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
}

const gearBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '2px',
  color: 'rgba(55,53,47,0.3)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '4px',
}

const saveBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2383e2',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '44px',
}

const saveBtnDisabled: CSSProperties = {
  ...saveBtn,
  color: 'rgba(55,53,47,0.25)',
  cursor: 'default',
}

const zoneRow: CSSProperties = {
  display: 'flex',
  gap: '10px',
  padding: '10px 0',
  borderBottom: '1px solid rgba(55,53,47,0.08)',
  minHeight: '44px',
}

const zoneLabelUnset: CSSProperties = {
  width: '32px',
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.3)',
  paddingTop: '6px',
}

const zoneLabelRank: CSSProperties = {
  width: '32px',
  fontSize: '14px',
  fontWeight: 700,
  textAlign: 'center',
  paddingTop: '4px',
}

const chipRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  flex: 1,
}

const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 8px',
  minHeight: '36px',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '13px',
  fontWeight: 500,
  userSelect: 'none',
  touchAction: 'none',
}

const dragHandle: CSSProperties = {
  fontSize: '11px',
  opacity: 0.3,
}

const chipLabel: CSSProperties = {
  maxWidth: '140px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

// ── Settings Sheet styles ─────────────────────────────────────────────────────

const sheetTitle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: c.text,
}

const addArea: CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
}

const addInput: CSSProperties = {
  flex: 1,
  border: '1px solid rgba(55,53,47,0.15)',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '15px',
  outline: 'none',
  backgroundColor: 'rgba(55,53,47,0.02)',
}

const addBtnActive: CSSProperties = {
  padding: '8px 14px',
  background: '#37352f',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const addBtnDisabled: CSSProperties = {
  ...addBtnActive,
  opacity: 0.25,
  cursor: 'default',
}

const noteText: CSSProperties = {
  fontSize: '11px',
  color: 'rgba(55,53,47,0.45)',
  marginBottom: '16px',
  lineHeight: 1.6,
}

const errorText: CSSProperties = {
  fontSize: '12px',
  color: c.red,
  marginBottom: '12px',
}

const itemRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
}

const itemName: CSSProperties = {
  fontSize: font.base,
  fontWeight: 600,
  color: c.text,
}

const iconBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(55,53,47,0.45)',
  cursor: 'pointer',
  padding: '2px 6px',
}

const editRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 0',
}

const editInput: CSSProperties = {
  flex: 1,
  border: '1px solid rgba(55,53,47,0.2)',
  borderRadius: '4px',
  padding: '6px 8px',
  fontSize: font.base,
  color: c.text,
  outline: 'none',
  backgroundColor: 'rgba(55,53,47,0.02)',
}

const deleteRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 0',
}

const deleteText: CSSProperties = {
  flex: 1,
  fontSize: '12px',
  color: c.red,
  fontWeight: 500,
}

const saveBtnSheet: CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#2383e2',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const cancelBtnSheet: CSSProperties = {
  padding: '4px 10px',
  backgroundColor: 'transparent',
  border: '1px solid rgba(55,53,47,0.16)',
  borderRadius: '4px',
  fontSize: '11px',
  color: 'rgba(55,53,47,0.6)',
  cursor: 'pointer',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const destructiveBtn: CSSProperties = {
  padding: '4px 10px',
  backgroundColor: c.red,
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const divider: CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(55,53,47,0.06)',
}
