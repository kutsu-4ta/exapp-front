import {useCallback, useEffect, useMemo, useState} from 'react'
import type {
    Sprint,
    SprintInput,
    SprintUpdateInput,
    StudyTicket,
    StudyTicketInput,
    StudyTicketUpdateInput,
    TicketStatus
} from '../types/sprint'
import {useSprintStore} from '../lib/store/sprintStore'
import {SprintBar} from '../components/sprint/SprintBar'
import {SprintKpi} from '../components/sprint/SprintKpi'
import {SprintFormModal} from '../components/sprint/SprintFormModal'
import {SprintRetroModal} from '../components/sprint/SprintRetroModal'
import {TicketList} from '../components/sprint/TicketList'
import {KanbanBoard} from '../components/sprint/KanbanBoard'
import {TicketDrawer} from '../components/sprint/TicketDrawer'
import {TicketFormModal} from '../components/sprint/TicketFormModal'
import {c, font} from '../styles/notion'
import {MarkdownContent} from '../components/common/MarkdownContent'

function useIsWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const h = (e: MediaQueryListEvent) => setWide(e.matches)
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  }, [])
  return wide
}

type SprintFormState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; sprint: Sprint }

type TicketFormState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; ticket: StudyTicket }

type RetroFormState = { open: false } | { open: true; sprint: Sprint }

