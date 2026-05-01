import { apiFetch } from '../client'

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
