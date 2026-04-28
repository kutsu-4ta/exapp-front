'use client'

import { useRef, useState } from 'react'
import type { StudySession, StudySessionInput, TimeSlot } from '@/types/workspace'
import { StudyBlockRow } from './StudyBlockRow'

const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: 'morning', label: '朝' },
  { slot: 'lunch', label: '昼' },
  { slot: 'commute', label: '通勤' },
  { slot: 'night', label: '夜' },
]

type Props = {
  date: string
  sessions: StudySession[]
  readonly: boolean
  onAdd: (input: StudySessionInput) => Promise<StudySession>
  onUpdate: (id: number, input: Omit<StudySessionInput, 'dailyLogDate'>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type NewRow = { id: string; slot: TimeSlot }

export function StudyBlockList({ date, sessions, readonly, onAdd, onUpdate, onDelete }: Props) {
  const rowCounter = useRef(0)

  const [expandedSlots, setExpandedSlots] = useState<Set<TimeSlot>>(
    () => new Set(sessions.map((s) => s.timeSlot)),
  )
  const [newRows, setNewRows] = useState<NewRow[]>([])

  function nextId(slot: TimeSlot): string {
    return `nr-${slot}-${++rowCounter.current}`
  }

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
            style={{
              borderBottom: isLast ? 'none' : '1px solid #f0ece8',
            }}
          >
            {/* Toggle header */}
            <button
              onClick={() => toggleSlot(slot)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '44px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.5rem',
                  color: '#c9c0b8',
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s ease',
                }}
              >
                ▼
              </span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#5c4a38',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </span>
              {slotSessions.length > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#c9c0b8',
                    marginLeft: '0.125rem',
                  }}
                >
                  {slotSessions.length}
                </span>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Saved sessions */}
                {slotSessions.map((s) => (
                  <StudyBlockRow
                    key={s.id}
                    session={s}
                    onSave={async (_, input) => {
                      await onUpdate(s.id, { timeSlot: s.timeSlot, ...input })
                      return s.id
                    }}
                    onDelete={async () => onDelete(s.id)}
                    readonly={readonly}
                  />
                ))}

                {/* New unsaved rows */}
                {!readonly &&
                  slotNewRows.map((row) => (
                    <StudyBlockRow
                      key={row.id}
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

                {/* Add another row */}
                {!readonly && (
                  <button
                    onClick={() => addRow(slot)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.25rem',
                      background: 'none',
                      border: 'none',
                      color: '#c9c0b8',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
                    追加
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
