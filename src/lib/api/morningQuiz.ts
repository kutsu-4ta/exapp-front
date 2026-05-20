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
    question: string
    options: string[]
    correct_index: number
    explanation: string
  } | null
}

export type MorningQuizSession = {
  session_id: string
  questions: MorningQuizQuestion[]
}

export type MorningQuizAnswer = {
  question_id: string
  selected_index: number
}

export async function fetchMorningQuiz(): Promise<MorningQuizSession> {
  const res = await apiFetch('/api/morning-bugfix')
  if (!res.ok) await extractApiError(res, 'クイズの取得に失敗しました')
  return res.json()
}

export type FlashBugfixConfig = {
  failureTypes: string[]
  subCategoryIds: number[]
  touchedOrder: 'recent' | 'old' | null
  limit: number
  proficiency: string[]
  quizMode: 'multiple_choice' | 'word_card'
  formulaOnly: boolean
}

export async function fetchFlashBugfix(
  subject: string,
  config: FlashBugfixConfig
): Promise<MorningQuizSession> {
  const q = new URLSearchParams({ subject })
  config.failureTypes.forEach((ft) => q.append('failureTypes[]', ft))
  config.subCategoryIds.forEach((id) => q.append('subCategoryIds[]', String(id)))
  config.proficiency.forEach((p) => q.append('proficiency[]', p))

  // 単一の値のみ set を使用
  if (config.touchedOrder) {
    q.set('touchedOrder', config.touchedOrder)
  }
  q.set('limit', String(config.limit))

  const res = await apiFetch(`/api/morning-bugfix?${q}`)
  if (!res.ok) await extractApiError(res, 'クイズの取得に失敗しました')
  return res.json()
}

export async function fetchFlashCard(
  subject: string,
  config: FlashBugfixConfig
): Promise<MorningQuizSession> {
  const q = new URLSearchParams({subject})
  config.failureTypes.forEach((ft) => q.append('failureTypes[]', ft))
  config.subCategoryIds.forEach((id) => q.append('subCategoryIds[]', String(id)))
  config.proficiency.forEach((p) => q.append('proficiency[]', p))
  if (config.touchedOrder) q.set('touchedOrder', config.touchedOrder)
  q.set('limit', String(config.limit))
  if (config.formulaOnly) q.set('formulaOnly', 'true')

  const res = await apiFetch(`/api/flash-card?${q}`)
  if (!res.ok) await extractApiError(res, 'カードの取得に失敗しました')
  return res.json()
}

export type DegBugfixConfig = {
  subject: string | null
  limit: number
  quizMode: 'multiple_choice' | 'word_card'
  formulaOnly: boolean
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

export async function fetchDegWordCard(config: DegBugfixConfig): Promise<MorningQuizSession> {
  const q = new URLSearchParams()
  if (config.subject) q.set('subject', config.subject)
  q.set('limit', String(config.limit))
  if (config.formulaOnly) q.set('formulaOnly', 'true')

  const res = await apiFetch(`/api/deg-word-card?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? '保存済み単語カードの取得に失敗しました')
  }
  return res.json()
}

export async function completeMorningQuiz(
  sessionId: string,
  answers: MorningQuizAnswer[],
  elapsedMs: number
): Promise<{ minutes: number }> {
  const res = await apiFetch('/api/morning-bugfix/sessions', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, answers, elapsed_ms: elapsedMs }),
  })
  if (!res.ok) await extractApiError(res, '結果の保存に失敗しました')
  return res.json()
}
