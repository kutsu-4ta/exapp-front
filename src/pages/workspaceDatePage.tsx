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
import {fetchSubCategories} from "../lib/api/subcategory";
import type {DailyLog, SubCategory} from "../types/workspace";
import {Suspense, useCallback, useEffect, useState} from "react";
import {backBtn} from "@/styles/notion.ts";
import {StopWatchWidget} from "@/components/dashboard/StopWatchWidget.tsx";

export default function WorkspaceDatePage() {
    return (
        <Suspense fallback={<div style={loaderStyle}>Loading...</div>}>
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

    const [log, setLog] = useState<DailyLog | null>(null)
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 初期データ取得
    useEffect(() => {
        if (!date) return
            ;
        (async () => {
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
        navigator.vibrate?.(15) // Tapticフィードバック
        setActionLoading(true)
        try {
            const updatedLog = await completeDailyLog(date)
            setLog(updatedLog)
        } finally {
            setActionLoading(false)
        }
    }, [date])

    const handleUncomplete = useCallback(async () => {
        if (!date) return
        navigator.vibrate?.(10)
        setActionLoading(true)
        try {
            const updatedLog = await uncompleteDailyLog(date)
            setLog(updatedLog)
        } finally {
            setActionLoading(false)
        }
    }, [date])

    const handleDelete = useCallback(async () => {
        if (!date) return
        if (!window.confirm(`${date} のデイリーログを削除しますか？\nすべての学習記録も削除されます。`)) return
        setDeleteLoading(true)
        try {
            await deleteDailyLog(date)
            navigate('/workspace/daily-logs', {replace: true})
        } catch (err) {
            alert(err instanceof Error ? err.message : '削除に失敗しました')
        } finally {
            setDeleteLoading(false)
        }
    }, [date, navigate])

    const handleAddSession = useCallback(async (input: any) => {
        const newSession = await addStudySession(input)
        setLog(prev => prev ? {
            ...prev,
            studySessions: [...prev.studySessions, newSession]
        } : null)
        return newSession
    }, [])

    const handleUpdateSession = useCallback(async (id: number, input: any) => {
        const updated = await updateStudySession(id, input)
        setLog(prev => prev ? {
            ...prev,
            studySessions: prev.studySessions.map(s => s.id === id ? updated : s)
        } : null)
    }, [])

    const handleDeleteSession = useCallback(async (id: number) => {
        await deleteStudySession(id)
        setLog(prev => prev ? {
            ...prev,
            studySessions: prev.studySessions.filter(s => s.id !== id)
        } : null)
    }, [])

    if (loading) return <div style={fullPageCenter}><p style={infoText}>Loading...</p></div>
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

                    {/* Complete時は非表示にする */}
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
                            onSave={async (t) => {
                                const updatedLog = await updateReflection(log.date, t)
                                setLog(updatedLog)
                            }}
                        />
                    </section>

                    <div style={deleteArea}>
                        <button style={deleteBtn} onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? 'Deleting...' : 'Delete this daily log'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 固定ボトムアクションバー: BottomNavの上に配置 */}
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

// Styles
const pageWrapper: React.CSSProperties = {
    backgroundColor: '#fff',
    minHeight: '100vh',
    color: '#37352f',
}

const content: React.CSSProperties = {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    // ボトムバー(約80px) + BottomNav(56px) + 余白を考慮
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
    transition: 'color 0.2s',
}

const fullPageCenter: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fff'
}

const infoText: React.CSSProperties = {color: 'rgba(55, 53, 47, 0.4)', fontSize: '14px', fontWeight: 500}
const errorText: React.CSSProperties = {color: '#eb5757', fontSize: '14px', fontWeight: 500}
const loaderStyle: React.CSSProperties = {...fullPageCenter}

const bottomBar: React.CSSProperties = {
    position: 'fixed',
    // BottomNav(56px + safe-area) のすぐ上に配置されるように計算
    bottom: 'calc(56px + env(safe-area-inset-bottom))',
    left: 0,
    right: 0,
    padding: '16px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(55, 53, 47, 0.08)',
    zIndex: 900, // BottomNav(1000)より背面に設定して重なりを整理
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