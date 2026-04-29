'use client'

import type { Problem, ProblemInput } from '@/types/workspace'
import { getToken } from '@/lib/auth'

async function authHeaders(): Promise<HeadersInit> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// GET /api/problems
export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch('/api/problems', { headers: await authHeaders() })
  if (!res.ok) throw new Error('問題の取得に失敗しました')
  return res.json()
}

// POST /api/problems
export async function addProblem(input: ProblemInput): Promise<Problem> {
  const res = await fetch('/api/problems', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('問題の追加に失敗しました')
  return res.json()
}

// PUT /api/problems/:id
export async function updateProblem(id: number, input: ProblemInput): Promise<Problem> {
  const res = await fetch(`/api/problems/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('問題の更新に失敗しました')
  return res.json()
}

// DELETE /api/problems/:id
export async function deleteProblem(id: number): Promise<void> {
  const res = await fetch(`/api/problems/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('問題の削除に失敗しました')
}
