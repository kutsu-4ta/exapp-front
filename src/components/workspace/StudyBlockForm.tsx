'use client'

import { useId, useState } from 'react'
import type { StudySessionInput, TimeSlot } from '@/types/workspace'
import { SUBJECTS, MATERIALS } from '@/types/workspace'

function nowHHmm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type InitialValues = {
  startTime: string
  endTime: string
  subject: string
  material: string
  memo: string | null
}

type Props = {
  date: string
  timeSlot: TimeSlot
  initial?: InitialValues
  onSubmit: (input: StudySessionInput) => Promise<void>
  onCancel: () => void
}

const inp: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: '1px solid #000000',
  borderRadius: '4px',
  backgroundColor: '#faf8f4',
  color: '#2a1c10',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  minWidth: 0,
  boxSizing: 'border-box',
}

const label: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#7a6858',
  whiteSpace: 'nowrap',
  minWidth: '2.5rem',
  letterSpacing: '0.02em',
}

export function StudyBlockForm({ date, timeSlot, initial, onSubmit, onCancel }: Props) {
  const id = useId()
  const [startTime, setStartTime] = useState(initial?.startTime ?? nowHHmm())
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!subject.trim()) {
      setError('科目を入力してください')
      return
    }
    if (endTime) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      if (eh * 60 + em <= sh * 60 + sm) {
        setError('終了は開始より後にしてください')
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit({
        dailyLogDate: date,
        timeSlot,
        startTime,
        endTime,
        subject: subject.trim(),
        material: material.trim(),
        memo: memo.trim() || null,
      })
      // Reset for next entry (edit mode: parent unmounts this component)
      setStartTime(nowHHmm())
      setEndTime('')
      setSubject('')
      setMaterial('')
      setMemo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.625rem 0.75rem',
        backgroundColor: '#faf8f4',
        border: '1px solid #000000',
        borderRadius: '6px',
      }}
    >
      {/* 時刻 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          style={{ ...inp, width: '7.5rem' }}
        />
        <span style={{ color: '#b5a99a', fontSize: '0.875rem' }}>〜</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{ ...inp, width: '7.5rem' }}
        />
      </div>

      {/* 実績: 科目 + 教材 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={label}>実績:</span>
        <input
          list={`${id}-subjects`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="科目"
          style={{ ...inp, flex: 1 }}
        />
        <datalist id={`${id}-subjects`}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <input
          list={`${id}-materials`}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="教材"
          style={{ ...inp, flex: 1 }}
        />
        <datalist id={`${id}-materials`}>
          {MATERIALS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      {/* 備考: メモ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={label}>備考:</span>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="完 / 苦手問題のみ など"
          style={{ ...inp, flex: 1 }}
        />
      </div>

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#c0392b', letterSpacing: '0.02em' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.25rem 0.75rem',
            border: '1px solid #000000',
            borderRadius: '4px',
            background: 'none',
            color: '#7a6858',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.25rem 0.75rem',
            border: 'none',
            borderRadius: '4px',
            background: '#5c3a1e',
            color: '#fff',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : '保存'}
        </button>
      </div>
    </form>
  )
}
