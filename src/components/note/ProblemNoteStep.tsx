import {useEffect, useMemo, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {Pencil} from 'lucide-react'
import {c, font} from '../../styles/notion'
import {HASHTAG_KEYS, HASHTAG_MAP, MarkdownContent} from '@/components/common/MarkdownContent'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'
import {BottomSheet, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

// ── 自動整形 ──────────────────────────────────────────────────────────────────

const HASHTAG_LINE_RE = /^#(Definition|Keyword|Pitfall|Example|Relation|MemoryHook|Formula)[ \t]/

function autoFormat(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isHashtag = HASHTAG_LINE_RE.test(line)
    const isHeading = /^#{1,6} /.test(line)
    const prev = result[result.length - 1]
    const nextLine = lines[i + 1]

    if ((isHashtag || isHeading) && result.length > 0 && prev !== '') result.push('')
    result.push(line)
    if ((isHashtag || isHeading) && nextLine !== undefined && nextLine !== '') result.push('')
  }

  while (result.length > 0 && result[result.length - 1] === '') result.pop()

  const normalized: string[] = []
  let wasBlank = false
  for (const line of result) {
    if (line === '') {
      if (!wasBlank) normalized.push(line)
      wasBlank = true
    } else {
      wasBlank = false
      normalized.push(line)
    }
  }

  return normalized.join('\n')
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export function ProblemNoteStep({problem, onAutoSave, onClose}: Props) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const [note, setNote] = useState(problem.note ?? '')
  const [preview, setPreview] = useState(false)
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // # オートコンプリート
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestFilter, setSuggestFilter] = useState('')
  const [suggestAnchor, setSuggestAnchor] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const successTimerRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
      window.clearTimeout(timerRef.current ?? 0)
      window.clearTimeout(successTimerRef.current ?? 0)
    }
  }, [])

  function scheduleSave(value: string) {
    setSaveSuccessVisible(false)
    setIsSaving(true)
    window.clearTimeout(timerRef.current ?? 0)
    timerRef.current = window.setTimeout(async () => {
      try {
        await onAutoSave(value)
        window.clearTimeout(successTimerRef.current ?? 0)
        setSaveSuccessVisible(true)
        successTimerRef.current = window.setTimeout(() => setSaveSuccessVisible(false), 3000)
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }

  // セクション充足インジケーター用
  const detectedTags = useMemo(() => {
    const re = /#(Definition|Keyword|Pitfall|Example|Relation|MemoryHook|Formula)(?=\s|$)/g
    return new Set([...note.matchAll(re)].map((m) => m[1]))
  }, [note])

  // フィルター済み候補
  const filteredSuggests = useMemo(
    () =>
      HASHTAG_KEYS.filter(
        (tag) => suggestFilter === '' || tag.toLowerCase().startsWith(suggestFilter.toLowerCase()),
      ),
    [suggestFilter],
  )

  // ── onChange: # オートコンプリート検知 ──
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

    setNote(v)
    scheduleSave(v)
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
    const next = note.slice(0, suggestAnchor) + `#${tag} ` + note.slice(pos)
    setNote(next)
    scheduleSave(next)
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
    const next = note.slice(0, pos) + insert + note.slice(pos)
    setNote(next)
    scheduleSave(next)
    setShowSuggest(false)
    const newPos = pos + insert.length
    requestAnimationFrame(() => {
      el.setSelectionRange(newPos, newPos)
    })
  }

  // ── マークダウン装飾（選択範囲を囲む）──
  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = note.slice(start, end) || 'テキスト'
    const next = note.slice(0, start) + before + selected + after + note.slice(end || start)
    setNote(next)
    scheduleSave(next)
    const newStart = start + before.length
    const newEnd = newStart + selected.length
    requestAnimationFrame(() => {
      el.setSelectionRange(newStart, newEnd)
    })
  }

  // ── 行頭プレフィックス挿入 / トグル ──
  const insertAtLineStart = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const lineStart = note.lastIndexOf('\n', pos - 1) + 1
    if (note.slice(lineStart).startsWith(prefix)) {
      const next = note.slice(0, lineStart) + note.slice(lineStart + prefix.length)
      setNote(next)
      scheduleSave(next)
      const newPos = Math.max(pos - prefix.length, lineStart)
      requestAnimationFrame(() => el.setSelectionRange(newPos, newPos))
    } else {
      const next = note.slice(0, lineStart) + prefix + note.slice(lineStart)
      setNote(next)
      scheduleSave(next)
      const newPos = pos + prefix.length
      requestAnimationFrame(() => el.setSelectionRange(newPos, newPos))
    }
  }

  // ── 自動整形 ──
  const handleAutoFormat = () => {
    const formatted = autoFormat(note)
    setNote(formatted)
    scheduleSave(formatted)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  return (
    <BottomSheet onClose={onClose} height="90vh">
      {/* ヘッダー */}
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} disabled={isSaving} style={{...closeBtn, opacity: isSaving ? 0.7 : 1}}>
          ×
        </button>
        <div style={headerRight}>
          {(isSaving || saveSuccessVisible) && (
            <span style={isSaving ? saveLabelSaving : saveLabelSuccess}>
              {isSaving ? '保存中…' : '自動保存済み'}
            </span>
          )}
          <button
            style={{...iconBtn, background: !preview ? '#eef5ff' : 'none', borderRadius: '6px'}}
            onClick={() => setPreview((v) => !v)}
            title={preview ? '編集' : 'プレビュー'}
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>

      {/* ツールバー（編集モードのみ・スクロールしない） */}
      {!preview && (
        <div style={toolbarArea}>
          {/* マークダウン操作ツールバー */}
          <div style={mdToolbarRow}>
            {(
              [
                {label: <b>B</b>,  title: '太字',           action: () => wrapSelection('**')},
                {label: <i>I</i>,  title: '斜体',           action: () => wrapSelection('*')},
                {label: 'H2',      title: '見出し2',         action: () => insertAtLineStart('## ')},
                {label: 'H3',      title: '見出し3',         action: () => insertAtLineStart('### ')},
                {label: '•',       title: '箇条書き',        action: () => insertAtLineStart('- ')},
                {label: '1.',      title: '番号付きリスト',   action: () => insertAtLineStart('1. ')},
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
        </div>
      )}

      {/* スクロール可能な本文エリア */}
      <div style={body}>
        <div style={metaRow}>
          <span
            style={{
              ...subjectTag,
              background: subjectPalette(problem.subject, subjectColors[problem.subject]).bg,
              color: subjectPalette(problem.subject, subjectColors[problem.subject]).color,
            }}
          >
            {problem.subject}
          </span>
          <span style={subCatTag}>
            {problem.materialName} {problem.questionRef}
          </span>
        </div>

        {problem.subCategory && <p style={questionRefStyle}>{problem.subCategory}</p>}

        <div style={section}>
          {!preview && <p style={sectionLbl}>ノート</p>}

          {preview ? (
            <div style={markdownPreview}>
              <MarkdownContent>{note}</MarkdownContent>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={note}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => scheduleSave(note)}
              style={noteTextarea}
              placeholder={'ノートをとる…\n\n▎ #Definition 定義内容…（2回改行でセクション終了）'}
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
            />
          )}

          {/* セクション充足インジケーター */}
          {!preview && (
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
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

// ── スタイル ─────────────────────────────────────────────────────────────────

const closeBtn: React.CSSProperties = {border: 'none', background: 'none', fontSize: '20px', color: 'rgba(55,53,47,0.4)', cursor: 'pointer', lineHeight: 1, padding: '0 2px'}
const headerRight: React.CSSProperties = {display: 'flex', alignItems: 'center', gap: '12px'}
const iconBtn: React.CSSProperties = {border: 'none', background: 'none', color: c.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'}
const saveLabelSuccess: React.CSSProperties = {fontSize: '12px', color: '#19a576'}
const saveLabelSaving: React.CSSProperties = {fontSize: '12px', color: c.textHint}

const toolbarArea: React.CSSProperties = {borderBottom: `1px solid ${c.border}`, flexShrink: 0}

const mdToolbarRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '5px 8px',
  borderBottom: `1px solid rgba(55,53,47,0.06)`,
}

const mdBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '32px',
  border: 'none',
  background: 'transparent',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 700,
  color: c.text,
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'inherit',
}

const fmtBtn: React.CSSProperties = {
  padding: '5px 10px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  color: c.textSub,
  cursor: 'pointer',
  flexShrink: 0,
}

const hashtagToolbarRow: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '7px 8px',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
  scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
}

const hashtagBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  padding: '4px 10px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  lineHeight: 1.5,
}

const suggestBox: React.CSSProperties = {
  borderTop: `1px solid ${c.border}`,
  backgroundColor: '#fafaf9',
  maxHeight: '160px',
  overflowY: 'auto',
}

const suggestItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: '14px',
  borderBottom: `1px solid rgba(55,53,47,0.04)`,
  boxSizing: 'border-box' as const,
}

const body: React.CSSProperties = {padding: '12px 16px 20px', overflowY: 'auto', flex: 1}
const metaRow: React.CSSProperties = {display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px'}
const subjectTag: React.CSSProperties = {padding: '3px 8px', borderRadius: '6px', fontSize: font.sm, fontWeight: 600}
const subCatTag: React.CSSProperties = {padding: '3px 8px', borderRadius: '6px', background: '#f6f6f6', color: c.textSub, fontSize: font.sm}
const questionRefStyle: React.CSSProperties = {fontSize: '16px', fontWeight: 600, margin: '0 0 10px', color: c.text}
const section: React.CSSProperties = {marginBottom: '20px'}
const sectionLbl: React.CSSProperties = {fontSize: '11px', fontWeight: 700, color: c.textHint, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 6px'}

const noteTextarea: React.CSSProperties = {
  width: '100%',
  minHeight: '280px',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  fontSize: '15px',
  lineHeight: 1.75,
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
  color: c.text,
  outline: 'none',
}

const markdownPreview: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  minHeight: '200px',
  fontSize: '15px',
  lineHeight: 1.7,
}

const indicatorRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '5px',
  marginTop: '10px',
}

const indicatorBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s',
}
