import type {CSSProperties} from 'react'
import {useEffect, useState} from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import type {SubCategory, SubCategoryRank} from '@/types/workspace.ts'
import {addSubCategory, deleteSubCategory, updateSubCategory,} from '@/lib/api/subcategory.ts'

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

  const [draftRanks, setDraftRanks] = useState<
      Record<number, SubCategoryRank | null>
  >(() => Object.fromEntries(items.map(sc => [sc.id, sc.rank])))

  const [saving, setSaving] = useState(false)
  const [addValue, setAddValue] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 6 },
      }),
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

  const byZone: Record<Zone, SubCategory[]> = {
    unset: [],
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
  }

  for (const sc of items) {
    byZone[draftRanks[sc.id] ?? 'unset'].push(sc)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const id = Number(active.id)
    const zone = over.id as Zone

    setDraftRanks(prev => ({
      ...prev,
      [id]: zone === 'unset' ? null : zone,
    }))
  }

  const handleSave = async () => {
    const changed = items.filter(sc => draftRanks[sc.id] !== sc.rank)
    if (!changed.length) return

    setSaving(true)

    try {
      const results = await Promise.all(
          changed.map(sc =>
              updateSubCategory(sc.id, {
                subject: subjectName,
                name: sc.name,
                rank: draftRanks[sc.id],
              }),
          ),
      )

      setSubCategories(
          subCategories.map(sc => results.find(r => r.id === sc.id) ?? sc),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!addValue.trim()) return

    setAddLoading(true)

    try {
      const created = await addSubCategory({
        subject: subjectName,
        name: addValue.trim(),
      })

      setSubCategories([...subCategories, created])
      setAddValue('')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (sc: SubCategory) => {
    if (
        !window.confirm(
            `「${sc.name}」を削除しますか？\nこの小分類に紐づく全てのデータが削除されます。`,
        )
    ) {
      return
    }

    await deleteSubCategory(sc.id)

    setSubCategories(subCategories.filter(x => x.id !== sc.id))
  }

  return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div>
          <div style={headerRow}>
            <span style={sectionTitle}>SUB CATEGORIES</span>

            <button
                style={isDirty && !saving ? saveBtn : saveBtnDisabled}
                onClick={handleSave}
                disabled={!isDirty || saving}
            >
              {saving ? '保存中…' : 'Save'}
            </button>
          </div>

          <div>
            <DropZone
                zone="unset"
                label="未設定"
                items={byZone.unset}
                onDelete={handleDelete}
            />

            {RANK_VALUES.map(rank => (
                <DropZone
                    key={rank}
                    zone={rank}
                    label={rank}
                    color={RANK_COLORS[rank]}
                    items={byZone[rank]}
                    onDelete={handleDelete}
                />
            ))}
          </div>

          <div style={addArea}>
            <input
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="新しい小分類を追加..."
                style={addInput}
            />

            <button
                style={
                  addValue.trim() && !addLoading
                      ? addBtnActive
                      : addBtnDisabled
                }
                onClick={handleAdd}
            >
              {addLoading ? '…' : '追加'}
            </button>
          </div>
        </div>
      </DndContext>
  )
}

function DropZone({
                    zone,
                    label,
                    color,
                    items,
                    onDelete,
                  }: {
  zone: Zone
  label: string
  color?: string
  items: SubCategory[]
  onDelete: (sc: SubCategory) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone,
  })

  return (
      <div
          ref={setNodeRef}
          style={{
            ...zoneRow,
            backgroundColor: isOver
                ? color
                    ? `${color}10`
                    : 'rgba(55,53,47,0.03)'
                : 'transparent',
          }}
      >
      <span
          style={
            zone === 'unset'
                ? zoneLabelUnset
                : { ...zoneLabelRank, color }
          }
      >
        {label}
      </span>

        <div style={chipRow}>
          {items.map(sc => (
              <Chip
                  key={sc.id}
                  sc={sc}
                  accentColor={color}
                  onDelete={() => onDelete(sc)}
              />
          ))}
        </div>
      </div>
  )
}

function Chip({
                sc,
                accentColor,
                onDelete,
              }: {
  sc: SubCategory
  accentColor?: string
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: sc.id,
      })

  return (
      <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          style={{
            ...chip,
            opacity: isDragging ? 0.35 : 1,
            transform: transform
                ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                : undefined,
            borderColor: accentColor
                ? `${accentColor}30`
                : 'rgba(55,53,47,0.08)',
            color: accentColor ?? 'rgba(55,53,47,0.65)',
            backgroundColor: accentColor
                ? `${accentColor}0d`
                : 'rgba(55,53,47,0.03)',
          }}
      >
        <span style={dragHandle}>⠿</span>

        <span style={chipLabel}>{sc.name}</span>

        <button
            style={chipDeleteBtn}
            onPointerDown={e => {
              e.stopPropagation()
              onDelete()
            }}
        >
          ×
        </button>
      </div>
  )
}

/* styles */

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
}

const sectionTitle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
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

const chipDeleteBtn: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: '0 0 0 2px',
  fontSize: '14px',
  color: 'inherit',
  opacity: 0.35,
  cursor: 'pointer',
}

const addArea: CSSProperties = {
  display: 'flex',
  gap: '8px',
  paddingTop: '12px',
}

const addInput: CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '16px',
}

const addBtnActive: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#37352f',
  fontSize: '14px',
  cursor: 'pointer',
}

const addBtnDisabled: CSSProperties = {
  ...addBtnActive,
  opacity: 0.25,
}