import {useCallback, useEffect, useMemo, useState} from 'react'
import type {
  Sprint,
  SprintInput,
  SprintStats,
  SprintUpdateInput,
  StudyTicket,
  StudyTicketInput,
  StudyTicketUpdateInput,
  TicketStatus
} from '../types/sprint'
import {PRIORITY_LABEL, STATUS_LABEL, TICKET_TYPE_LABEL} from '../types/sprint'
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
import {StatusCopyModal} from '../components/common/StatusCopyModal'
import {fetchSprintAiContext} from '../lib/api/aiContext'

function buildSprintStatusText(sprint: Sprint, stats: SprintStats | undefined, tickets: StudyTicket[]): string {
  const isCompleted = sprint.status === 'completed'
  const lines = ['【スプリントステータス】']
  lines.push(`スプリント: ${sprint.name}`)
  if (sprint.goal) lines.push(`目標: ${sprint.goal}`)
  if (sprint.startDate) lines.push(`期間: ${sprint.startDate} 〜 ${sprint.endDate ?? '?'}`)
  lines.push(`状態: ${isCompleted ? '完了済み' : '進行中'}`)
  lines.push('')
  if (stats) {
    lines.push('【KPI】')
    lines.push(`合計: ${stats.total}件  完了: ${stats.done}  進行中: ${stats.doing}  未着手: ${stats.todo}`)
    lines.push(`完了率: ${Math.round(stats.completionRate * 100)}%`)
    if (stats.avgCompleteDays !== null) lines.push(`平均完了日数: ${stats.avgCompleteDays}日`)
    lines.push('')
  }
  const groups: Array<[TicketStatus, string]> = [['doing', 'DOING'], ['todo', 'TODO'], ['done', 'DONE']]
  for (const [status, label] of groups) {
    const group = tickets.filter((t) => t.status === status)
    if (group.length === 0) continue
    lines.push(`[${label}]`)
    group.forEach((t) => {
      lines.push(`・${PRIORITY_LABEL[t.priority]} ${t.title}  (${TICKET_TYPE_LABEL[t.ticketType]} / ${STATUS_LABEL[t.status]} / 期限:${t.dueDate})`)
      if (t.acceptanceCriteria) lines.push(`  → ${t.acceptanceCriteria}`)
    })
    lines.push('')
  }
  return lines.join('\n')
}

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
  const [statsCopied, setStatsCopied] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyText, setCopyText] = useState('')
  const [aiContextLoading, setAiContextLoading] = useState(false)
  const [aiCopied, setAiCopied] = useState(false)
  const [copyModalMode, setCopyModalMode] = useState<'status' | 'ai'>('status')

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

  const handlePrepareStats = () => {
    if (!currentSprint) return
    setCopyText(buildSprintStatusText(currentSprint, currentStats, currentTickets))
    setCopyModalMode('status')
    setIsCopyModalOpen(true)
  }

  const handleAiContextCopy = async () => {
    setAiContextLoading(true)
    try {
      const text = await fetchSprintAiContext()
      setCopyText(text)
      setCopyModalMode('ai')
      setIsCopyModalOpen(true)
    } catch (e) {
      console.error(e)
    } finally {
      setAiContextLoading(false)
    }
  }

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      if (copyModalMode === 'ai') setAiCopied(true)
      else setStatsCopied(true)
      setTimeout(() => {
        setAiCopied(false)
        setStatsCopied(false)
        setIsCopyModalOpen(false)
      }, 800)
    } catch (e) {
      console.error(e)
    }
  }

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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={handleAiContextCopy}
                  disabled={aiContextLoading}
                  title="AIプランニング用コンテキストをコピー"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    height: 32,
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: `1px solid ${c.border}`,
                    background: 'transparent',
                    color: c.textHint,
                    cursor: aiContextLoading ? 'wait' : 'pointer',
                    fontSize: font.xs,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    opacity: aiContextLoading ? 0.6 : 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  {aiContextLoading ? '取得中…' : 'AI向けコピー'}
                </button>
                <button
                  onClick={handlePrepareStats}
                  disabled={!currentSprint}
                  title="ステータスをコピー"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32,
                    borderRadius: '6px',
                    border: `1px solid ${c.border}`,
                    background: 'transparent',
                    color: statsCopied ? '#27ae60' : c.textHint,
                    cursor: 'pointer',
                  }}
                >
                  {statsCopied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="4" rx="1" />
                      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                    </svg>
                  )}
                </button>
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

          {/* ステータスコピーボタン (モバイル固定) */}
          <button
            onClick={handlePrepareStats}
            disabled={!currentSprint}
            title="ステータスをコピー"
            style={{
              position: 'fixed',
              bottom: `calc(68px + env(safe-area-inset-bottom))`,
              left: '20px',
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `1px solid ${c.border}`,
              backgroundColor: '#fff',
              color: statsCopied ? '#27ae60' : c.textHint,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {statsCopied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              </svg>
            )}
          </button>

          {/* AI向けコピーボタン (モバイル固定) */}
          <button
            onClick={handleAiContextCopy}
            disabled={aiContextLoading}
            title="AIプランニング用コンテキストをコピー"
            style={{
              position: 'fixed',
              bottom: `calc(68px + env(safe-area-inset-bottom))`,
              left: '68px',
              height: 40,
              padding: '0 12px',
              borderRadius: '20px',
              border: `1px solid ${c.border}`,
              backgroundColor: '#fff',
              color: c.textHint,
              cursor: aiContextLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 200,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              opacity: aiContextLoading ? 0.6 : 1,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            {aiContextLoading ? '取得中…' : 'AI向け'}
          </button>

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

      {isCopyModalOpen && (
        <StatusCopyModal
          text={copyText}
          copied={copyModalMode === 'ai' ? aiCopied : statsCopied}
          onCopy={handleFinalCopy}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}
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
