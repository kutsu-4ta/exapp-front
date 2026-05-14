import {LongPressButton} from "@/components/common/LongPressButton.tsx";
import {FailureTypeSelector} from "@/components/common/FailureTypeSlecter.tsx";
import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {deleteProblem, updateProblem} from '../../lib/api/problem'
import {Copy, Eye, EyeOff} from 'lucide-react'
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";

type Props = {
  problem: Problem
  onClose: () => void
  onDelete: (id: number) => void
  onUpdate: (problem: Problem) => void
}

export function ProblemQuickModal({ problem, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draft, setDraft] = useState<Problem>(problem)

  const [note, setNote] = useState(problem.note ?? '')
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)
  const [preview, setPreview] = useState(true)

  const [copied, setCopied] = useState(false)

  const timerRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)

  const noteRef = useRef<HTMLTextAreaElement | null>(null)

  // 編集開始時にコピー
  useEffect(() => {
    if (editing) {
      setDraft(problem)
    }
  }, [editing, problem])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = original
      window.clearTimeout(timerRef.current ?? 0)
      window.clearTimeout(successTimerRef.current ?? 0)
    }
  }, [])

  function scheduleSave(value: string) {
    setSaveSuccessVisible(false)

    window.clearTimeout(timerRef.current ?? 0)

    timerRef.current = window.setTimeout(async () => {
      const updated = await updateProblem(problem.id, {
        ...problem,
        note: value,
      })

      onUpdate(updated)

      setSaveSuccessVisible(true)

      successTimerRef.current = window.setTimeout(() => {
        setSaveSuccessVisible(false)
      }, 3000)

    }, 500)
  }

  async function handleMetaSave() {
    const updated = await updateProblem(problem.id, draft)
    onUpdate(updated)
    setEditing(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(note || '')
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (e) {
      console.error('copy failed', e)
    }
  }

  async function handleDelete() {
    if (!confirm('本当に削除しますか？')) return

    setDeleting(true)

    try {
      await deleteProblem(problem.id)
      onDelete(problem.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const isEditing = editing

  return (
      <div style={overlay} onClick={onClose}>
        <div style={sheet} onClick={(e) => e.stopPropagation()}>
          <div style={handle} />

          <div style={header}>
            <button style={closeBtn} onClick={onClose}>×</button>

            <button
                style={editBtn}
                onClick={() => setEditing(v => !v)}
            >
              {editing ? 'キャンセル' : '問題情報を編集する'}
            </button>
          </div>

          <div style={body}>

            {/* ===== META ===== */}
            {isEditing ? (
                <>
                  <input
                      style={input}
                      value={draft.subject}
                      onChange={(e) =>
                          setDraft(prev => ({ ...prev, subject: e.target.value }))
                      }
                      placeholder="科目"
                  />

                  <input
                      style={input}
                      value={draft.materialName ?? ''}
                      onChange={(e) =>
                          setDraft(prev => ({ ...prev, materialName: e.target.value }))
                      }
                      placeholder="教材"
                  />

                  <input
                      style={input}
                      value={draft.questionRef}
                      onChange={(e) =>
                          setDraft(prev => ({ ...prev, questionRef: e.target.value }))
                      }
                      placeholder="問題番号"
                  />

                  <input
                      style={input}
                      value={draft.subCategory ?? ''}
                      onChange={(e) =>
                          setDraft(prev => ({ ...prev, subCategory: e.target.value }))
                      }
                      placeholder="小分類"
                  />

                  <textarea
                      style={factorTextarea}
                      value={draft.defeatReason ?? ''}
                      onChange={(e) =>
                          setDraft(prev => ({
                            ...prev,
                            defeatReason: e.target.value
                          }))
                      }
                      placeholder="敗因"
                  />

                  <FailureTypeSelector
                      value={draft.failureTypes}
                      onChange={(next) =>
                          setDraft(prev => ({ ...prev, failureTypes: next }))
                      }
                  />

                  <label style={{ display: 'block', marginTop: 16 }}>
                    <input
                        type="checkbox"
                        checked={draft.isGoodQuestion}
                        onChange={(e) =>
                            setDraft(prev => ({
                              ...prev,
                              isGoodQuestion: e.target.checked
                            }))
                        }
                    />
                    良問
                  </label>

                  <button style={saveMetaBtn} onClick={handleMetaSave}>
                    保存
                  </button>
                </>
            ) : (
                <>
                  <div style={metaRow}>
                    <span style={subjectTag}>{problem.subject}</span>
                    <span style={subCatTag}>
                  {problem.materialName} {problem.questionRef}
                </span>
                    {problem.isGoodQuestion && <span style={starTag}>★ 良問</span>}
                  </div>

                  <p style={questionRefStyle}>{problem.subCategory}</p>

                  {problem.failureTypes.length > 0 && (
                      <div style={section}>
                        <div style={pillsRow}>
                          {problem.failureTypes.map(ft => (
                              <span key={ft} style={pill}>{ft}</span>
                          ))}
                        </div>
                      </div>
                  )}

                  {problem.defeatReason && (
                      <div style={section}>
                        <p style={sectionLbl}>敗因</p>
                        <div style={defeatBox}>{problem.defeatReason}</div>
                      </div>
                  )}
                </>
            )}

            {/* ===== NOTE ===== */}
            {!editing && (
                <div style={section}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={sectionLbl}>ノート</p>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                      {/* コピー */}
                      <button
                          onClick={handleCopy}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: c.blue,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="コピー"
                      >
                        <Copy size={18} />
                        {copied && (
                            <span
                                style={{
                                  fontSize: '12px',
                                  color: '#19a576',
                                  lineHeight: 1,
                                }}
                            >✓</span>
                        )}
                      </button>

                      {/* プレビュー切替 */}
                      <button
                          onClick={() => setPreview(v => !v)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: c.blue,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={preview ? 'プレビュー' : '編集'}
                      >
                        {preview ? <Eye size={18} /> : <EyeOff size={18} /> }
                      </button>

                    </div>
                  </div>

                  {preview ? (
                      <div style={markdownPreview}>
                        <MarkdownContent>
                          {note || ''}
                        </MarkdownContent>
                      </div>
                  ) : (
                      <textarea
                          ref={noteRef}
                          value={note}
                          onChange={(e) => {
                            const v = e.target.value
                            setNote(v)
                            scheduleSave(v)
                          }}
                          style={noteTextarea}
                          placeholder="ノートをとる..."
                      />
                  )}

                  {saveSuccessVisible && (
                      <div style={saveLabelSuccess}>自動保存済み</div>
                  )}
                </div>
            )}

            <div style={{ paddingBottom: 32 }}>
              <LongPressButton
                  onConfirm={handleDelete}
                  disabled={deleting}
                  style={deleteBtn}
              >
                この問題を削除
              </LongPressButton>
            </div>
          </div>
        </div>
      </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'flex-end',
}

const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  margin: '0 auto',
  backgroundColor: '#fff',
  borderRadius: '16px 16px 0 0',
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
}

const handle = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  background: 'rgba(55,53,47,0.15)',
  margin: '10px auto 0',
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: `1px solid ${c.border}`,
}

const body: React.CSSProperties = {
  padding: '20px 16px',
  overflowY: 'auto',
  flex: 1,
}

const closeBtn = {
  border: 'none',
  background: 'none',
}

const editBtn = {
  border: 'none',
  background: 'none',
  color: c.blue,
}

const input = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
}

const noteTextarea: React.CSSProperties = {
  width: '100%',
  height: '500px',
  overflowY: 'auto',
  resize: 'none',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: 'none',
  fontSize: '15px',
  lineHeight: 1.7,
  boxSizing: 'border-box',
  transition: 'background 0.15s ease, border-color 0.15s ease',
}

const factorTextarea: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  overflowY: 'auto',
  resize: 'none',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: 'none',
  fontSize: '15px',
  lineHeight: 1.7,
  boxSizing: 'border-box',
  transition: 'background 0.15s ease, border-color 0.15s ease',
}
const metaRow = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const,
  marginBottom: '16px',
}

