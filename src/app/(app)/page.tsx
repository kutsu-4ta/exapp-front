'use client'

import { useEffect, useState } from 'react'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
  const today = new Date(todayString() + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function lastTouchedLabel(lastDate: string | null): { text: string; color: string } {
  if (!lastDate) return { text: '未学習', color: '#b5a99a' }
  const n = daysAgo(lastDate)
  if (n === 0) return { text: '今日', color: '#3a7a2a' }
  if (n === 1) return { text: '昨日', color: '#5a9a4a' }
  if (n <= 6) return { text: `${n}日前`, color: '#c8860a' }
  return { text: `${n}日前`, color: '#c0392b' }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {})
    fetchProblems().then(setProblems).catch(() => {})
  }, [])

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1}月`

  // Failure type breakdown
  const failureData = FAILURE_TYPE_VALUES.map((ft) => ({
    type: ft,
    count: problems.filter((p) => p.failureTypes.includes(ft)).length,
  }))
  const maxFailureCount = Math.max(...failureData.map((f) => f.count), 1)
  const hasFailureData = failureData.some((f) => f.count > 0)

  // Subject last touched, sorted most overdue first
  const subjectTouched = (
    stats?.lastTouchedBySubject ?? SUBJECTS.map((s) => ({ subject: s, lastDate: null }))
  )
    .slice()
    .sort((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0
      if (!a.lastDate) return -1
      if (!b.lastDate) return 1
      return a.lastDate < b.lastDate ? -1 : 1
    })

  // Intensity chart
  const dailyMinutes = stats?.dailyMinutes ?? []
  const maxDailyMins = Math.max(...dailyMinutes.map((d) => d.minutes), 1)

  return (
    <div style={content}>
      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
        <StatCard
          label={`今月（${monthLabel}）`}
          value={formatHours(stats?.thisMonthMinutes ?? 0)}
          sub={`${stats?.thisMonthDays ?? 0}日`}
        />
        <StatCard
          label="直近7日"
          value={formatHours(stats?.last7DaysMinutes ?? 0)}
          sub={`週平均 ${formatHours(stats?.weeklyAvgMinutes ?? 0)}`}
        />
      </div>

      {/* Intensity chart */}
      <div style={card}>
        <p style={sectionLabel}>学習強度（直近30日）</p>
        <IntensityChart data={dailyMinutes} maxMins={maxDailyMins} />
      </div>

      {/* Last touched per subject */}
      <div style={card}>
        <p style={sectionLabel}>科目別 最終学習日</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.625rem' }}>
          {subjectTouched.map(({ subject, lastDate }) => {
            const { text, color } = lastTouchedLabel(lastDate)
            const overdue = !lastDate || daysAgo(lastDate) >= 7
            return (
              <div key={subject} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#1a1108' }}>{subject}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: overdue ? 600 : 400,
                  }}
                >
                  {text}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Failure type breakdown */}
      <div style={card}>
        <p style={sectionLabel}>ミスの傾向</p>
        {!hasFailureData ? (
          <p style={{ fontSize: '0.8125rem', color: '#b5a99a', marginTop: '0.375rem' }}>
            弱点タブから問題を登録すると表示されます
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.625rem' }}>
            {failureData.map(({ type, count }) => (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#1a1108' }}>{type}</span>
                  <span style={{ fontSize: '0.875rem', color: '#8a7b6e', fontVariantNumeric: 'tabular-nums' }}>
                    {count}件
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#f0ece8', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(count / maxFailureCount) * 100}%`,
                      backgroundColor: count > 0 ? '#5c3a1e' : 'transparent',
                      borderRadius: '2px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today quick link */}
      <Link
        href={`/workspace/${todayString()}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.125rem',
          backgroundColor: '#ffffff',
          border: '1px solid #edeae6',
          borderRadius: '10px',
          textDecoration: 'none',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', color: '#b5a99a', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
            今日のログ
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1108' }}>
            {todayString().replace(/-/g, '/')}
          </p>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c9c0b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={card}>
      <p style={{ ...sectionLabel, marginBottom: '0.375rem' }}>{label}</p>
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1a1108',
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#b5a99a', marginTop: '0.125rem' }}>{sub}</p>}
    </div>
  )
}

function IntensityChart({
  data,
  maxMins,
}: {
  data: { date: string; minutes: number }[]
  maxMins: number
}) {
  const today = todayString()
  const chartHeight = 72

  if (data.length === 0) {
    return (
      <p style={{ fontSize: '0.8125rem', color: '#b5a99a', marginTop: '0.375rem' }}>データなし</p>
    )
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      {/* Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2px',
          height: `${chartHeight}px`,
          borderBottom: '1px solid #edeae6',
        }}
      >
        {data.map((d) => {
          const barH =
            d.minutes > 0 ? Math.max(Math.round((d.minutes / maxMins) * chartHeight), 4) : 0
          const isToday = d.date === today
          return (
            <div
              key={d.date}
              title={`${d.date.slice(5).replace('-', '/')} ${Math.round(d.minutes / 60 * 10) / 10}h`}
              style={{
                flex: 1,
                height: `${barH}px`,
                backgroundColor: isToday ? '#5c3a1e' : '#c9b49a',
                borderRadius: '2px 2px 0 0',
              }}
            />
          )
        })}
      </div>
      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
        {([0, 14, 29] as const).map((i) => {
          const d = data[i]
          if (!d) return null
          return (
            <span key={i} style={{ fontSize: '0.6875rem', color: '#b5a99a' }}>
              {d.date.slice(5).replace('-', '/')}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const content: React.CSSProperties = {
  padding: '1.25rem',
  maxWidth: '640px',
  margin: '0 auto',
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #edeae6',
  borderRadius: '10px',
  padding: '1rem 1.125rem',
  marginBottom: '0.875rem',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8a7b6e',
  letterSpacing: '0.03em',
}
