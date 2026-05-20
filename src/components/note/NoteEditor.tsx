import {useMemo, useRef, useState} from 'react'
import {HASHTAG_KEYS, HASHTAG_MAP} from '@/components/common/MarkdownContent'
import {c, font} from '../../styles/notion'

// ── 自動整形 ──────────────────────────────────────────────────────────────────

const HASHTAG_LINE_RE = /^#(Definition|Keyword|Pitfall|Example|Relation|MemoryHook|Formula)[ \t]/

export function autoFormat(text: string): string {
  // 太字の前後に半角スペースを補う
  text = text
      .replace(/(\S)(\*\*[^*\n]+?\*\*)/g, '$1 $2')
      .replace(/(\*\*[^*\n]+?\*\*)(\S)/g, '$1 $2')

  const lines = text.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isHashtag = HASHTAG_LINE_RE.test(line)
    const isHeading = /^#{1,6} /.test(line)
    const prev = result[result.length - 1]

    // 前だけ空ける
    if ((isHashtag || isHeading) && result.length > 0 && prev !== '') {
      result.push('')
    }

    result.push(line)
  }

  // 連続空行を1つに
  const normalized: string[] = []
  let wasBlank = false

  for (const line of result) {
    if (line === '') {
      if (!wasBlank) normalized.push('')
      wasBlank = true
    } else {
      normalized.push(line)
      wasBlank = false
    }
  }

  return normalized.join('\n').trim()
}

// ── NoteEditor ────────────────────────────────────────────────────────────────

type Props = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  minHeight?: string
  stretch?: boolean
}

