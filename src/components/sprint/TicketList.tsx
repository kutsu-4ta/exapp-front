import {useState} from 'react'
import type {StudyTicket, TicketPriority, TicketSource, TicketStatus, TicketType} from '../../types/sprint'
import {PRIORITY_LABEL, SOURCE_LABEL, STATUS_LABEL, TICKET_TYPE_LABEL} from '../../types/sprint'
import {TicketCard} from './TicketCard'
import {c, font} from '../../styles/notion'

type StatusFilter = TicketStatus | 'all'

type Props = {
  tickets: StudyTicket[]
  filter: StatusFilter
  onFilterChange: (f: StatusFilter) => void
  onTicketTap: (ticket: StudyTicket) => void
  onStatusChange?: (ticket: StudyTicket, status: TicketStatus) => void
  loading?: boolean
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: 'TODO' },
  { value: 'doing', label: 'DOING' },
  { value: 'done', label: 'DONE' },
]

const PRIORITIES: TicketPriority[] = ['high', 'medium', 'low']
const TICKET_TYPES: TicketType[] = ['knowledge', 'practice', 'understanding', 'memorization']
const TICKET_SOURCES: TicketSource[] = ['wrong_answer', 'load_map', 'review', 'manual']

const PRIORITY_COLOR_MAP: Record<TicketPriority, string> = {
  high: '#d06d6d',
  medium: '#93b964',
  low: '#5e85ab',
}

export function TicketList({ tickets, filter, onFilterChange, onTicketTap, onStatusChange, loading }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPriority, setFilterPriority] = useState<Set<TicketPriority>>(new Set())
  const [filterType, setFilterType] = useState<Set<TicketType>>(new Set())
  const [filterSource, setFilterSource] = useState<Set<TicketSource>>(new Set())

  const togglePriority = (p: TicketPriority) =>
    setFilterPriority((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })

  const toggleType = (t: TicketType) =>
    setFilterType((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  const toggleSource = (s: TicketSource) =>
    setFilterSource((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })

  const activeFilterCount = filterPriority.size + filterType.size + filterSource.size

  const filtered = tickets
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => filterPriority.size === 0 || filterPriority.has(t.priority))
    .filter((t) => filterType.size === 0 || filterType.has(t.ticketType))
    .filter((t) => filterSource.size === 0 || filterSource.has(t.source))

  const statusColor = (s: TicketStatus) =>
    s === 'done' ? '#27ae60' : s === 'doing' ? c.blue : c.textHint

  const countByStatus = (s: TicketStatus) => tickets.filter((t) => t.status === s).length

  return (
    <div>
      {/* Status tabs + filter toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px 8px 16px',
          borderBottom: filterOpen ? 'none' : `1px solid ${c.border}`,
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.value
            const count = f.value === 'all' ? tickets.length : countByStatus(f.value as TicketStatus)
            const accentColor = f.value === 'all' ? c.text : statusColor(f.value as TicketStatus)
            return (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: active ? `1px solid ${accentColor}22` : 'none',
                  backgroundColor: active ? `${accentColor}0e` : 'transparent',
                  color: active ? accentColor : c.textHint,
                  fontSize: font.sm,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: active ? accentColor : 'rgba(55,53,47,0.3)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
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
            flexShrink: 0,
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

      {/* Collapsible filter panel */}
      {filterOpen && (
        <div style={{
          padding: '10px 16px 12px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backgroundColor: 'rgba(55,53,47,0.015)',
        }}>
          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>優先度</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITIES.map((p) => {
                const active = filterPriority.has(p)
                return (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: active ? 'none' : `1px solid ${c.border}`,
                      backgroundColor: active ? PRIORITY_COLOR_MAP[p] : 'transparent',
                      color: active ? '#fff' : c.textSub,
                      fontSize: font.sm,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {PRIORITY_LABEL[p]} {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ticket type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>種別</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TICKET_TYPES.map((t) => {
                const active = filterType.has(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: active ? 'none' : `1px solid ${c.border}`,
                      backgroundColor: active ? c.blue : 'transparent',
                      color: active ? '#fff' : c.textSub,
                      fontSize: font.sm,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {TICKET_TYPE_LABEL[t]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, minWidth: 36 }}>発生源</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TICKET_SOURCES.map((s) => {
                const active = filterSource.has(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleSource(s)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: active ? 'none' : `1px solid ${c.border}`,
                      backgroundColor: active ? c.blue : 'transparent',
                      color: active ? '#fff' : c.textSub,
                      fontSize: font.sm,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {SOURCE_LABEL[s]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterPriority(new Set()); setFilterType(new Set()); setFilterSource(new Set()) }}
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
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px 0', fontSize: font.base, color: c.textHint }}
          >
            {activeFilterCount > 0
              ? '条件に一致するチケットがありません'
              : filter === 'done'
                ? 'まだ完了したチケットがありません'
                : filter === 'all'
                  ? 'チケットがありません'
                  : `${STATUS_LABEL[filter as TicketStatus]} のチケットがありません`}
          </div>
        ) : (
          filtered.map((ticket) => (
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
