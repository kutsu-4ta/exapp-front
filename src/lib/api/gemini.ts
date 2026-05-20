import {apiFetch, extractApiError} from '../client'
import type {GeminiContext} from '../../types/workspace'
import type {GeminiModel} from './apiWeights'

export type { GeminiModel }

export const GEMINI_MODEL_OPTIONS: { value: GeminiModel; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
]

export async function fetchGeminiContext(year: number, month: number): Promise<GeminiContext> {
  const res = await apiFetch(`/api/gemini/context?year=${year}&month=${month}`)
  if (!res.ok) throw new Error(`fetchGeminiContext: ${res.status}`)
  return res.json()
}

export async function fetchGeminiSettings(): Promise<{ geminiModel: GeminiModel | null }> {
  const res = await apiFetch('/api/gemini/settings')
  if (!res.ok) await extractApiError(res, 'Gemini設定の取得に失敗しました')
  return res.json()
}

export async function updateGeminiSettings(
  model: GeminiModel
): Promise<{ geminiModel: GeminiModel }> {
  const res = await apiFetch('/api/gemini/settings', {
    method: 'PUT',
    body: JSON.stringify({ geminiModel: model }),
  })
  if (!res.ok) await extractApiError(res, 'Gemini設定の更新に失敗しました')
  return res.json()
}
