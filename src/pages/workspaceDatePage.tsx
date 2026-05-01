import {
  addStudySession,
  completeDailyLog,
  createDailyLog,
  deleteDailyLog,
  deleteStudySession,
  fetchDailyLog,
  uncompleteDailyLog,
  updateReflection, updateStudySession
} from "../lib/api/workspace";
import {DayHeader} from "../components/workspace/DayHeader";
import {DayReflection} from "../components/workspace/DayReflection";
import {StudyBlockList} from "../components/workspace/StudyBlockList";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {fetchSubCategories} from "../lib/api/subcategory";
import type {DailyLog, SubCategory} from "../types/workspace";
import {Suspense, useCallback, useEffect, useState} from "react";

export default function WorkspaceDatePage() {
  return (
      <Suspense fallback={<div style={loaderStyle}>Loading...</div>}>
        <WorkspaceDateContent />
      </Suspense>
  )
}

function WorkspaceDateContent() {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const date = params.date

  const initialMinutes = searchParams.get('minutes')
      ? parseInt(searchParams.get('minutes')!, 10)
      : undefined

  const [log, setLog] = useState<DailyLog | null>(null)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
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

  const handleDelete = useCallback(async () => {
    if (!date) return
    if (!window.confirm(`${date} のデイリーログを削除しますか？\nすべての学習記録も削除されます。`)) return
    setDeleteLoading(true)
    try {
      await deleteDailyLog(date)
      navigate('/workspace/daily-logs', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeleteLoading(false)
    }
  }, [date, navigate])

  if (loading) return <div style={content}><p style={infoText}>Loading...</p></div>
  if (error || !log) return <div style={content}><p style={errorText}>{error}</p></div>

  return (
      <div style={pageWrapper}>
        <div style={content}>
          <DayHeader
              log={log}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              loading={actionLoading}
          />

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

          <div style={reflectionWrapper}>
            <div style={sectionLabel}>REFLECTION</div>
            <DayReflection
                value={log.reflection}
                readonly={log.isCompleted}
                onSave={async (t) => { if (date) setLog(await updateReflection(date, t)) }}
            />
          </div>

          {/* Delete button at bottom */}
          <div style={deleteArea}>
            <button style={deleteBtn} onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? '削除中...' : 'このデイリーを削除'}
            </button>
          </div>
        </div>
      </div>
  )
}

const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f' }
const content: React.CSSProperties = { width: '100%', maxWidth: '720px', margin: '0 auto', padding: '40px 20px 100px' }
const section: React.CSSProperties = { marginBottom: '40px' }
const sectionLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.3)',
  marginBottom: '12px', letterSpacing: '0.06em',
}
const reflectionWrapper: React.CSSProperties = { marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(55, 53, 47, 0.09)' }
const deleteArea: React.CSSProperties = { marginTop: '60px', paddingTop: '24px', borderTop: '1px solid rgba(55, 53, 47, 0.06)', display: 'flex', justifyContent: 'center' }
const deleteBtn: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'transparent',
  border: '1px solid rgba(235, 87, 87, 0.3)',
  borderRadius: '6px',
  fontSize: '13px',
  color: 'rgba(235, 87, 87, 0.7)',
  cursor: 'pointer',
  fontWeight: 500,
}
const infoText: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.45)', fontSize: '14px' }
const errorText: React.CSSProperties = { color: '#eb5757', fontSize: '14px' }
const loaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'rgba(55, 53, 47, 0.45)' }
