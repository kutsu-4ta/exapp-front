import {useState} from 'react'
import {useSettingsStore} from '../../lib/store/settings'
import {quickScoreExamSession} from '../../lib/api/exam'
import {c, font} from '../../styles/notion'
import {BottomSheet, SheetField} from '../../components/common/BottomSheet'

type Props = {
  onClose: () => void
  onSaved: () => void
}

export function QuickScoreModal({ onClose, onSaved }: Props) {
  const subjects = useSettingsStore((s) => s.subjects)
  const [subject, setSubject] = useState(subjects[0] ?? '')
  const [examYear, setExamYear] = useState('R07')
  const [totalScore, setTotalScore] = useState('')
  const [pureScore, setPureScore] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = parseInt(totalScore, 10)
  const pure = pureScore === '' ? total : parseInt(pureScore, 10)
  const isValid =
    subject.trim() !== '' &&
    examYear.trim() !== '' &&
    !isNaN(total) && total >= 0 && total <= 100 &&
    (pureScore === '' || (!isNaN(pure) && pure >= 0 && pure <= 100))

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    setError(null)
    try {
      await quickScoreExamSession({ subject: subject.trim(), examYear: examYear.trim(), totalScore: total, pureScore: pureScore === '' ? undefined : pure })
      onSaved()
    } catch {
      setError('保存に失敗しました')
      setSaving(false)
    }
  }

  return (
    <BottomSheet onClose={onClose} zIndex={1000} maxWidth={600} showHandle={false} paddingBottom="calc(40px + env(safe-area-inset-bottom, 0px))">
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={sheetTitle}>得点を記録</p>

        <SheetField label="科目" gap={6}>
          <input list="qs-subject-options" style={fieldInput} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="科目名..." />
          <datalist id="qs-subject-options">
            {subjects.map((s) => <option key={s} value={s} />)}
          </datalist>
        </SheetField>

        <SheetField label="年度" gap={6}>
          <input style={{ ...fieldInput, maxWidth: '120px' }} value={examYear} onChange={(e) => setExamYear(e.target.value)} placeholder="R07" />
        </SheetField>

        <div style={scoreRow}>
          <SheetField label="TOTAL得点" gap={6}>
            <div style={scoreInputWrap}>
              <input type="number" min={0} max={100} style={scoreInput} value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="0〜100" />
              <span style={scoreUnit}>点</span>
            </div>
          </SheetField>
          <SheetField label={<>PURE得点 <span style={optionalTag}>任意</span></>} gap={6}>
            <div style={scoreInputWrap}>
              <input type="number" min={0} max={100} style={scoreInput} value={pureScore} onChange={(e) => setPureScore(e.target.value)} placeholder={totalScore || '0〜100'} />
              <span style={scoreUnit}>点</span>
            </div>
          </SheetField>
        </div>

        {error && <p style={errorText}>{error}</p>}

        <div style={actions}>
          <button style={primaryBtn} onClick={handleSave} disabled={!isValid || saving}>
            {saving ? '保存中...' : '記録する'}
          </button>
          <button style={ghostBtn} onClick={onClose} disabled={saving}>キャンセル</button>
        </div>
      </div>
    </BottomSheet>
  )
}

const sheetTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: c.text, margin: 0 }
const fieldInput: React.CSSProperties = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: font.base, color: c.text, outline: 'none', width: '100%', boxSizing: 'border-box' }
const scoreRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const scoreInputWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px' }
const scoreInput: React.CSSProperties = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '18px', fontWeight: 700, color: c.text, outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right' }
const scoreUnit: React.CSSProperties = { fontSize: font.sm, color: c.textSub, flexShrink: 0 }
const optionalTag: React.CSSProperties = { fontSize: '9px', fontWeight: 600, color: '#aaa', background: '#f3f3f2', padding: '1px 5px', borderRadius: '4px' }
const errorText: React.CSSProperties = { fontSize: font.sm, color: c.red, margin: 0 }
const actions: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }
const primaryBtn: React.CSSProperties = { padding: '14px', border: 'none', borderRadius: '10px', background: c.text, color: '#fff', fontSize: font.base, fontWeight: 700, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { padding: '12px', border: 'none', borderRadius: '10px', background: 'transparent', color: c.textSub, fontSize: font.sm, fontWeight: 600, cursor: 'pointer' }
