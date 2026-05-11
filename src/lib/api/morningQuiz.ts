import { apiFetch } from '../client'

export type MorningQuizQuestion = {
  id: string
  subject: string
  sub_category: string
  problem_context: {
    original_ref: string
    user_memo: string
  }
  quiz: {
    question: string
    options: string[]
    correct_index: number
    explanation: string
  }
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
  if (!res.ok) throw new Error('クイズの取得に失敗しました')
  return res.json()
}

export async function completeMorningQuiz(
  sessionId: string,
  answers: MorningQuizAnswer[],
  elapsedMs: number,
): Promise<{ minutes: number }> {
  const res = await apiFetch('/api/morning-bugfix/sessions', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, answers, elapsed_ms: elapsedMs }),
  })
  if (!res.ok) throw new Error('結果の保存に失敗しました')
  return res.json()
}
