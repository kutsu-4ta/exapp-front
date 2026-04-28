'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { DailyLog, StudySession, StudySessionInput } from '@/types/workspace'
import {
  fetchDailyLog, createDailyLog, updateReflection,
  completeDailyLog, uncompleteDailyLog,
  addStudySession, updateStudySession, deleteStudySession,
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
        setError(err instanceof Error ? err.message : '読み込み失敗')
      } finally {
        setLoading(false)
      }
    })()
  }, [date])

  const handleComplete = useCallback(async () => {
    if (!date) return
    setActionLoading(true)
    try { setLog(await completeDailyLog(date)) } finally { setActionLoading(false) }
  }, [date])

  const handleUncomplete = useCallback(async () => {
    if (!date) return
    setActionLoading(true)
    try { setLog(await uncompleteDailyLog(date)) } finally { setActionLoading(false) }
  }, [date])

  // --- Render ---
  if (loading) return <div style={content}><p style={infoText}>Loading...</p></div>
  if (error || !log) return <div style={content}><p style={errorText}>{error}</p></div>

  return (
      <div style={pageWrapper}>
        {/* Notion-style Top Bar */}
        <nav style={navBar}>
          <div style={breadcrumb}>
            <span style={navIcon}>📝</span>
            <span style={navLink}>Workspace</span>
            <span style={sep}>/</span>
            <span style={activeNav}>{log.date}</span>
          </div>
          <div style={navActions}>
            {!log.isCompleted ? (
                <button onClick={handleComplete} disabled={actionLoading} style={primaryBtn}>
                  Complete page
                </button>
            ) : (
                <button onClick={handleUncomplete} disabled={actionLoading} style={ghostBtn}>
                  Reopen page
                </button>
            )}
          </div>
        </nav>

        <div style={content}>
          <DayHeader
              log={log}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              loading={actionLoading}
          />

          <div style={section}>
            <div style={sectionLabel}>
              CONTENT
            </div>
            <StudyBlockList
                date={log.date}
                sessions={log.studySessions}
                readonly={log.isCompleted}
                onAdd={async (i) => {
                  const s = await addStudySession(i)
                  if (date) setLog(await fetchDailyLog(date))
                  return s
                }}
                onUpdate={async (id, i) => {
                  await updateStudySession(id, i)
                  if (date) setLog(await fetchDailyLog(date))
                }}
                onDelete={async (id) => {
                  await deleteStudySession(id)
                  if (date) setLog(await fetchDailyLog(date))
                }}
            />
          </div>

          <div style={reflectionWrapper}>
            <div style={sectionLabel}>REFLECTION</div>
            <DayReflection
                value={log.reflection}
                readonly={log.isCompleted}
                onSave={async (t) => { if (date) setLog(await updateReflection(date, t)) }}
            />
          </div>
        </div>
      </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f' }

const navBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
}

const breadcrumb: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '13px', // 少し小さく
  color: 'rgba(55, 53, 47, 0.45)'
}
const navIcon: React.CSSProperties = { marginRight: '6px' }
const navLink: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.5)', cursor: 'pointer' }
const sep: React.CSSProperties = { margin: '0 6px', color: 'rgba(55, 53, 47, 0.16)' }
const activeNav: React.CSSProperties = { fontWeight: 500 }

const navActions: React.CSSProperties = { display: 'flex', gap: '8px' }

const primaryBtn: React.CSSProperties = {
  backgroundColor: '#2383e2',
  color: '#fff',
  border: 'none',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'rgba(55, 53, 47, 0.45)',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
}

const content: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px', // 900pxから少し絞るとモバイル/デスクトップ両方で綺麗です
  margin: '0 auto',
  padding: '60px 40px 100px', // 上の余白をしっかり取る
}
const section: React.CSSProperties = { marginBottom: '40px' }

const sectionLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(55, 53, 47, 0.3)',
  marginBottom: '12px',
  letterSpacing: '0.06em',
}

const reflectionWrapper: React.CSSProperties = {
  marginTop: '40px',
  paddingTop: '32px',
  borderTop: '1px solid rgba(55, 53, 47, 0.09)',
}

const infoText: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.45)', fontSize: '14px' }
const errorText: React.CSSProperties = { color: '#eb5757', fontSize: '14px' }