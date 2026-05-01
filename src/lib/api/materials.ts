import { apiFetch } from '../client'

export async function fetchMaterials(): Promise<string[]> {
  const res = await apiFetch('/api/materials')
  if (!res.ok) throw new Error('教材の取得に失敗しました')
  return res.json()
}
