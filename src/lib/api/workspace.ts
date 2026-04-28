'use client'

import type {
  DailyLog,
  DailyLogSummary,
  DashboardStats,
  Problem,
  StudySession,
  StudySessionInput,
  TimeSlot,
  FailureType,
} from '@/types/workspace'
import { SUBJECTS } from '@/types/workspace'
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
  const totalMinutes = daySessions.reduce((acc, s) => acc + Math.max(0, s.minutes), 0)
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
        const totalMinutes = daySessions.reduce((acc, s) => acc + Math.max(0, s.minutes), 0)
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
      ss.reduce((acc, s) => acc + Math.max(0, s.minutes), 0)

    const thisMonthMinutes = sumMins(monthSessions)
    const thisMonthDays = new Set(monthSessions.map((s) => s.dailyLogDate)).size
    const last7DaysMinutes = sumMins(last7Sessions)
    const weeklyAvgMinutes = now.getDate() > 0 ? (thisMonthMinutes / now.getDate()) * 7 : 0

    const subjectMap: Record<string, number> = {}
    monthSessions.forEach((s) => {
      if (!s.subject) return
      subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.minutes
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
const dummyProblemBase = {
  subject: '財務・会計', material: 'スピード問題集', questionRef: '',
  note: null, proficiency: '×' as const, isGoodQuestion: false, solvedAt: '2026-04-01',
  createdAt: '', updatedAt: '',
}
export const DUMMY_PROBLEMS: Problem[] = [
  ...Array(12).fill(null).map((_, i) => ({ ...dummyProblemBase, id: i,      failureTypes: ['定義漏れ', '解法ミス'] as FailureType[] })),
  ...Array(8).fill(null).map((_, i)  => ({ ...dummyProblemBase, id: i + 20, failureTypes: ['計算ミス'] as FailureType[] })),
  ...Array(5).fill(null).map((_, i)  => ({ ...dummyProblemBase, id: i + 40, failureTypes: ['解法ミス'] as FailureType[] })),
  ...Array(3).fill(null).map((_, i)  => ({ ...dummyProblemBase, id: i + 60, failureTypes: ['定義漏れ'] as FailureType[] })),
]

// GET /api/daily-logs (一覧取得)
export async function fetchDailyLogs(): Promise<DailyLog[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const logs = loadLogs()
    const sessions = loadSessions()

    // ログが空の場合のみダミーデータを注入
    if (Object.keys(logs).length === 0) {
      injectDummyDailyLogs();
    }

    const allLogs = loadLogs(); // 再読み込み
    return Object.values(allLogs)
        .map((l) => buildDailyLog(l, sessions))
        .sort((a, b) => b.date.localeCompare(a.date));
  }

  const res = await fetch('/api/daily-logs', { headers: await authHeaders() })
  if (!res.ok) throw new Error('ログ一覧の取得に失敗しました')
  return res.json()
}

/**
 * ストイックな学習実績をシミュレートするダミー注入ロジック
 */
function injectDummyDailyLogs() {
  const logs: Record<string, Omit<DailyLog, 'studySessions' | 'totalMinutes'>> = {};
  const sessions: StudySession[] = [];
  const today = new Date();

  // 過去14日分のデータを生成
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    // DailyLog本体
    logs[dateStr] = {
      date: dateStr,
      reflection: getStoicReflection(i),
      isCompleted: i !== 0, // 今日以外は完了済み
      completedAt: i !== 0 ? now() : null,
      createdAt: now(),
      updatedAt: now(),
    };

    // セッション（早朝、昼、深夜の固定ブロック）
    const dailyBlocks: { timeSlot: TimeSlot; duration: number; subj: string; material: string }[] = [
      { timeSlot: 'morning', duration: 120, subj: '財務・会計', material: 'スピード問題集' },
      { timeSlot: 'lunch', duration: 45, subj: '企業経営理論', material: 'テキスト' },
      { timeSlot: 'night', duration: 180, subj: i % 2 === 0 ? '経済学・経済政策' : '運営管理', material: '問題集' },
    ];

    if (isWeekend) {
      // 休日は通勤時間帯にロングブロックを追加
      dailyBlocks.push({ timeSlot: 'commute', duration: 240, subj: '経営法務', material: '過去問' });
    }

    dailyBlocks.forEach((block) => {
      sessions.push({
        id: sessions.length + 1,
        dailyLogDate: dateStr,
        timeSlot: block.timeSlot,
        subject: block.subj,
        material: block.material,
        memo: null,
        minutes: block.duration,
        createdAt: now(),
        updatedAt: now(),
      });
    });
  }

  saveLogs(logs);
  saveSessions(sessions);
}

function getStoicReflection(index: number): string {
  const reflections = [
    "今日は「経済学」のIS-LM曲線に集中。グラフのシフト条件を論理的に解釈できた。明日は法務へ。",
    "早朝の財務計算、回転率が上がってきた。スピ問のミスパターンをReactアプリに記録済み。",
    "仕事が立て込んだが、昼の45分を死守。運営管理の在庫管理計算はパズルに近い。簡単だと思えるまで回す。",
    "週45時間ペース維持。可処分時間のすべてを診断士に捧げている感覚が心地よい。哲学的な思考が学習を助けている。",
    "財務のキャッシュフロー計算書でミス。営業活動によるCFの小計以下を再暗記。明日リベンジする。",
    "経済学・経済政策の先行指標を整理。雑学知識と結びつけると定着が良い。ストイックに実績を積むのみ。",
  ];
  return reflections[index % reflections.length];
}