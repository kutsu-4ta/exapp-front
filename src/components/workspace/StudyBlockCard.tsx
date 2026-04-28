'use client'

import { useState } from 'react'
import type { StudySession, StudySessionInput } from '@/types/workspace'
import { TIME_SLOT_LABELS, formatMinutes, calcMinutes } from '@/types/workspace'
import { StudyBlockForm } from './StudyBlockForm'

type Props = {
  session: StudySession
  readonly: boolean
  onUpdate: (id: number, input: Omit<StudySessionInput, 'dailyLogDate'>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function StudyBlockCard({ session, readonly, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const minutes = calcMinutes(session.startTime, session.endTime)

  async function handleUpdate(input: StudySessionInput) {
    const { timeSlot, startTime, endTime, subject, material, memo } = input
    await onUpdate(session.id, { timeSlot, startTime, endTime, subject, material, memo })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('このブロックを削除しますか？')) return
    setDeleting(true)
    try {
      await onDelete(session.id)
    } finally {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <StudyBlockForm
        date={session.dailyLogDate}
        timeSlot={session.timeSlot}
        initial={session}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #000000',
        borderRadius: '8px',
        padding: '1rem 1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#5c3a1e',
              backgroundColor: '#f0e8dd',
              borderRadius: '4px',
              padding: '0.125rem 0.5rem',
              letterSpacing: '0.04em',
            }}
          >
            {TIME_SLOT_LABELS[session.timeSlot]}
          </span>
          <span
            style={{
              fontSize: '0.8125rem',
              color: '#7a6858',
              letterSpacing: '0.02em',
            }}
          >
            {session.startTime}
            {session.endTime && ` – ${session.endTime}`}
            {minutes > 0 && (
              <span style={{ marginLeft: '0.375rem', color: '#b5a99a' }}>
                ({formatMinutes(minutes)})
              </span>
            )}
          </span>
        </div>

        {!readonly && (
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => setEditing(true)}
              style={{
                fontSize: '0.75rem',
                color: '#7a6858',
                background: 'none',
                border: '1px solid #000000',
                borderRadius: '4px',
                padding: '0.125rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: '0.75rem',
                color: '#c0392b',
                background: 'none',
                border: '1px solid #f0d0cc',
                borderRadius: '4px',
                padding: '0.125rem 0.5rem',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              削除
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#2a1c10',
            letterSpacing: '0.02em',
          }}
        >
          {session.subject}
        </span>
        {session.material && (
          <span
            style={{
              fontSize: '0.8125rem',
              color: '#7a6858',
              letterSpacing: '0.02em',
            }}
          >
            {session.material}
          </span>
        )}
      </div>

      {session.memo && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#5c4a38',
            letterSpacing: '0.02em',
            marginTop: '0.125rem',
          }}
        >
          {session.memo}
        </p>
      )}
    </div>
  )
}
