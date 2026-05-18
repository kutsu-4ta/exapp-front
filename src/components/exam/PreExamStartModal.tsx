import {useState} from 'react'
import {c, font} from '@/styles/notion'

interface Props {
  subjects: string[]
  initialExamYear?: string
  initialQuestionCount?: number
  onConfirm: (
      subject: string,
      examYear: string,
      questionCount: number
  ) => void
  onClose: () => void
}

export function PreExamStartModal({
                                    subjects,
                                    initialExamYear = 'R07',
                                    initialQuestionCount = 25,
                                    onConfirm,
                                    onClose,
                                  }: Props) {
  const [subject, setSubject] = useState('')
  const [examYear, setExamYear] = useState(initialExamYear)
  const [questionCount, setQuestionCount] = useState(initialQuestionCount)

  return (
      <div
          style={overlay}
          onClick={onClose}
      >
        <div
            style={sheet}
            onClick={(e) =>
                e.stopPropagation()
            }
        >
          <div style={handle} />
          <p style={title}>
            試験を開始
          </p>

          <div style={fields}>
            <div style={field}>
              <label
                  style={fieldLabel}
              >
                科目
              </label>

              <input
                  list="pre-exam-subjects"
                  style={input}
                  value={subject}
                  onChange={(e) =>
                      setSubject(
                          e.target.value
                      )
                  }
                  placeholder="科目名を入力または選択"
                  autoFocus
              />

              <datalist id="pre-exam-subjects">
                {subjects.map((s) => (
                    <option
                        key={s}
                        value={s}
                    />
                ))}
              </datalist>
            </div>

            <div style={field}>
              <label
                  style={fieldLabel}
              >
                年度
              </label>

              <input
                  style={input}
                  value={examYear}
                  onChange={(e) =>
                      setExamYear(
                          e.target.value
                      )
                  }
                  placeholder="例: R07"
              />
            </div>

            <div style={field}>
              <label
                  style={fieldLabel}
              >
                問題数
              </label>

              <input
                  type="number"
                  min={1}
                  style={input}
                  value={questionCount}
                  onChange={(e) =>
                      setQuestionCount(
                          parseInt(
                              e.target.value
                          ) || 1
                      )
                  }
                  placeholder="25"
              />
            </div>
          </div>

          <div style={actions}>
            <button
                style={{
                  ...primaryBtn,
                  opacity:
                      subject.trim()
                          ? 1
                          : 0.4,
                }}
                onClick={() =>
                    onConfirm(
                        subject.trim(),
                        examYear.trim(),
                        questionCount
                    )
                }
                disabled={
                  !subject.trim()
                }
            >
              開始する
            </button>

            <button
                style={ghostBtn}
                onClick={onClose}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.25)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1100,
}

const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  backgroundColor: '#fff',
  borderRadius: '16px 16px 0 0',
  padding: '0 20px calc(36px + env(safe-area-inset-bottom, 0px))',
  boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
}

const handle: React.CSSProperties = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: 'rgba(55,53,47,0.15)',
  margin: '12px auto 20px',
}

const title: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: c.text,
  margin: '0 0 20px',
}

const fields: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '24px',
}

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const input: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  fontSize: font.base,
  fontWeight: 600,
  boxSizing: 'border-box',
  width: '100%',
  outline: 'none',
}

const actions: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const primaryBtn: React.CSSProperties = {
  padding: '14px',
  border: 'none',
  borderRadius: '10px',
  background: c.text,
  color: '#fff',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}

const ghostBtn: React.CSSProperties = {
  padding: '12px',
  border: 'none',
  borderRadius: '10px',
  background: 'transparent',
  color: c.textSub,
  fontSize: font.sm,
  fontWeight: 600,
  cursor: 'pointer',
}
