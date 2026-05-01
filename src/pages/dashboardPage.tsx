import {daysAgo, FAILURE_TYPE_VALUES, formatHours, todayString} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import type {ChartDataPoint, DashboardStats, DailyLogSummary, Problem} from "../types/workspace";
import {fetchProblems} from "../lib/api/problem";
import {useEffect, useMemo, useState} from "react";
import {
    fetchAIAdvice,
    fetchDashboardStats,
    fetchMonthlyLogs,
    fetchMonthlySettings,
    updateMonthlySettings
} from "../lib/api/workspace";
import {SubjectStatus} from "../components/dashboard/SubjectStatus";
import {DashboardChart} from "../components/dashboard/DashboardChart";
import {FailureAnalysisSection} from "../components/dashboard/FailureAnalysisSection";
import {AlertWidget} from "../components/dashboard/AlertWidget";
import {StatCard} from "../components/dashboard/StatCard";
import {Link} from "react-router-dom";
import {AIAgentWidget} from "@/components/aiAgent/aiAgentWidget.tsx";

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
    const now = new Date()

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [problems, setProblems] = useState<Problem[]>([])

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
        fetchDashboardStats().then(setStats).catch(console.error)
        fetchProblems().then(setProblems).catch(console.error)
    }, [])

    useEffect(() => {
        setChartLoading(true)
        setIsEditingChartGoal(false)
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

    const failureData = useMemo(() =>
        FAILURE_TYPE_VALUES.map((ft) => ({
            type: ft,
            count: problems.filter((p) => p.failureTypes.includes(ft)).length,
        }))
    , [problems])

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

    return (
        <div className="bg-white min-h-screen text-n-text">
            <div className="max-w-[800px] mx-auto px-5 pt-10 pb-[120px]">

                {/* CTA: 今日のワークスペース */}
                <Link
                    to={`/workspace/${todayString()}`}
                    className="flex items-center justify-between px-6 py-5 mb-6 bg-white rounded-xl text-n-blue no-underline border border-[var(--nt-blue-border)] shadow-[0_2px_4px_rgba(35,131,226,0.05)] transition-transform active:scale-[0.99]"
                >
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold mb-0.5 tracking-wide">
                            GO TO TODAY'S WORKSPACE
                        </div>
                        <div className="text-[18px] font-bold">
                            {todayString().replace(/-/g, '/')}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[11px] font-semibold opacity-80 ml-4 shrink-0">
                        <span>演習を開始する</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                        </svg>
                    </div>
                </Link>

                {warningSubjects.length > 0 && <AlertWidget warningSubjects={warningSubjects} />}

                {/* AI Advisor */}
                <div className="mb-6">
                    <AIAgentWidget onGetAdvice={fetchAIAdvice}/>
                </div>

                {/* 統計カード */}
                <div className="grid grid-cols-3 gap-3 mb-6">
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

                            {/* 目標設定ボタン */}
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

                        {/* 目標インラインエディタ */}
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
                            ? <div className="flex items-center justify-center text-[13px] text-[rgba(55,53,47,0.35)]" style={{ height: 'clamp(200px, 35vw, 280px)' }}>読み込み中...</div>
                            : <DashboardChart data={transformedChartData} targetMin={chartTargetMin} targetMax={chartTargetMax} />
                        }
                    </div>
                </section>

                <SubjectStatus subjectTouched={subjectTouched} />
                <FailureAnalysisSection failureData={failureData} />

            </div>
        </div>
    )
}
