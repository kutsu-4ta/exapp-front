'use client'

import type { DailyLog } from '@/types/workspace'
import { formatDate, formatMinutes, calcMinutes } from '@/types/workspace'

type Props = {
    log: DailyLog
    onComplete: () => void
    onUncomplete: () => void
    loading: boolean
}

export function DayHeader({ log, onComplete, onUncomplete, loading }: Props) {
    const subjectTotals = log.studySessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.subject] = (acc[s.subject] ?? 0) + calcMinutes(s.startTime, s.endTime)
        return acc
    }, {})

    const subjectSummary = Object.entries(subjectTotals)
        .map(([subj, mins]) => `${subj.split('・')[0]} ${formatMinutes(mins)}`)
        .join('  ·  ')

    return (
        <div style={headerContainer}>
            <div style={titleRow}>
                <span style={pageIcon}>📅</span>
                <h1 style={titleText}>{formatDate(log.date)}</h1>
            </div>

            <div style={metaRow}>
                <div style={statsGroup}>
                    <div style={mainStat}>
                        <span style={label}>Total time</span>
                        <span style={value}>{formatMinutes(log.totalMinutes)}</span>
                    </div>
                    {subjectSummary && (
                        <div style={subStat}>{subjectSummary}</div>
                    )}
                </div>

                {log.isCompleted && (
                    <div style={statusBadge}>
                        <span style={checkIcon}>✓</span> Completed
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headerContainer: React.CSSProperties = {
    marginBottom: '2.5rem',
}

const titleRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center', // 上下中央に
    gap: '16px',
    marginBottom: '12px',
}

const pageIcon: React.CSSProperties = {
    fontSize: '32px', // 少し小さくしてバランス調整
    lineHeight: 1
}

const titleText: React.CSSProperties = {
    fontSize: '1.75rem', // 2.5remから1.75remに縮小
    fontWeight: 700,
    color: '#37352f',
    margin: 0,
    letterSpacing: '-0.01em',
}

const metaRow: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column', // 横並びから縦並びに（Notionのプロパティ風）
    gap: '8px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
}

const mainStat: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center', // 垂直中央
    gap: '12px'
}

const label: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(55, 53, 47, 0.45)',
    width: '80px', // ラベル幅を固定するとプロパティっぽく見えます
    flexShrink: 0
}

const value: React.CSSProperties = {
    fontSize: '14px', // テキストと同等に
    fontWeight: 500,
    color: '#37352f'
}

const subStat: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(55, 53, 47, 0.45)',
    paddingLeft: '92px' // labelの幅 + gap分ずらす
}

const statsGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }

const statusBadge: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    backgroundColor: 'rgba(35, 131, 226, 0.07)',
    color: '#2383e2',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
}

const checkIcon: React.CSSProperties = { fontSize: '11px', fontWeight: 800 }