// MEMO: 将来的にユーザーが定義できるようにする
import {useRef, useState} from 'react'
import type {StudySession, StudySessionInput, TimeSlot} from '../../types/workspace'
import {StudyBlockRow} from './StudyBlockRow'
import {useWorkspaceDraftStore} from '../../lib/store/workspaceDraft'

const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: 'morning', label: '朝' },
  { slot: 'lunch', label: '昼' },
  { slot: 'night', label: '夜' },
]

const VALID_SLOTS = new Set<TimeSlot>(SLOTS.map((s) => s.slot))

function getCurrentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'lunch'
  return 'night'
}

/** `${date}:nr-${slot}-${N}` 形式のキーをパースして slot と N を返す */
function parseDraftKey(
  key: string,
  date: string,
): {slot: TimeSlot; n: number} | null {
  const prefix = `${date}:nr-`
  if (!key.startsWith(prefix)) return null
  const rest = key.slice(prefix.length)
  const match = rest.match(/^([^-]+)-(\d+)$/)
  if (!match) return null
  const slot = match[1] as TimeSlot
  if (!VALID_SLOTS.has(slot)) return null
  return {slot, n: parseInt(match[2], 10)}
}

type Props = {
  date: string
  sessions: StudySession[]
  readonly: boolean
  initialMinutes?: number
  initialSubject?: string
  initialMaterial?: string
  onAdd: (input: StudySessionInput) => Promise<StudySession>
  onUpdate: (id: number, input: Omit<StudySessionInput, 'dailyLogDate'>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type NewRow = {
  id: string
  slot: TimeSlot
  defaultMinutes?: number
  defaultSubject?: string
  defaultMaterial?: string
}

export function StudyBlockList({
  date,
  sessions,
  readonly,
  initialMinutes,
  initialSubject,
  initialMaterial,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const rowCounter = useRef(0)
  const hasInitial = !readonly && (initialMinutes != null || !!initialSubject)
  const initialSlot = getCurrentTimeSlot()

  const [expandedSlots, setExpandedSlots] = useState<Set<TimeSlot>>(() => {
    const set = new Set(sessions.map((s) => s.timeSlot))
    if (hasInitial) set.add(initialSlot)

    if (!readonly) {
      const {drafts} = useWorkspaceDraftStore.getState()
      for (const key of Object.keys(drafts)) {
        const parsed = parseDraftKey(key, date)
        if (parsed) set.add(parsed.slot)
      }
    }

    return set
  })

  const [newRows, setNewRows] = useState<NewRow[]>(() => {
    const rows: NewRow[] = []
    let maxN = 0

    if (!readonly) {
      const {drafts} = useWorkspaceDraftStore.getState()
      for (const key of Object.keys(drafts)) {
        const parsed = parseDraftKey(key, date)
        if (!parsed) continue
        rows.push({id: key, slot: parsed.slot})
        maxN = Math.max(maxN, parsed.n)
      }
    }

    rowCounter.current = maxN

    if (hasInitial) {
      rowCounter.current++
      rows.push({
        id: `${date}:nr-${initialSlot}-${rowCounter.current}`,
        slot: initialSlot,
        defaultMinutes: initialMinutes,
        defaultSubject: initialSubject,
        defaultMaterial: initialMaterial,
      })
    }

    return rows
  })

  function nextId(slot: TimeSlot): string {
    return `${date}:nr-${slot}-${++rowCounter.current}`
  }

  function toggleSlot(slot: TimeSlot) {
    const next = new Set(expandedSlots)
    if (next.has(slot)) {
      next.delete(slot)
      setNewRows((prev) => prev.filter((r) => r.slot !== slot))
    } else {
      next.add(slot)
      if (!readonly) {
        // ドラフトストアにこのスロットの下書き行があれば復元、なければ新規追加
        const {drafts} = useWorkspaceDraftStore.getState()
        const draftRows = Object.keys(drafts)
          .map((key) => {
            const parsed = parseDraftKey(key, date)
            return parsed?.slot === slot ? {id: key, slot, n: parsed.n} : null
          })
          .filter((r): r is {id: string; slot: TimeSlot; n: number} => r !== null)

        if (draftRows.length > 0) {
          setNewRows((prev) => [
            ...prev,
            ...draftRows.map(({id, slot: s}) => ({id, slot: s})),
          ])
          const maxN = Math.max(...draftRows.map((r) => r.n))
          rowCounter.current = Math.max(rowCounter.current, maxN)
        } else {
          setNewRows((prev) => [...prev, {id: nextId(slot), slot}])
        }
      }
    }
    setExpandedSlots(next)
  }

  function addRow(slot: TimeSlot) {
    setNewRows((prev) => [...prev, {id: nextId(slot), slot}])
  }

  return (
    <div>
      {SLOTS.map(({slot, label}, i) => {
        const slotSessions = sessions.filter((s) => s.timeSlot === slot)
        const slotNewRows = newRows.filter((r) => r.slot === slot)
        const isExpanded = expandedSlots.has(slot)
        const isLast = i === SLOTS.length - 1

        return (
          <div
            key={slot}
            style={{borderBottom: isLast ? 'none' : '1px solid rgba(55, 53, 47, 0.08)'}}
          >
            <button onClick={() => toggleSlot(slot)} style={slotHeader}>
              <span style={{...arrow, transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}}>
                ▼
              </span>
              <span style={slotLabelText}>{label}</span>
              {slotSessions.length > 0 && <span style={badge}>{slotSessions.length}</span>}
            </button>

            {isExpanded && (
              <div style={slotContent}>
                {slotSessions.map((s) => (
                  <StudyBlockRow
                    key={s.id}
                    rowKey={String(s.id)}
                    session={s}
                    onSave={async (_, input) => {
                      await onUpdate(s.id, {timeSlot: s.timeSlot, ...input})
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
                      rowKey={row.id}
                      initialMinutes={row.defaultMinutes}
                      initialSubject={row.defaultSubject}
                      initialMaterial={row.defaultMaterial}
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
                        await onUpdate(currentId, {timeSlot: slot, ...input})
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
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '12px 0',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  minHeight: '44px',
}
const arrow: React.CSSProperties = {
  fontSize: '8px',
  color: 'rgba(55, 53, 47, 0.3)',
  transition: 'transform 0.15s ease',
}
const slotLabelText: React.CSSProperties = {fontSize: '14px', fontWeight: 600, color: '#37352f'}
const badge: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.4)',
  marginLeft: '4px',
}
const slotContent: React.CSSProperties = {
  paddingBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}
const addButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 4px',
  background: 'none',
  border: 'none',
  color: 'rgba(55, 53, 47, 0.4)',
  fontSize: '14px',
  cursor: 'pointer',
}
