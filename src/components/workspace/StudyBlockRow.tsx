'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { StudySession, StudySessionInput } from '@/types/workspace'
import { SUBJECTS, MATERIALS, calcMinutes, formatMinutes } from '@/types/workspace'

function nowHHmm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type SaveInput = Omit<StudySessionInput, 'dailyLogDate' | 'timeSlot'>

type Props = {
  session?: StudySession
  onSave: (currentId: number | null, input: SaveInput) => Promise<number>
  onDelete: (currentId: number | null) => Promise<void>
  readonly?: boolean
}

// Inline text input — Notion style (bottom border only)
const textInp: React.CSSProperties = {
  border: 'none',
  borderBottom: '1px solid #edeae6',
  background: 'transparent',
  color: '#1a1108',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
  padding: '0.125rem 0',
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box',
}

// Time picker input — slightly structured
const timeInp: React.CSSProperties = {
  border: '1px solid #edeae6',
  borderRadius: '5px',
  background: '#faf8f6',
  color: '#1a1108',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  padding: '0.3rem 0.5rem',
  minWidth: '5.5rem',
  boxSizing: 'border-box',
}

const rowLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#b5a99a',
  whiteSpace: 'nowrap',
  minWidth: '2.25rem',
  letterSpacing: '0.02em',
  userSelect: 'none',
}

export function StudyBlockRow({ session, onSave, onDelete, readonly }: Props) {
  const uid = useId()

  const savedIdRef = useRef<number | null>(session?.id ?? null)
  const onSaveRef = useRef(onSave)
  const pendingRef = useRef<SaveInput | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRef = useRef({
    startTime: session?.startTime ?? '',
    endTime: session?.endTime ?? '',
    subject: session?.subject ?? '',
    material: session?.material ?? '',
    memo: session?.memo ?? '',
  })

  const [startTime, setStartTime] = useState(session?.startTime ?? nowHHmm())
  const [endTime, setEndTime] = useState(session?.endTime ?? '')
  const [subject, setSubject] = useState(session?.subject ?? '')
  const [material, setMaterial] = useState(session?.material ?? '')
  const [memo, setMemo] = useState(session?.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const doSave = useCallback(async (values: SaveInput) => {
    pendingRef.current = null
    setSaving(true)
    setSaveError(null)
    try {
      const newId = await onSaveRef.current(savedIdRef.current, values)
      savedIdRef.current = newId
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失敗')
    } finally {
      setSaving(false)
    }
  }, [])

  const scheduleSave = useCallback(
    (values: SaveInput) => {
      if (!values.subject.trim()) return
      pendingRef.current = values
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => doSave(values), 800)
    },
    [doSave],
  )

  const flushSave = useCallback(() => {
    if (pendingRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      doSave(pendingRef.current)
    }
  }, [doSave])

  useEffect(() => {
    const init = initialRef.current
    if (
      startTime === init.startTime &&
      endTime === init.endTime &&
      subject === init.subject &&
      material === init.material &&
      memo === init.memo
    )
      return

    scheduleSave({ startTime, endTime, subject, material, memo: memo.trim() || null })
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [startTime, endTime, subject, material, memo, scheduleSave])

  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }
    document.addEventListener('visibilitychange', handleHide)
    return () => {
      document.removeEventListener('visibilitychange', handleHide)
      flushSave()
    }
  }, [flushSave])

  async function handleDelete() {
    if (savedIdRef.current === null) {
      await onDelete(null)
      return
    }
    if (!confirm('このブロックを削除しますか？')) return
    setDeleting(true)
    try {
      await onDelete(savedIdRef.current)
    } finally {
      setDeleting(false)
    }
  }

  const minutes = calcMinutes(startTime, endTime)

  // ── Readonly ────────────────────────────────────────────────────────────
  if (readonly) {
    return (
      <div
        style={{
          padding: '0.875rem 1rem',
          background: '#ffffff',
          border: '1px solid #edeae6',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#8a7b6e', fontVariantNumeric: 'tabular-nums' }}>
            {startTime}
            {endTime ? ` — ${endTime}` : ''}
          </span>
          {minutes > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#b5a99a' }}>{formatMinutes(minutes)}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#1a1108', fontSize: '0.9375rem' }}>{subject}</span>
          {material && <span style={{ fontSize: '0.8125rem', color: '#8a7b6e' }}>{material}</span>}
        </div>
        {memo && (
          <p style={{ fontSize: '0.875rem', color: '#5c4a38', marginTop: '0.375rem', lineHeight: 1.5 }}>
            {memo}
          </p>
        )}
      </div>
    )
  }

  // ── Editable ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #edeae6',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* 時刻 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={timeInp}
        />
        <span style={{ color: '#c9c0b8', fontSize: '0.875rem', flexShrink: 0 }}>—</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={timeInp}
        />
        {minutes > 0 && (
          <span style={{ fontSize: '0.75rem', color: '#b5a99a', flexShrink: 0 }}>
            {formatMinutes(minutes)}
          </span>
        )}
        {/* Status + delete */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            flexShrink: 0,
          }}
        >
          {saving && (
            <span style={{ fontSize: '0.625rem', color: '#c9c0b8' }} aria-label="保存中">
              ●
            </span>
          )}
          {!saving && justSaved && (
            <span style={{ fontSize: '0.625rem', color: '#4c7a3a' }} aria-label="保存済み">
              ✓
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="削除"
            style={{
              fontSize: '1rem',
              lineHeight: 1,
              color: '#c9c0b8',
              background: 'none',
              border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              padding: '0.125rem 0.25rem',
              borderRadius: '4px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 実績: 科目 + 教材 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={rowLabel}>実績</span>
        <input
          list={`${uid}-subj`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="科目"
          style={{ ...textInp, flex: 2 }}
        />
        <datalist id={`${uid}-subj`}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <input
          list={`${uid}-mat`}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="教材"
          style={{ ...textInp, flex: 1 }}
        />
        <datalist id={`${uid}-mat`}>
          {MATERIALS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      {/* 備考 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={rowLabel}>備考</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="完 / 苦手問題のみ など"
          style={textInp}
        />
      </div>

      {saveError && (
        <p style={{ fontSize: '0.75rem', color: '#c0392b', marginTop: '0.125rem' }}>{saveError}</p>
      )}
    </div>
  )
}
