/**
 * ── Problems (苦手問題管理) ──────────────────────────────────────────────────
 */
import {apiFetch, apiUpload} from '../client'
import type {AnalysisResponse, Problem, ProblemInput, ProblemQuiz, ProblemQuizInput} from '../../types/workspace'

// GET /api/problems
export async function fetchProblems(opts?: {
  limit?: number
  q?: string
  subjects?: string[]
}): Promise<Problem[]> {
  const params = new URLSearchParams()
  if (opts?.limit !== undefined) params.set('limit', String(opts.limit))
  if (opts?.q) params.set('q', opts.q)
  if (opts?.subjects?.length) params.set('subjects', opts.subjects.join(','))
  const qs = params.toString()
  const res = await apiFetch(`/api/problems${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('問題の取得に失敗しました')
  return res.json()
}

// POST /api/problems
export async function addProblem(input: ProblemInput): Promise<Problem> {
  const res = await apiFetch('/api/problems', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('問題の追加に失敗しました')
  return res.json()
}

// PUT /api/problems/:id
export async function updateProblem(id: number, input: ProblemInput): Promise<Problem> {
  const res = await apiFetch(`/api/problems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('問題の更新に失敗しました')
  return res.json()
}

// DELETE /api/problems/:id
export async function deleteProblem(id: number): Promise<void> {
  const res = await apiFetch(`/api/problems/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('問題の削除に失敗しました')
}

// GET /api/problems/:id
export async function fetchProblem(id: number): Promise<Problem> {
  const res = await apiFetch(`/api/problems/${id}`)
  if (!res.ok) throw new Error('問題の取得に失敗しました')
  return res.json()
}

// POST /api/ai/problems/:id/explain — 問題の解説を生成
export async function explainProblem(id: number): Promise<string> {
  const res = await apiFetch(`/api/ai/problems/${id}/explain`, { method: 'POST' })
  if (!res.ok) throw new Error('解説の生成に失敗しました')
  const data = await res.json()
  return data.explanation
}

// GET /api/problems/:id/quizzes
export async function fetchProblemQuizzes(id: number): Promise<ProblemQuiz[]> {
  const res = await apiFetch(`/api/problems/${id}/quizzes`)
  if (!res.ok) throw new Error('クイズの取得に失敗しました')
  return res.json()
}

// POST /api/problems/:id/quizzes
export async function addProblemQuiz(id: number, input: ProblemQuizInput): Promise<ProblemQuiz> {
  const res = await apiFetch(`/api/problems/${id}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('良問の登録に失敗しました')
  return res.json()
}

// DELETE /api/problems/:id/quizzes/:quizId
export async function deleteProblemQuiz(id: number, quizId: number): Promise<void> {
  const res = await apiFetch(`/api/problems/${id}/quizzes/${quizId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('良問の削除に失敗しました')
}

// POST /api/ai/analysis — multipart/form-data で画像を送信し、解析済み Problem を返す
export async function analyzeImage(
    image: File,
    problemId: number | null
): Promise<AnalysisResponse> {
  const form = new FormData()
  form.append('image', image)

  if (problemId != null) {
    form.append('problemId', String(problemId))
  }

  const res = await apiUpload('/api/ai/analysis', form)
  if (!res.ok) throw new Error('画像解析に失敗しました')

  return res.json()
}