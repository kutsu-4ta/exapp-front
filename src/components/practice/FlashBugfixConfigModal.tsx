import {useState} from 'react'
import type {FailureType, Proficiency, SubCategory} from '../../types/workspace'
import type {FlashBugfixConfig} from '../../lib/api/morningQuiz'
import {c, font} from '../../styles/notion'
import {FailureTypeSelector} from '@/components/common/FailureTypeSlecter.tsx'
import {ProficiencySelector} from '@/components/common/ProficiencySelector.tsx'

interface Props {
  subjectName: string
  subCategories: SubCategory[]
  onClose: () => void
  onStart: (config: FlashBugfixConfig) => void
}

export function FlashBugfixConfigModal({
                                         subjectName,
                                         subCategories,
                                         onClose,
                                         onStart,
                                       }: Props) {
  const [failureTypes, setFailureTypes] = useState<FailureType[]>([])
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>(
      subCategories.map((sc) => sc.id),
  )
  const [touchedOrder, setTouchedOrder] = useState<'recent' | 'old' | null>(null)
  const [limit, setLimit] = useState(5)
  const [proficiency, setProficiency] = useState<Proficiency[]>(['△', '×'])
  const [quizMode, setQuizMode] = useState<'multiple_choice' | 'word_card'>('multiple_choice')
  const [formulaOnly, setFormulaOnly] = useState(false)

  const toggleSubCat = (id: number) =>
      setSubCategoryIds((prev) =>
          prev.includes(id)
              ? prev.filter((x) => x !== id)
              : [...prev, id],
      )

  const toggleTouchedOrder = (v: 'recent' | 'old') =>
      setTouchedOrder((prev) => (prev === v ? null : v))

  return (
      <div style={overlay} onClick={onClose}>
        <div style={sheet} onClick={(e) => e.stopPropagation()}>
          <div style={contentInner}>
            <div style={handle} />

            <div style={sheetHeader}>
              <div>
                <p style={modalTitle}>Flash Bugfix</p>
                <p style={subjectLabel}>{subjectName}</p>
              </div>

              <button style={closeBtn} onClick={onClose}>
                ×
              </button>
            </div>

            <div style={body}>
              <div style={fieldGroup}>
                <p style={fieldLabel}>出題形式</p>
                <div style={chipWrap}>
                  <Chip
                      selected={quizMode === 'multiple_choice'}
                      onClick={() => setQuizMode('multiple_choice')}
                  >
                    一問一答
                  </Chip>
                  <Chip
                      selected={quizMode === 'word_card'}
                      onClick={() => setQuizMode('word_card')}
                  >
                    単語カード
                  </Chip>
                </div>
                {quizMode === 'word_card' && (
                    <div style={chipWrap}>
                      <Chip
                          selected={formulaOnly}
                          onClick={() => setFormulaOnly((v) => !v)}
                      >
                        公式チェック
                      </Chip>
                    </div>
                )}
              </div>

              {subCategories.length > 0 && (
                  <div style={fieldGroup}>
                    <p style={fieldLabel}>論点</p>
                    <div style={chipWrap}>
                      {subCategories.map((sc) => (
                          <Chip
                              key={sc.id}
                              selected={subCategoryIds.includes(sc.id)}
                              onClick={() => toggleSubCat(sc.id)}
                          >
                            {sc.name}
                          </Chip>
                      ))}
                    </div>
                  </div>
              )}

              <div style={fieldGroup}>
                <p style={fieldLabel}>属性</p>
                <FailureTypeSelector
                    value={failureTypes}
                    onChange={setFailureTypes}
                />
              </div>

              <div style={fieldGroup}>
                <p style={fieldLabel}>習熟度</p>
                <ProficiencySelector
                    mode="multi"
                    value={proficiency}
                    onChange={setProficiency}
                />
              </div>

              <div style={fieldGroup}>
                <p style={fieldLabel}>問題順</p>
                <div style={chipWrap}>
                  <Chip
                      selected={touchedOrder === 'old'}
                      onClick={() => toggleTouchedOrder('old')}
                  >
                    古い順
                  </Chip>

                  <Chip
                      selected={touchedOrder === 'recent'}
                      onClick={() => toggleTouchedOrder('recent')}
                  >
                    新しい順
                  </Chip>
                </div>
              </div>

              <div style={fieldGroup}>
                <p style={fieldLabel}>問題数</p>
                <div style={stepperRow}>
                  <button
                      style={stepBtn}
                      onClick={() => setLimit((l) => Math.max(1, l - 1))}
                  >
                    −
                  </button>

                  <span style={stepValue}>{limit}</span>

                  <button
                      style={stepBtn}
                      onClick={() => setLimit((l) => Math.min(10, l + 1))}
                  >
                    ＋
                  </button>
                </div>
              </div>

              <button
                  style={startBtn}
                  onClick={() =>
                      onStart({
                        failureTypes,
                        subCategoryIds,
                        touchedOrder,
                        limit,
                        proficiency,
                        quizMode,
                        formulaOnly: quizMode === 'word_card' ? formulaOnly : false,
                      })
                  }
              >
                生成して開始する
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
              }: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
      <button
          onClick={onClick}
          style={{
            ...chipBase,
            backgroundColor: selected
                ? 'rgba(55,53,47,0.08)'
                : 'transparent',
          }}
      >
        {children}
      </button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
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
  display: 'flex',
  alignItems: 'center',
}
const modalTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: c.text,
  margin: 0,
}
const subjectLabel: React.CSSProperties = {
  fontSize: font.sm,
  color: 'rgba(55,53,47,0.4)',
  margin: '2px 0 0',
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
const chipWrap: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }
const chipBase: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: '6px',
  border: '1px solid',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s',
}
const stepperRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}
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
  backgroundColor: c.text,
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '4px',
}
const contentInner: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}
