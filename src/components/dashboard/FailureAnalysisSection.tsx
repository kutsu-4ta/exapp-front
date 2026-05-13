import {useMemo} from 'react'
import type {Problem} from '@/types/workspace'
import {FAILURE_TYPE_VALUES} from '@/types/workspace'

type Props = { problems: Problem[]; subjects: string[] }

const FAILURE_COLORS: Record<string, string> = {
  定義: '#2383e2',
  解法: '#eb5757',
  ケアレス: '#f2ab26',
}

export function FailureAnalysisSection({ problems, subjects }: Props) {
  const rows = useMemo(
    () =>
      subjects
        .map((subject) => {
          const sp = problems.filter(
            (p) => p.subject === subject && (p.proficiency === '△' || p.proficiency === '×')
          )
          const counts = FAILURE_TYPE_VALUES.map((ft) => ({
            type: ft,
            count: sp.filter((p) => p.failureTypes.includes(ft)).length,
          }))
          const total = counts.reduce((s, c) => s + c.count, 0)
          return { subject, counts, total, problemCount: sp.length }
        })
        .filter((r) => r.total > 0),
    [problems, subjects]
  )

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <SectionLabel>FAILURE ANALYSIS</SectionLabel>
        <div className="flex gap-3">
          {FAILURE_TYPE_VALUES.map((ft) => (
            <div key={ft} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-[2px] shrink-0"
                style={{ backgroundColor: FAILURE_COLORS[ft] }}
              />
              <span className="text-[11px] text-[var(--nt-text-sub)]">{ft}</span>
            </div>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--nt-text-hint)] text-center py-6">
          データがありません
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ subject, counts, total, problemCount }) => (
            <div key={subject}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-n-text">{subject}</span>
                <span className="text-[11px] text-[var(--nt-text-sub)] tabular-nums">
                  {problemCount} 問 · {total} ミス
                </span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--nt-surface)]">
                {counts.map(({ type, count }) => {
                  const pct = (count / total) * 100
                  return pct > 0 ? (
                    <div
                      key={type}
                      style={{ width: `${pct}%`, backgroundColor: FAILURE_COLORS[type] }}
                      title={`${type}: ${count}件 (${pct.toFixed(1)}%)`}
                    />
                  ) : null
                })}
              </div>
              <div className="flex gap-3 mt-1.5">
                {counts
                  .filter((c) => c.count > 0)
                  .map(({ type, count }) => (
                    <span key={type} className="text-[11px] text-[var(--nt-text-sub)]">
                      <span style={{ color: FAILURE_COLORS[type] }} className="font-semibold">
                        {type}
                      </span>{' '}
                      {((count / total) * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--nt-text-hint)] tracking-[0.05em] uppercase">
      <span className="text-[8px]">▼</span>
      {children}
    </div>
  )
}
