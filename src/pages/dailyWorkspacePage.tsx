import {
    addStudySession,
    completeDailyLog,
    createDailyLog,
    deleteDailyLog,
    deleteStudySession,
    fetchDailyLog,
    uncompleteDailyLog,
    updateReflection,
    updateStudySession
} from "../lib/api/workspace";
import {DayHeader} from "../components/workspace/DayHeader";
import {DayReflection} from "../components/workspace/DayReflection";
import {StudyBlockList} from "../components/workspace/StudyBlockList";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import type {DailyLog} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import {Suspense, useCallback, useEffect, useRef, useState} from "react";
import {StopWatchWidget} from "@/components/dashboard/StopWatchWidget.tsx";
import {LoadingSpinner} from "@/components/common/LoadingSpinner.tsx";
import { useTimer } from '@/context/TimerContext.tsx'
import { getCached, setCached, invalidateCache } from '../lib/pageCache'

function triggerTaptic(ms = 15) {
    if (navigator.vibrate) {
        navigator.vibrate(ms)
        return
    }
    try {
        const el = document.createElement('input')
        el.setAttribute('type', 'checkbox')
        el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;'
        document.body.appendChild(el)
        el.click()
        el.remove()
    } catch { /* silent */ }
}

// ── スケルトン ────────────────────────────────────────────────────────────────

function SkeletonBlock({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: radius,
            backgroundColor: 'rgba(55,53,47,0.08)',
            animation: 'wsSkeleton 1.4s ease-in-out infinite',
            flexShrink: 0,
        }} />
    )
}

