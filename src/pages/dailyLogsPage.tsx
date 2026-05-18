import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {LoadingSpinner} from '../components/common/LoadingSpinner'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts'
import {fetchDailyLogs, fetchRecentDailyLogs} from '../lib/api/workspace'
import type {DailyLogSummary} from '../types/workspace'
import {getCached, setCached} from '../lib/pageCache'
import {StatusBadge} from "@/components/common/StatusBadge.tsx";

type ViewMode = 'list' | 'chart'

function IconList({ active }: { active: boolean }) {
  const c = active ? '#37352f' : 'rgba(55,53,47,0.45)'
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconTrend({ active }: { active: boolean }) {
  const c = active ? '#37352f' : 'rgba(55,53,47,0.45)'
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

export default function DailyLogsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewMode = (searchParams.get('view') as ViewMode) ?? 'list'
  const setViewMode = (v: ViewMode) =>
    setSearchParams((p) => { const n = new URLSearchParams(p); v === 'list' ? n.delete('view') : n.set('view', v); return n }, { replace: true })

  // --- List state ---
  const [listLogs, setListLogs] = useState<DailyLogSummary[]>([])
  const [listInitialLoading, setListInitialLoading] = useState(true)
  const [listLoadingMore, setListLoadingMore] = useState(false)
  const [listHasMore, setListHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // --- Chart state ---
  const [baseMonth, setBaseMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [chartData, setChartData] = useState<DailyLogSummary[]>([])
  const [chartLoading, setChartLoading] = useState(false)

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Initial list fetch
  useEffect(() => {
    const cached = getCached<DailyLogSummary[]>('daily-logs-initial')
    if (cached) {
      setListLogs(cached)
      setListHasMore(cached.length === 5)
      setListInitialLoading(false)
    }
    fetchRecentDailyLogs(5)
      .then((data) => {
        setListLogs(data)
        setListHasMore(data.length === 5)
        setCached('daily-logs-initial', data)
      })
      .catch(console.error)
      .finally(() => setListInitialLoading(false))
  }, [])

  const loadMore = useCallback(async () => {
    if (listLoadingMore || !listHasMore) return
    const oldest = listLogs[listLogs.length - 1]?.date
    if (!oldest) return
    setListLoadingMore(true)
    try {
      const data = await fetchRecentDailyLogs(5, oldest)
      setListLogs((prev) => [...prev, ...data])
      setListHasMore(data.length === 5)
    } catch (e) {
      console.error(e)
    } finally {
      setListLoadingMore(false)
    }
  }, [listLogs, listLoadingMore, listHasMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // --- Chart Logic ---
  const daysInMonth = useMemo(() => {
    const [year, month] = baseMonth.split('-').map(Number)
    const date = new Date(year, month, 0)
    const count = date.getDate()
    return Array.from({ length: count }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      const monthStr = String(month).padStart(2, '0')
      return `${monthStr}/${day}`
    })
  }, [baseMonth])

  useEffect(() => {
    if (viewMode !== 'chart') return
    setChartLoading(true)
    const [y, m] = baseMonth.split('-').map(Number)

    fetchDailyLogs(y, m)
      .then((data) => {
        setChartData(data.sort((a, b) => a.date.localeCompare(b.date)))
      })
      .catch(console.error)
      .finally(() => setChartLoading(false))
  }, [viewMode, baseMonth])

  const filteredChartData = useMemo(() => {
    const monthDataMap = new Map(
      chartData
        .filter((log) => log.date.startsWith(baseMonth))
        .map((log) => [log.date.slice(5).replace('-', '/'), log.totalMinutes])
    )

    return daysInMonth.map((dateLabel) => ({
      date: dateLabel,
      minutes: monthDataMap.get(dateLabel) || 0,
    }))
  }, [chartData, daysInMonth, baseMonth])

  const navigateChart = (delta: number) => {
    const [y, m] = baseMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next > new Date().toISOString().slice(0, 7)) return
    setBaseMonth(next)
  }

  const handleConfirm = () => {
    if (!selectedDate) return
    setIsModalOpen(false)
    navigate(`/workspace/${selectedDate}`)
  }

  if (listInitialLoading) return <LoadingSpinner fullPage />

  return (
    <div style={pageWrapper}>
      <div style={tabBar}>
        <button
          onClick={() => setViewMode('list')}
          style={{ ...tabItem, ...(viewMode === 'list' ? activeTab : {}) }}
        >
          <IconList active={viewMode === 'list'} /> リスト
        </button>
        <button
          onClick={() => setViewMode('chart')}
          style={{ ...tabItem, ...(viewMode === 'chart' ? activeTab : {}) }}
        >
          <IconTrend active={viewMode === 'chart'} /> 推移
        </button>
      </div>

      <div style={content}>
        <header style={header}>
          <div style={titleRow}>
            <div>
              <h1 style={title}>Daily Logs</h1>
            </div>

            {viewMode === 'chart' ? (
              <div style={chartNavControls}>
                <button style={navBtn} onClick={() => navigateChart(-1)}>
                  ◀
                </button>
                <span style={chartRangeLabel}>{baseMonth.replace('-', '年')}月</span>
                <button
                  style={navBtn}
                  onClick={() => navigateChart(1)}
                  disabled={baseMonth >= new Date().toISOString().slice(0, 7)}
                >
                  ▶
                </button>
              </div>
            ) : (
              <button onClick={() => setIsModalOpen(true)} style={openModalBtn}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {viewMode === 'list' ? (
          <div style={listContainer}>
            <div style={listHeader}>
              <div style={{ flex: 2 }}>日付</div>
              <div style={{ flex: 1, textAlign: 'right' }}>時間</div>
              <div style={{ flex: 1, textAlign: 'center' }}>状態</div>
            </div>

            {listLogs.length > 0 ? (
              listLogs.map((log) => {
                const hours = Math.floor(log.totalMinutes / 60)
                const mins = log.totalMinutes % 60
                return (
                  <Link key={log.date} to={`/workspace/${log.date}`} style={logItem}>
                    <div style={itemDate}>
                      <span style={dateTxt}>{log.date}</span>
                      <span style={reflectionSnippet}>
                        {log.sessionCount ? `${log.sessionCount}セッション` : '記録なし'}
                      </span>
                    </div>
                    <div style={itemTime}>
                      {hours}h {mins}m
                    </div>
                    <div style={itemStatus}>
                      <StatusBadge
                          status={
                            log.isCompleted
                                ? 'done'
                                : 'open'
                          }
                      />
                    </div>
                  </Link>
                )
              })
            ) : (
              <div style={emptyMessage}>記録はありません</div>
            )}

            <div ref={sentinelRef} style={sentinel}>
              {listLoadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {!listHasMore && listLogs.length > 0 && (
                <span style={sentinelText}>すべて表示しました</span>
              )}
            </div>
          </div>
        ) : (
          <div style={chartContainer}>
            <div style={chartCard}>
              {chartLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <LoadingSpinner />
                </div>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={filteredChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis
                        dataKey="date"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        interval={4}
                        tick={{ fill: 'rgba(55, 53, 47, 0.45)' }}
                      />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} dx={-5} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ stroke: '#2383e2', strokeWidth: 1 }}
                        labelFormatter={(label) => `${baseMonth.split('-')[0]}/${label}`}
                        formatter={(value) => [`${value}分`, '学習時間']}
                      />
                      <ReferenceLine
                        y={385}
                        stroke="#eb5757"
                        strokeDasharray="5 5"
                        label={{
                          value: 'Target',
                          fontSize: 10,
                          fill: '#eb5757',
                          position: 'insideBottomRight',
                          offset: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#2383e2"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalTitle}>日付を選択</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={modalDateInput}
            />
            <div style={modalActions}>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn}>
                キャンセル
              </button>
              <button onClick={handleConfirm} style={confirmBtn}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const pageWrapper: React.CSSProperties = {
  backgroundColor: '#fff',
  minHeight: '100vh',
  color: '#37352f',
}
const tabBar: React.CSSProperties = {
  display: 'flex',
  padding: '0 16px',
  borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
  gap: '16px',
}
const tabItem: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '12px 4px',
  fontSize: '14px',
  color: 'rgba(55, 53, 47, 0.45)',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}
const activeTab: React.CSSProperties = { color: '#37352f', borderBottom: '2px solid #37352f' }
const content: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  margin: '0 auto',
  padding: '40px 20px 100px',
}
const header: React.CSSProperties = { marginBottom: '32px' }
const titleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
const title: React.CSSProperties = { fontSize: '32px', fontWeight: 700, marginBottom: '6px' }
const openModalBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  color: 'rgba(55, 53, 47, 0.55)',
  display: 'flex',
  alignItems: 'center',
}
const chartNavControls: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const navBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
  fontSize: '13px',
  color: 'rgba(55,53,47,0.55)',
}
const chartRangeLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.55)',
}
const listContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(55, 53, 47, 0.06)',
  borderRadius: '8px',
}
const listHeader: React.CSSProperties = {
  display: 'flex',
  padding: '10px 8px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(55, 53, 47, 0.35)',
  borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
}
const logItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '16px 8px',
  textDecoration: 'none',
  color: 'inherit',
  borderBottom: '1px solid rgba(55, 53, 47, 0.06)',
}
const itemDate: React.CSSProperties = {
  flex: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}
const dateTxt: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }
const reflectionSnippet: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.45)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const itemTime: React.CSSProperties = {
  flex: 1,
  textAlign: 'right',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'monospace',
}
const itemStatus: React.CSSProperties = { flex: 1, textAlign: 'center' }
const emptyMessage: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: 'rgba(55, 53, 47, 0.4)',
  fontSize: '14px',
}
const sentinel: React.CSSProperties = { padding: '16px', textAlign: 'center', minHeight: '1px' }
const sentinelText: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.4)' }
const chartContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
}
const chartCard: React.CSSProperties = {
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid rgba(55, 53, 47, 0.09)',
  backgroundColor: '#fcfcfc',
}
const tooltipStyle = {
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '12px',
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1200,
}
const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '320px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  textAlign: 'center',
}
const modalTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  marginBottom: '16px',
  color: '#37352f',
}
const modalDateInput: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  borderRadius: '8px',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  marginBottom: '24px',
  outline: 'none',
}
const modalActions: React.CSSProperties = { display: 'flex', gap: '12px' }
const cancelBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  backgroundColor: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  color: 'rgba(55,53,47,0.6)',
  cursor: 'pointer',
}
const confirmBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#2383e2',
  fontSize: '14px',
  fontWeight: 700,
  color: '#fff',
  cursor: 'pointer',
}
