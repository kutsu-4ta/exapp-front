import {useState} from 'react'
import type {FailureType, Problem, ProblemInput, Proficiency} from '../../types/workspace'
import {daysAgo, PROFICIENCY_VALUES} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {PROF_STYLE, subjectPalette} from '@/styles/subjectUI.ts'
import {FailureTypeSelector} from '@/components/common/FailureTypeSlecter.tsx'
import {useSettingsStore} from '../../lib/store/settings'
import {sheetCloseBtnStyle, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

interface Props {
  problem: Problem
  cardIndex: number
  totalCards: number
  onConfirm: (input: ProblemInput) => Promise<void>
  onClose?: () => void
}

export function TodayCardModal({ problem, cardIndex, totalCards, onConfirm, onClose }: Props) {
  const [proficiency, setProficiency] = useState<Proficiency>(problem.proficiency as Proficiency)
  const [failureTypes, setFailureTypes] = useState<FailureType[]>(problem.failureTypes as FailureType[])
  const [note, setNote] = useState(problem.note ?? '')
  const [loading, setLoading] = useState(false)
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const palette = subjectPalette(problem.subject, subjectColors[problem.subject])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm({
        subject: problem.subject, materialId: null, materialName: problem.material || null,
        subCategory: problem.subCategory, questionRef: problem.questionRef,
        note: note.trim() || null, proficiency, failureTypes,
        isGoodQuestion: problem.isGoodQuestion, isFormula: problem.isFormula, solvedAt: problem.solvedAt,
      })
    } finally {
      setLoading(false)
    }
  }

  const prof = PROF_STYLE[proficiency] ?? PROF_STYLE['×']

  return (
    <div style={card}>
      {/* Header */}
      <div style={sheetFlexHeaderStyle}>
        <button onClick={onClose} style={sheetCloseBtnStyle}>×</button>
        <span style={progressBadge}>{cardIndex} / {totalCards}</span>
      </div>

      {/* Card info */}
      <div style={cardHeader}>
        <div style={metaRow}>
          <span style={{ ...subjectChip, backgroundColor: palette.bg, color: palette.color }}>{problem.subject}</span>
          {problem.material && <span style={refText}>{problem.material}</span>}
          {problem.questionRef && <span style={refText}>{problem.questionRef}</span>}
          <span style={daysTag}>{daysAgo(problem.solvedAt)}日前</span>
        </div>
        {problem.subCategory && <p style={questionRefStyle}>{problem.subCategory}</p>}
      </div>

      <div style={body}>
        <div style={section}>
          <p style={sectionLbl}>習熟度</p>
          <div style={segControl}>
            {PROFICIENCY_VALUES.map((p) => (
              <button key={p} onClick={() => setProficiency(p)} style={{ ...segBtn, backgroundColor: proficiency === p ? PROF_STYLE[p].bg : 'transparent', color: proficiency === p ? PROF_STYLE[p].color : 'rgba(55,53,47,0.35)', fontWeight: proficiency === p ? 700 : 400 }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={section}>
          <p style={sectionLbl}>属性</p>
          <FailureTypeSelector value={failureTypes} onChange={setFailureTypes} />
        </div>

        <div style={section}>
          <p style={sectionLbl}>ノート</p>
          <textarea style={noteArea} value={note} onChange={(e) => setNote(e.target.value)} placeholder="気づき・復習メモを入力..." rows={3} />
        </div>

        <button style={{ ...confirmBtn, backgroundColor: prof.bg, color: prof.color, opacity: loading ? 0.6 : 1 }} onClick={handleConfirm} disabled={loading}>
          {loading ? '保存中...' : '確認'}
        </button>
      </div>
    </div>
  )
}

const card: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${c.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginTop: '20px', overflow: 'hidden' }
const progressBadge: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: c.blue, backgroundColor: 'rgba(35,131,226,0.1)', borderRadius: '4px', padding: '3px 10px' }
const cardHeader: React.CSSProperties = { padding: '14px 16px 16px', borderBottom: `1px solid ${c.border}` }
const metaRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }
const subjectChip: React.CSSProperties = { padding: '2px 7px', borderRadius: '4px', fontSize: font.xs, fontWeight: 700, letterSpacing: '0.02em' }
const refText: React.CSSProperties = { fontSize: font.sm, color: c.textFaint, fontWeight: 400 }
const daysTag: React.CSSProperties = { marginLeft: 'auto', padding: '2px 7px', borderRadius: '4px', fontSize: font.xs, fontWeight: 500, backgroundColor: 'rgba(55,53,47,0.04)', color: 'rgba(55,53,47,0.4)' }
const questionRefStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.45, letterSpacing: '-0.01em' }
const body: React.CSSProperties = { padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }
const section: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
const sectionLbl: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }
const segControl: React.CSSProperties = { display: 'flex', gap: '4px', backgroundColor: 'rgba(55,53,47,0.05)', borderRadius: '8px', padding: '3px' }
const segBtn: React.CSSProperties = { flex: 1, border: 'none', borderRadius: '6px', padding: '10px', fontSize: '18px', cursor: 'pointer', transition: 'all 0.15s' }
const noteArea: React.CSSProperties = { width: '100%', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', lineHeight: '1.6', color: c.text, outline: 'none', resize: 'none', backgroundColor: 'rgba(55,53,47,0.01)', boxSizing: 'border-box' }
const confirmBtn: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }
