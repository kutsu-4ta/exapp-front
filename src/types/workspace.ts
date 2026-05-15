export type SubjectSettings = {
  finalTarget: string | null
}

export type SubjectMonthlyGoal = {
  year: number
  month: number
  goal: string | null
}

export type TimeSlot = 'morning' | 'lunch' | 'commute' | 'night'

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

export type SubCategory = {
  id: number
  subject: string
  name: string
  createdAt: string
  updatedAt: string
}

export type SubCategoryInput = {
  subject: string
  name: string
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
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}時間` : `${h}時間${m}分`
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}（${days[d.getDay()]}）`
}

export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1) + 'h'
}

export function todayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function daysAgo(dateStr: string): number {
  const today = new Date(todayString() + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Problem / Weak-point types ───────────────────────────────────────────────

export type Flashcard = {
  id: number
  subject: string
  front: {
    questionRef: string
    subCategory: string | null
    material: string | null
    solvedAt: string
  }
  back: {
    note: string | null
    proficiency: string
    failureTypes: string[]
    isGoodQuestion: boolean
  }
}

export const PROFICIENCY_VALUES = ['○', '△', '×'] as const
export type Proficiency = (typeof PROFICIENCY_VALUES)[number]

export const FAILURE_TYPE_VALUES = ['定義', '解法', 'ケアレス'] as const
export type FailureType = (typeof FAILURE_TYPE_VALUES)[number]

export type Problem = {
  id: number
  subject: string
  material: string
  materialId: null
  materialName: string | null
  subCategory: string | null
  questionRef: string
  note: string | null
  defeatReason: string | null
  proficiency: Proficiency
  failureTypes: FailureType[]
  isGoodQuestion: boolean
  solvedAt: string // YYYY-MM-DD
  lastTouchedAt: string | null // ISO datetime, updated on review
  createdAt: string
  updatedAt: string
}

export type AnalysisResponse = {
  subject_name: string
  sub_category_name: string
  question_ref: string | null
  note: string | null
  proficiency: string
  failure_types: string[]
  is_good_question: boolean
  solved_at: string
}

export type ChartDataPoint = {
  day: number
  date: string
  actual?: number
  forecast?: number
  range: [number, number]
}

export type ProblemInput = {
  subject: string
  materialId: number | null
  materialName: string | null
  subCategory: string | null
  questionRef: string
  note: string | null
  defeatReason: string | null
  proficiency: string
  failureTypes: string[]
  isGoodQuestion: boolean
  solvedAt: string
}

// ── Subject activity ─────────────────────────────────────────────────────────

export type SubjectActivityDay = {
  date: string
  studyMinutes: number
  problemCount: number
}

// ── Gemini context ───────────────────────────────────────────────────────────

export type GeminiContextSubject = {
  subject: string
  finalTarget: string | null
  monthlyGoal: string | null
  studyMinutes: number
  problemCount: number
  failureStats: { type: string; count: number; ratio: number }[]
  recentExamScore: {
    examYear: number
    score: number
    completedAt: string | null
  } | null
}

export type GeminiContextDailyLog = {
  date: string
  studyMinutes: number
  reflection: string | null
}

export type GeminiContext = {
  year: number
  month: number
  profile: {
    occupation: string | null
    goal: string | null
    weakAreas: string | null
    strongAreas: string | null
  }
  dashboard: DashboardStats
  recentDailyLogs: GeminiContextDailyLog[]
  subjects: GeminiContextSubject[]
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
  lastTouchedBySubject: { subject: string; lastdate: string | null; recentMinutes: number }[]
  dailyMinutes: { date: string; minutes: number }[]
}