function WorkspaceSkeleton({ onBack }: { onBack: () => void }) {
    return (
        <>
            <style>{`@keyframes wsSkeleton{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <div style={pageWrapper}>
                <div style={content}>
                    <nav>
                        <button style={backBtn} onClick={onBack}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="3" style={{marginRight: '6px'}}>
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back
                        </button>
                    </nav>

                    {/* DayHeader skeleton */}
                    <div style={{ marginBottom: '32px', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <SkeletonBlock w={24} h={24} radius={4} />
                                <SkeletonBlock w={160} h={26} />
                            </div>
                            <SkeletonBlock w={72} h={24} radius={12} />
                        </div>
                        <div style={{ borderTop: '1px solid rgba(55,53,47,0.08)', borderBottom: '1px solid rgba(55,53,47,0.08)', padding: '16px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                                <SkeletonBlock w={85} h={12} />
                                <SkeletonBlock w={60} h={18} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <SkeletonBlock w={80} h={24} radius={4} />
                                <SkeletonBlock w={80} h={24} radius={4} />
                            </div>
                        </div>
                    </div>

                    {/* CONTENT skeleton */}
                    <section style={section}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <SkeletonBlock w={12} h={12} radius={2} />
                            <SkeletonBlock w={72} h={12} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[90, 72, 80].map((w, i) => (
                                <div key={i} style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(55,53,47,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <SkeletonBlock w={`${w}%`} h={14} />
                                    <SkeletonBlock w="50%" h={12} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* REFLECTION skeleton */}
                    <section style={{ ...reflectionWrapper }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <SkeletonBlock w={12} h={12} radius={2} />
                            <SkeletonBlock w={88} h={12} />
                        </div>
                        <SkeletonBlock w="100%" h={100} radius={8} />
                    </section>
                </div>
            </div>

            <div style={bottomBar}>
                <div style={bottomBarContainer}>
                    <button style={{ ...completeBtn, opacity: 0.4, cursor: 'default' }} disabled>
                        Complete
                    </button>
                </div>
            </div>
        </>
    )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DailyWorkspacePage() {
    return (
        <Suspense fallback={<LoadingSpinner fullPage />}>
            <WorkspaceDateContent/>
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
    const initialSubject = searchParams.get('subject') ?? undefined
    const initialMaterial = searchParams.get('material') ?? undefined

    const { reset: resetTimer } = useTimer()
    const fromStopwatch = !!initialMinutes
    const stopwatchResetDone = useRef(false)

    const subCategories = useSettingsStore((s) => s.subCategories)
    const [log, setLog] = useState<DailyLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteConfirming, setDeleteConfirming] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // 初期データ取得（キャッシュヒット時は即表示 → バックグラウンド再フェッチ）
    useEffect(() => {
        if (!date) return
        const cacheKey = `workspace-log-${date}`

        const cached = getCached<DailyLog>(cacheKey)
        if (cached) {
            setLog(cached)
            setLoading(false)
        }

        ;(async () => {
            try {
                const logData = await fetchDailyLog(date).then((d) => d ?? createDailyLog(date))
                setLog(logData)
                setCached(cacheKey, logData)
            } catch (err) {
                if (!cached) setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました')
            } finally {
                setLoading(false)
            }
        })()
    }, [date])

    // ── Mutation handlers（すべてキャッシュを最新状態に更新）────────────────

    const handleComplete = useCallback(async () => {
        if (!date) return
        triggerTaptic(15)
        setActionLoading(true)
        try {
            const updatedLog = await completeDailyLog(date)
            setLog(updatedLog)
            setCached(`workspace-log-${date}`, updatedLog)
        } finally {
            setActionLoading(false)
        }
    }, [date])

    const handleUncomplete = useCallback(async () => {
        if (!date) return
        triggerTaptic(10)
        setActionLoading(true)
        try {
            const updatedLog = await uncompleteDailyLog(date)
            setLog(updatedLog)
            setCached(`workspace-log-${date}`, updatedLog)
        } finally {
            setActionLoading(false)
        }
    }, [date])

    const handleDelete = useCallback(async () => {
        if (!date) return
        setDeleteLoading(true)
        setDeleteError(null)
        try {
            await deleteDailyLog(date)
            invalidateCache(`workspace-log-${date}`)
            navigate('/workspace/daily-logs', {replace: true})
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : '削除に失敗しました')
            setDeleteLoading(false)
        }
    }, [date, navigate])

    const handleAddSession = useCallback(async (input: any) => {
        const newSession = await addStudySession(input)
        setLog(prev => {
            if (!prev) return null
            const updated = { ...prev, studySessions: [...prev.studySessions, newSession] }
            setCached(`workspace-log-${date}`, updated)
            return updated
        })
        if (fromStopwatch && !stopwatchResetDone.current) {
            stopwatchResetDone.current = true
            resetTimer()
        }
        return newSession
    }, [date, fromStopwatch, resetTimer])

    const handleUpdateSession = useCallback(async (id: number, input: any) => {
        const updated = await updateStudySession(id, input)
        setLog(prev => {
            if (!prev) return null
            const next = { ...prev, studySessions: prev.studySessions.map(s => s.id === id ? updated : s) }
            setCached(`workspace-log-${date}`, next)
            return next
        })
    }, [date])

    const handleDeleteSession = useCallback(async (id: number) => {
        await deleteStudySession(id)
        setLog(prev => {
            if (!prev) return null
            const next = { ...prev, studySessions: prev.studySessions.filter(s => s.id !== id) }
            setCached(`workspace-log-${date}`, next)
            return next
        })
    }, [date])

    const handleSaveReflection = useCallback(async (text: string | null) => {
        if (!log || !date) return
        const updatedLog = await updateReflection(log.date, text)
        setLog(updatedLog)
        setCached(`workspace-log-${date}`, updatedLog)
    }, [log, date])

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) return <WorkspaceSkeleton onBack={() => navigate(-1)} />
    if (error || !log) return <div style={fullPageCenter}><p style={errorText}>{error}</p></div>

    return (
        <>
            <div style={pageWrapper}>
                <div style={content}>
                    <nav>
                        <button style={backBtn} onClick={() => navigate(-1)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="3" style={{marginRight: '6px'}}>
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back
                        </button>
                    </nav>

                    <DayHeader log={log}/>

                    {!log.isCompleted && (
                        <StopWatchWidget/>
                    )}

                    <section style={section}>
                        <div style={sectionLabel}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2.5">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                            CONTENT
                        </div>
                        <StudyBlockList
                            date={log.date}
                            sessions={log.studySessions}
                            readonly={log.isCompleted}
                            initialMinutes={initialMinutes}
                            initialSubject={initialSubject}
                            initialMaterial={initialMaterial}
                            subCategories={subCategories}
                            onAdd={handleAddSession}
                            onUpdate={handleUpdateSession}
                            onDelete={handleDeleteSession}
                        />
                    </section>

                    <section style={reflectionWrapper}>
                        <div style={sectionLabel}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            REFLECTION
                        </div>
                        <DayReflection
                            value={log.reflection}
                            readonly={log.isCompleted}
                            onSave={handleSaveReflection}
                        />
                    </section>

                    <div style={deleteArea}>
                        {deleteConfirming ? (
                            <div style={deleteConfirmBox}>
                                <p style={deleteConfirmText}>このデイリーログと全ての学習記録を削除しますか？</p>
                                {deleteError && <p style={deleteErrorText}>{deleteError}</p>}
                                <div style={deleteConfirmActions}>
                                    <button
                                        style={deleteConfirmBtn}
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? '削除中...' : '削除する'}
                                    </button>
                                    <button
                                        style={deleteCancelBtn}
                                        onClick={() => { setDeleteConfirming(false); setDeleteError(null) }}
                                        disabled={deleteLoading}
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button style={deleteBtn} onClick={() => setDeleteConfirming(true)}>
                                Delete this daily log
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={bottomBar}>
                <div style={bottomBarContainer}>
                    {log.isCompleted ? (
                        <button style={reopenBtn} onClick={handleUncomplete} disabled={actionLoading}>
                            {actionLoading ? 'Updating...' : 'Reopen'}
                        </button>
                    ) : (
                        <button style={completeBtn} onClick={handleComplete} disabled={actionLoading}>
                            {actionLoading ? 'Processing...' : 'Complete'}
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}

const backBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)', fontWeight: 600,
    padding: '4px 8px', marginLeft: '-8px', marginBottom: '24px',
    display: 'flex', alignItems: 'center', borderRadius: '4px',
}

const pageWrapper: React.CSSProperties = {
    backgroundColor: '#fff',
    minHeight: '100vh',
    color: '#37352f',
}

const content: React.CSSProperties = {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '20px 20px 180px'
}

const section: React.CSSProperties = {marginBottom: '48px'}

const sectionLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.4)',
    marginBottom: '16px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
}

const reflectionWrapper: React.CSSProperties = {
    marginTop: '48px',
    paddingTop: '40px',
    borderTop: '1px solid rgba(55, 53, 47, 0.08)'
}

const deleteArea: React.CSSProperties = {
    marginTop: '80px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(55, 53, 47, 0.04)',
    display: 'flex',
    justifyContent: 'center'
}

const deleteBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: 'rgba(235, 87, 87, 0.6)',
    cursor: 'pointer',
    fontWeight: 500,
}

const deleteConfirmBox: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '16px',
    backgroundColor: 'rgba(235, 87, 87, 0.04)',
    border: '1px solid rgba(235, 87, 87, 0.18)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

const deleteConfirmText: React.CSSProperties = {
    fontSize: '13px',
    color: '#eb5757',
    fontWeight: 500,
    lineHeight: 1.5,
    margin: 0,
}

const deleteErrorText: React.CSSProperties = {
    fontSize: '12px',
    color: '#eb5757',
    margin: 0,
}

const deleteConfirmActions: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
}

const deleteConfirmBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#eb5757',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
}

const deleteCancelBtn: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.6)',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
}

const fullPageCenter: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fff'
}

const errorText: React.CSSProperties = {color: '#eb5757', fontSize: '14px', fontWeight: 500}

const bottomBar: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(56px + env(safe-area-inset-bottom))',
    left: 0,
    right: 0,
    padding: '16px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(55, 53, 47, 0.08)',
    zIndex: 900,
}

const bottomBarContainer: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
}

const completeBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2383e2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(35, 131, 226, 0.2)',
}

const reopenBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.6)',
    border: '1px solid rgba(55, 53, 47, 0.15)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
}
