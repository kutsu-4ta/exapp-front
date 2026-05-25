import {useCallback, useEffect, useMemo, useState} from 'react'
import type {StudyTicket, TicketPriority, TicketSource, TicketStatus, TicketType} from '../../types/sprint'
import {PRIORITY_LABEL, SOURCE_LABEL, TICKET_TYPE_LABEL} from '../../types/sprint'
import {TicketCard} from './TicketCard'
import {c, font} from '../../styles/notion'
import {useSettingsStore} from '../../lib/store/settings'

type SortKey = 'priority' | 'subject' | 'dueDate' | 'createdAt'
type SortOrder = 'asc' | 'desc'

type Props = {
  tickets: StudyTicket[]
  onTicketTap: (ticket: StudyTicket) => void
  onStatusChange?: (ticket: StudyTicket, status: TicketStatus) => void
  loading?: boolean
  onVisibleTicketsChange?: (tickets: StudyTicket[]) => void
}

const STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'TODO', color: 'rgba(55,53,47,0.5)' },
  { value: 'doing', label: 'DOING', color: '#2383e2' },
  { value: 'done', label: 'DONE', color: '#27ae60' },
]
const PRIORITIES: TicketPriority[] = ['high', 'medium', 'low']
const TICKET_TYPES: TicketType[] = ['knowledge', 'practice', 'understanding', 'memorization']
const TICKET_SOURCES: TicketSource[] = ['wrong_answer', 'load_map', 'review', 'manual']
const SORT_KEYS: { value: SortKey; label: string }[] = [
  { value: 'priority', label: '優先度' },
  { value: 'subject', label: '科目' },
  { value: 'dueDate', label: '期日' },
  { value: 'createdAt', label: '起票日' },
]
const PRIORITY_ORDER: Record<TicketPriority, number> = { high: 0, medium: 1, low: 2 }

const PRIORITY_COLOR_MAP: Record<TicketPriority, string> = {
  high: '#d06d6d',
  medium: '#93b964',
  low: '#5e85ab',
}

