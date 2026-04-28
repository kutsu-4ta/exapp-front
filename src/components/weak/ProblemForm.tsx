'use client'

import { useState } from 'react'
import {
  SUBJECTS,
  MATERIALS,
  PROFICIENCY_VALUES,
  FAILURE_TYPE_VALUES,
  todayString,
  type Proficiency,
  type FailureType,
  type ProblemInput,
} from '@/types/workspace'

type Props = {
  initial?: ProblemInput
  onSubmit: (input: ProblemInput) => Promise<void>
  onCancel: () => void
}

export function ProblemForm({ initial, onSubmit, onCancel }: Props) {
  const isEdit = initial !== undefined

  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [questionRef, setQuestionRef] = useState(initial?.questionRef ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [proficiency, setProficiency] = useState<Proficiency>(initial?.proficiency ?? '×')
  const [failureTypes, setFailureTypes] = useState<FailureType[]>(initial?.failureTypes ?? [])
  const [isGoodQuestion, setIsGoodQuestion] = useState(initial?.isGoodQuestion ?? false)
  const [solvedAt, setSolvedAt] = useState(initial?.solvedAt ?? todayString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subjectId = `pf-subject-${Math.random().toString(36).slice(2)}`
  const materialId = `pf-material-${Math.random().toString(36).slice(2)}`

  function toggleFailureType(ft: FailureType) {
    setFailureTypes((prev) =>
      prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft],
    )
  }

  async function handleSubmit() {
    if (!subject.trim()) { setError('科目を入力してください'); return }
    if (!questionRef.trim()) { setError('問題番号を入力してください'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        subject: subject.trim(),
        material: material.trim(),
        questionRef: questionRef.trim(),
        note: note.trim() || null,
        proficiency,
        failureTypes,
        isGoodQuestion,
        solvedAt,
      })
      if (!isEdit) {
        // keep subject, reset everything else for consecutive entry
        setMaterial('')
        setQuestionRef('')
        setNote('')
        setProficiency('×')
        setFailureTypes([])
        setIsGoodQuestion(false)
        setSolvedAt(todayString())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={formWrap}>
      {/* Row 1: subject + material */}
      <div style={row}>
        <div style={field}>
          <label style={labelStyle} htmlFor={subjectId}>科目</label>
          <input
            id={subjectId}
            list="pf-subjects"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="科目を選択または入力"
            style={inp}
          />
          <datalist id="pf-subjects">
            {SUBJECTS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div style={field}>
          <label style={labelStyle} htmlFor={materialId}>教材</label>
          <input
            id={materialId}
            list="pf-materials"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="教材"
            style={inp}
          />
          <datalist id="pf-materials">
            {MATERIALS.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
      </div>

      {/* Row 2: question ref + date */}
      <div style={row}>
        <div style={{ ...field, flex: 2 }}>
          <label style={labelStyle}>問題番号</label>
          <input
            value={questionRef}
            onChange={(e) => setQuestionRef(e.target.value)}
            placeholder="Q23 / 2023年第3問A など"
            style={inp}
          />
        </div>
        <div style={field}>
          <label style={labelStyle}>日付</label>
          <input
            type="date"
            value={solvedAt}
            onChange={(e) => setSolvedAt(e.target.value)}
            style={inp}
          />
        </div>
      </div>

      {/* Row 3: proficiency */}
      <div>
        <p style={labelStyle}>習熟度</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
          {PROFICIENCY_VALUES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProficiency(p)}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '8px',
                border: proficiency === p ? 'none' : '1px solid #edeae6',
                backgroundColor: proficiency === p ? '#5c3a1e' : 'transparent',
                color: proficiency === p ? '#ffffff' : '#8a7b6e',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: failure types */}
      <div>
        <p style={labelStyle}>ミスの種類</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
          {FAILURE_TYPE_VALUES.map((ft) => {
            const selected = failureTypes.includes(ft)
            return (
              <button
                key={ft}
                type="button"
                onClick={() => toggleFailureType(ft)}
                style={{
                  padding: '0.375rem 0.875rem',
                  minHeight: '36px',
                  borderRadius: '20px',
                  border: selected ? '1px solid #d4c4b0' : '1px solid #edeae6',
                  backgroundColor: selected ? '#f0e8dd' : 'transparent',
                  color: selected ? '#5c3a1e' : '#8a7b6e',
                  fontSize: '0.8125rem',
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {ft}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 5: good question toggle */}
      <div>
        <button
          type="button"
          onClick={() => setIsGoodQuestion((v) => !v)}
          style={{
            padding: '0.375rem 0.875rem',
            minHeight: '36px',
            borderRadius: '20px',
            border: isGoodQuestion ? '1px solid #e8c97a' : '1px solid #edeae6',
            backgroundColor: isGoodQuestion ? '#fdf3df' : 'transparent',
            color: isGoodQuestion ? '#c8860a' : '#b5a99a',
            fontSize: '0.8125rem',
            fontWeight: isGoodQuestion ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          ★ 良問
        </button>
      </div>

      {/* Row 6: note */}
      <div>
        <label style={labelStyle}>メモ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="ポイント・間違えた原因など"
          style={{
            width: '100%',
            resize: 'none',
            border: '1px solid #edeae6',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            color: '#1a1108',
            backgroundColor: '#faf8f6',
            outline: 'none',
            fontFamily: 'inherit',
            marginTop: '0.375rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Error */}
      {error && <p style={{ fontSize: '0.8125rem', color: '#c0392b' }}>{error}</p>}

      {/* Row 7: actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" onClick={onCancel} style={cancelBtn}>
          キャンセル
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading} style={submitBtn}>
          {loading ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  )
}

const formWrap: React.CSSProperties = {
  backgroundColor: '#faf8f6',
  border: '1px solid #edeae6',
  borderRadius: '10px',
  padding: '1rem 1.125rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1rem',
}

const row: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
}

const field: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8a7b6e',
  letterSpacing: '0.03em',
}

const inp: React.CSSProperties = {
  width: '100%',
  border: '1px solid #edeae6',
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: '#1a1108',
  backgroundColor: '#ffffff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const cancelBtn: React.CSSProperties = {
  padding: '0.5rem 1rem',
  minHeight: '40px',
  border: '1px solid #edeae6',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: '#8a7b6e',
  fontSize: '0.875rem',
  cursor: 'pointer',
}

const submitBtn: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  minHeight: '40px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#5c3a1e',
  color: '#ffffff',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
}
