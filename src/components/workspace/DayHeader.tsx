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

  const canComplete = !loading

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {/* Date row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '0.375rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1a1108',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
          }}
        >
          {formatDate(log.date)}
        </h1>

        {/* Completion action */}
        {log.isCompleted ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              flexShrink: 0,
              paddingTop: '0.125rem',
            }}
          >
            <span
              style={{
                fontSize: '0.8125rem',
                color: '#4c7a3a',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              ✓ 完了
            </span>
            <button
              onClick={onUncomplete}
              disabled={loading}
              style={{
                fontSize: '0.75rem',
                color: '#8a7b6e',
                background: 'none',
                border: '1px solid #ddd9d4',
                borderRadius: '20px',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              編集に戻す
            </button>
          </div>
        ) : (
          <button
            onClick={onComplete}
            disabled={!canComplete}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: canComplete ? '#fff' : '#b5a99a',
              background: canComplete ? '#5c3a1e' : '#ede9e4',
              border: 'none',
              borderRadius: '20px',
              padding: '0.375rem 1rem',
              cursor: canComplete ? 'pointer' : 'not-allowed',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            完了する
          </button>
        )}
      </div>

      {/* Time summary */}
      {log.totalMinutes > 0 && (
        <p style={{ fontSize: '0.8125rem', color: '#8a7b6e', letterSpacing: '0.01em' }}>
          合計 {formatMinutes(log.totalMinutes)}
          {subjectSummary && (
            <span style={{ marginLeft: '0.875rem', color: '#b5a99a' }}>{subjectSummary}</span>
          )}
        </p>
      )}
    </div>
  )
}
