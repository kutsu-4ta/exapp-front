'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { type DashboardStats, DUMMY_STATS, DUMMY_PROBLEMS } from '@/lib/api/workspace'
import {
    SUBJECTS,
    FAILURE_TYPE_VALUES,
    formatHours,
    todayString,
    type Problem,
    type ChartDataPoint,
} from '@/types/workspace'
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { StopWatchWidget } from "@/components/dashboard/StopWatchWidget";

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

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [problems, setProblems] = useState<Problem[]>([])

    // 目標設定用ステート（localStorageなどで永続化する予定）
    const [targetMin, setTargetMin] = useState(140) // 単位: 時間 (h)
    const [targetMax, setTargetMax] = useState(180) // 単位: 時間 (h)
    const [isEditingGoal, setIsEditingGoal] = useState(false)

    useEffect(() => {
        setStats(DUMMY_STATS)
        setProblems(DUMMY_PROBLEMS)
    }, [])

    // ── グラフ用データの変形ロジック ──────────────────────────────────────────
    const transformedChartData = useMemo(() => {
        if (!stats?.dailyMinutes) return [];

        const todayStr = todayString();
        const daysInMonth = stats.dailyMinutes.length;
        let cumulative = 0;

        // 1. 実績累積とターゲットレンジの算出
        const chartPoints: ChartDataPoint[] = stats.dailyMinutes.map((d, index) => {
            const dayNum = index + 1;
            const isFuture = d.date > todayStr;

            if (!isFuture) {
                cumulative += d.minutes;
            }

            // 線形ターゲットの計算 (1日〜月末に向けて積み上がる帯)
            const rangeMin = (targetMin / daysInMonth) * dayNum;
            const rangeMax = (targetMax / daysInMonth) * dayNum;

            return {
                day: dayNum,
                date: d.date,
                actual: isFuture ? undefined : Number((cumulative / 60).toFixed(1)), // 時間単位に変換
                range: [Number((rangeMin / 60).toFixed(1)), Number((rangeMax / 60).toFixed(1))] as [number, number],
            };
        });

        // 2. 予測値の算出
        const elapsedDays = chartPoints.filter(p => p.date <= todayStr).length;
        const avgPerDayMinutes = cumulative / (elapsedDays || 1);
        let forecastCumulative = cumulative;

        return chartPoints.map(p => {
            if (p.date > todayStr) {
                forecastCumulative += avgPerDayMinutes;
                return { ...p, forecast: Number((forecastCumulative / 60).toFixed(1)) };
            } else if (p.date === todayStr) {
                return { ...p, forecast: p.actual }; // 予測線の開始点
            }
            return p;
        });
        }, [stats, targetMin, targetMax]);

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
                <StopWatchWidget />

                <div style={statsGrid}>
                    <StatCard
                        label="Monthly Total (Actual)"
                        value={formatHours(stats?.thisMonthMinutes ?? 0)}
                        sub={`${stats?.thisMonthDays ?? 0} days active`}
                    />

                    {/* 目標設定カードをStatCardのスタイルに統合 */}
                    <div style={statCard}>
                        <span style={statLabel}>MONTHLY GOAL</span>
                        {!isEditingGoal ? (
                            <div style={goalDisplay} onClick={() => setIsEditingGoal(true)}>
                                <p style={statValue}>{targetMin}h <span style={goalRangeSep}>〜</span> {targetMax}h</p>
                                <span style={editIcon}>✎</span>
                            </div>
                        ) : (
                            <div style={goalEditGroup}>
                                <input
                                    type="number"
                                    value={targetMin}
                                    onChange={(e) => setTargetMin(Number(e.target.value))}
                                    style={goalInput}
                                    autoFocus
                                />
                                <span style={goalRangeSep}>-</span>
                                <input
                                    type="number"
                                    value={targetMax}
                                    onChange={(e) => setTargetMax(Number(e.target.value))}
                                    style={goalInput}
                                />
                                <button style={saveBtn} onClick={() => setIsEditingGoal(false)}>
                                    OK
                                </button>
                            </div>
                        )}
                        <p style={statSub}>Target Range</p>
                    </div>
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

                {/* Subject Status / Failure Analysis セクション */}
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

// ── Styles & StatCard ──────────────────────────────────────────
const pageWrapper: React.CSSProperties = {
    backgroundColor: '#fff',
    minHeight: '100vh',
    color: '#37352f',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif'
}

const content: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px 120px' // 下部に余白を確保
}

const statsGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '40px'
}

const statCard: React.CSSProperties = {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(55, 53, 47, 0.09)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    transition: 'background 0.2s ease'
}

const statLabel: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55, 53, 47, 0.45)',
    fontWeight: 600,
    marginBottom: '6px',
    letterSpacing: '0.02em'
}

const statValue: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    color: '#37352f',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
}

const statSub: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55, 53, 47, 0.35)',
    marginTop: '6px'
}

// --- Goal Edit Styles ---

const goalDisplay: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: '4px',
    margin: '-4px',
    padding: '4px',
}

const editIcon: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(55, 53, 47, 0.2)',
    marginLeft: '8px'
}

const goalRangeSep: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(55, 53, 47, 0.3)',
    fontWeight: 400,
    margin: '0 4px'
}

const goalEditGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '32px'
}

const goalInput: React.CSSProperties = {
    width: '56px',
    padding: '2px 6px',
    fontSize: '18px',
    fontWeight: 600,
    border: '1px solid #2383e2', // フォーカス色に近い青
    borderRadius: '4px',
    backgroundColor: '#fff',
    outline: 'none',
    color: '#37352f',
}

const saveBtn: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#2383e2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '4px'
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

const section: React.CSSProperties = { marginBottom: '48px' }
const sectionLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.35)', marginBottom: '16px', letterSpacing: '0.05em' }
const triangle: React.CSSProperties = { fontSize: '8px' }
const chartCard: React.CSSProperties = { padding: '12px', border: '1px solid rgba(55, 53, 47, 0.06)', borderRadius: '8px' }
const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }
const rowItem: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid rgba(55, 53, 47, 0.04)' }
const subjectNameGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' }
const subjectIcon: React.CSSProperties = { fontSize: '16px' }
const subjectText: React.CSSProperties = { fontSize: '14px', fontWeight: 500 }
const statusTag: React.CSSProperties = { padding: '2px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500 }
const analysisRow: React.CSSProperties = { padding: '12px 0' }
const analysisHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }
const analysisText: React.CSSProperties = { fontSize: '14px' }
const countText: React.CSSProperties = { fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const progressBarBg: React.CSSProperties = { height: '6px', backgroundColor: 'rgba(55, 53, 47, 0.05)', borderRadius: '3px', overflow: 'hidden' }
const progressBarFill: React.CSSProperties = { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' }
const ctaCard: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', backgroundColor: 'rgba(35, 131, 226, 0.04)', border: '1px solid rgba(35, 131, 226, 0.15)', borderRadius: '12px', textDecoration: 'none', color: '#2383e2', marginTop: '20px' }
const ctaInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const ctaLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 600, marginBottom: '2px' }
const ctaValue: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }
const ctaIcon: React.CSSProperties = { fontSize: '20px', fontWeight: 700 }