import { apiFetch } from '../client'

export async function fetchMaterials(): Promise<string[]> {
  const res = await apiFetch('/api/materials')
  if (!res.ok) throw new Error('教材の取得に失敗しました')
  return res.json()
}

export async function renameMaterial(name: string, newName: string): Promise<void> {
  const res = await apiFetch(`/api/materials/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ newName }),
  })
  if (!res.ok) throw new Error('教材名の変更に失敗しました')
}

export async function deleteMaterial(name: string): Promise<void> {
  const res = await apiFetch(`/api/materials/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('教材の削除に失敗しました')
}