export function NoteEditor({value, onChange, onBlur, minHeight = '280px', stretch}: Props) {
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestFilter, setSuggestFilter] = useState('')
  const [suggestAnchor, setSuggestAnchor] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // セクション充足インジケーター
  const detectedTags = useMemo(() => {
    const re = /#(Definition|Keyword|Pitfall|Example|Relation|MemoryHook|Formula)(?=\s|$)/g
    return new Set([...value.matchAll(re)].map((m) => m[1]))
  }, [value])

  // # オートコンプリート候補
  const filteredSuggests = useMemo(
    () =>
      HASHTAG_KEYS.filter(
        (tag) => suggestFilter === '' || tag.toLowerCase().startsWith(suggestFilter.toLowerCase()),
      ),
    [suggestFilter],
  )

  // ── onChange ──
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    const pos = e.target.selectionStart

    if (suggestAnchor !== null) {
      const typed = v.slice(suggestAnchor + 1, pos)
      if (/^\w*$/.test(typed) && pos > suggestAnchor) {
        setSuggestFilter(typed)
        setShowSuggest(true)
      } else {
        setSuggestAnchor(null)
        setShowSuggest(false)
      }
    } else if (v[pos - 1] === '#') {
      setSuggestAnchor(pos - 1)
      setSuggestFilter('')
      setShowSuggest(true)
    } else {
      setShowSuggest(false)
    }

    onChange(v)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggest) return
    if (e.key === 'Escape') {
      setShowSuggest(false)
      setSuggestAnchor(null)
      e.preventDefault()
    } else if (e.key === 'Tab' && filteredSuggests.length > 0) {
      e.preventDefault()
      selectSuggest(filteredSuggests[0])
    }
  }

  // ── # 候補選択 ──
  const selectSuggest = (tag: string) => {
    const el = textareaRef.current
    if (!el || suggestAnchor === null) return
    const pos = el.selectionStart
    const next = value.slice(0, suggestAnchor) + `#${tag} ` + value.slice(pos)
    onChange(next)
    setSuggestAnchor(null)
    setShowSuggest(false)
    const newPos = suggestAnchor + tag.length + 2
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newPos, newPos)
    })
  }

  // ── ハッシュタグ挿入 ──
  const insertTag = (tag: string) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const insert = `#${tag} `
    const next = value.slice(0, pos) + insert + value.slice(pos)
    onChange(next)
    setShowSuggest(false)
    const newPos = pos + insert.length
    requestAnimationFrame(() => el.setSelectionRange(newPos, newPos))
  }

  // ── マークダウン装飾 ──
  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'テキスト'
    const next = value.slice(0, start) + before + selected + after + value.slice(end || start)
    onChange(next)
    const newStart = start + before.length
    const newEnd = newStart + selected.length
    requestAnimationFrame(() => el.setSelectionRange(newStart, newEnd))
  }

  // ── 行頭プレフィックス挿入 / トグル ──
  const insertAtLineStart = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1
    if (value.slice(lineStart).startsWith(prefix)) {
      const next = value.slice(0, lineStart) + value.slice(lineStart + prefix.length)
      onChange(next)
      const newPos = Math.max(pos - prefix.length, lineStart)
      requestAnimationFrame(() => el.setSelectionRange(newPos, newPos))
    } else {
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
      onChange(next)
      const newPos = pos + prefix.length
      requestAnimationFrame(() => el.setSelectionRange(newPos, newPos))
    }
  }

  // ── 自動整形 ──
  const handleAutoFormat = () => {
    const formatted = autoFormat(value)
    onChange(formatted)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  return (
    <div style={stretch ? {...wrapper, flex: 1, display: 'flex', flexDirection: 'column', border: 'none', borderRadius: 0} : wrapper}>
      {/* マークダウン操作ツールバー */}
      <div style={mdToolbarRow}>
        {(
          [
            {label: <b>B</b>, title: '太字',         action: () => wrapSelection('**')},
            {label: <i>I</i>, title: '斜体',         action: () => wrapSelection('*')},
            {label: 'H2',     title: '見出し2',       action: () => insertAtLineStart('## ')},
            {label: 'H3',     title: '見出し3',       action: () => insertAtLineStart('### ')},
            {label: '•',      title: '箇条書き',      action: () => insertAtLineStart('- ')},
            {label: '1.',     title: '番号付きリスト', action: () => insertAtLineStart('1. ')},
          ] as {label: React.ReactNode; title: string; action: () => void}[]
        ).map(({label, title, action}) => (
          <button
            key={title}
            title={title}
            onPointerDown={(e) => { e.preventDefault(); action() }}
            style={mdBtn}
          >
            {label}
          </button>
        ))}
        <div style={{flex: 1}} />
        <button
          title="自動整形"
          onPointerDown={(e) => { e.preventDefault(); handleAutoFormat() }}
          style={fmtBtn}
        >
          整形
        </button>
      </div>

      {/* ハッシュタグ挿入ツールバー */}
      <div style={hashtagToolbarRow}>
        {HASHTAG_KEYS.map((tag) => {
          const info = HASHTAG_MAP[tag]
          return (
            <button
              key={tag}
              title={`#${tag} を挿入`}
              onPointerDown={(e) => { e.preventDefault(); insertTag(tag) }}
              style={{
                ...hashtagBtn,
                color: info.color,
                backgroundColor: info.bg,
                border: `1px solid ${info.color}38`,
              }}
            >
              {info.label}
            </button>
          )
        })}
      </div>

      {/* # オートコンプリートドロップダウン */}
      {showSuggest && filteredSuggests.length > 0 && (
        <div style={suggestBox}>
          {filteredSuggests.map((tag) => {
            const info = HASHTAG_MAP[tag]
            return (
              <button
                key={tag}
                onPointerDown={(e) => { e.preventDefault(); selectSuggest(tag) }}
                style={suggestItem}
              >
                <span style={{fontFamily: 'monospace', color: info.color, fontWeight: 700, fontSize: '13px'}}>
                  #{tag}
                </span>
                <span style={{color: c.textSub, fontSize: font.sm}}>— {info.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        style={stretch ? {...noteTextarea, flex: 1, resize: 'none'} : {...noteTextarea, minHeight}}
        placeholder={'ノートをとる…\n\n▎ #Definition 定義内容…（2回改行でセクション終了）'}
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
      />

      {/* セクション充足インジケーター */}
      <div style={indicatorRow}>
        {HASHTAG_KEYS.map((tag) => {
          const info = HASHTAG_MAP[tag]
          const active = detectedTags.has(tag)
          return (
            <span
              key={tag}
              style={{
                ...indicatorBadge,
                color: active ? info.color : '#bbb',
                backgroundColor: active ? info.bg : 'rgba(55,53,47,0.04)',
                border: `1px solid ${active ? `${info.color}38` : 'transparent'}`,
              }}
            >
              {active ? '●' : '○'} {info.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── スタイル ─────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  border: `1px solid ${c.border}`,
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#fff',
}

const mdToolbarRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '5px 8px',
  borderBottom: `1px solid rgba(55,53,47,0.06)`,
  backgroundColor: '#fafaf9',
}

const mdBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '30px',
  border: 'none',
  background: 'transparent',
  borderRadius: '5px',
  fontSize: '13px',
  fontWeight: 700,
  color: c.text,
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'inherit',
}

const fmtBtn: React.CSSProperties = {
  padding: '4px 10px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  borderRadius: '5px',
  fontSize: '12px',
  fontWeight: 700,
  color: c.textSub,
  cursor: 'pointer',
  flexShrink: 0,
}

const hashtagToolbarRow: React.CSSProperties = {
  display: 'flex',
  gap: '5px',
  padding: '6px 8px',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
  scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
  borderBottom: `1px solid rgba(55,53,47,0.06)`,
  backgroundColor: '#fafaf9',
}

const hashtagBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  padding: '3px 9px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  lineHeight: 1.5,
}

const suggestBox: React.CSSProperties = {
  borderBottom: `1px solid ${c.border}`,
  backgroundColor: '#fafaf9',
  maxHeight: '160px',
  overflowY: 'auto',
}

const suggestItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '9px 14px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: '14px',
  borderBottom: `1px solid rgba(55,53,47,0.04)`,
  boxSizing: 'border-box' as const,
}

const noteTextarea: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: 0,
  fontSize: '15px',
  lineHeight: 1.75,
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
  color: c.text,
  outline: 'none',
}

const indicatorRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  padding: '8px',
  borderTop: `1px solid rgba(55,53,47,0.06)`,
  backgroundColor: '#fafaf9',
}

const indicatorBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '2px 7px',
  borderRadius: '10px',
  fontSize: '10px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s',
}
