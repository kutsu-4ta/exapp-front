'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { type DashboardStats, DUMMY_STATS, DUMMY_PROBLEMS } from '@/lib/api/workspace'
import {
    SUBJECTS, FAILURE_TYPE_VALUES, formatHours, todayString, daysAgo,
    type Problem, type ChartDataPoint,
} from '@/types/workspace'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { StopWatchWidget } from '@/components/dashboard/StopWatchWidget'
import { StatCard } from '@/components/dashboard/StatCard'
import { MonthlyGoalCard } from '@/components/dashboard/MonthlyGoalCard'
import { AlertWidget } from '@/components/dashboard/AlertWidget'
import { SubjectStatus } from '@/components/dashboard/SubjectStatus'
import { FailureAnalysisSection } from '@/components/dashboard/FailureAnalysisSection'

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [problems, setProblems] = useState<Problem[]>([])
    const [targetMin, setTargetMin] = useState(140)
    const [targetMax, setTargetMax] = useState(180)
    const [isEditingGoal, setIsEditingGoal] = useState(false)

    useEffect(() => {
        setStats(DUMMY_STATS)
        setProblems(DUMMY_PROBLEMS)
    }, [])

    const transformedChartData = useMemo(() => {
        if (!stats?.dailyMinutes) return []
        const todayStr = todayString()
        const daysInMonth = stats.dailyMinutes.length
        let cumulative = 0
        const chartPoints: ChartDataPoint[] = stats.dailyMinutes.map((d, index) => {
            const dayNum = index + 1
            const isFuture = d.date > todayStr
            if (!isFuture) cumulative += d.minutes
            const rangeMin = (targetMin / daysInMonth) * dayNum
            const rangeMax = (targetMax / daysInMonth) * dayNum
            return {
                day: dayNum,
                date: d.date,
                actual: isFuture ? undefined : Number((cumulative / 60).toFixed(1)),
                range: [Number((rangeMin / 60).toFixed(1)), Number((rangeMax / 60).toFixed(1))] as [number, number],
            }
        })
        const elapsedDays = chartPoints.filter(p => p.date <= todayStr).length
        const avgPerDayMinutes = cumulative / (elapsedDays || 1)
        let forecastCumulative = cumulative
        return chartPoints.map(p => {
            if (p.date > todayStr) {
                forecastCumulative += avgPerDayMinutes
                return { ...p, forecast: Number((forecastCumulative / 60).toFixed(1)) }
            } else if (p.date === todayStr) {
                return { ...p, forecast: p.actual }
            }
            return p
        })
    }, [stats, targetMin, targetMax])

    const failureData = useMemo(() => FAILURE_TYPE_VALUES.map((ft) => ({
        type: ft,
        count: problems.filter((p) => p.failureTypes.includes(ft)).length,
    })), [problems])

    const subjectTouched = useMemo(() => (
        stats?.lastTouchedBySubject ?? SUBJECTS.map((s) => ({ subject: s, lastDate: null }))
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

                {warningSubjects.length > 0 && (
                    <AlertWidget warningSubjects={warningSubjects} />
                )}

                <div style={statsGrid}>
                    <StatCard
                        label="Monthly Total (Actual)"
                        value={formatHours(stats?.thisMonthMinutes ?? 0)}
                        sub={`${stats?.thisMonthDays ?? 0} days active`}
                    />
                    <MonthlyGoalCard
                        targetMin={targetMin}
                        targetMax={targetMax}
                        isEditing={isEditingGoal}
                        onTargetMinChange={setTargetMin}
                        onTargetMaxChange={setTargetMax}
                        onEditStart={() => setIsEditingGoal(true)}
                        onEditDone={() => setIsEditingGoal(false)}
                    />
                </div>

                <section style={section}>
                    <div style={sectionLabel}><span style={triangle}>▼</span> STUDY PROGRESS (CUMULATIVE)</div>
                    <div style={chartCard}>
                        <DashboardChart
                            data={transformedChartData}
                            targetMin={targetMin}
                            targetMax={targetMax}
                        />
                    </div>
                </section>

                <SubjectStatus subjectTouched={subjectTouched} />

                <FailureAnalysisSection failureData={failureData} />

                <Link href={`/workspace/${todayString()}`} style={ctaCard}>
                    <div style={ctaInfo}>
                        <span style={ctaLabel}>Go to Today's Page</span>
                        <span style={ctaValue}>{todayString().replace(/-/g, '/')}</span>
                    </div>
                    <span style={ctaIcon}>→</span>
                </Link>
            </div>
        </div>
    )
}

const pageWrapper: React.CSSProperties = {
    backgroundColor: '#fff',
    minHeight: '100vh',
    color: '#37352f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
}

const content: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px 120px',
}

const statsGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '40px',
}

const section: React.CSSProperties = { marginBottom: '48px' }

const sectionLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    letterSpacing: '0.05em',
    marginBottom: '12px',
}

const triangle: React.CSSProperties = { fontSize: '8px' }

const chartCard: React.CSSProperties = {
    padding: '12px',
    border: '1px solid rgba(55, 53, 47, 0.06)',
    borderRadius: '8px',
}

const ctaCard: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    backgroundColor: 'rgba(35, 131, 226, 0.04)',
    border: '1px solid rgba(35, 131, 226, 0.15)',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#2383e2',
    marginTop: '20px',
}

const ctaInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const ctaLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, marginBottom: '2px' }
const ctaValue: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }
const ctaIcon: React.CSSProperties = { fontSize: '20px', fontWeight: 700 }
