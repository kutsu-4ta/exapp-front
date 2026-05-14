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
      <>
        <div style={header}>
          {problem.subject} / {problem.subCategory} / {problem.materialName} /{' '}
          {problem.questionRef}
        </div>

        <div style={toolbar}>
          <button
              onClick={() => setPreview((v) => !v)}
              style={toggleBtn}
              title={preview ? '編集に戻る' : 'プレビュー'}
          >
            {preview ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

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
      </>
  )
}

const header = {
  marginBottom: 16,
  fontSize: 13,
  color: 'rgba(55,53,47,.55)',
}

const toolbar = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 8,
}

const toggleBtn = {
  border: 'none',
  background: 'none',
  color: c.blue,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
}

const textarea = {
  width: '100%',
  minHeight: 240,
  padding: 16,
  fontSize: 15,
  lineHeight: 1.7,
  borderRadius: 8,
  border: `1px solid ${c.border}`,
  resize: 'vertical' as const,
}

const markdownPreview = {
  minHeight: 240,
  padding: 16,
  borderRadius: 8,
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontSize: 15,
  lineHeight: 1.7,
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