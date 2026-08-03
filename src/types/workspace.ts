export type SubjectSettings = {
  finalTarget: string | null
  themeColor: string | null
}

export type SubjectMonthlyGoal = {
  year: number
  month: number
  goal: string | null
}

export type TimeSlot = 'morning' | 'lunch' | 'night'

export type AlertStatusItem = {
  subject: string
  lastDate: string | null
  recentMinutes: number
  settings: SubjectAlertSettings
}

export type SubjectAlertSettings = {
  touchAlertEnabled: boolean
  thresholdDays: number
  includeUntouched: boolean
  minutesAlertEnabled: boolean
  minutesThresholdDays: number
  minutesThreshold: number
}

export const DEFAULT_SUBJECT_ALERT_SETTINGS: SubjectAlertSettings = {
  touchAlertEnabled: true,
  thresholdDays: 3,
  includeUntouched: true,
  minutesAlertEnabled: false,
  minutesThresholdDays: 7,
  minutesThreshold: 30,
}


export type MonthlySettings = {
  year: number
  month: number
  targetMin: number
  targetMax: number
}

export type StudySession = {
  id: number
  dailyLogDate: string // YYYY-MM-DD
  timeSlot: TimeSlot
  minutes: number
  subject: string
  material: string
  subCategory: string | null
  memo: string | null
  createdAt: string
  updatedAt: string
}

export type StudySessionInput = {
  dailyLogDate: string
  timeSlot: TimeSlot
  minutes: number
  subject: string
  material: string
  subCategory?: string | null
  memo: string | null
}

export type DailyLog = {
  date: string // YYYY-MM-DD
  reflection: string | null
  isCompleted: boolean
  completedAt: string | null
  studySessions: StudySession[]
  totalMinutes: number
  createdAt: string
  updatedAt: string
}

export type DailyLogSummary = {
  date: string
  isCompleted: boolean
  totalMinutes: number
  sessionCount: number
  reflection: string | null
  slotMinutes: { morning: number; lunch: number; night: number }
  subjectMinutes: Record<string, number>
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0分'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

export function formatDurationForDashboardStats(minutes: number): string {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h\n${m}m`
}

export function todayString(): string {
  const now = new Date()
  // 0:00〜3:59 は前日を「今日」扱い（深夜の学習を当日に帰属させる）
  if (now.getHours() < 4) now.setDate(now.getDate() - 1)
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function daysSince(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDaysAgo(dateStr: string): string {
  return `${daysSince(dateStr)}日前`
}

export function formatSessions(count: number): string {
  return count === 1 ? '1 session' : `${count} sessions`
}

export function formatMonthYear(year: number, month: number): string {
  return `${year}年${month}月`
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatDayOfWeek(dateStr: string): string {
  const DAYS = ['日', '月', '火', '水', '木', '金', '土']
  return DAYS[new Date(dateStr + 'T00:00:00').getDay()]
}

export type ChartDataPoint = {
  day: number
  date: string
  actual?: number
  forecast?: number
  range: [number, number]
}

// ── Subject activity ─────────────────────────────────────────────────────────

export type SubjectActivityDay = {
  date: string
  studyMinutes: number
}

// ── Dashboard response ───────────────────────────────────────────────────────

export type DashboardResponse = {
  stats: DashboardStats
  todayLog: DailyLog | null
  prevDayLog: DailyLog | null
  alertItems: AlertStatusItem[]
}

// ── Subjects summary ─────────────────────────────────────────────────────────

export type SubjectSummaryItem = {
  subject: string
  finalTarget: string | null
  monthlyGoal: string | null
  studyMinutes: number
  recentExamScore: {
    examYear: number
    score: number
    completedAt: string | null
    rankStats: { rank: string; correctRate: number; count: number }[]
  } | null
}

export type SubjectsSummary = {
  year: number
  month: number
  subjects: SubjectSummaryItem[]
}

// ── Subject settings (bulk) ───────────────────────────────────────────────────

export type SubjectSettingsItem = {
  subject: string
  finalTarget: string | null
  themeColor: string | null
}

// ── Dashboard stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  currentStreak: number
  allTotalMinutes: number
  allTotalDays: number
  thisMonthMinutes: number
  thisMonthDays: number
  thisWeekTotalMinutes: number
  last7DaysMinutes: number
  weeklyAvgMinutes: number
  subjectMinutes: { subject: string; minutes: number }[]
  allSubjectMinutes: { subject: string; minutes: number }[]
  lastTouchedBySubject: { subject: string; lastdate: string | null }[]
  dailyMinutes: { date: string; minutes: number }[]
}
