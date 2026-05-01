import { apiFetch } from '../client'
import type { AlertSettings } from '../../types/workspace'

export async function fetchAlertSettings(): Promise<AlertSettings> {
  const res = await apiFetch('/api/alert-settings')
  if (!res.ok) throw new Error('アラート設定の取得に失敗しました')
  return res.json()
}

export async function updateAlertSettings(input: AlertSettings): Promise<AlertSettings> {
  const res = await apiFetch('/api/alert-settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('アラート設定の保存に失敗しました')
  return res.json()
}
