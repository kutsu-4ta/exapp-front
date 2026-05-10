import { apiFetch } from '../client'
import type { Flashcard } from '../../types/workspace'

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

export async function fetchFlashcards(subject?: string, count?: number): Promise<Flashcard[]> {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (count !== undefined) params.set('count', String(count))
  const qs = params.toString()
  const res = await apiFetch(`/api/flashcards${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('フラッシュカードの取得に失敗しました')
  return res.json()
}
