import {apiFetch, extractApiError} from '../client'

export type MorningQuizQuestion = {
  id: string
  subject: string
  sub_category: string
  sub_category_rank?: 'A' | 'B' | 'C' | 'D' | 'E' | null
  problem_context: {
    original_ref: string
    user_memo: string | null
    material_name: string | null
  }
  quiz: {
    question: string    // カード表面（AI生成キーワード質問）
    explanation: string // カード裏面（#Definition + #Formula）
  } | null
}

export type MorningQuizSession = {
  session_id: string
  questions: MorningQuizQuestion[]
}

export type FlashBugfixConfig = {
  failureTypes: string[]
  subCategoryIds: number[]
  touchedOrder: 'recent' | 'old' | null
  limit: number
  proficiency: string[]
}

export async function fetchMorningQuiz(): Promise<MorningQuizSession> {
  const res = await apiFetch('/api/morning-bugfix')
  if (!res.ok) await extractApiError(res, 'クイズの取得に失敗しました')
  return res.json()
}

export async function fetchFlashBugfix(
  subject: string,
  config: FlashBugfixConfig
): Promise<MorningQuizSession> {
  const q = new URLSearchParams({subject})
  config.failureTypes.forEach((ft) => q.append('failureTypes[]', ft))
  config.subCategoryIds.forEach((id) => q.append('subCategoryIds[]', String(id)))
  config.proficiency.forEach((p) => q.append('proficiency[]', p))
  if (config.touchedOrder) q.set('touchedOrder', config.touchedOrder)
  q.set('limit', String(config.limit))

  const res = await apiFetch(`/api/morning-bugfix?${q}`)
  if (!res.ok) await extractApiError(res, 'クイズの取得に失敗しました')
  return res.json()
}

export type DegBugfixConfig = {
  subject: string | null
  limit: number
}

export async function fetchDegBugfix(config: DegBugfixConfig): Promise<MorningQuizSession> {
  const q = new URLSearchParams()
  if (config.subject) q.set('subject', config.subject)
  q.set('limit', String(config.limit))

  const res = await apiFetch(`/api/deg-bugfix?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? '保存済みクイズの取得に失敗しました')
  }
  return res.json()
}
