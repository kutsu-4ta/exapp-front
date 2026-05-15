import {apiFetch} from '../client'
import type {SubjectAlertSettings} from '../../types/workspace'

export async function fetchSubjectAlertSettings(subject: string): Promise<SubjectAlertSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(subject)}/alert-settings`)
  if (!res.ok) throw new Error('アラート設定の取得に失敗しました')
  return res.json()
}

export async function updateSubjectAlertSettings(
  subject: string,
  input: SubjectAlertSettings
): Promise<SubjectAlertSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(subject)}/alert-settings`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('アラート設定の保存に失敗しました')
  return res.json()
}