const subjectTag = {
  padding: '4px 8px',
  borderRadius: '6px',
  background: '#eef5ff',
  color: c.blue,
  fontSize: font.sm,
}

const subCatTag = {
  padding: '4px 8px',
  borderRadius: '6px',
  background: '#f6f6f6',
  color: c.textSub,
}

const starTag = {
  padding: '4px 8px',
  borderRadius: '6px',
  background: '#fff8df',
}

const questionRefStyle = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '20px',
}

const section = {
  marginBottom: '20px',
}

const sectionLbl = {
  fontSize: '12px',
  color: c.textSub,
  marginBottom: '8px',
}

const pillsRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '6px',
}

const pill = {
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#f3f3f3',
}

const defeatBox = {
  padding: '12px',
  borderRadius: '8px',
  color: c.red,
  background: 'rgba(235,87,87,0.04)',
}

const saveLabelSuccess = {
  marginTop: '6px',
  fontSize: '12px',
  color: '#19a576',
  fontWeight: 500,
}

const saveMetaBtn = {
  width: '100%',
  marginTop: '16px',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  background: c.blue,
  color: '#fff',
}

const deleteBtn: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  border: "none",
  fontSize: "13px",
  width: "100%",
  color: "rgba(235, 87, 87, 0.6)",
  cursor: "pointer",
  fontWeight: 500,
};

const markdownPreview: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  minHeight: '500px',
  fontSize: '15px',
  lineHeight: 1.7,
  color: c.text,
}