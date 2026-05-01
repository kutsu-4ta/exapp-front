import {daysAgo, FAILURE_TYPE_VALUES, formatHours, todayString} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import type {ChartDataPoint, DashboardStats, DailyLogSummary, Problem} from "../types/workspace";
import {MonthlyGoalCard} from "../components/dashboard/MonthlyGoalCard";
import {fetchProblems} from "../lib/api/problem";
import {useEffect, useMemo, useState} from "react";
import {fetchDashboardStats, fetchMonthlyLogs, fetchMonthlySettings, updateMonthlySettings} from "../lib/api/workspace";
import {c, sectionLabelStyle, triangleStyle} from "../styles/notion";
import {SubjectStatus} from "../components/dashboard/SubjectStatus";
import {DashboardChart} from "../components/dashboard/DashboardChart";
import {FailureAnalysisSection} from "../components/dashboard/FailureAnalysisSection";
import {AlertWidget} from "../components/dashboard/AlertWidget";
import {StatCard} from "../components/dashboard/StatCard";
import {Link} from "react-router-dom";

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
                Number(((targetMin / daysInMonth) * dayNum / 60).toFixed(1)),
                Number(((targetMax / daysInMonth) * dayNum / 60).toFixed(1)),
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
    const [targetMin, setTargetMin] = useState(140)
    const [targetMax, setTargetMax] = useState(180)
    const [isEditingGoal, setIsEditingGoal] = useState(false)

    // Chart month navigation (independent from stat cards)
    const [chartYear, setChartYear] = useState(now.getFullYear())
    const [chartMonth, setChartMonth] = useState(now.getMonth() + 1)
    const [chartLogs, setChartLogs] = useState<DailyLogSummary[]>([])
    const [chartTargetMin, setChartTargetMin] = useState(140)
    const [chartTargetMax, setChartTargetMax] = useState(180)
    const [chartLoading, setChartLoading] = useState(false)

    useEffect(() => {
        fetchDashboardStats().then(setStats).catch(console.error)
        fetchProblems().then(setProblems).catch(console.error)
        fetchMonthlySettings(now.getFullYear(), now.getMonth() + 1)
            .then((s) => { setTargetMin(s.targetMin); setTargetMax(s.targetMax) })
            .catch(console.error)
    }, [])

    useEffect(() => {
        setChartLoading(true)
        Promise.all([
            fetchMonthlyLogs(chartYear, chartMonth),
            fetchMonthlySettings(chartYear, chartMonth),
        ])
            .then(([logs, settings]) => {
                setChartLogs(logs)
                setChartTargetMin(settings.targetMin)
                setChartTargetMax(settings.targetMax)
            })
            .catch(console.error)
            .finally(() => setChartLoading(false))
    }, [chartYear, chartMonth])

    const handleGoalDone = async () => {
        setIsEditingGoal(false)
        await updateMonthlySettings(now.getFullYear(), now.getMonth() + 1, { targetMin, targetMax })
            .catch(console.error)
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

    const subjectTouched = useMemo(() => (
        stats?.lastTouchedBySubject ?? subjects.map((s) => ({ subject: s, lastDate: null }))
    ).slice().sort((a, b) => {
        if (!a.lastDate && !b.lastDate) return 0
        if (!a.lastDate) return 1
        if (!b.lastDate) return -1
        return a.lastDate < b.lastDate ? 1 : -1
    }), [stats, subjects])

    const warningSubjects = useMemo(() =>
        subjectTouched.filter(({ lastDate }) => !lastDate || daysAgo(lastDate) >= 7)
    , [subjectTouched])

    return (
        <div style={pageWrapper}>
            <div style={content}>

                <Link to={`/workspace/${todayString()}`} style={mainActionCard}>
                    <div style={mainActionBody}>
                        <div style={ctaLabel}>GO TO TODAY'S WORKSPACE</div>
                        <div style={ctaValue}>{todayString().replace(/-/g, '/')}</div>
                    </div>
                    <div style={mainActionIcon}>
                        <span>演習を開始する</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                        </svg>
                    </div>
                </Link>

                {warningSubjects.length > 0 && <AlertWidget warningSubjects={warningSubjects} />}

                <div style={statsGrid}>
                    <StatCard
                        label="Monthly Total (Actual)"
                        value={formatHours(stats?.thisMonthMinutes ?? 0)}
                        sub={`${stats?.thisMonthDays ?? 0} days active`}
                    />
                    <MonthlyGoalCard
                        targetMin={targetMin} targetMax={targetMax} isEditing={isEditingGoal}
                        onTargetMinChange={setTargetMin} onTargetMaxChange={setTargetMax}
                        onEditStart={() => setIsEditingGoal(true)} onEditDone={handleGoalDone}
                    />
                </div>

                <section style={section}>
                    <div style={sectionLabelStyle}><span style={triangleStyle}>▼</span> STUDY PROGRESS (CUMULATIVE)</div>
                    <div style={chartCard}>
                        {/* Month navigation */}
                        <div style={chartNav}>
                            <button onClick={() => navigateMonth(-1)} style={navBtn} aria-label="前月">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            <span style={monthLabel}>
                                {chartYear}/{String(chartMonth).padStart(2, '0')}
                                {isCurrentMonth && <span style={currentBadge}>今月</span>}
                            </span>
                            <button
                                onClick={() => navigateMonth(1)}
                                style={isCurrentMonth ? navBtnDisabled : navBtn}
                                disabled={isCurrentMonth}
                                aria-label="翌月"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>
                        {chartLoading
                            ? <div style={chartPlaceholder}>読み込み中...</div>
                            : <DashboardChart data={transformedChartData} targetMin={chartTargetMin} targetMax={chartTargetMax} />
                        }
                    </div>
                </section>

                <SubjectStatus subjectTouched={subjectTouched} />
                <FailureAnalysisSection failureData={failureData} />

                <Link to={`/workspace/${todayString()}`} style={ctaCard}>
                    <div>
                        <div style={ctaLabel}>Go to Today's Page</div>
                        <div style={ctaValue}>{todayString().replace(/-/g, '/')}</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </Link>
            </div>
        </div>
    )
}

