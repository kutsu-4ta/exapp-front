import {create} from 'zustand'
import type {
  Sprint,
  SprintInput,
  SprintStats,
  SprintUpdateInput,
  StudyTicket,
  StudyTicketInput,
  StudyTicketUpdateInput,
  TicketStatus,
} from '../../types/sprint'
import {
  completeSprint,
  completeTicketApi,
  createSprint,
  createTicket,
  deleteSprint,
  deleteTicket,
  fetchSprints,
  fetchSprintStats,
  fetchTickets,
  patchTicketSprint,
  reopenTicketApi,
  updateSprint,
  updateTicket,
} from '../api/sprint'


function patchTickets(
  cache: Record<number, StudyTicket[]>,
  ticketId: number,
  patch: Partial<StudyTicket>
): Record<number, StudyTicket[]> {
  const next: Record<number, StudyTicket[]> = {}
  for (const key in cache) {
    next[key] = cache[key].map((t) => (t.id === ticketId ? { ...t, ...patch } : t))
  }
  return next
}

interface SprintState {
  sprints: Sprint[]
  currentSprintId: number | null
  ticketsBySprintId: Record<number, StudyTicket[]>
  statsCache: Record<number, SprintStats>
  sprintsLoaded: boolean

  loadSprints: () => Promise<void>
  reloadSprints: () => Promise<void>
  setCurrentSprint: (id: number) => void
  loadTickets: (sprintId: number) => Promise<void>
  loadStats: (sprintId: number) => Promise<void>
  invalidateStats: (sprintId: number) => void

  addSprint: (input: SprintInput) => Promise<Sprint>
  editSprint: (id: number, input: SprintUpdateInput) => Promise<void>
  removeSprint: (id: number) => Promise<void>
  finishSprint: (id: number, retrospective: string) => Promise<void>

  addTicket: (input: StudyTicketInput) => Promise<void>
  editTicket: (id: number, input: StudyTicketUpdateInput) => Promise<void>
  removeTicket: (id: number) => Promise<void>
  finishTicket: (id: number) => Promise<void>
  reactivateTicket: (id: number) => Promise<void>
  moveTicketStatus: (ticketId: number, newStatus: TicketStatus) => Promise<void>
  assignTicketToSprint: (ticketId: number, newSprintId: number) => Promise<void>
}

