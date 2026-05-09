/**
 * ── Problems (苦手問題管理) ──────────────────────────────────────────────────
 */ import { apiFetch, apiUpload } from '../client'
import type {AnalysisResponse, Problem, ProblemInput} from '../../types/workspace'


// GET /api/problems?limit=N&after=ID
export async function fetchProblems(limit?: number, after?: number): Promise<Problem[]> {
  const params = new URLSearchParams()
  if (limit !== undefined) params.set('limit', String(limit))
  if (after !== undefined) params.set('after', String(after))
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

// POST /api/ai/analysis — multipart/form-data で画像を送信し、解析済み Problem を返す
export async function analyzeImage(image: File): Promise<AnalysisResponse> {
  const form = new FormData()
  form.append('image', image)
  const res = await apiUpload('/api/ai/analysis', form)
  if (!res.ok) throw new Error('画像解析に失敗しました')
  return res.json()
}