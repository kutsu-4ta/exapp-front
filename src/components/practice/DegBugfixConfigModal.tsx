import {useState} from 'react'
import type {DegBugfixConfig} from '../../lib/api/morningQuiz'
import {c, font} from '../../styles/notion'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'
import {BottomSheet, sheetCloseBtnAbsStyle, SheetField, sheetHeaderStyle} from '@/components/common/BottomSheet'

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

  return (
    <BottomSheet onClose={onClose} maxWidth={600} maxHeight="85vh" paddingBottom="calc(100px + env(safe-area-inset-bottom, 0px))">
      <div style={sheetHeaderStyle}>
        <p style={modalTitle}>DegBugfix</p>
        <p style={subjectLabel}>保存済みのクイズで練習</p>
        <button style={sheetCloseBtnAbsStyle} onClick={onClose}>×</button>
      </div>

      <div style={body}>
        <SheetField label="科目">
          <div style={chipWrap}>
            <Chip selected={subject === null} onClick={() => setSubject(null)}>
              すべての科目
            </Chip>
            {subjects.map((s) => {
              const p = subjectPalette(s, subjectColors[s])
              return (
                <Chip key={s} selected={subject === s} onClick={() => setSubject(s)} activeColor={p.color} activeBg={p.bg}>
                  {s}
                </Chip>
              )
            })}
          </div>
        </SheetField>

        <SheetField label="問題数">
          <div style={stepperRow}>
            <button style={stepBtn} onClick={() => setLimit((l) => Math.max(1, l - 1))}>−</button>
            <span style={stepValue}>{limit}</span>
            <button style={stepBtn} onClick={() => setLimit((l) => Math.min(20, l + 1))}>＋</button>
          </div>
        </SheetField>

        <button style={startBtn} onClick={() => onStart({ subject, limit })}>
          開始する
        </button>
      </div>
    </BottomSheet>
  )
}

function Chip({ selected, onClick, children, activeColor, activeBg }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; activeColor?: string; activeBg?: string
}) {
  const color = activeColor ?? '#7c3aed'
  const bg = activeBg ?? 'rgba(124,58,237,0.08)'
  return (
    <button onClick={onClick} style={{ ...chipBase, backgroundColor: selected ? bg : 'transparent', borderColor: selected ? `${color}59` : 'rgba(55,53,47,0.12)', color: selected ? color : c.textSub, fontWeight: selected ? 700 : 400 }}>
      {children}
    </button>
  )
}

const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: c.text, margin: 0 }
const subjectLabel: React.CSSProperties = { fontSize: font.sm, color: 'rgba(55,53,47,0.4)', margin: '2px 0 0' }
const body: React.CSSProperties = { padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }
const chipWrap: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }
const chipBase: React.CSSProperties = { padding: '5px 12px', borderRadius: '6px', border: '1px solid', fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s' }
const stepperRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const stepBtn: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '8px', border: `1px solid rgba(55,53,47,0.12)`, backgroundColor: 'rgba(55,53,47,0.03)', color: c.text, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const stepValue: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: c.text, minWidth: '28px', textAlign: 'center' }
const startBtn: React.CSSProperties = { width: '100%', padding: '14px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontSize: font.base, fontWeight: 700, cursor: 'pointer', marginTop: '4px' }