export const useSprintStore = create<SprintState>()((set, get) => ({
  sprints: [],
  currentSprintId: null,
  ticketsBySprintId: {},
  statsCache: {},
  sprintsLoaded: false,

  loadSprints: async () => {
    if (get().sprintsLoaded) return
    await get().reloadSprints()
  },

  reloadSprints: async () => {
    const sprints = await fetchSprints()
    const prev = get().currentSprintId
    const hasActive = sprints.some((s) => s.id === prev)
    const defaultId =
      sprints.find((s) => s.type === 'active' && s.status === 'active')?.id ??
      sprints[0]?.id ??
      null
    set({
      sprints,
      sprintsLoaded: true,
      currentSprintId: hasActive ? prev : defaultId,
    })
  },

  setCurrentSprint: (id) => set({ currentSprintId: id }),

  loadTickets: async (sprintId) => {
    const tickets = await fetchTickets(sprintId)
    set((s) => ({ ticketsBySprintId: { ...s.ticketsBySprintId, [sprintId]: tickets } }))
  },

  loadStats: async (sprintId) => {
    if (get().statsCache[sprintId]) return
    const stats = await fetchSprintStats(sprintId)
    set((s) => ({ statsCache: { ...s.statsCache, [sprintId]: stats } }))
  },

  invalidateStats: (sprintId) => {
    set((s) => {
      const next = { ...s.statsCache }
      delete next[sprintId]
      return { statsCache: next }
    })
  },

  addSprint: async (input) => {
    const sprint = await createSprint(input)
    set((s) => ({ sprints: [...s.sprints, sprint], sprintsLoaded: false }))
    await get().reloadSprints()
    return sprint
  },

  editSprint: async (id, input) => {
    const updated = await updateSprint(id, input)
    set((s) => ({ sprints: s.sprints.map((sp) => (sp.id === id ? updated : sp)) }))
  },

  removeSprint: async (id) => {
    await deleteSprint(id)
    set((s) => {
      const sprints = s.sprints.filter((sp) => sp.id !== id)
      const wasSelected = s.currentSprintId === id
      const defaultId =
        sprints.find((sp) => sp.type === 'active' && sp.status === 'active')?.id ??
        sprints[0]?.id ??
        null
      const tickets = { ...s.ticketsBySprintId }
      delete tickets[id]
      const stats = { ...s.statsCache }
      delete stats[id]
      return {
        sprints,
        currentSprintId: wasSelected ? defaultId : s.currentSprintId,
        ticketsBySprintId: tickets,
        statsCache: stats,
      }
    })
  },

  finishSprint: async (id, retrospective) => {
    const updated = await completeSprint(id, retrospective)
    set((s) => ({ sprints: s.sprints.map((sp) => (sp.id === id ? updated : sp)) }))
  },

  addTicket: async (input) => {
    const ticket = await createTicket(input)
    const sprintId = ticket.sprintId
    set((s) => ({
      ticketsBySprintId: {
        ...s.ticketsBySprintId,
        [sprintId]: [...(s.ticketsBySprintId[sprintId] ?? []), ticket],
      },
    }))
    fetchSprintStats(sprintId)
      .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [sprintId]: stats } })))
      .catch(() => {})
  },

  editTicket: async (id, input) => {
    const updated = await updateTicket(id, input)
    set((s) => ({ ticketsBySprintId: patchTickets(s.ticketsBySprintId, id, updated) }))
    fetchSprintStats(updated.sprintId)
      .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [updated.sprintId]: stats } })))
      .catch(() => {})
  },

  removeTicket: async (id) => {
    const cache = get().ticketsBySprintId
    let sprintId: number | null = null
    for (const key in cache) {
      if (cache[key].some((t) => t.id === id)) {
        sprintId = Number(key)
        break
      }
    }

    await deleteTicket(id)
    set((s) => {
      const next: Record<number, StudyTicket[]> = {}
      for (const key in s.ticketsBySprintId) {
        next[key] = s.ticketsBySprintId[key].filter((t) => t.id !== id)
      }
      return { ticketsBySprintId: next }
    })
    if (sprintId) {
      const sid = sprintId
      fetchSprintStats(sid)
        .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [sid]: stats } })))
        .catch(() => {})
    }
  },

  finishTicket: async (id) => {
    const prev = get().ticketsBySprintId
    set((s) => ({
      ticketsBySprintId: patchTickets(s.ticketsBySprintId, id, { status: 'done' }),
    }))
    try {
      const updated = await completeTicketApi(id)
      set((s) => ({ ticketsBySprintId: patchTickets(s.ticketsBySprintId, id, updated) }))
      fetchSprintStats(updated.sprintId)
        .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [updated.sprintId]: stats } })))
        .catch(() => {})
    } catch {
      set({ ticketsBySprintId: prev })
      throw new Error('完了処理に失敗しました')
    }
  },

  reactivateTicket: async (id) => {
    const prev = get().ticketsBySprintId
    set((s) => ({
      ticketsBySprintId: patchTickets(s.ticketsBySprintId, id, { status: 'todo' }),
    }))
    try {
      const updated = await reopenTicketApi(id)
      set((s) => ({ ticketsBySprintId: patchTickets(s.ticketsBySprintId, id, updated) }))
      fetchSprintStats(updated.sprintId)
        .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [updated.sprintId]: stats } })))
        .catch(() => {})
    } catch {
      set({ ticketsBySprintId: prev })
      throw new Error('再オープンに失敗しました')
    }
  },

  moveTicketStatus: async (ticketId, newStatus) => {
    const prev = get().ticketsBySprintId
    set((s) => ({
      ticketsBySprintId: patchTickets(s.ticketsBySprintId, ticketId, { status: newStatus }),
    }))
    try {
      const updated = await updateTicket(ticketId, { status: newStatus })
      set((s) => ({ ticketsBySprintId: patchTickets(s.ticketsBySprintId, ticketId, updated) }))
      fetchSprintStats(updated.sprintId)
        .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [updated.sprintId]: stats } })))
        .catch(() => {})
    } catch {
      set({ ticketsBySprintId: prev })
    }
  },

  assignTicketToSprint: async (ticketId, newSprintId) => {
    const prev = get().ticketsBySprintId
    // Optimistically move ticket between sprint buckets
    let movedTicket: StudyTicket | null = null
    let oldSprintId: number | null = null
    const optimistic: Record<number, StudyTicket[]> = {}
    for (const key in prev) {
      const found = prev[key].find((t) => t.id === ticketId)
      if (found) {
        movedTicket = { ...found, sprintId: newSprintId }
        oldSprintId = Number(key)
        optimistic[key] = prev[key].filter((t) => t.id !== ticketId)
      } else {
        optimistic[key] = prev[key]
      }
    }
    if (movedTicket) {
      optimistic[newSprintId] = [...(optimistic[newSprintId] ?? []), movedTicket]
    }
    set({ ticketsBySprintId: optimistic })

    try {
      const updated = await patchTicketSprint(ticketId, newSprintId)
      set((s) => {
        const next: Record<number, StudyTicket[]> = {}
        for (const key in s.ticketsBySprintId) {
          next[key] = s.ticketsBySprintId[key].filter((t) => t.id !== ticketId)
        }
        next[updated.sprintId] = [...(next[updated.sprintId] ?? []), updated]
        return { ticketsBySprintId: next }
      })
      const refreshIds = [...new Set([oldSprintId, updated.sprintId].filter(Boolean))] as number[]
      for (const sid of refreshIds) {
        fetchSprintStats(sid)
          .then((stats) => set((s) => ({ statsCache: { ...s.statsCache, [sid]: stats } })))
          .catch(() => {})
      }
    } catch {
      set({ ticketsBySprintId: prev })
    }
  },
}))
