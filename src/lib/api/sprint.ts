import {apiFetch} from '../client'
import type {
  Sprint,
  SprintInput,
  SprintStats,
  SprintUpdateInput,
  StudyTicket,
  StudyTicketInput,
  StudyTicketUpdateInput,
  TicketNote,
  TicketNoteInput,
  TicketStatus,
} from '../../types/sprint'

export async function fetchSprints(): Promise<Sprint[]> {
  const res = await apiFetch('/api/sprints')
  if (!res.ok) throw new Error('スプリント一覧の取得に失敗しました')
  return res.json()
}

export async function createSprint(input: SprintInput): Promise<Sprint> {
  const res = await apiFetch('/api/sprints', { method: 'POST', body: JSON.stringify(input) })
  if (!res.ok) throw new Error('スプリントの作成に失敗しました')
  return res.json()
}

export async function updateSprint(id: number, input: SprintUpdateInput): Promise<Sprint> {
  const res = await apiFetch(`/api/sprints/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  if (!res.ok) throw new Error('スプリントの更新に失敗しました')
  return res.json()
}

export async function deleteSprint(id: number): Promise<void> {
  const res = await apiFetch(`/api/sprints/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('スプリントの削除に失敗しました')
}

export async function completeSprint(id: number, retrospective: string): Promise<Sprint> {
  const res = await apiFetch(`/api/sprints/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ retrospective }),
  })
  if (!res.ok) throw new Error('スプリントの完了に失敗しました')
  return res.json()
}

export async function fetchSprintStats(id: number): Promise<SprintStats> {
  const res = await apiFetch(`/api/sprints/${id}/stats`)
  if (!res.ok) throw new Error('スプリント統計の取得に失敗しました')
  return res.json()
}

export async function fetchTickets(sprintId?: number, status?: TicketStatus): Promise<StudyTicket[]> {
  const params = new URLSearchParams()
  if (sprintId !== undefined) params.set('sprintId', String(sprintId))
  if (status) params.set('status', status)
  const query = params.toString()
  const res = await apiFetch(`/api/tickets${query ? `?${query}` : ''}`)
  if (!res.ok) throw new Error('チケット一覧の取得に失敗しました')
  return res.json()
}

export async function createTicket(input: StudyTicketInput): Promise<StudyTicket> {
  const res = await apiFetch('/api/tickets', { method: 'POST', body: JSON.stringify(input) })
  if (!res.ok) throw new Error('チケットの作成に失敗しました')
  return res.json()
}

export async function updateTicket(id: number, input: StudyTicketUpdateInput): Promise<StudyTicket> {
  const res = await apiFetch(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  if (!res.ok) throw new Error('チケットの更新に失敗しました')
  return res.json()
}

export async function deleteTicket(id: number): Promise<void> {
  const res = await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('チケットの削除に失敗しました')
}

export async function completeTicketApi(id: number): Promise<StudyTicket> {
  const res = await apiFetch(`/api/tickets/${id}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error('チケットの完了に失敗しました')
  return res.json()
}

export async function reopenTicketApi(id: number): Promise<StudyTicket> {
  const res = await apiFetch(`/api/tickets/${id}/reopen`, { method: 'POST' })
  if (!res.ok) throw new Error('チケットの再オープンに失敗しました')
  return res.json()
}

export async function patchTicketSprint(id: number, sprintId: number): Promise<StudyTicket> {
  const res = await apiFetch(`/api/tickets/${id}/sprint`, {
    method: 'PATCH',
    body: JSON.stringify({ sprintId }),
  })
  if (!res.ok) throw new Error('スプリントの移動に失敗しました')
  return res.json()
}

export async function fetchTicketNotes(ticketId: number): Promise<TicketNote[]> {
  const res = await apiFetch(`/api/tickets/${ticketId}/notes`)
  if (!res.ok) throw new Error('ノートの取得に失敗しました')
  return res.json()
}

export async function createTicketNote(ticketId: number, input: TicketNoteInput): Promise<TicketNote> {
  const res = await apiFetch(`/api/tickets/${ticketId}/notes`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('ノートの追加に失敗しました')
  return res.json()
}

export async function updateTicketNote(
  ticketId: number,
  noteId: number,
  input: TicketNoteInput
): Promise<TicketNote> {
  const res = await apiFetch(`/api/tickets/${ticketId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('ノートの更新に失敗しました')
  return res.json()
}

export async function deleteTicketNote(ticketId: number, noteId: number): Promise<void> {
  const res = await apiFetch(`/api/tickets/${ticketId}/notes/${noteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('ノートの削除に失敗しました')
}
