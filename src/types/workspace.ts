export type TimeSlot = 'morning' | 'lunch' | 'commute' | 'night'

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '早朝',
  lunch: '昼',
  commute: '通勤',
  night: '深夜',
}

export const SUBJECTS = [
  '経済学・経済政策',
  '財務・会計',
  '企業経営理論',
  '運営管理',
  '経営法務',
  '経営情報システム',
  '中小企業経営・政策',
] as const
export type Subject = (typeof SUBJECTS)[number]

export const MATERIALS = ['テキスト', '問題集', 'スピード問題集', '過去問', 'その他'] as const
export type Material = (typeof MATERIALS)[number]

export type StudySession = {
  id: number
  dailyLogDate: string // YYYY-MM-DD
  timeSlot: TimeSlot
  startTime: string // HH:mm
  endTime: string // HH:mm — empty string if not yet filled
  subject: string
  material: string
  memo: string | null
  createdAt: string
  updatedAt: string
}

export type StudySessionInput = {
  dailyLogDate: string
  timeSlot: TimeSlot
  startTime: string
  endTime: string
  subject: string
  material: string
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

export function calcMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
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

// ── Problem / Weak-point types ───────────────────────────────────────────────

export const PROFICIENCY_VALUES = ['○', '△', '×'] as const
export type Proficiency = (typeof PROFICIENCY_VALUES)[number]

export const FAILURE_TYPE_VALUES = ['定義漏れ', '解法ミス', '計算ミス'] as const
export type FailureType = (typeof FAILURE_TYPE_VALUES)[number]

export type Problem = {
  id: number
  subject: string
  material: string
  questionRef: string
  note: string | null
  proficiency: Proficiency
  failureTypes: FailureType[]
  isGoodQuestion: boolean
  solvedAt: string // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type ProblemInput = Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>
