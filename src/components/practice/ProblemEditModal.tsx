import {useEffect, useState} from 'react'
import type {FailureType, Problem, Proficiency} from '../../types/workspace'
import {daysAgo, FAILURE_TYPE_VALUES, PROFICIENCY_VALUES} from '../../types/workspace'
import {fetchProblem, updateProblem} from '../../lib/api/problem'
import {c, font} from '../../styles/notion'
import {PROF_STYLE} from '@/styles/subjectUI.ts'

type Props = {
  problemId: number
  onClose: () => void
  initialProblem?: Problem
}

export function ProblemEditModal({ problemId, onClose, initialProblem }: Props) {
  const [problem, setProblem] = useState<Problem | null>(initialProblem ?? null)
  const [loading, setLoading] = useState(!initialProblem)
  const [proficiency, setProficiency] = useState<Proficiency>(
    (initialProblem?.proficiency as Proficiency) ?? '×'
  )
  const [failureTypes, setFailureTypes] = useState<FailureType[]>(
    (initialProblem?.failureTypes as FailureType[]) ?? []
  )
  const [note, setNote] = useState(initialProblem?.note ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialProblem) return
    fetchProblem(problemId)
      .then((p) => {
        setProblem(p)
        setProficiency(p.proficiency as Proficiency)
        setFailureTypes(p.failureTypes as FailureType[])
        setNote(p.note ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [problemId])

  const toggleFt = (ft: FailureType) => {
    setFailureTypes((prev) => (prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft]))
  }

  const handleSave = async () => {
    if (!problem) return
    setSaving(true)
    try {
      await updateProblem(problem.id, {
        subject: problem.subject,
        materialId: null,
        materialName: problem.material || null,
        subCategory: problem.subCategory,
        questionRef: problem.questionRef,
        note: note.trim() || null,
        defeatReason: problem.defeatReason,
        proficiency,
        failureTypes,
        isGoodQuestion: problem.isGoodQuestion,
        solvedAt: problem.solvedAt,
      })
      onClose()
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  const prof = PROF_STYLE[proficiency] ?? PROF_STYLE['×']

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />

        {/* Header */}
        <div style={sheetHeader}>
          {loading || !problem ? (
            <p style={loadingText}>読み込み中...</p>
          ) : (
            <>
              <div style={metaRow}>
                {problem.subCategory && <span style={subCatTag}>{problem.subCategory}</span>}
                {problem.material && <span style={materialTag}>{problem.material}</span>}
                <span style={daysTag}>{daysAgo(problem.solvedAt)}日前</span>
              </div>
              <p style={questionRefStyle}>{problem.questionRef}</p>
            </>
          )}
          <button style={closeBtn} onClick={onClose} aria-label="閉じる">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!loading && problem && (
          <div style={body}>
            {/* Proficiency */}
            <div style={fieldGroup}>
              <p style={fieldLabel}>習熟度</p>
              <div style={segControl}>
                {PROFICIENCY_VALUES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProficiency(p)}
                    style={{
                      ...segBtn,
                      backgroundColor: proficiency === p ? PROF_STYLE[p].bg : 'transparent',
                      color: proficiency === p ? PROF_STYLE[p].color : 'rgba(55,53,47,0.35)',
                      fontWeight: proficiency === p ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Failure types */}
            <div style={fieldGroup}>
              <p style={fieldLabel}>属性</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FAILURE_TYPE_VALUES.map((ft) => {
                  const selected = failureTypes.includes(ft)
                  return (
                    <button
                      key={ft}
                      onClick={() => toggleFt(ft)}
                      style={{
                        ...pillBtn,
                        backgroundColor: selected ? 'rgba(55,53,47,0.08)' : 'transparent',
                        borderColor: selected ? 'rgba(55,53,47,0.2)' : 'rgba(55,53,47,0.1)',
                        color: selected ? c.text : 'rgba(55,53,47,0.4)',
                      }}
                    >
                      {ft}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Note */}
            <div style={fieldGroup}>
              <p style={fieldLabel}>メモ</p>
              <textarea
                style={noteArea}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="気づき・復習メモを入力..."
                rows={3}
              />
            </div>

            <button
              style={{
                ...saveBtn,
                backgroundColor: prof.bg,
                color: prof.color,
                opacity: saving ? 0.6 : 1,
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 300,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-end',
}
const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '20px 20px 0 0',
  maxHeight: '85vh',
  overflowY: 'auto',
  paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
}
const handle: React.CSSProperties = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: 'rgba(55,53,47,0.15)',
  margin: '12px auto 0',
}
const sheetHeader: React.CSSProperties = {
  position: 'relative',
  padding: '16px 48px 12px 20px',
  borderBottom: `1px solid rgba(55,53,47,0.08)`,
  minHeight: '48px',
}
const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: '14px',
  right: '16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(55,53,47,0.3)',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
}
const loadingText: React.CSSProperties = { fontSize: font.base, color: c.textHint, margin: 0 }
const metaRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginBottom: '8px',
}
const subCatTag: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: font.xs,
  fontWeight: 600,
  backgroundColor: 'rgba(55,53,47,0.06)',
  color: 'rgba(55,53,47,0.6)',
}
const materialTag: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: font.xs,
  fontWeight: 500,
  backgroundColor: 'rgba(55,53,47,0.04)',
  color: 'rgba(55,53,47,0.4)',
}
const daysTag: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: font.xs,
  fontWeight: 500,
  backgroundColor: 'rgba(55,53,47,0.03)',
  color: 'rgba(55,53,47,0.35)',
}
const questionRefStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: c.text,
  margin: 0,
  lineHeight: 1.4,
}
const body: React.CSSProperties = {
  padding: '20px 20px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}
const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
const fieldLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: 0,
}
const segControl: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  backgroundColor: 'rgba(55,53,47,0.05)',
  borderRadius: '8px',
  padding: '3px',
}
const segBtn: React.CSSProperties = {
  flex: 1,
  border: 'none',
  borderRadius: '6px',
  padding: '10px',
  fontSize: '18px',
  cursor: 'pointer',
  transition: 'all 0.15s',
}
const pillBtn: React.CSSProperties = {
  padding: '5px 14px',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s',
}
const noteArea: React.CSSProperties = {
  width: '100%',
  border: `1px solid rgba(55,53,47,0.1)`,
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  lineHeight: '1.6',
  color: c.text,
  outline: 'none',
  resize: 'none',
  backgroundColor: 'rgba(55,53,47,0.01)',
  boxSizing: 'border-box',
}
const saveBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}
