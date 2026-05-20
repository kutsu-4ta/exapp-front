import {useEffect, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {fetchProblems} from '../../lib/api/problem'
import {c, font} from '../../styles/notion'

// ── 検索ロジック ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'の', 'を', 'に', 'は', 'が', 'で', 'と', 'も', 'から', 'より', 'など',
  'について', 'する', 'ある', 'いる', 'なる', 'こと', 'ため', 'もの', 'とき',
  'これ', 'それ', 'あの', 'その',
])

/** note から #Relation / #Keyword 直後のテキストを行単位で抽出する */
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

/** テキストを意味のある単語レベルに分割する */
function tokenize(text: string): string[] {
  return text
    .split(/[\s　、。・「」【】（）()＝=→←↑↓\-／/・]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
}

/**
 * 現Problemのノートから検索クエリ一覧を生成する。
 * - #Relation / #Keyword 行全体
 * - それを単語分割したもの
 * - フォールバック: subCategory
 * 重複除去して最大 MAX_QUERIES 件に絞る。
 */
const MAX_QUERIES = 6

function buildQueries(current: Problem): string[] {
  const lines = extractHashtagLines(current.note)
  const words = lines.flatMap(tokenize)
  const candidates = [...lines, ...words]

  if (candidates.length === 0 && current.subCategory) {
    return [current.subCategory, ...tokenize(current.subCategory)].slice(0, MAX_QUERIES)
  }

  return [...new Set(candidates)].filter(Boolean).slice(0, MAX_QUERIES)
}

/** ヒット条件: note に #Relation または #Keyword が含まれている */
function hasRelationOrKeyword(note: string | null): boolean {
  if (!note) return false
  return /#(?:Relation|Keyword)/.test(note)
}

// ── コンポーネント ────────────────────────────────────────────────────────────

type Props = {
  current: Problem
  onSelect: (problem: Problem) => void
}

export function RelatedProblemsSection({current, onSelect}: Props) {
  const [related, setRelated] = useState<Problem[]>([])

  useEffect(() => {
    const queries = buildQueries(current)

    if (queries.length === 0) {
      setRelated([])
      return
    }

    Promise.all(
      queries.map((q) => fetchProblems({subjects: [current.subject], q}))
    )
      .then((results) => {
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
        setRelated(merged.slice(0, 5))
      })
      .catch(() => {})
  }, [current.id])  // eslint-disable-line react-hooks/exhaustive-deps

  if (related.length === 0) return null

  return (
    <div style={container}>
      <div style={header}>
        <span style={headerLabel}>芋づる</span>
        <span style={headerCount}>{related.length}件</span>
      </div>
      <div style={list}>
        {related.map((p) => (
          <button key={p.id} style={row} onClick={() => onSelect(p)}>
            <div style={rowContent}>
              <div style={rowTitle}>{p.subCategory ?? p.subject}</div>
              <div style={rowMeta}>
                {[p.subCategory ? p.subject : null, p.questionRef]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <span style={arrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  marginBottom: 14,
}

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 12px 8px',
  borderBottom: `1px solid ${c.border}`,
}

const headerLabel: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  color: c.textHint,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const headerCount: React.CSSProperties = {
  fontSize: font.xs,
  fontWeight: 600,
  color: c.textFaint,
}

const list: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '9px 12px',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${c.border}`,
  cursor: 'pointer',
  textAlign: 'left',
}

const rowContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const rowTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: c.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowMeta: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  marginTop: 1,
}

const arrow: React.CSSProperties = {
  flexShrink: 0,
  fontSize: '14px',
  color: c.textFaint,
}
