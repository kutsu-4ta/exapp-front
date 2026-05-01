import {
  FAILURE_TYPE_VALUES,
  PROFICIENCY_VALUES,
  todayString
} from "../../types/workspace";
import type {FailureType, ProblemInput, Proficiency, SubCategory} from "../../types/workspace";
import { useSettingsStore } from '../../lib/store/settings';
import {useState} from "react";

type Props = {
  initial?: ProblemInput
  subCategories?: SubCategory[]
  onSubmit: (input: ProblemInput) => Promise<void>
  onCancel: () => void
  /** アクション行の左端に差し込む要素（カメラボタン等） */
  leftAction?: React.ReactNode
}

export function ProblemForm({ initial, subCategories = [], onSubmit, onCancel, leftAction }: Props) {
  const isEdit = initial !== undefined
  const subjects = useSettingsStore((s) => s.subjects)
  const materials = useSettingsStore((s) => s.materials)

  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [subCategoryName, setSubCategoryName] = useState<string>(
    initial?.subCategoryId
      ? subCategories.find((sc) => sc.id === initial.subCategoryId)?.name ?? ''
      : ''
  )
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
        subCategoryId: subCategories.find(
          (sc) => sc.subject === subject.trim() && sc.name === subCategoryName.trim()
        )?.id ?? null,
        questionRef: questionRef.trim(),
        note: note.trim() || null,
        proficiency,
        failureTypes,
        isGoodQuestion,
        solvedAt,
      })
      if (!isEdit) {
        setMaterial('')
        setSubCategoryName('')
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
        {/* Row 1: subject + subcategory + material */}
        <div style={row}>
          <div style={field}>
            <label style={labelStyle} htmlFor={subjectId}>科目</label>
            <input
                id={subjectId}
                list="pf-subjects"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setSubCategoryName('') }}
                placeholder="選択または入力"
                style={inp}
            />
            <datalist id="pf-subjects">
              {subjects.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div style={field}>
            <label style={labelStyle}>小分類（任意）</label>
            <input
                list="pf-subcats"
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                placeholder="小分類を入力"
                style={inp}
            />
            <datalist id="pf-subcats">
              {subCategories
                .filter((sc) => sc.subject === subject)
                .map((sc) => (
                  <option key={sc.id} value={sc.name} />
                ))}
            </datalist>
          </div>
          <div style={field}>
            <label style={labelStyle} htmlFor={materialId}>教材</label>
            <input
                id={materialId}
                list="pf-materials"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="教材名"
                style={inp}
            />
            <datalist id="pf-materials">
              {materials.map((m) => <option key={m} value={m} />)}
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
                placeholder="例: 2026年度 第1問"
                style={inp}
            />
          </div>
          <div style={field}>
            <label style={labelStyle}>解いた日</label>
            <input
                type="date"
                value={solvedAt}
                onChange={(e) => setSolvedAt(e.target.value)}
                style={inp}
            />
          </div>
        </div>

        {/* Row 3: proficiency (Segmented Control style) */}
        <div>
          <p style={labelStyle}>習熟度</p>
          <div style={segmentedControl}>
            {PROFICIENCY_VALUES.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => setProficiency(p)}
                    style={{
                      ...segmentBtn,
                      backgroundColor: proficiency === p ? '#edeae6' : 'transparent',
                      color: proficiency === p ? '#37352f' : 'rgba(55, 53, 47, 0.45)',
                      fontWeight: proficiency === p ? 600 : 400,
                    }}
                >
                  {p}
                </button>
            ))}
          </div>
        </div>

        {/* Row 4: failure types (Pill style) */}
        <div>
          <p style={labelStyle}>ミスの種類</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {FAILURE_TYPE_VALUES.map((ft) => {
              const selected = failureTypes.includes(ft)
              return (
                  <button
                      key={ft}
                      type="button"
                      onClick={() => toggleFailureType(ft)}
                      style={{
                        ...pillBtn,
                        backgroundColor: selected ? 'rgba(55, 53, 47, 0.08)' : 'transparent',
                        borderColor: selected ? 'rgba(55, 53, 47, 0.16)' : 'rgba(55, 53, 47, 0.09)',
                        color: selected ? '#37352f' : 'rgba(55, 53, 47, 0.45)',
                      }}
                  >
                    {ft}
                  </button>
              )
            })}
          </div>
        </div>

        {/* Row 5: good question toggle */}
        <div style={{ marginTop: '4px' }}>
          <button
              type="button"
              onClick={() => setIsGoodQuestion((v) => !v)}
              style={{
                ...pillBtn,
                backgroundColor: isGoodQuestion ? '#fdf3df' : 'transparent',
                borderColor: isGoodQuestion ? '#e8c97a' : 'rgba(55, 53, 47, 0.09)',
                color: isGoodQuestion ? '#c8860a' : 'rgba(55, 53, 47, 0.45)',
              }}
          >
            {isGoodQuestion ? '★ 良問として保存中' : '☆ 良問マークをつける'}
          </button>
        </div>

        {/* Row 6: note */}
        <div style={field}>
          <label style={labelStyle}>分析・メモ</label>
          <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="間違えた原因や、思い出したかった知識を言語化してください"
              style={textarea}
          />
        </div>

        {error && <p style={errorText}>{error}</p>}

        {/* Actions */}
        <div style={actions}>
          {leftAction && <div style={{ marginRight: 'auto' }}>{leftAction}</div>}
          <button type="button" onClick={onCancel} style={ghostBtn}>
            キャンセル
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} style={primaryBtn}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const formWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const row: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
}

const field: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const inp: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(55, 53, 47, 0.09)',
  borderRadius: '4px',
  padding: '8px 10px',
  fontSize: '14px',
  color: '#37352f',
  backgroundColor: 'rgba(55, 53, 47, 0.02)',
  outline: 'none',
  boxSizing: 'border-box',
}

const textarea: React.CSSProperties = {
  ...inp,
  resize: 'none',
  minHeight: '80px',
  lineHeight: '1.5',
}

const segmentedControl: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  backgroundColor: 'rgba(55, 53, 47, 0.04)',
  padding: '2px',
  borderRadius: '6px',
  marginTop: '4px',
}

const segmentBtn: React.CSSProperties = {
  flex: 1,
  border: 'none',
  borderRadius: '4px',
  padding: '8px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
}

const pillBtn: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
}

const actions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  paddingTop: '8px',
}

const primaryBtn: React.CSSProperties = {
  backgroundColor: '#2383e2',
  color: '#fff',
  border: 'none',
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'rgba(55, 53, 47, 0.45)',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
}

const errorText: React.CSSProperties = {
  fontSize: '12px',
  color: '#eb5757',
  margin: 0,
}