export default function SprintPage() {
  const isWide = useIsWide()

  const {
    sprints,
    currentSprintId,
    ticketsBySprintId,
    statsCache,
    sprintsLoaded,
    loadSprints,
    setCurrentSprint,
    loadTickets,
    loadStats,
    addSprint,
    editSprint,
    removeSprint,
    finishSprint,
    addTicket,
    editTicket,
    removeTicket,
    moveTicketStatus,
    assignTicketToSprint,
  } = useSprintStore()

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [sprintForm, setSprintForm] = useState<SprintFormState>({ open: false })
  const [retroForm, setRetroForm] = useState<RetroFormState>({ open: false })
  const [ticketForm, setTicketForm] = useState<TicketFormState>({ open: false })
  const [selectedTicket, setSelectedTicket] = useState<StudyTicket | null>(null)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initial load
  useEffect(() => {
    loadSprints().catch(() => setError('スプリントの読み込みに失敗しました'))
  }, [])

  // Load tickets + stats when sprint changes
  useEffect(() => {
    if (!currentSprintId) return

    if (!ticketsBySprintId[currentSprintId]) {
      setTicketsLoading(true)
      loadTickets(currentSprintId)
        .catch(() => setError('チケットの読み込みに失敗しました'))
        .finally(() => setTicketsLoading(false))
    }

    if (!statsCache[currentSprintId]) {
      setStatsLoading(true)
      loadStats(currentSprintId)
        .catch(() => {})
        .finally(() => setStatsLoading(false))
    }
  }, [currentSprintId])

  const currentTickets = useMemo(
    () => (currentSprintId ? ticketsBySprintId[currentSprintId] ?? [] : []),
    [ticketsBySprintId, currentSprintId]
  )
  const currentStats = currentSprintId ? statsCache[currentSprintId] : undefined

  // Sprint actions
  const handleSprintSave = async (input: SprintInput) => {
    const sprint = await addSprint(input)
    setCurrentSprint(sprint.id)
  }

  const handleSprintEdit = async (input: SprintUpdateInput) => {
    if (sprintForm.open && sprintForm.mode === 'edit') {
      await editSprint(sprintForm.sprint.id, input)
    }
  }

  const handleSprintDelete = async (sprint: Sprint) => {
    if (!window.confirm(`「${sprint.name}」を削除しますか？チケットは失われます。`)) return
    await removeSprint(sprint.id).catch(() => setError('削除に失敗しました'))
  }

  const handleSprintComplete = (sprint: Sprint) => {
    setRetroForm({ open: true, sprint })
  }

  const handleRetroSave = async (retrospective: string) => {
    if (!retroForm.open) return
    await finishSprint(retroForm.sprint.id, retrospective)
    setRetroForm({ open: false })
  }

  // Ticket actions
  const handleTicketCreate = async (input: StudyTicketInput) => {
    await addTicket(input)
  }

  const handleTicketEdit = async (input: StudyTicketUpdateInput) => {
    if (ticketForm.open && ticketForm.mode === 'edit') {
      await editTicket(ticketForm.ticket.id, input)
    }
  }

  const handleTicketStatusChange = useCallback(
    async (ticket: StudyTicket, status: TicketStatus) => {
      await moveTicketStatus(ticket.id, status)
      setSelectedTicket((prev) => (prev?.id === ticket.id ? { ...prev, status } : prev))
    },
    [moveTicketStatus]
  )

  const handleTicketSprintChange = useCallback(
    async (ticketId: number, sprintId: number) => {
      await assignTicketToSprint(ticketId, sprintId)
      setSelectedTicket((prev) =>
        prev?.id === ticketId ? { ...prev, sprintId } : prev
      )
    },
    [assignTicketToSprint]
  )

  const handleTicketDelete = useCallback(
    async (ticket: StudyTicket) => {
      await removeTicket(ticket.id)
      setSelectedTicket(null)
    },
    [removeTicket]
  )

  const openTicketEdit = (ticket: StudyTicket) => {
    setSelectedTicket(null)
    setTicketForm({ open: true, mode: 'edit', ticket })
  }

  const currentSprint = sprints.find((s) => s.id === currentSprintId) ?? null
  const isCompleted = currentSprint?.status === 'completed'

  if (!sprintsLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: font.base, color: c.textHint }}>読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <p style={{ color: c.red, marginBottom: 12 }}>{error}</p>
        <button
          onClick={() => { setError(null); loadSprints() }}
          style={{
            padding: '8px 16px',
            backgroundColor: c.blue,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          再読み込み
        </button>
      </div>
    )
  }

  return (
    <>
      {isWide ? (
        /* ── iPad layout ─────────────────────────────────── */
        <div
          style={{
            display: 'flex',
            height: 'calc(100dvh - 38px - 56px)',
            overflow: 'hidden',
          }}
        >
          {/* Left sidebar — sprint list */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              borderRight: `1px solid ${c.border}`,
              overflowY: 'auto',
              backgroundColor: 'rgba(55,53,47,0.01)',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderBottom: `1px solid ${c.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: font.sm, fontWeight: 700, color: c.textHint, letterSpacing: '0.06em' }}>
                SPRINTS
              </span>
              <button
                onClick={() => setSprintForm({ open: true, mode: 'create' })}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(35,131,226,0.1)',
                  color: c.blue,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                +
              </button>
            </div>

            {sprints.map((sp) => {
              const selected = sp.id === currentSprintId
              const isBacklog = sp.type === 'backlog'
              const isDone = sp.status === 'completed'
              return (
                <div
                  key={sp.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderLeft: selected ? `3px solid ${c.blue}` : '3px solid transparent',
                    backgroundColor: selected ? c.blueBg : 'transparent',
                    borderBottom: `1px solid ${c.border}`,
                    opacity: isDone ? 0.65 : 1,
                  }}
                  onClick={() => setCurrentSprint(sp.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: font.base,
                        fontWeight: selected ? 700 : 500,
                        color: selected ? c.blue : c.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isBacklog && '☰ '}
                      {sp.name}
                      {isDone && ' ✓'}
                    </div>
                    {!isBacklog && sp.startDate && (
                      <div style={{ fontSize: font.xs, color: c.textHint, marginTop: 2 }}>
                        {sp.startDate} 〜 {sp.endDate ?? '?'}
                      </div>
                    )}
                  </div>
                  {!isBacklog && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSprintForm({ open: true, mode: 'edit', sprint: sp })
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: c.textHint,
                        fontSize: '14px',
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                    >
                      ···
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right — KPI + Kanban */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sprint name header */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: font.md, fontWeight: 700, color: c.text }}>
                  {currentSprint?.name ?? '—'}
                </h2>
                {currentSprint && !isCompleted && currentSprint.type !== 'backlog' && currentSprint.endDate && (
                  <div style={{ fontSize: font.xs, color: c.textHint, marginTop: 2 }}>
                    {currentSprint.startDate} 〜 {currentSprint.endDate}
                  </div>
                )}
                {isCompleted && (
                  <span
                    style={{
                      fontSize: font.xs,
                      color: '#27ae60',
                      fontWeight: 600,
                    }}
                  >
                    完了済み
                  </span>
                )}
                {currentSprint?.goal && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: font.xs,
                      color: c.textSub,
                      lineHeight: 1.5,
                      maxWidth: 360,
                    }}
                  >
                    {currentSprint.goal}
                  </div>
                )}
              </div>
              {!isCompleted && (
                <button
                  onClick={() => setTicketForm({ open: true, mode: 'create' })}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: c.blue,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: font.sm,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + チケット
                </button>
              )}
            </div>

            {/* KPI */}
            <SprintKpi stats={currentStats} loading={statsLoading} />

            {/* Retrospective (completed sprints) */}
            {isCompleted && currentSprint?.retrospective && (
              <RetroSection retrospective={currentSprint.retrospective} />
            )}

            {/* Kanban */}
            <div style={{ flex: 1, overflow: isCompleted ? 'auto' : 'hidden' }}>
              <KanbanBoard
                tickets={currentTickets}
                onTicketTap={setSelectedTicket}
                onStatusChange={moveTicketStatus}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── Mobile layout ───────────────────────────────── */
        <div style={{ minHeight: '100vh', backgroundColor: c.bg }}>
          <SprintBar
            sprints={sprints}
            currentId={currentSprintId}
            onSelect={setCurrentSprint}
            onNew={() => setSprintForm({ open: true, mode: 'create' })}
            onEdit={(sp) => setSprintForm({ open: true, mode: 'edit', sprint: sp })}
            onDelete={handleSprintDelete}
            onComplete={handleSprintComplete}
          />

          <SprintKpi stats={currentStats} loading={statsLoading} />

          {currentSprint && (
            <div style={{ padding: '4px 16px 8px' }}>
              <div style={{ fontSize: font.xs, color: c.textHint }}>
                {currentSprint.type === 'backlog'
                  ? 'バックログ'
                  : currentSprint.startDate
                    ? `${currentSprint.startDate} 〜 ${currentSprint.endDate ?? '?'}`
                    : ''}
                {isCompleted && (
                  <span style={{ marginLeft: 6, color: '#27ae60', fontWeight: 600 }}>完了済み</span>
                )}
              </div>
              {currentSprint.goal && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: font.sm,
                    color: c.textSub,
                    lineHeight: 1.5,
                  }}
                >
                  {currentSprint.goal}
                </div>
              )}
            </div>
          )}

          {isCompleted && currentSprint?.retrospective && (
            <RetroSection retrospective={currentSprint.retrospective} />
          )}

          <TicketList
            tickets={currentTickets}
            filter={statusFilter}
            onFilterChange={setStatusFilter}
            onTicketTap={setSelectedTicket}
            onStatusChange={handleTicketStatusChange}
            loading={ticketsLoading}
          />

          {/* Bottom spacer */}
          <div style={{ height: 80 }} />

          {/* FAB */}
          {!isCompleted && (
            <button
              onClick={() => setTicketForm({ open: true, mode: 'create' })}
              style={{
                position: 'fixed',
                bottom: 'calc(68px + env(safe-area-inset-bottom))',
                right: '20px',
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: c.blue,
                color: '#fff',
                fontSize: '24px',
                fontWeight: 300,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(35,131,226,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                lineHeight: 1,
              }}
              aria-label="チケット作成"
            >
              +
            </button>
          )}
        </div>
      )}

      {/* ── Modals & Drawers ── */}

      {retroForm.open && (
        <SprintRetroModal
          sprint={retroForm.sprint}
          onSave={handleRetroSave}
          onClose={() => setRetroForm({ open: false })}
        />
      )}

      {sprintForm.open && sprintForm.mode === 'create' && (
        <SprintFormModal
          mode="create"
          onSave={handleSprintSave}
          onClose={() => setSprintForm({ open: false })}
        />
      )}

      {sprintForm.open && sprintForm.mode === 'edit' && (
        <SprintFormModal
          mode="edit"
          sprint={sprintForm.sprint}
          onSave={handleSprintEdit}
          onClose={() => setSprintForm({ open: false })}
        />
      )}

      {ticketForm.open && ticketForm.mode === 'create' && (
        <TicketFormModal
          mode="create"
          sprints={sprints}
          defaultSprintId={currentSprintId}
          onSave={handleTicketCreate}
          onClose={() => setTicketForm({ open: false })}
        />
      )}

      {ticketForm.open && ticketForm.mode === 'edit' && (
        <TicketFormModal
          mode="edit"
          ticket={ticketForm.ticket}
          sprints={sprints}
          onSave={handleTicketEdit}
          onClose={() => setTicketForm({ open: false })}
        />
      )}

      <TicketDrawer
        ticket={selectedTicket}
        sprints={sprints}
        onClose={() => setSelectedTicket(null)}
        onEdit={openTicketEdit}
        onStatusChange={handleTicketStatusChange}
        onSprintChange={handleTicketSprintChange}
        onDelete={handleTicketDelete}
      />
    </>
  )
}

function RetroSection({ retrospective }: { retrospective: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        margin: '0 16px 12px',
        borderRadius: 8,
        border: `1px solid rgba(39,174,96,0.2)`,
        backgroundColor: 'rgba(39,174,96,0.03)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '12px', color: '#27ae60' }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: font.sm, fontWeight: 700, color: '#27ae60', letterSpacing: '0.04em' }}>
          振り返り
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <MarkdownContent>{retrospective}</MarkdownContent>
        </div>
      )}
    </div>
  )
}
