import {useEffect, useMemo, useState} from 'react'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
      avgTotal >= 60 ? '安定' : avgTotal >= 50 ? '注意' : '要強化'
    return { subject, sessionCount: list.length, avgTotalScore: avgTotal, avgPureScore: avgPure, status }
  })
}

const statusStyle: Record<SubjectCardData['status'], React.CSSProperties> = {
  安定: { background: '#e6f6eb', color: '#19a576' },
  注意: { background: '#fff5e0', color: '#f2ab26' },
  要強化: { background: '#ffebe9', color: '#eb5757' },
  未受験: { background: '#f3f3f2', color: '#8a7b6e' },
}

const statusBarColor: Record<SubjectCardData['status'], string> = {
  安定: '#19a576',
  注意: '#f2ab26',
  要強化: '#eb5757',
  未受験: '#d0cfc9',
}

// ツールチップ（折れ線）
function ProgressTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; examYear: string; total: number; pure: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={tooltipBox}>
      <div style={tooltipHead}>{d.examYear} &nbsp;·&nbsp; {d.date}</div>
      <div style={{ color: '#2383e2', ...tooltipRow }}>TOTAL<span style={tooltipVal}>{d.total}</span></div>
      <div style={{ color: '#19a576', ...tooltipRow }}>PURE<span style={tooltipVal}>{d.pure}</span></div>
    </div>
  )
}

// ツールチップ（棒グラフ）
function OverviewTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: SubjectCardData & { total: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={tooltipBox}>
      <div style={tooltipHead}>{d.subject}</div>
      <div style={{ color: statusBarColor[d.status], ...tooltipRow }}>
        TOTAL<span style={tooltipVal}>{d.total.toFixed(1)}</span>
      </div>
      <div style={{ color: '#aaa', ...tooltipRow }}>
        {d.sessionCount}回受験
      </div>
    </div>
  )
}

interface AnalysisViewProps {
  onDetail?: (sessionId: number) => void
}