const mainActionCard: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px', backgroundColor: '#fff', border: `1px solid ${c.blueBorder}`,
    borderRadius: '12px', textDecoration: 'none', color: c.blue,
    marginBottom: '24px', boxShadow: '0 2px 4px rgba(35,131,226,0.05)',
    transition: 'transform 0.1s ease',
}
const mainActionBody: React.CSSProperties = { flex: 1 }
const mainActionIcon: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
    fontSize: '11px', fontWeight: 600, opacity: 0.8
}
const pageWrapper: React.CSSProperties = {
    backgroundColor: c.bg, minHeight: '100vh', color: c.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
}
const content: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '40px 20px 120px' }
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }
const section: React.CSSProperties = { marginBottom: '48px' }
const chartCard: React.CSSProperties = { padding: '12px', border: `1px solid rgba(55, 53, 47, 0.06)`, borderRadius: '8px' }

const chartNav: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', paddingBottom: '8px',
}
const navBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '4px',
    border: '1px solid rgba(55,53,47,0.12)', backgroundColor: '#fff',
    color: 'rgba(55,53,47,0.6)', cursor: 'pointer',
}
const navBtnDisabled: React.CSSProperties = { ...navBtn, color: 'rgba(55,53,47,0.2)', cursor: 'default', borderColor: 'rgba(55,53,47,0.06)' }
const monthLabel: React.CSSProperties = {
    fontSize: '13px', fontWeight: 700, color: 'rgba(55,53,47,0.6)',
    minWidth: '90px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
}
const currentBadge: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, color: '#2383e2',
    backgroundColor: 'rgba(35,131,226,0.08)', padding: '1px 5px', borderRadius: '3px',
}
const chartPlaceholder: React.CSSProperties = { height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(55,53,47,0.35)' }

const ctaCard: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', backgroundColor: c.blueBg, border: `1px solid ${c.blueBorder}`,
    borderRadius: '12px', textDecoration: 'none', color: c.blue, marginTop: '20px',
}
const ctaLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, marginBottom: '2px' }
const ctaValue: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }
