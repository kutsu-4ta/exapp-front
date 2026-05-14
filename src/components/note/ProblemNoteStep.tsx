import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'
import {Eye, EyeOff} from 'lucide-react'
import {c} from '../../styles/notion'
import {MarkdownContent} from '@/components/common/MarkdownContent'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

export function ProblemNoteStep({
                                  problem,
                                  onAutoSave,
                                  onClose,
                                }: Props) {
  const [note, setNote] = useState(problem.note ?? '')
  const [preview, setPreview] = useState(false)
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)

  const successTimerRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  function scheduleSave(value: string) {
    setSaveSuccessVisible(false)

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(async () => {
      await onAutoSave(value)

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
      }

      setSaveSuccessVisible(true)

      successTimerRef.current = window.setTimeout(() => {
        setSaveSuccessVisible(false)
      }, 3000)
    }, 500)
  }

  return (
      <div style={overlay} onClick={onClose}>
        <div style={sheet} onClick={(e) => e.stopPropagation()}>
          <div style={handle} />

          <div style={header}>
            <div>
              {problem.subject} / {problem.subCategory} /{' '}
              {problem.materialName} / {problem.questionRef}
            </div>

            <button
                onClick={() => setPreview((v) => !v)}
                style={toggleBtn}
                title={preview ? '編集に戻る' : 'プレビュー'}
            >
              {preview ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={body}>
            {preview ? (
                <div style={markdownPreview}>
                  <MarkdownContent>
                    {note || ''}
                  </MarkdownContent>
                </div>
            ) : (
                <textarea
                    value={note}
                    onChange={(e) => {
                      const value = e.target.value
                      setNote(value)
                      scheduleSave(value)
                    }}
                    onBlur={() => {
                      scheduleSave(note)
                    }}
                    style={textarea}
                    placeholder="ノートを書く..."
                />
            )}

            {saveSuccessVisible ? (
                <div style={saveLabelSuccess}>
                  自動保存済み
                </div>
            ) : (
                <span>&nbsp;</span>
            )}

            <div style={actions}>
              <button onClick={onClose}>
                完了
              </button>
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

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: `1px solid ${c.border}`,
  fontSize: 13,
  color: 'rgba(55,53,47,.55)',
}

const body: React.CSSProperties = {
  padding: '20px 16px',
  overflowY: 'auto',
  flex: 1,
}

const toggleBtn = {
  border: 'none',
  background: 'none',
  color: c.blue,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}

const textarea: React.CSSProperties = {
  width: '100%',
  height: '500px',
  overflowY: 'auto',
  resize: 'none',
  padding: '12px',
  fontSize: '15px',
  lineHeight: 1.7,
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  boxSizing: 'border-box',
  background: 'none',
}

const markdownPreview: React.CSSProperties = {
  minHeight: '500px',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontSize: '15px',
  lineHeight: 1.7,
  color: c.text,
}

const actions = {
  marginTop: 24,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}

const saveLabelSuccess = {
  marginTop: 8,
  fontSize: 12,
  color: '#19a576',
  fontWeight: 500,
}