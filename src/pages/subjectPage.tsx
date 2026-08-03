import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getCached, setCached} from "@/lib/pageCache";
import {
    deleteSubject,
    fetchSubjectMonthlyGoal,
    fetchSubjectSettings,
    renameSubject,
    saveSubjectMonthlyGoal,
    saveSubjectSettings
} from "@/lib/api/subjects.ts";
import {SubjectHeader} from "@/components/subject/SubjectHeader.tsx";
import {SubjectActivity} from "@/components/subject/SubjectActivity.tsx";
import type {SubjectAlertSettings, SubjectSettings} from "@/types/workspace.ts";
import {DEFAULT_SUBJECT_ALERT_SETTINGS, formatDuration} from "@/types/workspace.ts";
import {subjectUi} from "@/styles/subjectUI.ts";
import {fetchSubjectAlertSettings, updateSubjectAlertSettings} from "@/lib/api/subjectAlertSettings.ts";
import {useSettingsStore} from "@/lib/store/settings.ts";
import {StrategySection} from "@/components/subject/StrategySection.tsx";
import {SubjectExamStats} from "@/components/subject/SubjectExamStats.tsx";
import {SubjectSettingsModal} from "@/components/subject/SubjectSettingsModal.tsx";
import {fetchSubjectsSummary} from "@/lib/api/gemini.ts"
import {StatusCopyModal} from "@/components/common/StatusCopyModal.tsx";


