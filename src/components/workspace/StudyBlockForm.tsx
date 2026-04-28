'use client'

import { useId, useState, useEffect } from 'react'
import type { StudySessionInput, TimeSlot } from '@/types/workspace'
import { SUBJECTS, MATERIALS } from '@/types/workspace'

type InitialValues = {
  minutes: number    // 時刻から数値に変更
  subject: string
  material: string
  memo: string | null
}

type Props = {
  date: string
  timeSlot: TimeSlot
  initial?: InitialValues
  initialMinutes?: number // ストップウォッチからの直接注入用
  onSubmit: (input: StudySessionInput) => Promise<void>
  onCancel: () => void
}

// スタイル定数は既存のものを継承
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

export function StudyBlockForm({ date, timeSlot, initial, initialMinutes, onSubmit, onCancel }: Props) {
  const id = useId()

  // 状態管理を「分」ベースに変更
  const [minutes, setMinutes] = useState<string>(
      String(initial?.minutes ?? initialMinutes ?? '')
  )
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const mins = parseInt(minutes, 10)
    if (isNaN(mins) || mins <= 0) {
      setError('学習時間を正しく入力してください')
      return
    }
    if (!subject.trim()) {
      setError('科目を入力してください')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        dailyLogDate: date,
        timeSlot,
        minutes: mins, // backend側もnumber型を想定
        subject: subject.trim(),
        material: material.trim(),
        memo: memo.trim() || null,
      })
      // リセット
      setMinutes('')
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
        {/* 学習時間入力 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={label}>時間:</span>
          <input
              type="number"
              inputMode="numeric" // モバイルで数値キーボードを表示
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              required
              style={{ ...inp, width: '5rem', textAlign: 'right' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#7a6858' }}>分</span>
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

        {/* ボタン類（既存のまま） */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>キャンセル</button>
          <button type="submit" disabled={loading} style={saveBtnStyle(loading)}>
            {loading ? '…' : '保存'}
          </button>
        </div>
      </form>
  )
}

// 整理のためスタイルを一部変数化（内容は以前と同様）
const cancelBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem', border: '1px solid #000000', borderRadius: '4px',
  background: 'none', color: '#7a6858', fontSize: '0.8125rem', cursor: 'pointer',
}
const saveBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: '0.25rem 0.75rem', border: 'none', borderRadius: '4px',
  background: '#5c3a1e', color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
})