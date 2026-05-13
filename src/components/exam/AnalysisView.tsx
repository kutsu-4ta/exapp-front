import {useEffect, useMemo, useState} from 'react'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts'
import {useSettingsStore} from '../../lib/store/settings'
import type {ExamSessionSummary} from '../../types/exam'
import {fetchExamSessions} from '../../lib/api/exam'
import SubjectDetailView from './SubjectDetailView'

type SubjectCardData = {
  subject: string
  sessionCount: number
  avgTotalScore: number
  avgPureScore: number
  status: '未受験' | '要強化' | '注意' | '安定'
}

function computeSubjectCards(
  sessions: ExamSessionSummary[],
  subjects: string[]
): SubjectCardData[] {
  const subjectList = subjects.length > 0 ? subjects : [...new Set(sessions.map((s) => s.subject))]
  return subjectList.map((subject) => {
    const list = sessions.filter((s) => s.subject === subject)
    if (list.length === 0)
      return { subject, sessionCount: 0, avgTotalScore: 0, avgPureScore: 0, status: '未受験' }
    const avgTotal = list.reduce((s, x) => s + x.totalScore, 0) / list.length
    const avgPure = list.reduce((s, x) => s + x.pureScore, 0) / list.length
    const status: SubjectCardData['status'] =
      avgPure >= 60 ? '安定' : avgPure >= 50 ? '注意' : '要強化'
    return {
      subject,
      sessionCount: list.length,
      avgTotalScore: avgTotal,
      avgPureScore: avgPure,
      status,
    }
  })
}

const statusStyle: Record<SubjectCardData['status'], React.CSSProperties> = {
  安定: { background: '#e6f6eb', color: '#19a576' },
  注意: { background: '#fff5e0', color: '#f2ab26' },
  要強化: { background: '#ffebe9', color: '#eb5757' },
  未受験: { background: '#f3f3f2', color: '#8a7b6e' },
}

export default function AnalysisView() {
  const subjects = useSettingsStore((s) => s.subjects)
  const [sessions, setSessions] = useState<ExamSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('すべて')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    fetchExamSessions('completed')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => {
    const filtered =
      filterSubject === 'すべて' ? sessions : sessions.filter((s) => s.subject === filterSubject)
    return filtered
      .filter((s) => s.completedAt)
      .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!))
      .map((s) => ({
        date: s.completedAt!.slice(5, 10).replace('-', '/'),
        total: s.totalScore,
        pure: s.pureScore,
        subject: s.subject,
      }))
  }, [sessions, filterSubject])

  const subjectCards = useMemo(() => computeSubjectCards(sessions, subjects), [sessions, subjects])

  if (selectedSubject) {
    return <SubjectDetailView subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  return (
    <div style={analysisContainer}>
      <div style={filterRow}>
        <select
          style={miniSelect}
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="すべて">すべての科目</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={chartCard}>
        <h3 style={cardTitle}>得点推移 (TOTAL vs PURE)</h3>
        {chartData.length === 0 ? (
          <p style={emptyText}>記録がありません</p>
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine
                  y={60}
                  stroke="#2383e2"
                  strokeDasharray="5 5"
                  label={{ value: '60', position: 'right', fontSize: 10, fill: '#2383e2' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2383e2"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="TOTAL"
                />
                <Line
                  type="monotone"
                  dataKey="pure"
                  stroke="#19a576"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="PURE"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={detailGrid}>
        {subjectCards.map((card) => (
          <div key={card.subject} style={subjCard} onClick={() => setSelectedSubject(card.subject)}>
            <div style={subjCardHeader}>
              <span style={subjNameSmall}>{card.subject}</span>
              <span style={{ ...subjStatusTag, ...statusStyle[card.status] }}>{card.status}</span>
            </div>
            <div style={subjCardBody}>
              <div style={dataItem}>
                <span style={dataLabel}>Avg. PURE</span>
                <span style={dataValue}>
                  {card.sessionCount > 0 ? card.avgPureScore.toFixed(1) : '-'}
                </span>
              </div>
              <div style={dataItem}>
                <span style={dataLabel}>回数</span>
                <span style={dataValue}>{card.sessionCount}回</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Styles ──
const analysisContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  paddingBottom: '40px',
}
const filterRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end' }
const miniSelect: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid #eee',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: '#fff',
  color: '#37352f',
}
const chartCard: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid #f0f0ef',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
}
const cardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 800,
  marginBottom: '20px',
  color: '#888',
  letterSpacing: '0.05em',
}
const tooltipStyle = {
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '12px',
}
const detailGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
}
const subjCard: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #f0f0ef',
  cursor: 'pointer',
}
const subjCardHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
}
const subjNameSmall: React.CSSProperties = { fontSize: '11px', fontWeight: 900 }
const subjStatusTag: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
}
const subjCardBody: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const dataItem: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const dataLabel: React.CSSProperties = { fontSize: '8px', color: '#aaa', fontWeight: 700 }
const dataValue: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#37352f' }
const emptyText: React.CSSProperties = {
  fontSize: '13px',
  color: '#aaa',
  textAlign: 'center',
  padding: '20px 0',
}