export default function AnalysisView({ onDetail }: AnalysisViewProps) {
  const subjects = useSettingsStore((s) => s.subjects)
  const [sessions, setSessions] = useState<ExamSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('すべて')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [cardView, setCardView] = useState<'subjects' | 'recent'>('subjects')

  useEffect(() => {
    fetchExamSessions('completed')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const subjectCards = useMemo(() => computeSubjectCards(sessions, subjects), [sessions, subjects])

  // 概要グラフ（全科目比較）
  const overviewData = useMemo(() =>
    subjectCards
      .filter((c) => c.sessionCount > 0)
      .sort((a, b) => b.avgTotalScore - a.avgTotalScore)
      .map((c) => ({ ...c, total: Math.round(c.avgTotalScore * 10) / 10 })),
    [subjectCards]
  )

  // 推移グラフ（特定科目）
  const progressData = useMemo(() => {
    if (filterSubject === 'すべて') return []
    return sessions
      .filter((s) => s.subject === filterSubject && s.completedAt != null)
      .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!))
      .map((s, i) => ({
        label: `第${i + 1}回`,
        date: s.completedAt!.slice(5, 10).replace('-', '/'),
        examYear: s.examYear,
        total: s.totalScore,
        pure: s.pureScore,
      }))
  }, [sessions, filterSubject])

  const recentSessions = useMemo(() =>
    [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [sessions]
  )

  // 各科目の最新1件（タブ2合計用）
  const latestPerSubject = useMemo(() => {
    const seen = new Set<string>()
    return recentSessions.filter((s) => {
      if (seen.has(s.subject)) return false
      seen.add(s.subject)
      return true
    })
  }, [recentSessions])

  // タブ1合計：各科目の avgTotalScore の合計
  const subjectsTotalScore = useMemo(
    () => overviewData.reduce((sum, c) => sum + c.avgTotalScore, 0),
    [overviewData]
  )

  // タブ2合計：各科目の直近スコアの合計
  const recentTotalScore = useMemo(
    () => latestPerSubject.reduce((sum, s) => sum + s.totalScore, 0),
    [latestPerSubject]
  )

  const isOverview = filterSubject === 'すべて'

  if (selectedSubject) {
    return (
      <SubjectDetailView
        subject={selectedSubject}
        sessions={sessions.filter((s) => s.subject === selectedSubject)}
        onBack={() => setSelectedSubject(null)}
        onDetail={onDetail}
        onDelete={(sessionId) => setSessions((prev) => prev.filter((s) => s.id !== sessionId))}
      />
    )
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  return (
    <div style={analysisContainer}>
      {/* フィルター */}
      <div style={filterRow}>
        <select
          style={miniSelect}
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="すべて">すべての科目</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* チャートカード */}
      <div style={chartCard}>
        <h3 style={cardTitle}>
          {isOverview ? 'Avg.TOTAL SCORE' : `HISTORY OF ${filterSubject}`}
        </h3>

        {isOverview ? (
          // ── 全科目比較 横棒グラフ ──
          overviewData.length === 0 ? (
            <p style={emptyText}>記録がありません</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(overviewData.length * 48, 120) }}>
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={overviewData}
                  margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="subject"
                    width={72}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<OverviewTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <ReferenceLine
                    x={60}
                    stroke="#2383e2"
                    strokeDasharray="5 5"
                    label={{ value: '60', position: 'right', fontSize: 10, fill: '#2383e2' }}
                  />
                  <Bar dataKey="total" name="Avg.TOTAL" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {overviewData.map((entry) => (
                      <Cell key={entry.subject} fill={statusBarColor[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        ) : (
          // ── 特定科目 推移折れ線 ──
          progressData.length === 0 ? (
            <p style={emptyText}>この科目の記録がありません</p>
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<ProgressTooltip />} />
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
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2383e2' }}
                    activeDot={{ r: 6 }}
                    name="TOTAL"
                  />
                  <Line
                    type="monotone"
                    dataKey="pure"
                    stroke="#19a576"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#19a576' }}
                    activeDot={{ r: 6 }}
                    name="PURE"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        )}

        {/* 凡例 */}
        {!isOverview && progressData.length > 0 && (
          <div style={legend}>
            <span style={legendDot('#2383e2')} />TOTAL
            <span style={{ ...legendDot('#19a576'), marginLeft: 12 }} />PURE
          </div>
        )}
      </div>

      {/* 切替タブ */}
      <div style={viewToggleRow}>
        <button style={viewToggleBtn(cardView === 'subjects')} onClick={() => setCardView('subjects')}>
          AVG.
        </button>
        <button style={viewToggleBtn(cardView === 'recent')} onClick={() => setCardView('recent')}>
          LAST
        </button>
      </div>

      {/* 科目カードグリッド（平均） */}
      {cardView === 'subjects' ? (
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
          {subjectCards.length % 2 === 0 && <div />}
          <div style={summaryCard}>
            <div style={subjCardHeader}>
              <span style={{ ...subjNameSmall, color: '#2383e2' }}>合計点</span>
            </div>
            <div style={subjCardBody}>
              <div style={dataItem}>
                <span style={dataLabel}>Avg. TOTAL</span>
                <span style={{ ...dataValue, color: '#2383e2' }}>
                  {overviewData.length > 0 ? Math.round(subjectsTotalScore * 10) / 10 : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 科目カードグリッド（直近） */
        <div style={detailGrid}>
          {latestPerSubject.length === 0 && <p style={{ ...emptyText, gridColumn: '1/-1' }}>記録がありません</p>}
          {latestPerSubject.map((s) => {
            const sessionStatus: SubjectCardData['status'] =
              s.totalScore >= 60 ? '安定' : s.totalScore >= 50 ? '注意' : '要強化'
            return (
              <div key={s.subject} style={subjCard} onClick={() => setSelectedSubject(s.subject)}>
                <div style={subjCardHeader}>
                  <span style={subjNameSmall}>{s.subject}</span>
                  <span style={{ ...subjStatusTag, ...statusStyle[sessionStatus] }}>{sessionStatus}</span>
                </div>
                <div style={subjCardBody}>
                  <div style={dataItem}>
                    <span style={dataLabel}>{s.createdAt.slice(5, 10).replace('-', '/')}</span>
                    <span style={dataValue}>{s.examYear}</span>
                  </div>
                  <div style={dataItem}>
                    <span style={dataLabel}>TOTAL</span>
                    <span style={dataValue}>{s.totalScore}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {latestPerSubject.length % 2 === 0 && <div />}
          <div style={summaryCard}>
            <div style={subjCardHeader}>
              <span style={{ ...subjNameSmall, color: '#2383e2' }}>合計点</span>
            </div>
            <div style={subjCardBody}>
              <div style={dataItem}>
                <span style={dataLabel}>TOTAL</span>
                <span style={{ ...dataValue, color: '#2383e2' }}>
                  {latestPerSubject.length > 0 ? recentTotalScore : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
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
  marginBottom: '16px',
  color: '#888',
  letterSpacing: '0.05em',
}
const tooltipBox: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '12px',
  lineHeight: 1.6,
}
const tooltipHead: React.CSSProperties = {
  fontWeight: 700,
  color: '#37352f',
  marginBottom: '4px',
  fontSize: '11px',
}
const tooltipRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  fontWeight: 600,
}
const tooltipVal: React.CSSProperties = { fontWeight: 900, color: 'inherit' }
const legend: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '12px',
  fontSize: '11px',
  color: '#888',
  fontWeight: 600,
}
function legendDot(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '4px',
  }
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
const viewToggleRow: React.CSSProperties = { display: 'flex', gap: '8px' }
const viewToggleBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '8px',
  border: active ? '1.5px solid #2383e2' : '1px solid #eee',
  background: active ? 'rgba(35,131,226,0.08)' : '#fff',
  color: active ? '#2383e2' : '#888',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
})
const summaryCard: React.CSSProperties = {
  backgroundColor: 'rgba(35,131,226,0.06)',
  padding: '12px',
  borderRadius: '12px',
  border: '1.5px solid rgba(35,131,226,0.2)',
}
