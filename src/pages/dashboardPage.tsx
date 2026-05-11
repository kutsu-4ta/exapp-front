import {daysAgo, formatHours, todayString} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import type {ChartDataPoint, DashboardStats, DailyLog, DailyLogSummary} from "../types/workspace";
import {useEffect, useMemo, useState} from "react";
import { fetchGeminiContext } from "@/lib/api/gemini.ts";
import {
    fetchAIAdvice,
    fetchDashboardStats,
    fetchDailyLog,
    fetchMonthlyLogs,
    fetchMonthlySettings,
    updateMonthlySettings
} from "../lib/api/workspace";
import {SubjectStatus} from "../components/dashboard/SubjectStatus";
import {DashboardChart} from "../components/dashboard/DashboardChart";
import {AlertWidget} from "../components/dashboard/AlertWidget";
import {StatCard} from "../components/dashboard/StatCard";
import {Link, useNavigate} from "react-router-dom";
import {AIAgentWidget} from "@/components/aiAgent/aiAgentWidget.tsx";
import { loadAllDrafts, type PracticeDraft } from "@/lib/practiceDraft.ts";
import { getCached, setCached } from "@/lib/pageCache";

// --- スケルトン用コンポーネント ---
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-[rgba(55,53,47,0.06)] rounded ${className}`} />
);

function buildChartData(
    year: number,
    month: number,
    logs: DailyLogSummary[],
    targetMin: number,
    targetMax: number,
    todayStr: string,
): ChartDataPoint[] {
    const daysInMonth = new Date(year, month, 0).getDate()
    const logsByDate: Record<string, number> = {}
    for (const log of logs) logsByDate[log.date] = log.totalMinutes

    let cumulative = 0
    const chartPoints: ChartDataPoint[] = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        const isFuture = dateStr > todayStr
        if (!isFuture) cumulative += logsByDate[dateStr] ?? 0
        return {
            day: dayNum, date: dateStr,
            actual: isFuture ? undefined : Number((cumulative / 60).toFixed(1)),
            range: [
                Number(((targetMin / daysInMonth) * dayNum).toFixed(1)),
                Number(((targetMax / daysInMonth) * dayNum).toFixed(1)),
            ] as [number, number],
        }
    })

    const elapsedDays = chartPoints.filter(p => p.date <= todayStr).length
    const avgPerDay = cumulative / (elapsedDays || 1)
    let forecast = cumulative
    return chartPoints.map(p => {
        if (p.date > todayStr) {
            forecast += avgPerDay
            return { ...p, forecast: Number((forecast / 60).toFixed(1)) }
        }
        return p.date === todayStr ? { ...p, forecast: p.actual } : p
    })
}

export default function DashboardPage() {
    const subjects = useSettingsStore((s) => s.subjects)
    const navigate = useNavigate()
    const now = new Date()
    const [practiceDrafts] = useState<Array<{ subject: string; draft: PracticeDraft }>>(
        () => loadAllDrafts()
    )

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    // Chart month navigation
    const [chartYear, setChartYear] = useState(now.getFullYear())
    const [chartMonth, setChartMonth] = useState(now.getMonth() + 1)
    const [chartLogs, setChartLogs] = useState<DailyLogSummary[]>([])
    const [chartTargetMin, setChartTargetMin] = useState(140)
    const [chartTargetMax, setChartTargetMax] = useState(180)
    const [chartLoading, setChartLoading] = useState(false)

    // Inline goal editor for chart month
    const [isEditingChartGoal, setIsEditingChartGoal] = useState(false)
    const [editMin, setEditMin] = useState(140)
    const [editMax, setEditMax] = useState(180)
    const [goalSaving, setGoalSaving] = useState(false)

    useEffect(() => {
        const todayKey = `dashboard-today-log-${todayString()}`
        const cachedStats = getCached<DashboardStats>('dashboard-stats')
        const cachedTodayLog = getCached<DailyLog>(todayKey)

        if (cachedStats) setStats(cachedStats)
        if (cachedTodayLog) setTodayLog(cachedTodayLog)

        // キャッシュがある場合でも初期ローディング状態は一度解除する
        if (cachedStats && cachedTodayLog) setIsInitialLoading(false)

        Promise.all([
            fetchDashboardStats(),
            fetchDailyLog(todayString())
        ]).then(([s, log]) => {
            setStats(s);
            setCached('dashboard-stats', s);
            setTodayLog(log);
            setCached(todayKey, log);
        })
            .catch(console.error)
            .finally(() => setIsInitialLoading(false))
    }, [])

    useEffect(() => {
        const cacheKey = `dashboard-monthly-${chartYear}-${chartMonth}`
        type MonthlyCache = { logs: DailyLogSummary[]; settings: { targetMin: number; targetMax: number } }
        const cached = getCached<MonthlyCache>(cacheKey)
        setIsEditingChartGoal(false)
        if (cached) {
            setChartLogs(cached.logs)
            setChartTargetMin(cached.settings.targetMin)
            setChartTargetMax(cached.settings.targetMax)
            setEditMin(cached.settings.targetMin)
            setEditMax(cached.settings.targetMax)
            setChartLoading(false)
        } else {
            setChartLoading(true)
        }
        Promise.all([
            fetchMonthlyLogs(chartYear, chartMonth),
            fetchMonthlySettings(chartYear, chartMonth),
        ])
            .then(([logs, settings]) => {
                setChartLogs(logs)
                setChartTargetMin(settings.targetMin)
                setChartTargetMax(settings.targetMax)
                setEditMin(settings.targetMin)
                setEditMax(settings.targetMax)
                setCached(cacheKey, { logs, settings })
            })
            .catch(console.error)
            .finally(() => setChartLoading(false))
    }, [chartYear, chartMonth])

    const handleOpenGoalEditor = () => {
        setEditMin(chartTargetMin)
        setEditMax(chartTargetMax)
        setIsEditingChartGoal(true)
    }

    const handleSaveChartGoal = async () => {
        setGoalSaving(true)
        try {
            await updateMonthlySettings(chartYear, chartMonth, { targetMin: editMin, targetMax: editMax })
            setChartTargetMin(editMin)
            setChartTargetMax(editMax)
            setIsEditingChartGoal(false)
        } catch (e) {
            console.error(e)
        } finally {
            setGoalSaving(false)
        }
    }

    const navigateMonth = (delta: number) => {
        setChartMonth(prev => {
            const newMonth = prev + delta
            if (newMonth < 1) { setChartYear(y => y - 1); return 12 }
            if (newMonth > 12) { setChartYear(y => y + 1); return 1 }
            return newMonth
        })
    }

    const isCurrentMonth = chartYear === now.getFullYear() && chartMonth === now.getMonth() + 1

    const transformedChartData = useMemo(() =>
            buildChartData(chartYear, chartMonth, chartLogs, chartTargetMin, chartTargetMax, todayString())
        , [chartYear, chartMonth, chartLogs, chartTargetMin, chartTargetMax])

    const subjectTouched = useMemo(() => {
        const raw = stats?.lastTouchedBySubject
            ?? subjects.map((s) => ({ subject: s, lastdate: null }))
        return raw
            .map((item) => ({ subject: item.subject, lastDate: item.lastdate }))
            .sort((a, b) => {
                if (!a.lastDate && !b.lastDate) return 0
                if (!a.lastDate) return 1
                if (!b.lastDate) return -1
                return a.lastDate < b.lastDate ? 1 : -1
            })
    }, [stats, subjects])

    const warningSubjects = useMemo(() =>
            subjectTouched.filter(({ lastDate }) => !lastDate || daysAgo(lastDate) >= 7)
        , [subjectTouched])

    const todaySubjects = useMemo(() => {
        if (!todayLog?.studySessions.length) return []
        const map = new Map<string, number>()
        for (const s of todayLog.studySessions) {
            map.set(s.subject, (map.get(s.subject) ?? 0) + s.minutes)
        }
        return Array.from(map.entries())
            .map(([subject, minutes]) => ({ subject, minutes }))
            .sort((a, b) => b.minutes - a.minutes)
    }, [todayLog])

    // アラート表示制御用
    const [showAlert, setShowAlert] = useState(false);

    // ローディング完了を監視してフラグを立てる
    useEffect(() => {
        if (!isInitialLoading && warningSubjects.length > 0) {
            // 読み込み完了後、少し遅らせてピコンと出す
            const timer = setTimeout(() => setShowAlert(true), 200);
            return () => clearTimeout(timer);
        }
    }, [isInitialLoading, warningSubjects.length]);

    const [statsCopied, setStatsCopied] = useState(false)
    const [statsCopying, setStatsCopying] = useState(false)

    const buildStatsPrompt = (ctx: Awaited<ReturnType<typeof fetchGeminiContext>>) => {
        const d = ctx.dashboard
        const lines = ['【学習状況サマリー】']
        lines.push(`累計: ${formatHours(d.allTotalMinutes)} (${d.allTotalDays}日)`)
        lines.push(`今月: ${formatHours(d.thisMonthMinutes)} (${d.thisMonthDays}日)`)
        lines.push(`連続: ${d.currentStreak}日`)
        lines.push(`今週: ${formatHours(d.thisWeekTotalMinutes)}`)
        lines.push('')
        lines.push(`【本日 ${todayString().replace(/-/g, '/')}】`)
        if (todaySubjects.length > 0) {
            lines.push(`合計: ${todayLog!.totalMinutes}分`)
            todaySubjects.forEach(({ subject, minutes }) => lines.push(`・${subject}: ${minutes}分`))
        } else {
            lines.push('まだ学習していません')
        }
        lines.push('')
        lines.push(`【科目別詳細 (${ctx.year}年${ctx.month}月)】`)
        for (const s of ctx.subjects) {
            lines.push(`■ ${s.subject}`)
            if (s.finalTarget) lines.push(`  最終目標: ${s.finalTarget}`)
            if (s.monthlyGoal) lines.push(`  今月の目標: ${s.monthlyGoal}`)
            lines.push(`  学習時間: ${formatHours(s.studyMinutes)}`)
            lines.push(`  問題数: ${s.problemCount}問`)
            const lastDate = d.lastTouchedBySubject.find(e => e.subject === s.subject)?.lastdate ?? null
            lines.push(lastDate
                ? `  最終学習: ${lastDate.replace(/-/g, '/')} (${daysAgo(lastDate)}日前)`
                : `  最終学習: 未学習`)
            if (s.failureStats.length > 0) {
                lines.push(`  ミスの傾向:`)
                s.failureStats.forEach(f => lines.push(`    ・${f.type}: ${f.count}問 (${Math.round(f.ratio * 100)}%)`))
            }
        }
        lines.push('')
        return lines.join('\n')
    }

    const handleCopyStats = async () => {
        if (statsCopying) return
        setStatsCopying(true)
        try {
            const ctx = await fetchGeminiContext(chartYear, chartMonth)
            await navigator.clipboard.writeText(buildStatsPrompt(ctx))
            setStatsCopied(true)
            setTimeout(() => setStatsCopied(false), 2500)
        } catch { /* silent */ } finally {
            setStatsCopying(false)
        }
    }

    return (
        <div className="bg-white min-h-screen text-n-text">
            <div className="max-w-[800px] mx-auto px-5 pt-10 pb-[120px]">

                {/* TODAY + ワークスペースCTA 統合カード */}
                {isInitialLoading ? (
                    <div className="mb-6 rounded-xl border border-[rgba(55,53,47,0.06)] overflow-hidden">
                        <div className="px-5 pt-4 pb-3 space-y-3">
                            <Skeleton className="h-3 w-24" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        </div>
                        <div className="px-5 py-3 bg-[rgba(55,53,47,0.02)] border-t border-[rgba(55,53,47,0.06)] flex justify-between">
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                ) : (
                    <Link
                        to={`/workspace/${todayString()}`}
                        className="block mb-6 rounded-xl border border-[var(--nt-blue-border)] bg-white no-underline overflow-hidden transition-transform active:scale-[0.99]"
                    >
                        <div className="px-5 pt-4 pb-3">
                            <div className="text-[10px] font-bold tracking-widest text-n-blue uppercase mb-3">
                                TODAY &nbsp;·&nbsp; {todayString().replace(/-/g, '/')}
                            </div>
                            {todaySubjects.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {todaySubjects.map(({ subject, minutes }) => (
                                        <div key={subject} className="flex items-center justify-between">
                                            <span className="text-[14px] font-medium text-n-text">{subject}</span>
                                            <span className="text-[14px] font-semibold text-[rgba(55,53,47,0.45)] tabular-nums">{minutes}分</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.preventDefault(); navigate('/morning-bugfix') }}
                                    className="flex items-center gap-2 text-[13px] font-semibold text-n-blue bg-[var(--nt-blue-bg)] border border-[var(--nt-blue-border)] rounded-lg px-3.5 py-2.5 cursor-pointer"
                                >
                                    morning_bugfixを開始する
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 bg-[var(--nt-blue-bg)] border-t border-[var(--nt-blue-border)]">
                            <span className="text-[15px] font-bold text-n-text tabular-nums">
                                {todaySubjects.length > 0 ? formatHours(todayLog!.totalMinutes) : '0h'}
                            </span>
                            <div className="flex items-center gap-1.5 text-n-blue text-[12px] font-semibold">
                                <span>ワークスペースを開く</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </div>
                        </div>
                    </Link>
                )}

                {practiceDrafts.length > 0 && (
                    <div className="mb-4 p-3.5 rounded-xl border border-[var(--nt-blue-border)] bg-[var(--nt-blue-bg)]">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-n-blue tracking-widest uppercase mb-2.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            演習の続きがあります
                        </div>
                        <div className="flex flex-col gap-2">
                            {practiceDrafts.map(({ subject, draft }) => (
                                <div key={subject} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white border border-[var(--nt-blue-border)]">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[14px] font-bold text-n-text truncate">{subject}</span>
                                        <span className="text-[11px] text-[rgba(55,53,47,0.45)] font-medium">
                                            {draft.log.length}問 回答済み・Q{draft.currentIndex} まで
                                        </span>
                                    </div>
                                    <button
                                        className="shrink-0 px-3.5 py-1.5 rounded-md bg-n-blue text-white text-[12px] font-bold border-none cursor-pointer whitespace-nowrap"
                                        onClick={() => navigate(`/practice/${encodeURIComponent(subject)}`)}
                                    >
                                        再開する →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* アラート */}
                {showAlert && (
                    <div className="animate-pop">
                        <AlertWidget warningSubjects={warningSubjects} />
                    </div>
                )}

                {/* 統計カード */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {isInitialLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl border border-[rgba(55,53,47,0.06)] space-y-2">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))
                    ) : (
                        <>
                            <StatCard
                                label="All Total"
                                value={formatHours(stats?.allTotalMinutes ?? 0)}
                                sub={`${stats?.allTotalDays ?? 0}d Active`}
                            />
                            <StatCard
                                label="Monthly"
                                value={formatHours(stats?.thisMonthMinutes ?? 0)}
                                sub={`${stats?.thisMonthDays ?? 0}d Active`}
                            />
                            <StatCard
                                label="Streak"
                                value={`${stats?.currentStreak ?? 0}d`}
                                sub={`週 ${formatHours(stats?.thisWeekTotalMinutes ?? 0)}`}
                            />
                        </>
                    )}
                </div>

                {/* バーンダウンチャート */}
                <section className="mb-12">
                    <div className="p-3 border border-[rgba(55,53,47,0.06)] rounded-lg">
                        {/* Month navigation */}
                        <div className="flex items-center justify-center relative pb-3 pt-1">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="flex items-center justify-center w-7 h-7 rounded border border-[rgba(55,53,47,0.12)] bg-white text-[rgba(55,53,47,0.6)] cursor-pointer"
                                    aria-label="前月"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6"/>
                                    </svg>
                                </button>
                                <span className="text-[13px] font-bold text-[rgba(55,53,47,0.6)] min-w-[90px] text-center flex items-center justify-center gap-1.5">
                                    {chartYear}/{String(chartMonth).padStart(2, '0')}
                                    {isCurrentMonth && (
                                        <span className="text-[10px] font-semibold text-n-blue bg-[var(--nt-blue-bg)] px-1.5 py-[1px] rounded-sm">
                                            今月
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    disabled={isCurrentMonth}
                                    className={[
                                        'flex items-center justify-center w-7 h-7 rounded border bg-white',
                                        isCurrentMonth
                                            ? 'border-[rgba(55,53,47,0.06)] text-[rgba(55,53,47,0.2)] cursor-default'
                                            : 'border-[rgba(55,53,47,0.12)] text-[rgba(55,53,47,0.6)] cursor-pointer',
                                    ].join(' ')}
                                    aria-label="翌月"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                </button>
                            </div>

                            <button
                                onClick={handleOpenGoalEditor}
                                className="absolute right-1 top-1 flex items-center justify-center w-7 h-7 rounded text-[rgba(55,53,47,0.25)] hover:text-[rgba(55,53,47,0.5)] hover:bg-[var(--nt-pressed)] transition-colors border-none bg-transparent cursor-pointer"
                                aria-label="目標を編集"
                                title={`目標: ${chartTargetMin}h ~ ${chartTargetMax}h`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                </svg>
                            </button>
                        </div>

                        {isEditingChartGoal && (
                            <div className="flex justify-center items-center gap-1.5 px-2 py-2 mb-3 bg-[var(--nt-surface)] border border-[rgba(55,53,47,0.06)] rounded-md">
                                <span className="text-[10px] font-bold text-[rgba(55,53,47,0.3)] mr-1">GOAL:</span>
                                <input
                                    type="number"
                                    value={editMin}
                                    onChange={(e) => setEditMin(Number(e.target.value))}
                                    className="w-11 text-[13px] font-semibold text-n-text border border-[rgba(55,53,47,0.12)] rounded text-center py-0.5 outline-none bg-white"
                                    min={0}
                                />
                                <span className="text-[13px] text-[rgba(55,53,47,0.45)]">-</span>
                                <input
                                    type="number"
                                    value={editMax}
                                    onChange={(e) => setEditMax(Number(e.target.value))}
                                    className="w-11 text-[13px] font-semibold text-n-text border border-[rgba(55,53,47,0.12)] rounded text-center py-0.5 outline-none bg-white"
                                    min={0}
                                />
                                <span className="text-[13px] text-[rgba(55,53,47,0.45)]">h</span>
                                <button
                                    onClick={handleSaveChartGoal}
                                    disabled={goalSaving}
                                    className="ml-2 text-[11px] font-semibold px-2 py-1 rounded bg-n-blue text-white border-none cursor-pointer disabled:opacity-50"
                                >
                                    {goalSaving ? '...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => setIsEditingChartGoal(false)}
                                    className="text-[11px] text-[rgba(55,53,47,0.4)] border-none bg-transparent cursor-pointer px-2 py-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {chartLoading
                            ? <div className="flex items-center justify-center bg-[rgba(55,53,47,0.01)] rounded" style={{ height: 'clamp(200px, 35vw, 280px)' }}>
                                <div className="w-full h-full p-4 flex flex-col justify-between">
                                    <Skeleton className="h-full w-full" />
                                </div>
                            </div>
                            : <DashboardChart data={transformedChartData} targetMin={chartTargetMin} targetMax={chartTargetMax} />
                        }
                    </div>
                </section>

                {isInitialLoading ? (
                    <div className="mb-10 space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <div className="grid grid-cols-1 gap-2">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    </div>
                ) : (
                    <SubjectStatus
                        subjectTouched={subjectTouched}
                        subjectMinutes={stats?.subjectMinutes ?? []}
                        allSubjectMinutes={stats?.allSubjectMinutes ?? []}
                        todaySubjectMinutes={todaySubjects}
                    />
                )}

                {/* AI Advisor */}
                <div className="mb-6">
                    <AIAgentWidget onGetAdvice={fetchAIAdvice}/>
                </div>

                {/* 指標コピー / Gemini */}
                <div className="flex gap-2 mt-10 pt-8 border-t border-[var(--nt-border)]">
                    <button
                        onClick={handleCopyStats}
                        disabled={statsCopying || isInitialLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-[var(--nt-border)] bg-[rgba(55,53,47,0.03)] text-[rgba(55,53,47,0.5)] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                        {statsCopied
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/></svg>
                        }
                        <span>{statsCopied ? 'コピー済み' : statsCopying ? '取得中...' : 'ステータスをコピー'}</span>
                    </button>
                </div>

            </div>
        </div>
    )
}