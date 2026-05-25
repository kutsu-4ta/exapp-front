import {useState} from 'react'
import type {Sprint, StudyTicket, TicketNote, TicketStatus} from '../../types/sprint'
import {PRIORITY_COLOR, PRIORITY_LABEL, SOURCE_LABEL, STATUS_LABEL, TICKET_TYPE_LABEL,} from '../../types/sprint'
import {c, font} from '../../styles/notion'
import {TicketNotes} from './TicketNotes'
import {LongPressButton} from '@/components/common/LongPressButton.tsx'
import {MarkdownContent} from '@/components/common/MarkdownContent.tsx'

export function buildTicketDetailText(ticket: StudyTicket, notes: TicketNote[]): string {
  const icon = ticket.priority === 'high' ? '↑' : ticket.priority === 'medium' ? '→' : '↓'
  const lines = [
    `[${ticket.subject}] ${ticket.title}`,
    `${icon} ${PRIORITY_LABEL[ticket.priority]} | ${TICKET_TYPE_LABEL[ticket.ticketType]} | ${STATUS_LABEL[ticket.status]}`,
    `期日: ${ticket.dueDate} | 発生源: ${SOURCE_LABEL[ticket.source]}`,
  ]
  if (ticket.estimateMinutes) {
    const h = Math.floor(ticket.estimateMinutes / 60)
    const m = ticket.estimateMinutes % 60
    lines.push(`見積: ${h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`}`)
  }
  if (ticket.subCategories.length > 0) {
    lines.push(`カテゴリ: ${ticket.subCategories.map((sc) => sc.name).join(', ')}`)
  }
  lines.push('')
  if (ticket.acceptanceCriteria) {
    lines.push('【達成基準】')
    lines.push(ticket.acceptanceCriteria)
    lines.push('')
  }
  if (notes.length > 0) {
    lines.push('【ノート】')
    notes.forEach((note) => {
      const d = new Date(note.createdAt)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      lines.push(dateStr)
      lines.push(note.body)
      lines.push('')
    })
  }
  return lines.join('\n')
}

const deleteBtn: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: font.sm,
  width: '100%',
  color: `rgba(235,87,87,0.6)`,
  cursor: 'pointer',
  fontWeight: 500,
}

type Props = {
  ticket: StudyTicket | null
  sprints: Sprint[]
  onClose: () => void
  onEdit: (ticket: StudyTicket) => void
  onStatusChange: (ticket: StudyTicket, status: TicketStatus) => Promise<void>
  onSprintChange: (ticketId: number, sprintId: number) => Promise<void>
  onDelete: (ticket: StudyTicket) => Promise<void>
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'TODO', color: 'rgba(55,53,47,0.5)' },
  { value: 'doing', label: 'DOING', color: '#2383e2' },
  { value: 'done', label: 'DONE', color: '#27ae60' },
]

function formatDate(s: string): string {
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00')
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function TicketDrawer({
  ticket,
  sprints,
  onClose,
  onEdit,
  onStatusChange,
  onSprintChange,
  onDelete,
}: Props) {
  const [actionLoading, setActionLoading] = useState<'status' | 'sprint' | 'delete' | null>(null)
  const [sprintChanging, setSprintChanging] = useState(false)

  if (!ticket) return null

  const currentSprintId = ticket.sprintId
  const sprintName = sprints.find((s) => s.id === currentSprintId)?.name ?? ''

  const handleStatusChange = async (status: TicketStatus) => {
    if (status === ticket.status) return
    setActionLoading('status')
    try { await onStatusChange(ticket, status) } finally { setActionLoading(null) }
  }

  const handleSprintChange = async (newSprintId: number) => {
    if (newSprintId === ticket.sprintId) { setSprintChanging(false); return }
    setActionLoading('sprint')
    setSprintChanging(false)
    try { await onSprintChange(ticket.id, newSprintId) } finally { setActionLoading(null) }
  }

  const handleDelete = async () => {
    setActionLoading('delete')
    try { await onDelete(ticket) } finally { setActionLoading(null) }
  }


  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1500 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1501,
          backgroundColor: '#fff',
          borderRadius: '16px 16px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', cursor: 'pointer' }}
          onClick={onClose}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(55,53,47,0.12)' }} />
        </div>

        <div style={{ padding: '8px 0 24px' }}>
          {/* Close row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 20px 8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: c.textHint, padding: '4px', lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Sprint row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {/* Sprint chip — click to change */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSprintChanging((v) => !v)}
                disabled={actionLoading === 'sprint'}
                style={{
                  fontSize: font.xs,
                  fontWeight: 600,
                  padding: '3px 20px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${c.border}`,
                  backgroundColor: 'transparent',
                  color: c.textSub,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ☰ {sprintName}
                <span style={{ fontSize: '10px', color: c.textHint }}>▾</span>
              </button>

              {sprintChanging && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    border: `1px solid ${c.border}`,
                    overflow: 'hidden',
                    zIndex: 100,
                    minWidth: 180,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  {sprints.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => handleSprintChange(sp.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '9px 14px',
                        border: 'none',
                        background: sp.id === ticket.sprintId ? c.blueBg : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: font.sm,
                        fontWeight: sp.id === ticket.sprintId ? 700 : 400,
                        color: sp.id === ticket.sprintId ? c.blue : c.text,
                      }}
                    >
                      {sp.type === 'backlog' ? `☰ ${sp.name}` : sp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
              <button
                  onClick={() => onEdit(ticket)}
                  style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                      fontSize: font.base,
                      fontWeight: 600,
                      color: c.textSub,
                      cursor: 'pointer',
                      textAlign: 'left',
                  }}
              >
                  ⋯
              </button>
          </div>

          {/* Title */}
          <h2
            style={{
              margin: '0 20px 20px',
              fontSize: '18px',
              fontWeight: 700,
              color: c.text,
              lineHeight: 1.4,
              textDecoration: ticket.status === 'done' ? 'line-through' : 'none',
            }}
          >
            {ticket.title}
          </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 20px 20px' }}>
                <span
                    style={{
                        fontSize: font.sm,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: c.blueBg,
                        color: c.blue,
                    }}
                >
                    ✔︎ &nbsp;{formatDate(ticket.dueDate)}
                </span>
                <span style={{ fontSize: font.base, color: c.text }}>{TICKET_TYPE_LABEL[ticket.ticketType]}</span>
                <span style={{ fontSize: font.base, color: c.textHint }}>←</span>
                <span style={{ fontSize: font.base, color: c.text }}>{SOURCE_LABEL[ticket.source]}</span>
            </div>

          {/* Acceptance Criteria */}
          <div
            style={{
              padding: '10px 20px 12px',
                backgroundColor: c.bg,
              borderRadius: '8px',
              marginBottom: '14px',
            }}
          >
              {/* 科目名ブロック */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                  <span style={{fontWeight: 700, color: PRIORITY_COLOR[ticket.priority]}}>
                      {PRIORITY_LABEL[ticket.priority]}
                  </span>
                  <span style={{ fontSize: font.md, color: c.textHint }}>
               <span style={{color: c.text}}> {ticket.subject}</span> - {formatDate(ticket.createdAt)}
                </span>
              </div>

            <MarkdownContent>{ticket.acceptanceCriteria}</MarkdownContent>

              {ticket.estimateMinutes && (
                  <div>
                      <div style={{ fontSize: font.xs, color: c.textHint, fontWeight: 600, marginTop: 2 }}>Estimate</div>
                      <span style={{ fontSize: font.sm, color: c.text }}>
                  {ticket.estimateMinutes >= 60
                      ? `${Math.floor(ticket.estimateMinutes / 60)}h${ticket.estimateMinutes % 60 > 0 ? ` ${ticket.estimateMinutes % 60}m` : ''}`
                      : `${ticket.estimateMinutes}m`}
                </span>
                  </div>
              )}
          </div>

          {/* Status selector */}
          <div style={{ margin: '4px 20px 20px' }}>
            <div style={{ fontSize: font.xs, fontWeight: 700, color: c.textHint, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              STATUS
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {STATUS_OPTIONS.map(({ value, label, color }) => {
                const active = ticket.status === value
                return (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value)}
                    disabled={actionLoading === 'status'}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      borderRadius: '3px',
                      border: active ? 'none' : `1px solid ${c.border}`,
                      backgroundColor: active ? color + '18' : 'transparent',
                      color: active ? color : c.textHint,
                      fontSize: font.sm,
                      fontWeight: active ? 700 : 500,
                      cursor: actionLoading ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      outline: active ? `2px solid ${color}40` : 'none',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SubCategories */}
          {ticket.subCategories.length > 0 && (
            <div style={{ margin: '4px 20px 20px' }}>
              <div style={{ fontSize: font.xs, color: c.textHint, fontWeight: 600, marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                SUB CATEGORIES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {ticket.subCategories.map((sc) => (
                  <span
                    key={sc.id}
                    style={{
                      fontSize: font.sm,
                      color: c.textSub,
                      backgroundColor: c.surface,
                      borderRadius: '4px',
                      padding: '2px 7px',
                    }}
                  >
                    {sc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

            <span style={{color: c.textHint}} >
            <hr/>
                </span>
          {/* Notes thread */}
            <div style={{ margin: '14px 20px 20px' }}>
                <TicketNotes ticketId={ticket.id} />
            </div>
        </div>

          <LongPressButton
              onConfirm={handleDelete}
              disabled={actionLoading === 'delete'}
              style={deleteBtn}
          >
              Delete this ticket
          </LongPressButton>
      </div>

      {/* Backdrop for sprint dropdown */}
      {sprintChanging && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1499 }}
          onClick={() => setSprintChanging(false)}
        />
      )}
    </>
  )
}

