import {useEffect, useRef, useState} from 'react'
import type {Problem} from '../../types/workspace'

type Props = {
  problem: Problem
  onAutoSave: (note: string) => Promise<void>
  onClose: () => void
}

export function ProblemNoteStep({ problem, onAutoSave, onClose }: Props) {
  const [note, setNote] = useState(problem.note ?? '')
  const [saved, setSaved] = useState(true)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef?.current ?? 0)
    }
  }, [])

  function scheduleSave(value: string) {
    setSaved(false)

    window.clearTimeout(timerRef?.current ?? 0)

    timerRef.current = window.setTimeout(async () => {
      await onAutoSave(value)
      setSaved(true)
    }, 500)
  }

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

      <div style={saveLabel}>{saved ? '自動保存済み' : '保存中...'}</div>

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

const saveLabel = {
  marginTop: 8,
  fontSize: 12,
  color: 'rgba(55,53,47,.4)',
}

const actions = {
  marginTop: 24,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}