export function TicketList({ tickets, onTicketTap, onStatusChange, loading, onVisibleTicketsChange }: Props) {
  const subjects = useSettingsStore((s) => s.subjects)

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Set<TicketStatus>>(new Set())
  const [filterPriority, setFilterPriority] = useState<Set<TicketPriority>>(new Set())
  const [filterType, setFilterType] = useState<Set<TicketType>>(new Set())
  const [filterSource, setFilterSource] = useState<Set<TicketSource>>(new Set())
  const [filterSubject, setFilterSubject] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const toggleStatus = (s: TicketStatus) =>
    setFilterStatus((prev) => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next })

  const togglePriority = (p: TicketPriority) =>
    setFilterPriority((prev) => { const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next })

  const toggleType = (t: TicketType) =>
    setFilterType((prev) => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next })

  const toggleSource = (s: TicketSource) =>
    setFilterSource((prev) => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next })

  const toggleSubject = (s: string) =>
    setFilterSubject((prev) => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next })

  const activeFilterCount = filterStatus.size + filterPriority.size + filterType.size + filterSource.size + filterSubject.size

  const filtered = useMemo(() =>
    tickets
      .filter((t) => filterStatus.size === 0 || filterStatus.has(t.status))
      .filter((t) => filterPriority.size === 0 || filterPriority.has(t.priority))
      .filter((t) => filterType.size === 0 || filterType.has(t.ticketType))
      .filter((t) => filterSource.size === 0 || filterSource.has(t.source))
      .filter((t) => filterSubject.size === 0 || filterSubject.has(t.subject)),
    [tickets, filterStatus, filterPriority, filterType, filterSource, filterSubject]
  )

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sortKey === 'subject') cmp = a.subject.localeCompare(b.subject, 'ja')
      else if (sortKey === 'dueDate') cmp = a.dueDate.localeCompare(b.dueDate)
      else if (sortKey === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      return sortOrder === 'asc' ? cmp : -cmp
    }),
    [filtered, sortKey, sortOrder]
  )

  const stableOnVisibleChange = useCallback((t: StudyTicket[]) => { onVisibleTicketsChange?.(t) }, [onVisibleTicketsChange])
  useEffect(() => { stableOnVisibleChange(sorted) }, [sorted, stableOnVisibleChange])

  const chipBtn = (active: boolean, color: string, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px',
        borderRadius: 20,
        border: active ? 'none' : `1px solid ${c.border}`,
        backgroundColor: active ? color : 'transparent',
        color: active ? '#fff' : c.textSub,
        fontSize: font.sm,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  const currentSortLabel = SORT_KEYS.find((k) => k.value === sortKey)?.label ?? '優先度'

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 8px 16px',
          borderBottom: filterOpen || sortOpen ? 'none' : `1px solid ${c.border}`,
        }}
      >
        <span style={{ fontSize: font.sm, color: c.textHint, fontVariantNumeric: 'tabular-nums' }}>
          {tickets.length}件
          {activeFilterCount > 0 && ` / 絞込中 ${sorted.length}件`}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          {/* Sort button */}
          <button
            onClick={() => { setSortOpen((v) => !v); setFilterOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 8px',
              borderRadius: '6px',
              border: sortOpen ? `1px solid ${c.blue}` : `1px solid ${c.border}`,
              backgroundColor: sortOpen ? 'rgba(35,131,226,0.07)' : 'transparent',
              color: sortOpen ? c.blue : c.textSub,
              fontSize: font.sm,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            {currentSortLabel} {sortOrder === 'asc' ? '↑' : '↓'}
            <span style={{ fontSize: 10, opacity: 0.6 }}>{sortOpen ? '▲' : '▼'}</span>
          </button>

          {/* Filter button */}
          <button
            onClick={() => { setFilterOpen((v) => !v); setSortOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 8px',
              borderRadius: '6px',
              border: activeFilterCount > 0 ? `1px solid ${c.blue}` : `1px solid ${c.border}`,
              backgroundColor: activeFilterCount > 0 ? 'rgba(35,131,226,0.07)' : 'transparent',
              color: activeFilterCount > 0 ? c.blue : c.textSub,
              fontSize: font.sm,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            絞込
            {activeFilterCount > 0 && (
              <span style={{
                minWidth: 16, height: 16, borderRadius: 8,
                backgroundColor: c.blue, color: '#fff',
                fontSize: font.xs, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {activeFilterCount}
              </span>
            )}
            <span style={{ fontSize: 10, opacity: 0.6 }}>{filterOpen ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {/* Sort panel */}
      {sortOpen && (
        <div style={{
          padding: '10px 16px 12px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backgroundColor: 'rgba(55,53,47,0.015)',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SORT_KEYS.map(({ value, label }) => {
              const active = sortKey === value
              return (
                <button
                  key={value}
                  onClick={() => {
                    if (sortKey === value) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc')
                    else { setSortKey(value); setSortOrder('asc') }
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    border: active ? 'none' : `1px solid ${c.border}`,
                    backgroundColor: active ? c.blue : 'transparent',
                    color: active ? '#fff' : c.textSub,
                    fontSize: font.sm,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {label}
                  {active && <span style={{ fontSize: 10 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter panel */}
      {filterOpen && (
        <div style={{
          padding: '10px 16px 12px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backgroundColor: 'rgba(55,53,47,0.015)',
        }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>状態</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(({ value, label, color }) =>
                chipBtn(filterStatus.has(value), color, () => toggleStatus(value), label)
              )}
            </div>
          </div>

          {/* Subject */}
          {subjects.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>科目</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {subjects.map((s) => chipBtn(filterSubject.has(s), c.blue, () => toggleSubject(s), s))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>優先度</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITIES.map((p) =>
                chipBtn(filterPriority.has(p), PRIORITY_COLOR_MAP[p], () => togglePriority(p),
                  `${PRIORITY_LABEL[p]} ${p === 'high' ? '高' : p === 'medium' ? '中' : '低'}`)
              )}
            </div>
          </div>

          {/* Ticket type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>種別</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TICKET_TYPES.map((t) => chipBtn(filterType.has(t), c.blue, () => toggleType(t), TICKET_TYPE_LABEL[t]))}
            </div>
          </div>

          {/* Source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>発生源</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TICKET_SOURCES.map((s) => chipBtn(filterSource.has(s), c.blue, () => toggleSource(s), SOURCE_LABEL[s]))}
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilterStatus(new Set())
                setFilterPriority(new Set())
                setFilterType(new Set())
                setFilterSource(new Set())
                setFilterSubject(new Set())
              }}
              style={{
                alignSelf: 'flex-start',
                padding: '2px 8px',
                border: 'none',
                background: 'none',
                fontSize: font.xs,
                color: c.textHint,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              クリア
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{ height: 72, borderRadius: 8, backgroundColor: 'rgba(55,53,47,0.04)' }}
            />
          ))
        ) : sorted.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px 0', fontSize: font.base, color: c.textHint }}
          >
            {activeFilterCount > 0 ? '条件に一致するチケットがありません' : 'チケットがありません'}
          </div>
        ) : (
          sorted.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketTap}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  )
}
