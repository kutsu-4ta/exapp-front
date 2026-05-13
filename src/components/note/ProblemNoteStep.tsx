import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

export function ProblemNoteStep({ problem, onAutoSave, onClose }: Props) {
  const [note, setNote] = useState(problem.note ?? '')
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false)
  const successTimerRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef?.current ?? 0)
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

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  return (
    <>
      <div style={header}>
        {problem.subject} / {problem.subCategory} / {problem.materialName} / {problem.questionRef}
      </div>

      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
        }}
        onBlur={() => {
          scheduleSave(note)
        }}
        style={textarea}
      />

      {saveSuccessVisible && (
          <div style={saveLabelSuccess}>
            自動保存済み
          </div>
      )}

      <div style={actions}>
        <button onClick={onClose}>終了</button>
        <button onClick={onClose}>完了</button>
      </div>
    </>
  )
}

const header = {
  marginBottom: 16,
  fontSize: 13,
  color: 'rgba(55,53,47,.55)',
}

const textarea = {
  width: '100%',
  minHeight: 240,
  padding: 16,
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