import { apiFetch } from '../client'
import type { Flashcard, SubjectSettings, SubjectMonthlyGoal, SubjectActivityDay } from '../../types/workspace'

export async function fetchSubjects(): Promise<string[]> {
  const res = await apiFetch('/api/subjects')
  if (!res.ok) throw new Error('科目の取得に失敗しました')
  return res.json()
}

export async function renameSubject(name: string, newName: string): Promise<void> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ newName }),
  })
  if (!res.ok) throw new Error('科目名の変更に失敗しました')
}

export async function deleteSubject(name: string): Promise<void> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('科目の削除に失敗しました')
}

export async function fetchSubjectSettings(name: string): Promise<SubjectSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/settings`)
  if (!res.ok) throw new Error('科目設定の取得に失敗しました')
  return res.json()
}

export async function saveSubjectSettings(name: string, settings: SubjectSettings): Promise<SubjectSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error('科目設定の保存に失敗しました')
  return res.json()
}

export async function fetchSubjectMonthlyGoal(name: string, year: number, month: number): Promise<SubjectMonthlyGoal> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/monthly-goal/${year}/${month}`)
  if (!res.ok) throw new Error('月別方針の取得に失敗しました')
  return res.json()
}

export async function saveSubjectMonthlyGoal(name: string, year: number, month: number, goal: string | null): Promise<SubjectMonthlyGoal> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/monthly-goal/${year}/${month}`, {
    method: 'PUT',
    body: JSON.stringify({ goal }),
  })
  if (!res.ok) throw new Error('月別方針の保存に失敗しました')
  return res.json()
}

export async function fetchSubjectActivity(name: string, year: number, month: number): Promise<SubjectActivityDay[]> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/activity?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('アクティビティの取得に失敗しました')
  return res.json()
}

export async function fetchFlashcards(subject?: string, count?: number): Promise<Flashcard[]> {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (count !== undefined) params.set('count', String(count))
  const qs = params.toString()
  const res = await apiFetch(`/api/flashcards${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('フラッシュカードの取得に失敗しました')
  return res.json()
}
