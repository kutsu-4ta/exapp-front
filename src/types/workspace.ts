import {apiFetch} from "@/lib/client.ts";

export type TimeSlot = 'morning' | 'lunch' | 'commute' | 'night'

export type AlertSettings = {
  thresholdDays: number
  includeUntouched: boolean
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
  subCategoryId: number | null
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
  subCategoryId?: number | null
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

export const PROFICIENCY_VALUES = ['○', '△', '×'] as const
export type Proficiency = (typeof PROFICIENCY_VALUES)[number]

export const FAILURE_TYPE_VALUES = ['定義ミス', '解法ミス', '計算ミス'] as const
export type FailureType = (typeof FAILURE_TYPE_VALUES)[number]

export type Problem = {
  id: number
  subject: string
  material: string
  subCategoryId: number | null
  questionRef: string
  note: string | null
  proficiency: Proficiency
  failureTypes: FailureType[]
  isGoodQuestion: boolean
  solvedAt: string // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type ChartDataPoint = {
  day: number;        // 日にち (1〜31)
  date: string;       // YYYY-MM-DD
  actual?: number;    // 実績累計 (時間単位)
  forecast?: number;  // 予測累計 (時間単位)
  range: [number, number]; // その日の目標[下限, 上限]
};


export type ProblemInput = Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>

// ── Dashboard stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  thisMonthMinutes: number
  thisMonthDays: number
  last7DaysMinutes: number
  weeklyAvgMinutes: number
  subjectMinutes: { subject: string; minutes: number }[]
  lastTouchedBySubject: { subject: string; lastdate: string | null }[]
  dailyMinutes: { date: string; minutes: number }[]
}

// ── User Profile types ──────────────────────────────────────────────────────

export type UserProfile = {
  nickname: string
  occupation: string
  goal: string
  weakAreas: string
  strongAreas: string
  interests: string
  geminiToken?: string // セキュリティ上、取得時は非表示またはマスキングされる想定
  createdAt?: string
  updatedAt?: string
}

/**
 * プロフィール更新用の入力型
 * 全てのフィールドを任意（Partial）にすることで、特定の項目のみの更新にも対応可能にします。
 */
export type UserProfileInput = Partial<UserProfile>

/**
 * ユーザープロフィールを更新するAPI関数
 * @param input 更新データ
 * @returns 更新後のプロフィール情報
 */
export async function updateUserProfile(input: UserProfileInput): Promise<UserProfile> {
  const response = await apiFetch('/api/profile', {
    method: 'PUT', // または PUT。LaravelのRoute定義に合わせて調整
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // 必要に応じてAuthorizationヘッダを追加
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'プロフィールの更新に失敗しました');
  }

  return response.json();
}

/**
 * ユーザープロフィールを取得するAPI関数
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await apiFetch('/api/profile', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('プロフィールの取得に失敗しました');
  }

  return response.json();
}