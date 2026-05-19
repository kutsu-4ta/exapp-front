import {useState} from 'react'
import type {FailureType, Proficiency, SubCategory} from '../../types/workspace'
import type {FlashBugfixConfig} from '../../lib/api/morningQuiz'
import {font} from '../../styles/notion'
import {FailureTypeSelector} from '@/components/common/FailureTypeSlecter.tsx'
import {ProficiencySelector} from '@/components/common/ProficiencySelector.tsx'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'
import {BottomSheet, sheetCloseBtnAbsStyle, SheetField, sheetHeaderStyle} from '@/components/common/BottomSheet'

interface Props {
  subjectName: string
  subCategories: SubCategory[]
  onClose: () => void
  onStart: (config: FlashBugfixConfig) => void
}

export function FlashBugfixConfigModal({ subjectName, subCategories, onClose, onStart }: Props) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const palette = subjectPalette(subjectName, subjectColors[subjectName])

  const [failureTypes, setFailureTypes] = useState<FailureType[]>([])
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>(subCategories.map((sc) => sc.id))
  const [touchedOrder, setTouchedOrder] = useState<'recent' | 'old' | null>(null)
  const [limit, setLimit] = useState(5)
  const [proficiency, setProficiency] = useState<Proficiency[]>(['△', '×'])
  const [quizMode, setQuizMode] = useState<'multiple_choice' | 'word_card'>('multiple_choice')
  const [formulaOnly, setFormulaOnly] = useState(false)

  const toggleSubCat = (id: number) =>
    setSubCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleTouchedOrder = (v: 'recent' | 'old') =>
    setTouchedOrder((prev) => (prev === v ? null : v))

  return (
    <BottomSheet onClose={onClose} maxWidth={600} maxHeight="85vh" paddingBottom="calc(100px + env(safe-area-inset-bottom, 0px))">
      <div style={sheetHeaderStyle}>
        <p style={modalTitle}>Flash Bugfix</p>
        <p style={{ ...subjectLabel, color: palette.color }}>
          <span style={{ marginRight: '4px' }}>▌</span>{subjectName}
        </p>
        <button style={sheetCloseBtnAbsStyle} onClick={onClose}>×</button>
      </div>

      <div style={body}>
        <SheetField label="出題形式">
          <div style={chipWrap}>
            <Chip selected={quizMode === 'multiple_choice'} onClick={() => setQuizMode('multiple_choice')} activeColor={palette.color} activeBg={palette.bg}>一問一答</Chip>
            <Chip selected={quizMode === 'word_card'} onClick={() => setQuizMode('word_card')} activeColor={palette.color} activeBg={palette.bg}>単語カード</Chip>
          </div>
          {quizMode === 'word_card' && (
            <div style={chipWrap}>
              <Chip selected={formulaOnly} onClick={() => setFormulaOnly((v) => !v)} activeColor={palette.color} activeBg={palette.bg}>公式チェック</Chip>
            </div>
          )}
        </SheetField>

        {subCategories.length > 0 && (
          <SheetField label="論点">
            <div style={chipWrap}>
              {subCategories.map((sc) => (
                <Chip key={sc.id} selected={subCategoryIds.includes(sc.id)} onClick={() => toggleSubCat(sc.id)} activeColor={palette.color} activeBg={palette.bg}>
                  {sc.name}
                </Chip>
              ))}
            </div>
          </SheetField>
        )}

        <SheetField label="属性">
          <FailureTypeSelector value={failureTypes} onChange={setFailureTypes} />
        </SheetField>

        <SheetField label="習熟度">
          <ProficiencySelector mode="multi" value={proficiency} onChange={setProficiency} />
        </SheetField>

        <SheetField label="問題順">
          <div style={chipWrap}>
            <Chip selected={touchedOrder === 'old'} onClick={() => toggleTouchedOrder('old')} activeColor={palette.color} activeBg={palette.bg}>古い順</Chip>
            <Chip selected={touchedOrder === 'recent'} onClick={() => toggleTouchedOrder('recent')} activeColor={palette.color} activeBg={palette.bg}>新しい順</Chip>
          </div>
        </SheetField>

        <SheetField label="問題数">
          <div style={stepperRow}>
            <button style={stepBtn} onClick={() => setLimit((l) => Math.max(1, l - 1))}>−</button>
            <span style={stepValue}>{limit}</span>
            <button style={stepBtn} onClick={() => setLimit((l) => Math.min(10, l + 1))}>＋</button>
          </div>
        </SheetField>

        <button
          style={{ ...startBtn, backgroundColor: palette.color }}
          onClick={() => onStart({ failureTypes, subCategoryIds, touchedOrder, limit, proficiency, quizMode, formulaOnly: quizMode === 'word_card' ? formulaOnly : false })}
        >
          生成して開始する
        </button>
      </div>
    </BottomSheet>
  )
}

function Chip({ selected, onClick, children, activeColor, activeBg }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; activeColor?: string; activeBg?: string
}) {
  const color = activeColor ?? '#2383e2'
  const bg = activeBg ?? 'rgba(35,131,226,0.08)'
  return (
    <button onClick={onClick} style={{ ...chipBase, backgroundColor: selected ? bg : 'transparent', borderColor: selected ? `${color}59` : 'rgba(55,53,47,0.12)', color: selected ? color : 'rgba(55,53,47,0.55)', fontWeight: selected ? 700 : 400 }}>
      {children}
    </button>
  )
}

const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: 'rgba(55,53,47,0.9)', margin: 0 }
const subjectLabel: React.CSSProperties = { fontSize: font.sm, color: 'rgba(55,53,47,0.4)', margin: '2px 0 0' }
const body: React.CSSProperties = { padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }
const chipWrap: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }
const chipBase: React.CSSProperties = { padding: '5px 12px', borderRadius: '6px', border: '1px solid', fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s' }
const stepperRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const stepBtn: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '8px', border: `1px solid rgba(55,53,47,0.12)`, backgroundColor: 'rgba(55,53,47,0.03)', color: 'rgba(55,53,47,0.9)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const stepValue: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: 'rgba(55,53,47,0.9)', minWidth: '28px', textAlign: 'center' }
const startBtn: React.CSSProperties = { width: '100%', padding: '14px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: font.base, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }
