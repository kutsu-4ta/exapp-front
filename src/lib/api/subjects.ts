import {apiFetch, extractApiError} from '../client'
import type {SubjectActivityDay, SubjectMonthlyGoal, SubjectSettings, SubjectSettingsItem,} from '../../types/workspace'

export interface SubjectWithVisibility {
  name: string
  isHidden: boolean
}

export async function fetchSubjects(): Promise<string[]> {
  const res = await apiFetch('/api/subjects')
  if (!res.ok) await extractApiError(res, '科目の取得に失敗しました')
  return res.json()
}

export async function fetchAllSubjectsWithVisibility(): Promise<SubjectWithVisibility[]> {
  const res = await apiFetch('/api/subjects/all')
  if (!res.ok) await extractApiError(res, '科目の取得に失敗しました')
  return res.json()
}

export async function setSubjectHidden(name: string, hidden: boolean): Promise<void> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/hidden`, {
    method: 'PUT',
    body: JSON.stringify({ hidden }),
  })
  if (!res.ok) await extractApiError(res, '科目の表示設定の変更に失敗しました')
}

export async function renameSubject(name: string, newName: string): Promise<void> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ newName }),
  })
  if (!res.ok) await extractApiError(res, '科目名の変更に失敗しました')
}

export async function deleteSubject(name: string): Promise<void> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) await extractApiError(res, '科目の削除に失敗しました')
}

export async function fetchSubjectSettings(name: string): Promise<SubjectSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/settings`)
  if (!res.ok) await extractApiError(res, '科目設定の取得に失敗しました')
  return res.json()
}

export async function saveSubjectSettings(
  name: string,
  settings: SubjectSettings
): Promise<SubjectSettings> {
  const res = await apiFetch(`/api/subjects/${encodeURIComponent(name)}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  if (!res.ok) await extractApiError(res, '科目設定の保存に失敗しました')
  return res.json()
}

export async function fetchSubjectMonthlyGoal(
  name: string,
  year: number,
  month: number
): Promise<SubjectMonthlyGoal> {
  const res = await apiFetch(
    `/api/subjects/${encodeURIComponent(name)}/monthly-goal/${year}/${month}`
  )
  if (!res.ok) await extractApiError(res, '月別方針の取得に失敗しました')
  return res.json()
}

export async function saveSubjectMonthlyGoal(
  name: string,
  year: number,
  month: number,
  goal: string | null
): Promise<SubjectMonthlyGoal> {
  const res = await apiFetch(
    `/api/subjects/${encodeURIComponent(name)}/monthly-goal/${year}/${month}`,
    {
      method: 'PUT',
      body: JSON.stringify({ goal }),
    }
  )
  if (!res.ok) await extractApiError(res, '月別方針の保存に失敗しました')
  return res.json()
}

export async function fetchSubjectActivity(
  name: string,
  year: number,
  month: number
): Promise<SubjectActivityDay[]> {
  const res = await apiFetch(
    `/api/subjects/${encodeURIComponent(name)}/activity?year=${year}&month=${month}`
  )
  if (!res.ok) await extractApiError(res, 'アクティビティの取得に失敗しました')
  return res.json()
}

export async function fetchAllSubjectSettings(): Promise<SubjectSettingsItem[]> {
  const res = await apiFetch('/api/subjects/settings')
  if (!res.ok) await extractApiError(res, '科目設定の取得に失敗しました')
  return res.json()
}

