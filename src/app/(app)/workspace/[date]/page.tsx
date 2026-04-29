'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { DailyLog, StudySession, SubCategory } from '@/types/workspace'
import {
  fetchDailyLog, createDailyLog, updateReflection,
  completeDailyLog, uncompleteDailyLog,
  addStudySession, updateStudySession, deleteStudySession,
} from '@/lib/api/workspace'
import { fetchSubCategories } from '@/lib/api/subcategory'
import { DayHeader } from '@/components/workspace/DayHeader'
import { StudyBlockList } from '@/components/workspace/StudyBlockList'
import { DayReflection } from '@/components/workspace/DayReflection'

export default function WorkspaceDatePage() {
  return (
      <Suspense fallback={<div style={loaderStyle}>Loading...</div>}>
        <WorkspaceDateContent />
      </Suspense>
  )
}

function WorkspaceDateContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const date = Array.isArray(params.date) ? params.date[0] : params.date

  const initialMinutes = searchParams.get('minutes')
      ? parseInt(searchParams.get('minutes')!, 10)
      : undefined

  const [log, setLog] = useState<DailyLog | null>(null)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
        ;(async () => {
      try {
        const [logData, subCats] = await Promise.all([
          fetchDailyLog(date).then((d) => d ?? createDailyLog(date)),
          fetchSubCategories(),
        ])
        setLog(logData)
        setSubCategories(subCats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました')
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

  if (loading) return <div style={content}><p style={infoText}>Loading...</p></div>
  if (error || !log) return <div style={content}><p style={errorText}>{error}</p></div>

  return (
      <div style={pageWrapper}>
        {/* Notion-style Top Bar */}
        <nav style={navBar}>
          <div style={breadcrumb}>
            <span style={navIcon}>📝</span>
            {/* 一覧画面へのリンクに変更 */}
            <Link href="/workspace/daily-logs" style={navLink}>
              Workspace
            </Link>
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

          {/* Content Section */}
          <div style={section}>
            <div style={sectionLabel}>CONTENT</div>
            <StudyBlockList
                date={log.date}
                sessions={log.studySessions}
                readonly={log.isCompleted}
                initialMinutes={initialMinutes}
                subCategories={subCategories}
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

          {/* Reflection Section */}
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
const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }
const breadcrumb: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const navIcon: React.CSSProperties = { marginRight: '6px' }

// ホバー時に下線が出るように調整
const navLink: React.CSSProperties = {
  color: 'rgba(55, 53, 47, 0.5)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s ease-in-out',
  padding: '2px 4px',
  borderRadius: '4px'
}

const sep: React.CSSProperties = { margin: '0 2px', color: 'rgba(55, 53, 47, 0.16)' }
const activeNav: React.CSSProperties = { fontWeight: 500, paddingLeft: '4px' }
const navActions: React.CSSProperties = { display: 'flex', gap: '8px' }
const primaryBtn: React.CSSProperties = { backgroundColor: '#2383e2', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { backgroundColor: 'transparent', color: 'rgba(55, 53, 47, 0.45)', border: '1px solid rgba(55, 53, 47, 0.16)', padding: '4px 12px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }
const content: React.CSSProperties = { width: '100%', maxWidth: '720px', margin: '0 auto', padding: '60px 20px 100px' }
const section: React.CSSProperties = { marginBottom: '40px' }
const sectionLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)', marginBottom: '12px', letterSpacing: '0.06em' }
const reflectionWrapper: React.CSSProperties = { marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(55, 53, 47, 0.09)' }
const infoText: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.45)', fontSize: '14px' }
const errorText: React.CSSProperties = { color: '#eb5757', fontSize: '14px' }
const loaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'rgba(55, 53, 47, 0.45)' }