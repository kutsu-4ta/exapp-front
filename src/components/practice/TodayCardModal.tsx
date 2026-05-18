import {useState} from 'react'
import type {FailureType, Problem, ProblemInput, Proficiency} from '../../types/workspace'
import {daysAgo, FAILURE_TYPE_VALUES, PROFICIENCY_VALUES} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {PROF_STYLE} from '@/styles/subjectUI.ts'

interface Props {
  problem: Problem
  cardIndex: number
  totalCards: number
  onConfirm: (input: ProblemInput) => Promise<void>
}

export function TodayCardModal({ problem, cardIndex, totalCards, onConfirm }: Props) {
  const [proficiency, setProficiency] = useState<Proficiency>(problem.proficiency as Proficiency)
  const [failureTypes, setFailureTypes] = useState<FailureType[]>(
    problem.failureTypes as FailureType[]
  )
  const [note, setNote] = useState(problem.note ?? '')
  const [loading, setLoading] = useState(false)

  const toggleFt = (ft: FailureType) => {
    setFailureTypes((prev) => (prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft]))
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm({
        subject: problem.subject,
        materialId: null,
        materialName: problem.material || null,
        subCategory: problem.subCategory,
        questionRef: problem.questionRef,
        note: note.trim() || null,
        proficiency,
        failureTypes,
        isGoodQuestion: problem.isGoodQuestion,
        isFormula: problem.isFormula,
        solvedAt: problem.solvedAt,
      })
    } finally {
      setLoading(false)
    }
  }

  const prof = PROF_STYLE[proficiency] ?? PROF_STYLE['×']

  return (
    <div style={overlay}>
      <div style={sheet}>
        <div style={handle} />

        {/* Progress + card header */}
        <div style={cardHeader}>
          <span style={progressBadge}>
            {cardIndex}/{totalCards}
          </span>
          <div style={metaRow}>
            {problem.subCategory && <span style={subCatTag}>{problem.subCategory}</span>}
            {problem.material && <span style={materialTag}>{problem.material}</span>}
            <span style={daysTag}>{daysAgo(problem.solvedAt)}日前</span>
          </div>
          <p style={questionRef}>{problem.questionRef}</p>
        </div>

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
              ...confirmBtn,
              backgroundColor: prof.bg,
              color: prof.color,
              opacity: loading ? 0.6 : 1,
            }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '保存中...' : '確認'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  backgroundColor: 'rgba(0,0,0,0.5)',
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

const cardHeader: React.CSSProperties = {
  padding: '16px 20px 12px',
  borderBottom: `1px solid rgba(55,53,47,0.08)`,
}

const progressBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700,
  color: c.blue,
  backgroundColor: 'rgba(35,131,226,0.1)',
  borderRadius: '4px',
  padding: '2px 8px',
  marginBottom: '8px',
}

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

const questionRef: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: c.text,
  margin: 0,
  lineHeight: 1.4,
  letterSpacing: '-0.01em',
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

const confirmBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}
