'use client'

import { useRef, useState, useEffect } from 'react'
import type { StudySession, StudySessionInput, SubCategory, TimeSlot } from '@/types/workspace'
import { StudyBlockRow } from './StudyBlockRow'

// MEMO: 将来的にユーザーが定義できるようにする
const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: 'morning', label: '朝' },
  { slot: 'lunch', label: '昼' },
  { slot: 'night', label: '夜' },
  { slot: 'commute', label: '隙間' },
]

type Props = {
  date: string
  sessions: StudySession[]
  readonly: boolean
  initialMinutes?: number // ストップウォッチからの引き継ぎ用
  subCategories?: SubCategory[]
  onAdd: (input: StudySessionInput) => Promise<StudySession>
  onUpdate: (id: number, input: Omit<StudySessionInput, 'dailyLogDate'>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type NewRow = { id: string; slot: TimeSlot; defaultMinutes?: number }

export function StudyBlockList({ date, sessions, readonly, initialMinutes, subCategories = [], onAdd, onUpdate, onDelete }: Props) {
  const rowCounter = useRef(0)

  const [expandedSlots, setExpandedSlots] = useState<Set<TimeSlot>>(
      () => new Set(sessions.map((s) => s.timeSlot)),
  )
  const [newRows, setNewRows] = useState<NewRow[]>([])

  function nextId(slot: TimeSlot): string {
    return `nr-${slot}-${++rowCounter.current}`
  }

  // 初期投入（ストップウォッチからの遷移時）
  useEffect(() => {
    if (initialMinutes && !readonly) {
      // 現在時刻等からスロット判定も可能だが、一旦「night」か最後に開いた場所に投入
      const targetSlot: TimeSlot = 'night'
      setExpandedSlots((prev) => new Set(prev).add(targetSlot))
      setNewRows((prev) => [
        ...prev,
        { id: nextId(targetSlot), slot: targetSlot, defaultMinutes: initialMinutes },
      ])
    }
  }, [initialMinutes, readonly])

  function toggleSlot(slot: TimeSlot) {
    const next = new Set(expandedSlots)
    if (next.has(slot)) {
      next.delete(slot)
      setNewRows((prev) => prev.filter((r) => r.slot !== slot))
    } else {
      next.add(slot)
      if (!readonly) {
        setNewRows((prev) => [...prev, { id: nextId(slot), slot }])
      }
    }
    setExpandedSlots(next)
  }

  function addRow(slot: TimeSlot) {
    setNewRows((prev) => [...prev, { id: nextId(slot), slot }])
  }

  return (
      <div>
        {SLOTS.map(({ slot, label }, i) => {
          const slotSessions = sessions.filter((s) => s.timeSlot === slot)
          const slotNewRows = newRows.filter((r) => r.slot === slot)
          const isExpanded = expandedSlots.has(slot)
          const isLast = i === SLOTS.length - 1

          return (
              <div
                  key={slot}
                  style={{ borderBottom: isLast ? 'none' : '1px solid rgba(55, 53, 47, 0.08)' }}
              >
                <button
                    onClick={() => toggleSlot(slot)}
                    style={slotHeader}
                >
              <span style={{
                ...arrow,
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}>▼</span>
                  <span style={slotLabelText}>{label}</span>
                  {slotSessions.length > 0 && <span style={badge}>{slotSessions.length}</span>}
                </button>

                {isExpanded && (
                    <div style={slotContent}>
                      {slotSessions.map((s) => (
                          <StudyBlockRow
                              key={s.id}
                              session={s}
                              subCategories={subCategories}
                              onSave={async (_, input) => {
                                await onUpdate(s.id, { timeSlot: s.timeSlot, ...input })
                                return s.id
                              }}
                              onDelete={async () => onDelete(s.id)}
                              readonly={readonly}
                          />
                      ))}

                      {!readonly &&
                          slotNewRows.map((row) => (
                              <StudyBlockRow
                                  key={row.id}
                                  // ここで初期値をRowコンポーネントに渡す
                                  initialMinutes={row.defaultMinutes}
                                  subCategories={subCategories}
                                  onSave={async (currentId, input) => {
                                    if (currentId === null) {
                                      const newSession = await onAdd({
                                        dailyLogDate: date,
                                        timeSlot: slot,
                                        ...input,
                                      })
                                      setNewRows((prev) => prev.filter((r) => r.id !== row.id))
                                      return newSession.id
                                    }
                                    await onUpdate(currentId, { timeSlot: slot, ...input })
                                    return currentId
                                  }}
                                  onDelete={async () => {
                                    setNewRows((prev) => prev.filter((r) => r.id !== row.id))
                                  }}
                              />
                          ))}

                      {!readonly && (
                          <button onClick={() => addRow(slot)} style={addButton}>
                            <span>+</span> 追加
                          </button>
                      )}
                    </div>
                )}
              </div>
          )
        })}
      </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const slotHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
  padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
  textAlign: 'left', minHeight: '44px',
}
const arrow: React.CSSProperties = { fontSize: '8px', color: 'rgba(55, 53, 47, 0.3)', transition: 'transform 0.15s ease' }
const slotLabelText: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: '#37352f' }
const badge: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.4)', marginLeft: '4px' }
const slotContent: React.CSSProperties = { paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }
const addButton: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 4px',
  background: 'none', border: 'none', color: 'rgba(55, 53, 47, 0.4)',
  fontSize: '14px', cursor: 'pointer',
}