'use client'

import type { Problem, ProblemInput } from '@/types/workspace'
import { getToken } from '@/lib/auth'

const PROBLEMS_KEY = 'exapp_problems'

// ── Mock helpers ─────────────────────────────────────────────────────────────

function loadProblems(): Problem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(PROBLEMS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveProblems(problems: Problem[]) {
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems))
}

function now(): string {
  return new Date().toISOString()
}

function nextId(problems: Problem[]): number {
  return problems.length === 0 ? 1 : Math.max(...problems.map((p) => p.id)) + 1
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── API functions ─────────────────────────────────────────────────────────────

// GET /api/problems
export async function fetchProblems(): Promise<Problem[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const problems = loadProblems()
    return [...problems].sort((a, b) => {
      if (b.solvedAt !== a.solvedAt) return b.solvedAt.localeCompare(a.solvedAt)
      return b.id - a.id
    })
  }

  const res = await fetch('/api/problems', { headers: await authHeaders() })
  if (!res.ok) throw new Error('問題の取得に失敗しました')
  return res.json()
}

// POST /api/problems
export async function addProblem(input: ProblemInput): Promise<Problem> {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const problems = loadProblems()
    const problem: Problem = {
      ...input,
      id: nextId(problems),
      createdAt: now(),
      updatedAt: now(),
    }
    saveProblems([...problems, problem])
    return problem
  }

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
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const problems = loadProblems()
    const idx = problems.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('問題が見つかりません')
    problems[idx] = { ...problems[idx], ...input, updatedAt: now() }
    saveProblems(problems)
    return problems[idx]
  }

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
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    saveProblems(loadProblems().filter((p) => p.id !== id))
    return
  }

  const res = await fetch(`/api/problems/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('問題の削除に失敗しました')
}
