import {apiFetch} from '../client'

export type Snippet = {
  id: number
  title: string
  content: string
}

export type SnippetInput = {
  title: string
  content: string
}

export const MAX_SLOTS = 10
export const MAX_TITLE = 60
export const MAX_CONTENT = 2000

export async function fetchSnippets(): Promise<Snippet[]> {
  const res = await apiFetch('/api/snippets')
  if (!res.ok) throw new Error('スニペットの取得に失敗しました')
  return res.json()
}

export async function createSnippet(input: SnippetInput): Promise<Snippet> {
  const res = await apiFetch('/api/snippets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('スニペットの作成に失敗しました')
  return res.json()
}

export async function updateSnippet(id: number, input: SnippetInput): Promise<Snippet> {
  const res = await apiFetch(`/api/snippets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('スニペットの更新に失敗しました')
  return res.json()
}

export async function deleteSnippet(id: number): Promise<void> {
  const res = await apiFetch(`/api/snippets/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('スニペットの削除に失敗しました')
}
