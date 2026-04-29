'use client'

import type {
  DailyLog,
  DailyLogSummary,
  DashboardStats,
  MonthlySettings,
  StudySession,
  StudySessionInput,
} from '@/types/workspace'
import { apiFetch } from "@/lib/client";

/**
 * ── Daily Logs ─────────────────────────────────────────────────────────────
 */

// GET /api/daily-logs?year=&month=
export async function fetchMonthlyLogs(year: number, month: number): Promise<DailyLogSummary[]> {
  const res = await apiFetch(`/api/daily-logs?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('ログ一覧の取得に失敗しました')
  return res.json()
}

// 当月デフォルト
export async function fetchDailyLogs(year?: number, month?: number): Promise<DailyLogSummary[]> {
  const now = new Date()
  return fetchMonthlyLogs(year ?? now.getFullYear(), month ?? now.getMonth() + 1)
}

// GET /api/daily-logs/:date
export async function fetchDailyLog(date: string): Promise<DailyLog | null> {
  const res = await apiFetch(`/api/daily-logs/${date}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('ログの取得に失敗しました')
  return res.json()
}

// POST /api/daily-logs
export async function createDailyLog(date: string): Promise<DailyLog> {
  const res = await apiFetch('/api/daily-logs', {
    method: 'POST',
    body: JSON.stringify({ date }),
  })
  if (!res.ok) throw new Error('ログの作成に失敗しました')
  return res.json()
}

// PUT /api/daily-logs/:date (reflection)
export async function updateReflection(date: string, reflection: string | null): Promise<DailyLog> {
  const res = await apiFetch(`/api/daily-logs/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ reflection }),
  })
  if (!res.ok) throw new Error('振り返りの保存に失敗しました')
  return res.json()
}

// POST /api/daily-logs/:date/complete
export async function completeDailyLog(date: string): Promise<DailyLog> {
  const res = await apiFetch(`/api/daily-logs/${date}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error('完了処理に失敗しました')
  return res.json()
}

// POST /api/daily-logs/:date/uncomplete
export async function uncompleteDailyLog(date: string): Promise<DailyLog> {
  const res = await apiFetch(`/api/daily-logs/${date}/uncomplete`, { method: 'POST' })
  if (!res.ok) throw new Error('完了取消に失敗しました')
  return res.json()
}

/**
 * ── Study Sessions ──────────────────────────────────────────────────────────
 */

// POST /api/study-sessions
export async function addStudySession(input: StudySessionInput): Promise<StudySession> {
  const res = await apiFetch('/api/study-sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('ブロックの追加に失敗しました')
  return res.json()
}

// PUT /api/study-sessions/:id
export async function updateStudySession(
  id: number,
  input: Omit<StudySessionInput, 'dailyLogDate'>,
): Promise<StudySession> {
  const res = await apiFetch(`/api/study-sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('ブロックの更新に失敗しました')
  return res.json()
}

// DELETE /api/study-sessions/:id
export async function deleteStudySession(id: number): Promise<void> {
  const res = await apiFetch(`/api/study-sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('ブロックの削除に失敗しました')
}

/**
 * ── Dashboard ───────────────────────────────────────────────────────────────
 */

// GET /api/dashboard/stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiFetch('/api/dashboard/stats')
  if (!res.ok) throw new Error('統計の取得に失敗しました')
  return res.json()
}

/**
 * ── Monthly Settings ────────────────────────────────────────────────────────
 */

// GET /api/monthly-settings/:year/:month
export async function fetchMonthlySettings(year: number, month: number): Promise<MonthlySettings> {
  const res = await apiFetch(`/api/monthly-settings/${year}/${month}`)
  if (!res.ok) throw new Error('月間設定の取得に失敗しました')
  return res.json()
}

// PUT /api/monthly-settings/:year/:month
export async function updateMonthlySettings(
  year: number,
  month: number,
  input: { targetMin: number; targetMax: number },
): Promise<MonthlySettings> {
  const res = await apiFetch(`/api/monthly-settings/${year}/${month}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('月間設定の保存に失敗しました')
  return res.json()
}