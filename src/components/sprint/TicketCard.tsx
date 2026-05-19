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

          {/* Status button */}
          {onStatusChange && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={handleStatusClick}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${ticket.status === 'done' ? '#27ae60' : ticket.status === 'doing' ? '#2383e2' : 'rgba(55,53,47,0.2)'}`,
                  backgroundColor: ticket.status === 'done' ? '#27ae60' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.15s',
                }}
                title="ステータスを変更"
              >
                {ticket.status === 'done' && (
                  <span style={{ fontSize: 11, color: '#fff', lineHeight: 1 }}>✓</span>
                )}
                {ticket.status === 'doing' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2383e2', display: 'block' }} />
                )}
              </button>

              {/* Status mini menu — fixed positioned to avoid stacking context issues */}
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
                      left: menuPos.x - 100,
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      border: `1px solid ${c.border}`,
                      overflow: 'hidden',
                      zIndex: 501,
                      minWidth: 100,
                    }}
                  >
                    {(['todo', 'doing', 'done'] as TicketStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={(e) => selectStatus(e, s)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: ticket.status === s ? 'rgba(35,131,226,0.05)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: font.sm,
                          fontWeight: ticket.status === s ? 700 : 400,
                          color:
                            s === 'done' ? '#27ae60' : s === 'doing' ? '#2383e2' : c.textSub,
                        }}
                      >
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
