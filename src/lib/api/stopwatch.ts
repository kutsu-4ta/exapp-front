import {apiFetch, extractApiError} from '../client'

export type StopwatchState = {
  isRunning: boolean
  elapsedSeconds: number
}

export async function fetchStopwatch(): Promise<StopwatchState> {
  const res = await apiFetch('/api/stopwatch')
  if (!res.ok) await extractApiError(res, 'ストップウォッチの取得に失敗しました')
  return res.json()
}

export async function startStopwatch(): Promise<void> {
  const res = await apiFetch('/api/stopwatch/start', { method: 'POST' })
  if (!res.ok) await extractApiError(res, '開始に失敗しました')
}

export async function stopStopwatch(): Promise<void> {
  const res = await apiFetch('/api/stopwatch/stop', { method: 'POST' })
  if (!res.ok) await extractApiError(res, '停止に失敗しました')
}

export async function resetStopwatch(): Promise<void> {
  const res = await apiFetch('/api/stopwatch/reset', { method: 'POST' })
  if (!res.ok) await extractApiError(res, 'リセットに失敗しました')
}
