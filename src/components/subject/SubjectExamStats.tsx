import {useEffect, useState} from 'react'
import {fetchExamSessions, fetchSubjectStats} from '../../lib/api/exam'
import type {ExamSessionSummary, ExamSubjectStats} from '../../types/exam'
import {Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis} from 'recharts'
import {subjectUi} from '../../styles/subjectUI'
import {Skeleton} from '../common/Skeleton'
import {RANK_COLORS} from "@/components/subject/SubCategoryList.tsx";

function ScoreTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; pure: number; total: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={tooltipBox}>
      <div style={tooltipLabel}>{d.label}</div>
      <div style={{ color: '#2383e2', ...tooltipRow }}>TOTAL <span style={tooltipVal}>{d.total}</span></div>
      <div style={{ color: '#19a576', ...tooltipRow }}>PURE <span style={tooltipVal}>{d.pure}</span></div>
    </div>
  )
}

interface Props {
  subjectName: string
}

export function SubjectExamStats({ subjectName }: Props) {
  const [stats, setStats] = useState<ExamSubjectStats | null>(null)
  const [sessions, setSessions] = useState<ExamSessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchSubjectStats(subjectName).catch(() => null),
      fetchExamSessions('completed').catch(() => []),
    ]).then(([s, all]) => {
      setStats(s as ExamSubjectStats | null)
      setSessions(
        (all as ExamSessionSummary[])
          .filter((x) => x.subject === subjectName)
          .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
      )
    }).finally(() => setLoading(false))
  }, [subjectName])

  if (loading) {
    return (
      <section style={subjectUi.card}>
        <h3 style={subjectUi.title}>EXAM</h3>
        <div style={skeletonWrap}>
          <div style={summaryRow}>
            {[80, 90, 80].map((w, i) => <Skeleton key={i} width={w} height={32} borderRadius={8} />)}
          </div>
          <Skeleton height={80} borderRadius={8} style={{ margin: '16px 0' }} />
          <Skeleton width={100} height={10} style={{ marginBottom: 8 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={8} borderRadius={4} style={{ marginBottom: 10 }} />
          ))}
        </div>
      </section>
    )
  }

  if (!stats || stats.sessionCount === 0) return null

  const latest = sessions.at(-1)
  const trendData = sessions.slice(-5).map((s, i, arr) => ({
    label: `第${sessions.length - arr.length + i + 1}回`,
    pure: s.pureScore,
    total: s.totalScore,
  }))

  const latestTotal = latest?.totalScore ?? null
  const totalColor =
    latestTotal == null ? 'rgba(55,53,47,0.5)'
    : latestTotal >= 60 ? '#19a576'
    : latestTotal >= 50 ? '#f2ab26'
    : '#eb5757'

  return (
    <section style={subjectUi.card}>
      <h3 style={subjectUi.title}>EXAM</h3>

      {/* サマリー */}
      <div style={summaryRow}>
        <div style={summaryCard}>
          <span style={summaryLabel}>受験</span>
          <span style={summaryValue}>{stats.sessionCount}<span style={summaryUnit}>回</span></span>
        </div>
        <div style={summaryCard}>
          <span style={summaryLabel}>Avg.TOTAL</span>
          <span style={{ ...summaryValue, color: stats.avgTotalScore >= 60 ? '#19a576' : stats.avgTotalScore >= 50 ? '#f2ab26' : '#eb5757' }}>
            {stats.avgTotalScore.toFixed(1)}
          </span>
        </div>
        {latestTotal != null && (
          <div style={summaryCard}>
            <span style={summaryLabel}>直近</span>
            <span style={{ ...summaryValue, color: totalColor }}>{latestTotal}</span>
          </div>
        )}
      </div>

      {/* スコア推移チャート */}
      {trendData.length > 1 && (
        <div style={chartWrap}>
          <p style={sectionLabel}>直近{trendData.length}回の推移</p>
          <div style={{ width: '100%', height: 90 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -32, bottom: 0 }}>
                <YAxis domain={[0, 100]} hide />
                <Tooltip content={<ScoreTooltip />} />
                <ReferenceLine y={60} stroke="#2383e2" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2383e2"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#2383e2' }}
                  activeDot={{ r: 5 }}
                  name="TOTAL"
                />
                <Line
                  type="monotone"
                  dataKey="pure"
                  stroke="#19a576"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#19a576' }}
                  activeDot={{ r: 5 }}
                  name="PURE"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={chartLegend}>
            <span style={legendItem}>
              <span style={{ ...legendDot, background: '#2383e2' }} />TOTAL
            </span>
            <span style={legendItem}>
              <span style={{ ...legendDot, background: '#19a576' }} />PURE
            </span>
            <span style={{ ...legendItem, marginLeft: 'auto', color: 'rgba(55,53,47,0.3)', fontSize: '9px' }}>
              点線 = 60点
            </span>
          </div>
        </div>
      )}

      {/* ランク別正答率 */}
      {stats.rankStats.length > 0 && (
        <div style={rankWrap}>
          <p style={sectionLabel}>ランク別正答率</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.rankStats.map((r) => (
              <div key={r.rank} style={rankRow}>
                <span style={{ ...rankLabel, color: RANK_COLORS[r.rank] }}>{r.rank}</span>
                <div style={rankBarBase}>
                  <div
                    style={{
                      ...rankBarFill,
                      width: `${Math.round(r.correctRate * 100)}%`,
                      backgroundColor: RANK_COLORS[r.rank],
                    }}
                  />
                </div>
                <span style={rankPct}>{Math.round(r.correctRate * 100)}%</span>
                <span style={rankCount}>{r.count}問</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Styles ──
const skeletonWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }

const summaryRow: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '4px',
}
const summaryCard: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '10px 12px',
  borderRadius: '10px',
  backgroundColor: 'rgba(55,53,47,0.03)',
  border: '1px solid rgba(55,53,47,0.06)',
}
const summaryLabel: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.04em',
}
const summaryValue: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#37352f',
  lineHeight: 1.1,
}
const summaryUnit: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  marginLeft: '2px',
}

const chartWrap: React.CSSProperties = {
  marginTop: '16px',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(55,53,47,0.06)',
  backgroundColor: 'rgba(55,53,47,0.01)',
}
const chartLegend: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  marginTop: '6px',
}
const legendItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  color: 'rgba(55,53,47,0.5)',
  fontWeight: 600,
}
const legendDot: React.CSSProperties = {
  display: 'inline-block',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
}

const rankWrap: React.CSSProperties = { marginTop: '16px' }
const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.05em',
  marginBottom: '8px',
}
const rankRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const rankLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 900, width: '14px', textAlign: 'center' }
const rankBarBase: React.CSSProperties = {
  flex: 1,
  height: '6px',
  backgroundColor: 'rgba(55,53,47,0.06)',
  borderRadius: '3px',
  overflow: 'hidden',
}
const rankBarFill: React.CSSProperties = {
  height: '100%',
  borderRadius: '3px',
  transition: 'width 0.4s ease',
}
const rankPct: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  width: '32px',
  textAlign: 'right',
  color: '#37352f',
}
const rankCount: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(55,53,47,0.35)',
  width: '28px',
}

const tooltipBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '12px',
}
const tooltipLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.5)',
  marginBottom: '4px',
}
const tooltipRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  fontWeight: 600,
}
const tooltipVal: React.CSSProperties = { fontWeight: 900 }
