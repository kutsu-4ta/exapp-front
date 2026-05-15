import {apiFetch} from '../client'
import type {ExamQuestionInput, ExamSession, ExamSessionSummary, ExamSubjectStats,} from '../../types/exam'

export async function fetchExamSessions(status?: string): Promise<ExamSessionSummary[]> {
  const query = status ? `?status=${status}` : ''
  const res = await apiFetch(`/api/exam-sessions${query}`)
  if (!res.ok) throw new Error('Failed to fetch exam sessions')
  return res.json()
}

export async function fetchExamSession(id: number): Promise<ExamSession> {
  const res = await apiFetch(`/api/exam-sessions/${id}`)
  if (!res.ok) throw new Error('Failed to fetch exam session')
  return res.json()
}

export async function createExamSession(input: {
  subject: string
  examYear: string
}): Promise<ExamSession> {
  const res = await apiFetch('/api/exam-sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create exam session')
  return res.json()
}

export async function updateExamSession(
  id: number,
  patch: { subject?: string; examYear?: string; status?: string }
): Promise<ExamSession> {
  const res = await apiFetch(`/api/exam-sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update exam session')
  return res.json()
}

export async function deleteExamSession(id: number): Promise<void> {
  const res = await apiFetch(`/api/exam-sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete exam session')
}

export async function completeExamSession(
  id: number,
  body: { subject: string; examYear: string; questions: ExamQuestionInput[] }
): Promise<ExamSession> {
  const res = await apiFetch(`/api/exam-sessions/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to complete exam session')
  return res.json()
}

export async function quickScoreExamSession(input: {
  subject: string
  examYear: string
  totalScore: number
  pureScore?: number
}): Promise<ExamSessionSummary> {
  const res = await apiFetch('/api/exam-sessions/quick-score', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('スコアの記録に失敗しました')
  return res.json()
}

export async function fetchSubjectStats(
  subject: string,
  year?: number,
  month?: number
): Promise<ExamSubjectStats> {
  const params = new URLSearchParams()
  if (year !== undefined) params.set('year', String(year))
  if (month !== undefined) params.set('month', String(month))
  const qs = params.toString()
  const res = await apiFetch(
    `/api/exam-subjects/${encodeURIComponent(subject)}/stats${qs ? `?${qs}` : ''}`
  )
  if (!res.ok) throw new Error('Failed to fetch subject stats')
  return res.json()
}
