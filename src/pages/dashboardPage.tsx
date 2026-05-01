import {daysAgo, FAILURE_TYPE_VALUES, formatHours, todayString} from "../types/workspace";
import { useSettingsStore } from '../lib/store/settings';
import type {ChartDataPoint, DashboardStats, Problem} from "../types/workspace";
import {MonthlyGoalCard} from "../components/dashboard/MonthlyGoalCard";
import {fetchProblems} from "../lib/api/problem";
import {useEffect, useMemo, useState} from "react";
import {fetchDashboardStats, fetchMonthlySettings, updateMonthlySettings} from "../lib/api/workspace";
import {c, sectionLabelStyle, triangleStyle} from "../styles/notion";
import {SubjectStatus} from "../components/dashboard/SubjectStatus";
import {DashboardChart} from "../components/dashboard/DashboardChart";
import {FailureAnalysisSection} from "../components/dashboard/FailureAnalysisSection";
import {AlertWidget} from "../components/dashboard/AlertWidget";
import {StopWatchWidget} from "../components/dashboard/StopWatchWidget";
import {StatCard} from "../components/dashboard/StatCard";
import {Link} from "react-router-dom";


export default function DashboardPage() {
    const subjects = useSettingsStore((s) => s.subjects)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [problems, setProblems] = useState<Problem[]>([])
    const [targetMin, setTargetMin] = useState(140)
    const [targetMax, setTargetMax] = useState(180)
    const [isEditingGoal, setIsEditingGoal] = useState(false)

    useEffect(() => {
        const now = new Date()
        fetchDashboardStats().then(setStats).catch(console.error)
        fetchProblems().then(setProblems).catch(console.error)
        fetchMonthlySettings(now.getFullYear(), now.getMonth() + 1)
            .then((s) => { setTargetMin(s.targetMin); setTargetMax(s.targetMax) })
            .catch(console.error)
    }, [])

    const handleGoalDone = async () => {
        setIsEditingGoal(false)
        const now = new Date()
        await updateMonthlySettings(now.getFullYear(), now.getMonth() + 1, { targetMin, targetMax })
            .catch(console.error)
    }

    const transformedChartData = useMemo(() => {
        if (!stats?.dailyMinutes) return []
        const todayStr = todayString()
        const daysInMonth = stats.dailyMinutes.length
        let cumulative = 0
        const chartPoints: ChartDataPoint[] = stats.dailyMinutes.map((d, index) => {
            const dayNum = index + 1
            const isFuture = d.date > todayStr
            if (!isFuture) cumulative += d.minutes
            return {
                day: dayNum, date: d.date,
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
    }, [stats, targetMin, targetMax])

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
    }), [stats])

    const warningSubjects = useMemo(() =>
        subjectTouched.filter(({ lastDate }) => !lastDate || daysAgo(lastDate) >= 7)
    , [subjectTouched])

    return (
        <div style={pageWrapper}>
            <div style={content}>
                <StopWatchWidget />

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
                        <DashboardChart data={transformedChartData} targetMin={targetMin} targetMax={targetMax} />
                    </div>
                </section>

                <SubjectStatus subjectTouched={subjectTouched} />
                <FailureAnalysisSection failureData={failureData} />

                <Link to={`/workspace/${todayString()}`} style={ctaCard}>
                    <div>
                        <div style={ctaLabel}>Go to Today's Page</div>
                        <div style={ctaValue}>{todayString().replace(/-/g, '/')}</div>
                    </div>
                    <span style={ctaIcon}>→</span>
                </Link>
            </div>
        </div>
    )
}

const pageWrapper: React.CSSProperties = {
    backgroundColor: c.bg, minHeight: '100vh', color: c.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
}
const content: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '40px 20px 120px' }
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }
const section: React.CSSProperties = { marginBottom: '48px' }
const chartCard: React.CSSProperties = { padding: '12px', border: `1px solid rgba(55, 53, 47, 0.06)`, borderRadius: '8px' }
const ctaCard: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', backgroundColor: c.blueBg, border: `1px solid ${c.blueBorder}`,
    borderRadius: '12px', textDecoration: 'none', color: c.blue, marginTop: '20px',
}
const ctaLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, marginBottom: '2px' }
const ctaValue: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }
const ctaIcon: React.CSSProperties = { fontSize: '20px', fontWeight: 700 }
