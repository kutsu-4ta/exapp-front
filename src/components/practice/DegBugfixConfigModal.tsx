import {useState} from 'react'
import type {DegBugfixConfig} from '../../lib/api/morningQuiz'
import {c, font} from '../../styles/notion'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'

interface Props {
  subjects: string[]
  initialSubject: string | null
  onClose: () => void
  onStart: (config: DegBugfixConfig) => void
}

export function DegBugfixConfigModal({ subjects, initialSubject, onClose, onStart }: Props) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const [subject, setSubject] = useState<string | null>(initialSubject)
  const [limit, setLimit] = useState(5)
  const [quizMode, setQuizMode] = useState<'multiple_choice' | 'word_card'>('multiple_choice')
  const [formulaOnly, setFormulaOnly] = useState(false)

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={contentInner}>
          <div style={handle} />

          <div style={sheetHeader}>
            <div>
              <p style={modalTitle}>DegBugfix</p>
              <p style={subjectLabel}>保存済みのクイズで練習</p>
            </div>
            <button style={closeBtn} onClick={onClose}>×</button>
          </div>

          <div style={body}>
            <div style={fieldGroup}>
              <p style={fieldLabel}>科目</p>
              <div style={chipWrap}>
                <Chip selected={subject === null} onClick={() => setSubject(null)}>
                  すべての科目
                </Chip>
                {subjects.map((s) => {
                  const p = subjectPalette(s, subjectColors[s])
                  return (
                    <Chip
                      key={s}
                      selected={subject === s}
                      onClick={() => setSubject(s)}
                      activeColor={p.color}
                      activeBg={p.bg}
                    >
                      {s}
                    </Chip>
                  )
                })}
              </div>
            </div>

            <div style={fieldGroup}>
              <p style={fieldLabel}>モード</p>
              <div style={chipWrap}>
                <Chip selected={quizMode === 'multiple_choice'} onClick={() => setQuizMode('multiple_choice')}>
                  一問一答
                </Chip>
                <Chip selected={quizMode === 'word_card'} onClick={() => setQuizMode('word_card')}>
                  単語カード
                </Chip>
              </div>
              {quizMode === 'word_card' && (
                <div style={chipWrap}>
                  <Chip selected={formulaOnly} onClick={() => setFormulaOnly((v) => !v)}>
                    公式チェック
                  </Chip>
                </div>
              )}
            </div>

            <div style={fieldGroup}>
              <p style={fieldLabel}>問題数</p>
              <div style={stepperRow}>
                <button style={stepBtn} onClick={() => setLimit((l) => Math.max(1, l - 1))}>−</button>
                <span style={stepValue}>{limit}</span>
                <button style={stepBtn} onClick={() => setLimit((l) => Math.min(20, l + 1))}>＋</button>
              </div>
            </div>

            <button style={startBtn} onClick={() => onStart({ subject, limit, quizMode, formulaOnly: quizMode === 'word_card' ? formulaOnly : false })}>
              開始する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({
  selected,
  onClick,
  children,
  activeColor,
  activeBg,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  activeColor?: string
  activeBg?: string
}) {
  const color = activeColor ?? '#7c3aed'
  const bg = activeBg ?? 'rgba(124,58,237,0.08)'
  return (
    <button
      onClick={onClick}
      style={{
        ...chipBase,
        backgroundColor: selected ? bg : 'transparent',
        borderColor: selected ? `${color}59` : 'rgba(55,53,47,0.12)',
        color: selected ? color : c.textSub,
        fontWeight: selected ? 700 : 400,
      }}
    >
      {children}
    </button>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
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
  paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
}
const contentInner: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const handle: React.CSSProperties = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: 'rgba(55,53,47,0.15)',
  margin: '12px auto 0',
}
const sheetHeader: React.CSSProperties = {
  position: 'relative',
  padding: '16px 48px 14px 20px',
  borderBottom: `1px solid rgba(55,53,47,0.08)`,
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
  fontSize: '18px',
}
const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: c.text, margin: 0 }
const subjectLabel: React.CSSProperties = { fontSize: font.sm, color: 'rgba(55,53,47,0.4)', margin: '2px 0 0' }
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
const chipWrap: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }
const chipBase: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s',
}
const stepperRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const stepBtn: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  border: `1px solid rgba(55,53,47,0.12)`,
  backgroundColor: 'rgba(55,53,47,0.03)',
  color: c.text,
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const stepValue: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: c.text,
  minWidth: '28px',
  textAlign: 'center',
}
const startBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '4px',
}
