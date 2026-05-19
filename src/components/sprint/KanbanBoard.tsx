import type {DragEndEvent, DragStartEvent} from '@dnd-kit/core'
import {DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core'
import {CSS} from '@dnd-kit/utilities'
import {useState} from 'react'
import type {StudyTicket, TicketStatus} from '../../types/sprint'
import {TicketCard} from './TicketCard'
import {c, font} from '../../styles/notion'

type Props = {
  tickets: StudyTicket[]
  onTicketTap: (ticket: StudyTicket) => void
  onStatusChange: (ticketId: number, newStatus: TicketStatus) => void
}

const COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'TODO', color: c.textHint },
  { status: 'doing', label: 'DOING', color: '#2383e2' },
  { status: 'done', label: 'DONE', color: '#27ae60' },
]

function DraggableCard({
  ticket,
  onTap,
}: {
  ticket: StudyTicket
  onTap: (t: StudyTicket) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(ticket.id),
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} onClick={!isDragging ? onTap : undefined} compact />
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  color,
  tickets,
  onTicketTap,
}: {
  status: TicketStatus
  label: string
  color: string
  tickets: StudyTicket[]
  onTicketTap: (t: StudyTicket) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
        border: isOver ? `2px solid ${color}40` : `1px solid ${c.border}`,
        backgroundColor: isOver
          ? status === 'done'
            ? 'rgba(39,174,96,0.04)'
            : status === 'doing'
              ? 'rgba(35,131,226,0.04)'
              : 'rgba(55,53,47,0.02)'
          : 'rgba(55,53,47,0.015)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor:
            status === 'done' ? 'rgba(39,174,96,0.05)' : 'rgba(55,53,47,0.015)',
        }}
      >
        <span
          style={{
            fontSize: font.sm,
            fontWeight: 700,
            color,
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: font.xs,
            fontWeight: 700,
            color: '#fff',
            backgroundColor: color,
            borderRadius: '10px',
            padding: '1px 6px',
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1,
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          minHeight: 120,
        }}
      >
        {tickets.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 8px',
              fontSize: font.xs,
              color: 'rgba(55,53,47,0.2)',
            }}
          >
            ドロップ
          </div>
        ) : (
          tickets.map((t) => (
            <DraggableCard key={t.id} ticket={t} onTap={onTicketTap} />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ tickets, onTicketTap, onStatusChange }: Props) {
  const [activeTicket, setActiveTicket] = useState<StudyTicket | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const ticketId = Number(event.active.id)
    setActiveTicket(tickets.find((t) => t.id === ticketId) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null)
    const { active, over } = event
    if (!over) return
    const ticketId = Number(active.id)
    const newStatus = over.id as TicketStatus
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket && ticket.status !== newStatus) {
      onStatusChange(ticketId, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          height: '100%',
          padding: '0 16px 16px',
        }}
      >
        {COLUMNS.map(({ status, label, color }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            color={color}
            tickets={tickets.filter((t) => t.status === status)}
            onTicketTap={onTicketTap}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <div style={{ cursor: 'grabbing', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: 8 }}>
            <TicketCard ticket={activeTicket} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
