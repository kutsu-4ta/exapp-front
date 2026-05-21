import {useState} from 'react'
import type {StudyTicket, TicketStatus} from '../../types/sprint'
import {PRIORITY_COLOR, PRIORITY_LABEL, TICKET_TYPE_LABEL} from '../../types/sprint'
import {c, font} from '../../styles/notion'
import {subjectPalette} from '../../styles/subjectUI'
import {useSettingsStore} from '../../lib/store/settings'

type Props = {
  ticket: StudyTicket
  onClick?: (ticket: StudyTicket) => void
  onStatusChange?: (ticket: StudyTicket, status: TicketStatus) => void
  compact?: boolean
}

// ── Status chip styles ────────────────────────────────────────────────────────

const statusChipBase: React.CSSProperties = {
  borderRadius: 4,
  padding: '2px 7px',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  lineHeight: '16px',
}

const statusChipTodo: React.CSSProperties = {
  border: '1px solid rgba(55,53,47,0.15)',
  color: 'rgba(55,53,47,0.4)',
  backgroundColor: 'transparent',
}

const statusChipDoing: React.CSSProperties = {
  border: '1px solid rgba(35,131,226,0.3)',
  color: '#2383e2',
  backgroundColor: 'rgba(35,131,226,0.06)',
}

const statusChipDone: React.CSSProperties = {
  border: '1px solid rgba(55,53,47,0.08)',
  color: 'rgba(55,53,47,0.28)',
  backgroundColor: 'rgba(55,53,47,0.03)',
}

// ─────────────────────────────────────────────────────────────────────────────

function formatDue(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}日超過`
  if (diff === 0) return '今日'
  if (diff === 1) return '明日'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function isDueUrgent(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() - today.getTime() <= 0
}


export function TicketCard({ ticket, onClick, onStatusChange, compact = false }: Props) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const palette = subjectPalette(ticket.subject, subjectColors[ticket.subject])
  const urgentDue = ticket.status !== 'done' && isDueUrgent(ticket.dueDate)

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onStatusChange) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos((prev) => prev ? null : { x: rect.right, y: rect.bottom + 4 })
  }

  const selectStatus = (e: React.MouseEvent, status: TicketStatus) => {
    e.stopPropagation()
    setMenuPos(null)
    onStatusChange?.(ticket, status)
  }

  return (
    <div
      onClick={() => { setMenuPos(null); onClick?.(ticket) }}
      style={{
        padding: compact ? '10px 12px' : '12px 14px',
        borderRadius: '8px',
        border: `1px solid ${c.border}`,
        backgroundColor: ticket.status === 'done' ? 'rgba(55,53,47,0.02)' : c.bg,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      {/* Priority stripe */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          bottom: 4,
          width: 3,
          borderRadius: '0 2px 2px 0',
          backgroundColor: PRIORITY_COLOR[ticket.priority],
          opacity: ticket.status === 'done' ? 0.3 : 1,
        }}
      />

      <div style={{ paddingLeft: 8 }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '5px',
          }}
        >
            {/* Priority badge */}
            <span
                style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: PRIORITY_COLOR[ticket.priority],
                    opacity: ticket.status === 'done' ? 0.5 : 1,
                    flexShrink: 0,
                }}
            >
            {PRIORITY_LABEL[ticket.priority]}
          </span>

          {/* Subject chip */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: palette.color,
              backgroundColor: palette.bg,
              borderRadius: '3px',
              padding: '1px 5px',
              flexShrink: 0,
              maxWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ticket.subject}
          </span>

            {/* Type badge */}
            <span
                style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: 'rgba(55,53,47,0.35)',
                    borderRadius: '3px',
                    padding: '1px 4px',
                    flexShrink: 0,
                }}
            >
            {TICKET_TYPE_LABEL[ticket.ticketType]}
          </span>

          {/* Due date */}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: font.xs,
              color: urgentDue ? c.red : c.textHint,
              fontWeight: urgentDue ? 600 : 400,
              flexShrink: 0,
            }}
          >
            {formatDue(ticket.dueDate)}
          </span>

          {/* Status chip */}
          {onStatusChange && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={handleStatusClick}
                style={{
                  ...statusChipBase,
                  ...(ticket.status === 'done'
                    ? statusChipDone
                    : ticket.status === 'doing'
                      ? statusChipDoing
                      : statusChipTodo),
                }}
                title="ステータスを変更"
              >
                {ticket.status === 'todo' ? 'TODO' : ticket.status === 'doing' ? 'DOING' : 'DONE'}
              </button>

              {/* Status mini menu */}
              {menuPos && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 500 }}
                    onClick={(e) => { e.stopPropagation(); setMenuPos(null) }}
                  />
                  <div
                    style={{
                      position: 'fixed',
                      top: menuPos.y,
                      left: menuPos.x - 110,
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      border: `1px solid ${c.border}`,
                      overflow: 'hidden',
                      zIndex: 501,
                      minWidth: 110,
                    }}
                  >
                    {(['todo', 'doing', 'done'] as TicketStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={(e) => selectStatus(e, s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '9px 12px',
                          border: 'none',
                          background: ticket.status === s ? 'rgba(55,53,47,0.03)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: font.sm,
                          fontWeight: ticket.status === s ? 700 : 400,
                          color: ticket.status === s ? c.text : c.textSub,
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          backgroundColor:
                            s === 'doing' ? '#2383e2'
                            : s === 'done' ? 'rgba(55,53,47,0.25)'
                            : 'rgba(55,53,47,0.2)',
                        }} />
                        {s === 'todo' ? 'TODO' : s === 'doing' ? 'DOING' : 'DONE'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <p
          style={{
            margin: 0,
            fontSize: font.base,
            fontWeight: 500,
            color: ticket.status === 'done' ? c.textHint : c.text,
            textDecoration: ticket.status === 'done' ? 'line-through' : 'none',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}
        >
          {ticket.title}
        </p>

        {/* SubCategories */}
        {ticket.subCategories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {ticket.subCategories.map((sc) => (
              <span
                key={sc.id}
                style={{
                  fontSize: font.xs,
                  color: c.textSub,
                  backgroundColor: 'rgba(55,53,47,0.05)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                }}
              >
                {sc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
