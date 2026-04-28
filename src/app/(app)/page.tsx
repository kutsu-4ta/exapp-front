'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { fetchDashboardStats, type DashboardStats } from '@/lib/api/workspace'
import { fetchProblems } from '@/lib/api/problem'
import {
    SUBJECTS,
    FAILURE_TYPE_VALUES,
    formatHours,
    todayString,
    type Problem,
} from '@/types/workspace'
import { DashboardChart } from "@/components/dashboard/DashboardChart";

// ── Helpers (Logic remains same) ──────────────────────────────────────────────

function daysAgo(dateStr: string): number {
    const today = new Date(todayString() + 'T00:00:00')
    const d = new Date(dateStr + 'T00:00:00')
    return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function lastTouchedLabel(lastDate: string | null): { text: string; color: string; bg: string } {
    if (!lastDate) return { text: '未学習', color: '#8a7b6e', bg: 'rgba(55, 53, 47, 0.08)' }
    const n = daysAgo(lastDate)
    if (n === 0) return { text: '今日', color: '#3a7a2a', bg: 'rgba(58, 122, 42, 0.1)' }
    if (n === 1) return { text: '昨日', color: '#5c3a1e', bg: 'rgba(92, 58, 30, 0.1)' }
    if (n <= 6) return { text: `${n}日前`, color: '#c8860a', bg: 'rgba(200, 134, 10, 0.1)' }
    return { text: `${n}日前`, color: '#eb5757', bg: 'rgba(235, 87, 87, 0.1)' }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [problems, setProblems] = useState<Problem[]>([])

    useEffect(() => {
        fetchDashboardStats().then(setStats).catch(() => {})
        fetchProblems().then(setProblems).catch(() => {})
    }, [])

    const failureData = useMemo(() => FAILURE_TYPE_VALUES.map((ft) => ({
        type: ft,
        count: problems.filter((p) => p.failureTypes.includes(ft)).length,
    })), [problems]);

    const subjectTouched = useMemo(() => (
        stats?.lastTouchedBySubject ?? SUBJECTS.map((s) => ({ subject: s, lastDate: null }))
    ).slice().sort((a, b) => {
        if (!a.lastDate && !b.lastDate) return 0
        if (!a.lastDate) return 1
        if (!b.lastDate) return -1
        return a.lastDate < b.lastDate ? 1 : -1
    }), [stats]);

    return (
        <div style={pageWrapper}>
            <div style={content}>
                {/* Stats Summary Row */}
                <div style={statsGrid}>
                    <StatCard
                        label="Monthly"
                        value={formatHours(stats?.thisMonthMinutes ?? 0)}
                        sub={`${stats?.thisMonthDays ?? 0} days active`}
                    />
                    <StatCard
                        label="Last 7 Days"
                        value={formatHours(stats?.last7DaysMinutes ?? 0)}
                        sub={`Avg ${formatHours(stats?.weeklyAvgMinutes ?? 0)} / day`}
                    />
                </div>

                {/* Progress Chart */}
                <section style={section}>
                    <div style={sectionLabel}><span style={triangle}>▼</span> STUDY PROGRESS</div>
                    <div style={chartCard}>
                        <DashboardChart data={stats?.dailyMinutes ?? []} />
                    </div>
                </section>

                {/* Subject Status List */}
                <section style={section}>
                    <div style={sectionLabel}><span style={triangle}>▼</span> SUBJECT STATUS</div>
                    <div style={listContainer}>
                        {subjectTouched.map(({ subject, lastDate }) => {
                            const { text, color, bg } = lastTouchedLabel(lastDate)
                            return (
                                <div key={subject} style={rowItem}>
                                    <div style={subjectNameGroup}>
                                        <span style={subjectIcon}>📔</span>
                                        <span style={subjectText}>{subject}</span>
                                    </div>
                                    <span style={{ ...statusTag, color, backgroundColor: bg }}>
                                        {text}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Failure Analysis */}
                <section style={section}>
                    <div style={sectionLabel}><span style={triangle}>▼</span> FAILURE ANALYSIS</div>
                    <div style={listContainer}>
                        {failureData.map(({ type, count }) => (
                            <div key={type} style={analysisRow}>
                                <div style={analysisHeader}>
                                    <span style={analysisText}>{type}</span>
                                    <span style={countText}>{count} cases</span>
                                </div>
                                <div style={progressBarBg}>
                                    <div style={{
                                        ...progressBarFill,
                                        width: `${Math.min((count / (Math.max(...failureData.map(d => d.count)) || 1)) * 100, 100)}%`,
                                        backgroundColor: count > 10 ? '#eb5757' : '#2383e2'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Today's Log Link */}
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div style={statCard}>
            <p style={statLabel}>{label}</p>
            <p style={statValue}>{value}</p>
            {sub && <p style={statSub}>{sub}</p>}
        </div>
    )
}

// ── Styles (Notion-inspired) ──────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f' }

const content: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '60px 20px 100px' }

const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }

const statCard: React.CSSProperties = {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(55, 53, 47, 0.09)',
}

const statLabel: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.5)', fontWeight: 500, marginBottom: '4px' }
const statValue: React.CSSProperties = { fontSize: '24px', fontWeight: 700, margin: 0 }
const statSub: React.CSSProperties = { fontSize: '11px', color: 'rgba(55, 53, 47, 0.4)', marginTop: '4px' }

const section: React.CSSProperties = { marginBottom: '48px' }

const sectionLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    marginBottom: '16px',
    letterSpacing: '0.05em',
}

const triangle: React.CSSProperties = { fontSize: '8px' }

const chartCard: React.CSSProperties = {
    padding: '12px',
    border: '1px solid rgba(55, 53, 47, 0.06)',
    borderRadius: '8px',
}

const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }

const rowItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 4px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.04)',
}

const subjectNameGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' }
const subjectIcon: React.CSSProperties = { fontSize: '16px' }
const subjectText: React.CSSProperties = { fontSize: '14px', fontWeight: 500 }

const statusTag: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 500,
}

const analysisRow: React.CSSProperties = { padding: '12px 0' }
const analysisHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }
const analysisText: React.CSSProperties = { fontSize: '14px' }
const countText: React.CSSProperties = { fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }

const progressBarBg: React.CSSProperties = { height: '6px', backgroundColor: 'rgba(55, 53, 47, 0.05)', borderRadius: '3px', overflow: 'hidden' }
const progressBarFill: React.CSSProperties = { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' }

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