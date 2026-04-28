'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { DailyLog, StudySession, StudySessionInput } from '@/types/workspace'
import {
  fetchDailyLog,
  createDailyLog,
  updateReflection,
  completeDailyLog,
  uncompleteDailyLog,
  addStudySession,
  updateStudySession,
  deleteStudySession,
} from '@/lib/api/workspace'
import { DayHeader } from '@/components/workspace/DayHeader'
import { StudyBlockList } from '@/components/workspace/StudyBlockList'
import { DayReflection } from '@/components/workspace/DayReflection'

export default function WorkspaceDatePage() {
  const params = useParams()
  const date = Array.isArray(params.date) ? params.date[0] : params.date

  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    ;(async () => {
      try {
        let data = await fetchDailyLog(date)
        if (!data) data = await createDailyLog(date)
        setLog(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ログの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    })()
  }, [date])

  const handleComplete = useCallback(async () => {
    if (!date) return
    setActionLoading(true)
    try {
      setLog(await completeDailyLog(date))
    } finally {
      setActionLoading(false)
    }
  }, [date])

  const handleUncomplete = useCallback(async () => {
    if (!date) return
    setActionLoading(true)
    try {
      setLog(await uncompleteDailyLog(date))
    } finally {
      setActionLoading(false)
    }
  }, [date])

  const handleAddSession = useCallback(
    async (input: StudySessionInput): Promise<StudySession> => {
      const session = await addStudySession(input)
      if (date) setLog(await fetchDailyLog(date))
      return session
    },
    [date],
  )

  const handleUpdateSession = useCallback(
    async (id: number, input: Omit<StudySessionInput, 'dailyLogDate'>) => {
      await updateStudySession(id, input)
      if (date) setLog(await fetchDailyLog(date))
    },
    [date],
  )

  const handleDeleteSession = useCallback(
    async (id: number) => {
      await deleteStudySession(id)
      if (date) setLog(await fetchDailyLog(date))
    },
    [date],
  )

  const handleSaveReflection = useCallback(
    async (text: string | null) => {
      if (!date) return
      setLog(await updateReflection(date, text))
    },
    [date],
  )

  if (loading) {
    return (
      <div style={content}>
        <p style={{ color: '#b5a99a', fontSize: '0.875rem', letterSpacing: '0.04em' }}>読み込み中…</p>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div style={content}>
        <p style={{ color: '#c0392b', fontSize: '0.875rem' }}>{error ?? 'エラーが発生しました'}</p>
      </div>
    )
  }

  return (
    <div style={content}>
      <DayHeader
        log={log}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        loading={actionLoading}
      />
      <StudyBlockList
        date={log.date}
        sessions={log.studySessions}
        readonly={log.isCompleted}
        onAdd={handleAddSession}
        onUpdate={handleUpdateSession}
        onDelete={handleDeleteSession}
      />
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #edeae6' }}>
        <DayReflection
          value={log.reflection}
          readonly={log.isCompleted}
          onSave={handleSaveReflection}
        />
      </div>
    </div>
  )
}

const content: React.CSSProperties = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  padding: '2rem 1.25rem 4rem',
}
