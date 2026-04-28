'use client'

import type {
  DailyLog,
  DailyLogSummary, Problem,
  StudySession,
  StudySessionInput,
} from '@/types/workspace'
import { calcMinutes, SUBJECTS } from '@/types/workspace'
import { getToken } from '@/lib/auth'

// localStorage keys
const LOGS_KEY = 'exapp_daily_logs'
const SESSIONS_KEY = 'exapp_study_sessions'

// ── Mock helpers ────────────────────────────────────────────────────────────

function loadLogs(): Record<string, Omit<DailyLog, 'studySessions' | 'totalMinutes'>> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveLogs(logs: Record<string, Omit<DailyLog, 'studySessions' | 'totalMinutes'>>) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

function loadSessions(): StudySession[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveSessions(sessions: StudySession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function now(): string {
  return new Date().toISOString()
}

function nextId(sessions: StudySession[]): number {
  return sessions.length === 0 ? 1 : Math.max(...sessions.map((s) => s.id)) + 1
}

function buildDailyLog(
  raw: Omit<DailyLog, 'studySessions' | 'totalMinutes'>,
  sessions: StudySession[],
): DailyLog {
  const daySessions = sessions.filter((s) => s.dailyLogDate === raw.date)
  const totalMinutes = daySessions.reduce(
    (acc, s) => acc + Math.max(0, calcMinutes(s.startTime, s.endTime)),
    0,
  )
  return { ...raw, studySessions: daySessions, totalMinutes }
}

// ── API functions ────────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// GET /api/daily-logs?year=&month=
export async function fetchMonthlyLogs(year: number, month: number): Promise<DailyLogSummary[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    const sessions = loadSessions()
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return Object.values(logs)
      .filter((l) => l.date.startsWith(prefix))
      .map((l) => {
        const daySessions = sessions.filter((s) => s.dailyLogDate === l.date)
        const totalMinutes = daySessions.reduce(
          (acc, s) => acc + Math.max(0, calcMinutes(s.startTime, s.endTime)),
          0,
        )
        return { date: l.date, isCompleted: l.isCompleted, totalMinutes, sessionCount: daySessions.length }
      })
  }

  const res = await fetch(`/api/daily-logs?year=${year}&month=${month}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('ログ一覧の取得に失敗しました')
  return res.json()
}

// GET /api/daily-logs/:date (404 → null)
export async function fetchDailyLog(date: string): Promise<DailyLog | null> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    const sessions = loadSessions()
    const raw = logs[date]
    if (!raw) return null
    return buildDailyLog(raw, sessions)
  }

  const res = await fetch(`/api/daily-logs/${date}`, { headers: await authHeaders() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('ログの取得に失敗しました')
  return res.json()
}

// POST /api/daily-logs
export async function createDailyLog(date: string): Promise<DailyLog> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    if (logs[date]) return buildDailyLog(logs[date], loadSessions())
    const raw: Omit<DailyLog, 'studySessions' | 'totalMinutes'> = {
      date,
      reflection: null,
      isCompleted: false,
      completedAt: null,
      createdAt: now(),
      updatedAt: now(),
    }
    logs[date] = raw
    saveLogs(logs)
    return buildDailyLog(raw, loadSessions())
  }

  const res = await fetch('/api/daily-logs', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ date }),
  })
  if (!res.ok) throw new Error('ログの作成に失敗しました')
  return res.json()
}

// PUT /api/daily-logs/:date (reflection)
export async function updateReflection(date: string, reflection: string | null): Promise<DailyLog> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    if (!logs[date]) throw new Error('ログが存在しません')
    logs[date] = { ...logs[date], reflection, updatedAt: now() }
    saveLogs(logs)
    return buildDailyLog(logs[date], loadSessions())
  }

  const res = await fetch(`/api/daily-logs/${date}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify({ reflection }),
  })
  if (!res.ok) throw new Error('振り返りの保存に失敗しました')
  return res.json()
}

// POST /api/daily-logs/:date/complete
export async function completeDailyLog(date: string): Promise<DailyLog> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    if (!logs[date]) throw new Error('ログが存在しません')
    logs[date] = { ...logs[date], isCompleted: true, completedAt: now(), updatedAt: now() }
    saveLogs(logs)
    return buildDailyLog(logs[date], loadSessions())
  }

  const res = await fetch(`/api/daily-logs/${date}/complete`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('完了処理に失敗しました')
  return res.json()
}

// POST /api/daily-logs/:date/uncomplete
export async function uncompleteDailyLog(date: string): Promise<DailyLog> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    if (!logs[date]) throw new Error('ログが存在しません')
    logs[date] = { ...logs[date], isCompleted: false, completedAt: null, updatedAt: now() }
    saveLogs(logs)
    return buildDailyLog(logs[date], loadSessions())
  }

  const res = await fetch(`/api/daily-logs/${date}/uncomplete`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('完了取消に失敗しました')
  return res.json()
}

