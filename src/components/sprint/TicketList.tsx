import type {StudyTicket, TicketStatus} from '../../types/sprint'
import {STATUS_LABEL} from '../../types/sprint'
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

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: 'TODO' },
  { value: 'doing', label: 'DOING' },
  { value: 'done', label: 'DONE' },
]

export function TicketList({ tickets, filter, onFilterChange, onTicketTap, onStatusChange, loading }: Props) {
  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  const statusColor = (s: TicketStatus) =>
    s === 'done' ? '#27ae60' : s === 'doing' ? c.blue : c.textHint

  const countByStatus = (s: TicketStatus) => tickets.filter((t) => t.status === s).length

  return (
    <div>
      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 16px',
          borderBottom: `1px solid ${c.border}`,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value
          const count = f.value === 'all' ? tickets.length : countByStatus(f.value as TicketStatus)
          return (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: active ? 'rgba(55,53,47,0.08)' : 'transparent',
                color: active
                  ? f.value === 'all'
                    ? c.text
                    : statusColor(f.value as TicketStatus)
                  : c.textHint,
                fontSize: font.sm,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {f.label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: '4px',
                    fontSize: font.xs,
                    opacity: 0.7,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 8,
                backgroundColor: 'rgba(55,53,47,0.04)',
              }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              fontSize: font.base,
              color: c.textHint,
            }}
          >
            {filter === 'done'
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