export default function SubjectPage() {
    const { name: encodedName } = useParams<{ name: string }>()
    const subjectName = decodeURIComponent(encodedName ?? '')
    const navigate = useNavigate()

    const subjects = useSettingsStore((s) => s.subjects)
    const setSubjects = useSettingsStore((s) => s.setSubjects)

    const now = new Date()
    const [viewYear, setViewYear] = useState(now.getFullYear())
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

    const [monthlyGoal, setMonthlyGoal] = useState('')
    const [goalLoading, setGoalLoading] = useState(false)

    const [settings, setSettings] = useState<SubjectSettings>({ finalTarget: null, themeColor: null })
    const [settingsLoaded, setSettingsLoaded] = useState(false)
    const setSubjectColor = useSettingsStore((s) => s.setSubjectColor)

    const setSubjectAlertSettings = useSettingsStore((s) => s.setSubjectAlertSettings)
    const [subjectAlertSettings, setLocalSubjectAlertSettings] = useState<SubjectAlertSettings>(DEFAULT_SUBJECT_ALERT_SETTINGS)
    const [alertSaving, setAlertSaving] = useState(false)
    const [alertSaved, setAlertSaved] = useState(false)

    const [showSettings, setShowSettings] = useState(false)
    const [statsCopying, setStatsCopying] = useState(false)
    const [statsCopied, setStatsCopied] = useState(false)
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
    const [copyText, setCopyText] = useState('')

    const prevMonth = () => {
        if (viewMonth === 1) {
            setViewYear(y => y - 1)
            setViewMonth(12)
        } else {
            setViewMonth(m => m - 1)
        }
    }

    const nextMonth = () => {
        if (viewMonth === 12) {
            setViewYear(y => y + 1)
            setViewMonth(1)
        } else {
            setViewMonth(m => m + 1)
        }
    }

    // Phase 1: settings — キャッシュで即表示、バックグラウンド更新
    useEffect(() => {
        const cacheKey = `subject-settings-${subjectName}`
        const cached = getCached<SubjectSettings>(cacheKey)
        if (cached) {
            setSettings(cached)
            setSubjectColor(subjectName, cached.themeColor)
            setSettingsLoaded(true)
        }
        fetchSubjectSettings(subjectName)
            .then((s) => {
                setSettings(s)
                setSubjectColor(subjectName, s.themeColor)
                setSettingsLoaded(true)
                setCached(cacheKey, s)
            })
            .catch(() => setSettingsLoaded(true))

        // Phase 3: alert settings — モーダル専用、独立実行
        fetchSubjectAlertSettings(subjectName)
            .then((s) => setLocalSubjectAlertSettings(s))
            .catch(() => {})
    }, [subjectName])

    // Phase 2: monthly goal — 月切り替えのたびにキャッシュ付き再フェッチ
    useEffect(() => {
        const cacheKey = `subject-goal-${subjectName}-${viewYear}-${viewMonth}`
        const cached = getCached<string>(cacheKey)
        if (cached !== null) {
            setMonthlyGoal(cached)
            setGoalLoading(false)
        } else {
            setGoalLoading(true)
        }
        fetchSubjectMonthlyGoal(subjectName, viewYear, viewMonth)
            .then((g) => {
                const goal = g.goal ?? ''
                setMonthlyGoal(goal)
                setCached(cacheKey, goal)
            })
            .catch(() => {})
            .finally(() => setGoalLoading(false))
    }, [subjectName, viewYear, viewMonth])

    const handleAlertSave = async () => {
        setAlertSaving(true)
        try {
            const saved = await updateSubjectAlertSettings(subjectName, subjectAlertSettings)
            setLocalSubjectAlertSettings(saved)
            setSubjectAlertSettings(subjectName, saved)
            setAlertSaved(true)
            setTimeout(() => setAlertSaved(false), 2000)
        } catch {
            // silent fail
        } finally {
            setAlertSaving(false)
        }
    }


    const handlePrepareStats = async () => {
        if (statsCopying) return
        setStatsCopying(true)
        try {
            const ctx = await fetchSubjectsSummary(viewYear, viewMonth)
            const s = ctx.subjects.find((s) => s.subject === subjectName)
            const lines = [`[Subject Status: ${subjectName}]`]
            lines.push(`Period: ${ctx.year}/${String(ctx.month).padStart(2, '0')}`)
            if (s?.finalTarget) lines.push(`Final Target: ${s.finalTarget}`)
            if (s?.monthlyGoal) lines.push(`Monthly Goal: ${s.monthlyGoal}`)
            lines.push('')
            lines.push('[Study Progress]')
            lines.push(`Study Time: ${formatDuration(s?.studyMinutes ?? 0)}`)
            if (s?.recentExamScore) {
                const { examYear, score, completedAt } = s.recentExamScore
                const dateStr = completedAt ? ` (${completedAt})` : ''
                lines.push('')
                lines.push('[Recent Exam]')
                lines.push(`  ${examYear} ${score}pts${dateStr}`)
            }
            setCopyText(lines.join('\n'))
            setIsCopyModalOpen(true)
        } catch (e) {
            console.error(e)
        } finally {
            setStatsCopying(false)
        }
    }

    const handleFinalCopy = async () => {
        try {
            await navigator.clipboard.writeText(copyText)
            setStatsCopied(true)
            setTimeout(() => {
                setStatsCopied(false)
                setIsCopyModalOpen(false)
            }, 800)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <>
        <div style={subjectUi.page}>
            <div style={subjectUi.container}>

                {/* HEADER */}
                <section>
                    <SubjectHeader
                        subjectName={subjectName}
                        renameSubject={renameSubject}
                        subjects={subjects}
                        setSubjects={setSubjects}
                        navigate={navigate}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                </section>

                <StrategySection
                    settingsLoaded={settingsLoaded}
                    settings={settings}
                    setSettings={setSettings}
                    saveSubjectSettings={saveSubjectSettings}
                    subjectName={subjectName}
                />

                {/* ACTIVITY */}
                <section style={subjectUi.card}>
                    <div>
                        <h3 style={subjectUi.title}>ACTIVITY</h3>
                    </div>

                    <SubjectActivity
                        subjectName={subjectName}
                        viewYear={viewYear}
                        viewMonth={viewMonth}
                        monthlyGoal={monthlyGoal}
                        setMonthlyGoal={setMonthlyGoal}
                        goalLoading={goalLoading}
                        saveSubjectMonthlyGoal={saveSubjectMonthlyGoal}
                        prevMonth={prevMonth}
                        nextMonth={nextMonth}
                    />
                </section>

                {/* EXAM 分析 */}
                <SubjectExamStats subjectName={subjectName} />

                {/* ステータスコピー */}
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(55,53,47,0.08)' }}>
                    <button
                        onClick={handlePrepareStats}
                        disabled={statsCopying}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-[rgba(55,53,47,0.12)] bg-[rgba(55,53,47,0.03)] text-[rgba(55,53,47,0.5)] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                        {statsCopied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="2" width="6" height="4" rx="1" />
                                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                            </svg>
                        )}
                        <span>{statsCopied ? 'Copied' : statsCopying ? 'Loading...' : 'Copy status'}</span>
                    </button>
                </div>

                {showSettings && (
                    <SubjectSettingsModal
                        subjectName={subjectName}
                        settings={settings}
                        setSettings={setSettings}
                        saveSubjectSettings={saveSubjectSettings}
                        settingsLoaded={settingsLoaded}
                        subjectAlertSettings={subjectAlertSettings}
                        setLocalSubjectAlertSettings={setLocalSubjectAlertSettings}
                        handleAlertSave={handleAlertSave}
                        alertSaving={alertSaving}
                        alertSaved={alertSaved}
                        deleteSubject={deleteSubject}
                        subjects={subjects}
                        setSubjects={setSubjects}
                        navigate={navigate}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </div>
        </div>

        {isCopyModalOpen && (
            <StatusCopyModal
                text={copyText}
                copied={statsCopied}
                onCopy={handleFinalCopy}
                onClose={() => setIsCopyModalOpen(false)}
            />
        )}
        </>
    )
}

