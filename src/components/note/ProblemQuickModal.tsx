import {useEffect, useRef, useState} from 'react'
import type {FailureType, Problem} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {deleteProblem, updateProblem} from '../../lib/api/problem'
import {LongPressButton} from "@/components/common/LongPressButton.tsx";

type Props = {
  problem: Problem
  onClose: () => void
  onDelete: (id: number) => void
  onUpdate: (problem: Problem) => void
}

export function ProblemQuickModal({ problem, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const timerRef = useRef<number | null>(null)
  const noteRef = useRef<HTMLTextAreaElement | null>(null)

  const [subject, setSubject] = useState(problem.subject)
  const [materialName, setMaterialName] = useState(problem.materialName ?? '')
  const [questionRef, setQuestionRef] = useState(problem.questionRef)
  const [subCategory, setSubCategory] = useState(problem.subCategory ?? '')
  const [defeatReason, setDefeatReason] = useState(problem.defeatReason ?? '')
  const [failureTypes, setFailureTypes] = useState(problem.failureTypes)
  const [isGoodQuestion, setIsGoodQuestion] = useState(problem.isGoodQuestion)
  const [note, setNote] = useState(problem.note ?? '')

  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)
  const successTimerRef = useRef<number | null>(null)

  function resizeNote() {
    const el = noteRef.current
    if (!el) return

    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    resizeNote()
  }, [note])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = original
      window.clearTimeout(timerRef.current ?? 0)
    }
  }, [])

  function scheduleSave(value: string) {
    setSaveSuccessVisible(false)

    window.clearTimeout(timerRef.current ?? 0)

    timerRef.current = window.setTimeout(async () => {
      const updated = await updateProblem(problem.id, {
        ...problem,
        subject,
        materialName,
        questionRef,
        subCategory,
        defeatReason: defeatReason.trim() || null,
        failureTypes,
        isGoodQuestion,
        note: value,
      })

      onUpdate(updated)

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }

      setSaveSuccessVisible(true)

      successTimerRef.current = window.setTimeout(() => {
        setSaveSuccessVisible(false)
      }, 3000)

    }, 500)
  }

  async function handleMetaSave() {
    const updated = await updateProblem(problem.id, {
      ...problem,
      subject,
      materialName,
      questionRef,
      subCategory,
      defeatReason: defeatReason.trim() || null,
      failureTypes,
      isGoodQuestion,
      note,
    })

    onUpdate(updated)
    setEditing(false)
  }

  function toggleFailureType(ft: FailureType) {
    setFailureTypes((prev) => (prev.includes(ft) ? prev.filter((x) => x !== ft) : [...prev, ft]))
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

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = original

      window.clearTimeout(timerRef.current ?? 0)
      window.clearTimeout(successTimerRef.current ?? 0)
    }
  }, [])

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />

        <div style={header}>
          <button style={closeBtn} onClick={onClose}>
            ×
          </button>

          <button style={editBtn} onClick={() => setEditing((v) => !v)}>
            {editing ? 'キャンセル' : '編集'}
          </button>
        </div>

        <div style={body}>
          {editing ? (
            <>
              <input
                style={input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="科目"
              />

              <input
                style={input}
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="教材"
              />

              <input
                style={input}
                value={questionRef}
                onChange={(e) => setQuestionRef(e.target.value)}
                placeholder="問題番号"
              />

              <input
                style={input}
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="小分類"
              />

              <textarea
                style={noteTextarea}
                value={defeatReason}
                onChange={(e) => setDefeatReason(e.target.value)}
                placeholder="敗因"
              />

              <div style={pillsRow}>
                {failureTypes.map((ft) => (
                  <button
                    key={ft}
                    style={{
                      ...pillBtn,
                      opacity: failureTypes.includes(ft) ? 1 : 0.4,
                    }}
                    onClick={() => toggleFailureType(ft)}
                  >
                    {ft}
                  </button>
                ))}
              </div>

              <label
                style={{
                  display: 'block',
                  marginTop: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={isGoodQuestion}
                  onChange={(e) => setIsGoodQuestion(e.target.checked)}
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
                <span style={subjectTag}>{subject}</span>

                <span style={subCatTag}>
                  {materialName} {questionRef}
                </span>

                {isGoodQuestion && <span style={starTag}>★ 良問</span>}
              </div>

              <p style={questionRefStyle}>{subCategory}</p>

              {failureTypes.length > 0 && (
                <div style={section}>
                  <div style={pillsRow}>
                    {failureTypes.map((ft) => (
                      <span key={ft} style={pill}>
                        {ft}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {defeatReason && (
                <div style={section}>
                  <p style={sectionLbl}>敗因</p>

                  <div style={defeatBox}>{defeatReason}</div>
                </div>
              )}
            </>
          )}

          <div style={section}>
            <p style={sectionLbl}>メモ</p>

            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => {
                const value = e.target.value
                setNote(value)
                scheduleSave(value)
              }}
              style={noteTextarea}
              placeholder="メモを書く..."
            />

            {saveSuccessVisible && (
                <div style={saveLabelSuccess}>
                  自動保存済み
                </div>
            )}
          </div>

          <div style={{paddingBottom: 32}}>
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
  minHeight: '120px',
  height: 'auto',
  overflow: 'hidden',
  resize: 'none',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: '#fafafa',
  fontSize: '15px',
  lineHeight: 1.7,
  boxSizing: 'border-box',
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

const pillBtn = {
  ...pill,
  border: 'none',
  cursor: 'pointer',
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