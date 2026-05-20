import type {Problem} from '../../types/workspace'
import {fetchProblems} from '../api/problem'

const STOP_WORDS = new Set([
  'の', 'を', 'に', 'は', 'が', 'で', 'と', 'も', 'から', 'より', 'など',
  'について', 'する', 'ある', 'いる', 'なる', 'こと', 'ため', 'もの', 'とき',
  'これ', 'それ', 'あの', 'その',
])

function extractHashtagLines(note: string | null): string[] {
  if (!note) return []
  const lines: string[] = []
  const re = /#(?:Relation|Keyword)\s*([^\n#]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(note)) !== null) {
    const line = m[1].trim()
    if (line) lines.push(line)
  }
  return lines
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s　、。・「」【】（）()＝=→←↑↓\-／/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
}

const MAX_QUERIES = 6

export function buildQueries(current: Problem): string[] {
  const lines = extractHashtagLines(current.note)
  const words = lines.flatMap(tokenize)
  const candidates = [...lines, ...words]

  if (candidates.length === 0 && current.subCategory) {
    return [current.subCategory, ...tokenize(current.subCategory)].slice(0, MAX_QUERIES)
  }

  return [...new Set(candidates)].filter(Boolean).slice(0, MAX_QUERIES)
}

export function hasRelationOrKeyword(note: string | null): boolean {
  if (!note) return false
  return /#(?:Relation|Keyword)/.test(note)
}

export async function fetchRelated(current: Problem, limit = 5): Promise<Problem[]> {
  const queries = buildQueries(current)
  if (queries.length === 0) return []

  const results = await Promise.all(
    queries.map((q) => fetchProblems({q}))
  )

  const seen = new Set<number>()
  const merged: Problem[] = []
  for (const list of results) {
    for (const p of list) {
      if (!seen.has(p.id) && p.id !== current.id && hasRelationOrKeyword(p.note)) {
        seen.add(p.id)
        merged.push(p)
      }
    }
  }
  return merged.slice(0, limit)
}