// POST /api/study-sessions
export async function addStudySession(input: StudySessionInput): Promise<StudySession> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const sessions = loadSessions()
    const session: StudySession = {
      ...input,
      id: nextId(sessions),
      createdAt: now(),
      updatedAt: now(),
    }
    saveSessions([...sessions, session])
    return session
  }

  const res = await fetch('/api/study-sessions', {
    method: 'POST',
    headers: await authHeaders(),
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
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const sessions = loadSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('ブロックが見つかりません')
    sessions[idx] = { ...sessions[idx], ...input, updatedAt: now() }
    saveSessions(sessions)
    return sessions[idx]
  }

  const res = await fetch(`/api/study-sessions/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('ブロックの更新に失敗しました')
  return res.json()
}

// GET /api/dashboard/stats
export type DashboardStats = {
  thisMonthMinutes: number
  thisMonthDays: number
  last7DaysMinutes: number
  weeklyAvgMinutes: number
  subjectMinutes: { subject: string; minutes: number }[]
  lastTouchedBySubject: { subject: string; lastDate: string | null }[]
  dailyMinutes: { date: string; minutes: number }[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const sessions = loadSessions()
    const now = new Date()

    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

    const monthSessions = sessions.filter((s) => s.dailyLogDate.startsWith(monthPrefix))
    const last7Sessions = sessions.filter((s) => s.dailyLogDate >= sevenDaysAgoStr)

    const sumMins = (ss: typeof sessions) =>
      ss.reduce((acc, s) => acc + Math.max(0, calcMinutes(s.startTime, s.endTime)), 0)

    const thisMonthMinutes = sumMins(monthSessions)
    const thisMonthDays = new Set(monthSessions.map((s) => s.dailyLogDate)).size
    const last7DaysMinutes = sumMins(last7Sessions)
    const weeklyAvgMinutes = now.getDate() > 0 ? (thisMonthMinutes / now.getDate()) * 7 : 0

    const subjectMap: Record<string, number> = {}
    monthSessions.forEach((s) => {
      if (!s.subject) return
      subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + calcMinutes(s.startTime, s.endTime)
    })
    const subjectMinutes = Object.entries(subjectMap)
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)

    const lastTouchedBySubject = SUBJECTS.map((subject) => {
      const ss = sessions.filter((s) => s.subject === subject)
      if (ss.length === 0) return { subject, lastDate: null }
      const lastDate = ss.reduce((max, s) => (s.dailyLogDate > max ? s.dailyLogDate : max), '')
      return { subject, lastDate }
    })

    const dailyMinutes: { date: string; minutes: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyMinutes.push({ date: dateStr, minutes: sumMins(sessions.filter((s) => s.dailyLogDate === dateStr)) })
    }

    return { thisMonthMinutes, thisMonthDays, last7DaysMinutes, weeklyAvgMinutes, subjectMinutes, lastTouchedBySubject, dailyMinutes }
  }

  const res = await fetch('/api/dashboard/stats', { headers: await authHeaders() })
  if (!res.ok) throw new Error('統計の取得に失敗しました')
  return res.json()
}

// DELETE /api/study-sessions/:id
export async function deleteStudySession(id: number): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    saveSessions(loadSessions().filter((s) => s.id !== id))
    return
  }

  const res = await fetch(`/api/study-sessions/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('ブロックの削除に失敗しました')
}


// ダミーデータ
const generateDailyMinutes = () => {
  const data = []
  const today = new Date()
  // 過去30日分のデータを生成
  for (let i = 30; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    // 週40〜45時間目標（1日平均 340分〜385分）
    // 平日は仕事があるため早朝・深夜、休日は一気に積み上げるイメージ
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const baseMinutes = isWeekend ? 500 : 320
    const randomVariation = Math.floor(Math.random() * 60) - 30 // ±30分の揺らぎ

    data.push({
      date: dateStr,
      minutes: Math.max(0, baseMinutes + randomVariation)
    })
  }
  return data
}

export const DUMMY_STATS: DashboardStats = {
  thisMonthMinutes: 10800, // 約180時間
  thisMonthDays: 28,
  last7DaysMinutes: 2650,  // 約44時間（目標達成ペース）
  weeklyAvgMinutes: 378,   // 1日約6.3時間
  subjectMinutes: [
    { subject: '企業経営理論', minutes: 3000 },
    { subject: '財務・会計', minutes: 2500 },
    { subject: '運営管理', minutes: 2000 },
    { subject: '経済学・経済政策', minutes: 1200 }, // 最近注力
    { subject: '経営法務', minutes: 800 },         // これから
    { subject: '経営情報システム', minutes: 1000 },
    { subject: '中小企業経営・政策', minutes: 300 }, // 手薄
  ],
  lastTouchedBySubject: [
    { subject: '企業経営理論', lastDate: '2026-04-27' },
    { subject: '財務・会計', lastDate: '2026-04-28' }, // 今日
    { subject: '運営管理', lastDate: '2026-04-26' },
    { subject: '経済学・経済政策', lastDate: '2026-04-28' }, // 今日
    { subject: '経営法務', lastDate: '2026-04-25' },
    { subject: '経営情報システム', lastDate: '2026-04-20' },
    { subject: '中小企業経営・政策', lastDate: '2026-04-15' }, // 放置気味
  ],
  dailyMinutes: generateDailyMinutes(),
}
export const DUMMY_PROBLEMS: Problem[] = [
  // 実際にはもっと大量にある想定だが、分析用に偏りを持たせる
  ...Array(12).fill(null).map((_, i) => ({ id: i, failureTypes: ['理解不足', '知識の混同'] } as Problem)),
  ...Array(8).fill(null).map((_, i) => ({ id: i + 20, failureTypes: ['計算ミス'] } as Problem)),
  ...Array(5).fill(null).map((_, i) => ({ id: i + 40, failureTypes: ['問題文の読み飛ばし'] } as Problem)),
  ...Array(3).fill(null).map((_, i) => ({ id: i + 60, failureTypes: ['時間切れ'] } as Problem)),
]