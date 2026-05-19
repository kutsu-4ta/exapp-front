import {useState} from 'react'
import {c, font} from '@/styles/notion'
import {BottomSheet, SheetField} from '@/components/common/BottomSheet'

interface Props {
  subjects: string[]
  initialExamYear?: string
  initialQuestionCount?: number
  onConfirm: (subject: string, examYear: string, questionCount: number) => void
  onClose: () => void
}

export function PreExamStartModal({ subjects, initialExamYear = 'R07', initialQuestionCount = 25, onConfirm, onClose }: Props) {
  const [subject, setSubject] = useState('')
  const [examYear, setExamYear] = useState(initialExamYear)
  const [questionCount, setQuestionCount] = useState(initialQuestionCount)

  return (
    <BottomSheet onClose={onClose} zIndex={1100} maxWidth={600} paddingBottom="calc(36px + env(safe-area-inset-bottom, 0px))">
      <p style={title}>試験を開始</p>

      <div style={fields}>
        <SheetField label="科目" gap={6}>
          <input list="pre-exam-subjects" style={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="科目名を入力または選択" autoFocus />
          <datalist id="pre-exam-subjects">
            {subjects.map((s) => <option key={s} value={s} />)}
          </datalist>
        </SheetField>

        <SheetField label="年度" gap={6}>
          <input style={input} value={examYear} onChange={(e) => setExamYear(e.target.value)} placeholder="例: R07" />
        </SheetField>

        <SheetField label="問題数" gap={6}>
          <input type="number" min={1} style={input} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)} placeholder="25" />
        </SheetField>
      </div>

      <div style={actions}>
        <button style={{ ...primaryBtn, opacity: subject.trim() ? 1 : 0.4 }} onClick={() => onConfirm(subject.trim(), examYear.trim(), questionCount)} disabled={!subject.trim()}>
          開始する
        </button>
        <button style={ghostBtn} onClick={onClose}>キャンセル</button>
      </div>
    </BottomSheet>
  )
}

const title: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: c.text, margin: '20px 20px 20px' }
const fields: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', padding: '0 20px' }
const input: React.CSSProperties = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: font.base, fontWeight: 600, boxSizing: 'border-box', width: '100%', outline: 'none' }
const actions: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px' }
const primaryBtn: React.CSSProperties = { padding: '14px', border: 'none', borderRadius: '10px', background: c.text, color: '#fff', fontSize: font.base, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }
const ghostBtn: React.CSSProperties = { padding: '12px', border: 'none', borderRadius: '10px', background: 'transparent', color: c.textSub, fontSize: font.sm, fontWeight: 600, cursor: 'pointer' }
