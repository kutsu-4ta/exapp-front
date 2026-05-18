export type Snippet = {
  id: string
  title: string
  content: string
}

export const MAX_SLOTS = 10
export const MAX_TITLE = 60
export const MAX_CONTENT = 2000

const KEY = 'tsumiki_snippets'

export function loadSnippets(): Snippet[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveSnippets(snippets: Snippet[]): void {
  localStorage.setItem(KEY, JSON.stringify(snippets))
}

export function newSnippetId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
