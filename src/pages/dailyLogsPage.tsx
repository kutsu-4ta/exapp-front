import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {LoadingSpinner} from '../components/common/LoadingSpinner'
import {StatusCopyModal} from '../components/common/StatusCopyModal'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {fetchDailyLog, fetchDailyLogs, fetchRecentDailyLogs} from '../lib/api/workspace'
import type {DailyLog, DailyLogSummary} from '../types/workspace'
import {formatDuration, formatSessions} from '../types/workspace'
import {getCached, setCached} from '../lib/pageCache'
import {useSettingsStore} from '../lib/store/settings'

type ViewMode = 'list' | 'chart'

const FALLBACK_COLORS = [
  '#2383e2', '#f2ab26', '#eb5757', '#9b59b6',
  '#e67e22', '#1abc9c', '#e91e63', '#607d8b',
]

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

function buildLogsListText(logs: DailyLogSummary[]): string {
  const lines = [`Daily Logs (${logs.length}件)`, '']
  logs.forEach((log) => {
    const status = log.isCompleted ? '✓' : '○'
    lines.push(`${status} ${log.date}  ${formatDuration(log.totalMinutes)}  ${formatSessions(log.sessionCount)}`)
  })
  return lines.join('\n')
}

function buildLogsChartText(
  baseMonth: string,
  monthTotals: { totalMinutes: number; subjectMap: Record<string, number> },
  selectedDate: string | null,
  detailLog: DailyLog | null,
): string {
  const lines = [`【Daily Logs ${baseMonth}】`, '']
  lines.push(`TOTAL: ${formatDuration(monthTotals.totalMinutes)}`)
  const subjEntries = Object.entries(monthTotals.subjectMap).sort((a, b) => b[1] - a[1])
  if (subjEntries.length > 0) {
    lines.push('')
    lines.push('【科目別】')
    subjEntries.forEach(([subj, mins]) => {
      const pct = monthTotals.totalMinutes > 0 ? Math.round((mins / monthTotals.totalMinutes) * 100) : 0
      lines.push(`${subj}: ${formatDuration(mins)} (${pct}%)`)
    })
  }
  if (selectedDate && detailLog) {
    lines.push('')
    lines.push(`【${selectedDate} 詳細】`)
    lines.push(`合計: ${formatDuration(detailLog.totalMinutes)}`)
    const subjectMap: Record<string, number> = {}
    for (const s of detailLog.studySessions) {
      subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.minutes
    }
    Object.entries(subjectMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([subj, mins]) => lines.push(`  ${subj}: ${mins}m`))
    if (detailLog.reflection) {
      lines.push('')
      lines.push('【振り返り】')
      lines.push(detailLog.reflection)
    }
  }
  return lines.join('\n')
}

export default function DailyLogsPage() {
  const navigate = useNavigate()
  const subjectColors = useSettingsStore((s) => s.subjectColors)
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

  // --- Day detail state ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detailLog, setDetailLog] = useState<DailyLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const detailCache = useRef<Record<string, DailyLog | null>>({})

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().slice(0, 10))

  // --- Copy state ---
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyText, setCopyText] = useState('')
  const [logCopied, setLogCopied] = useState(false)

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

  const monthTotals = useMemo(() => {
    const totalMinutes = chartData.reduce((acc, log) => acc + log.totalMinutes, 0)
    const subjectMap: Record<string, number> = {}
    for (const log of chartData) {
      for (const [subj, mins] of Object.entries(log.subjectMinutes ?? {})) {
        subjectMap[subj] = (subjectMap[subj] ?? 0) + mins
      }
    }
    return { totalMinutes, subjectMap }
  }, [chartData])

  const filteredChartData = useMemo(() => {
    const [year, month] = baseMonth.split('-').map(Number)
    const monthDataMap = new Map(
      chartData
        .filter((log) => log.date.startsWith(baseMonth))
        .map((log) => [log.date.slice(5).replace('-', '/'), log])
    )

    return daysInMonth.map((dateLabel) => {
      const log = monthDataMap.get(dateLabel)
      const mm = String(month).padStart(2, '0')
      const dd = dateLabel.slice(3)
      const fullDate = `${year}-${mm}-${dd}`
      const subj = log?.subjectMinutes ?? {}
      return {
        date: dateLabel,
        fullDate,
        sessions: log?.sessionCount ?? 0,
        totalMinutes: log?.totalMinutes ?? 0,
        morning: log?.slotMinutes?.morning ?? 0,
        lunch: log?.slotMinutes?.lunch ?? 0,
        night: log?.slotMinutes?.night ?? 0,
        ...subj,
      }
    })
  }, [chartData, daysInMonth, baseMonth])

  // Background prefetch: populate cache for all dates with records (most recent first, 3 concurrent)
  useEffect(() => {
    if (chartData.length === 0) return
    const queue = chartData
      .filter((log) => log.totalMinutes > 0 || log.sessionCount > 0)
      .map((log) => log.date)
      .reverse()
    let cancelled = false
    const worker = async () => {
      while (queue.length > 0 && !cancelled) {
        const date = queue.shift()!
        if (date in detailCache.current) continue
        const hit = getCached<DailyLog>(`daily-log-detail-${date}`)
        if (hit) { detailCache.current[date] = hit; continue }
        try {
          const log = await fetchDailyLog(date)
          if (!cancelled) {
            detailCache.current[date] = log
            setCached(`daily-log-detail-${date}`, log)
          }
        } catch { /* retry on demand */ }
      }
    }
    Promise.all([worker(), worker(), worker()])
    return () => { cancelled = true }
  }, [chartData])

  const handleCopyScreen = useCallback(() => {
    if (viewMode === 'list') {
      setCopyText(buildLogsListText(listLogs))
    } else {
      setCopyText(buildLogsChartText(baseMonth, monthTotals, selectedDate, detailLog))
    }
    setIsCopyModalOpen(true)
  }, [viewMode, listLogs, baseMonth, monthTotals, selectedDate, detailLog])

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setLogCopied(true)
      setTimeout(() => { setLogCopied(false); setIsCopyModalOpen(false) }, 800)
    } catch (e) { console.error(e) }
  }

  const handleSelectDate = async (fullDate: string) => {
    if (selectedDate === fullDate) {
      setSelectedDate(null)
      setDetailLog(null)
      return
    }
    setSelectedDate(fullDate)
    // 1. in-memory ref (fastest)
    if (fullDate in detailCache.current) {
      setDetailLog(detailCache.current[fullDate])
      return
    }
    // 2. module-level page cache (survives navigation, 5 min TTL)
    const cached = getCached<DailyLog>(`daily-log-detail-${fullDate}`)
    if (cached) {
      detailCache.current[fullDate] = cached
      setDetailLog(cached)
      return
    }
    // 3. on-demand fetch
    setDetailLoading(true)
    try {
      const log = await fetchDailyLog(fullDate)
      detailCache.current[fullDate] = log
      setCached(`daily-log-detail-${fullDate}`, log)
      setDetailLog(log)
    } catch {
      setDetailLog(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const navigateChart = (delta: number) => {
    const [y, m] = baseMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next > new Date().toISOString().slice(0, 7)) return
    setBaseMonth(next)
    setSelectedDate(null)
    setDetailLog(null)
  }

  const handleConfirm = () => {
    if (!modalDate) return
    setIsModalOpen(false)
    navigate(`/workspace/${modalDate}`)
  }

  if (listInitialLoading) return <LoadingSpinner fullPage />

  return (
    <div style={pageWrapper}>
      <div style={tabBar}>
        <button
          onClick={() => setViewMode('list')}
          style={{ ...tabItem, ...(viewMode === 'list' ? activeTab : {}) }}
        >
          <IconList active={viewMode === 'list'} /> LIST
        </button>
        <button
          onClick={() => setViewMode('chart')}
          style={{ ...tabItem, ...(viewMode === 'chart' ? activeTab : {}) }}
        >
          <IconTrend active={viewMode === 'chart'} /> ANALYTICS
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
                <span style={chartRangeLabel}>{baseMonth}</span>
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
              <div style={{ flex: 1 }}>DATE</div>
              <div style={{ flexShrink: 0, width: '72px', textAlign: 'right' }}>TIME</div>
            </div>

            {listLogs.length > 0 ? (
              listLogs.map((log) => {
                return (
                  <Link key={log.date} to={`/workspace/${log.date}`} style={logItem}>
                    <div style={itemRow1}>
                      <div style={itemDate}>
                        <span style={dateTxt}>
                          <span style={statusMark}>{log.isCompleted ? '✓' : '○'}</span>
                          {log.date}
                        </span>
                        <span style={reflectionSnippet}>
                          {log.sessionCount ? formatSessions(log.sessionCount) : 'No record'}
                        </span>
                      </div>
                      <div style={itemTime}>
                        {formatDuration(log.totalMinutes)}
                      </div>
                    </div>
                    {log.reflection && (
                      <div style={itemMemo}>{log.reflection}</div>
                    )}
                  </Link>
                )
              })
            ) : (
              <div style={emptyMessage}>No records</div>
            )}

            <div ref={sentinelRef} style={sentinel}>
              {listLoadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {!listHasMore && listLogs.length > 0 && (
                <span style={sentinelText}>All caught up</span>
              )}
            </div>
          </div>
        ) : (
          <div style={chartContainer}>
            {chartLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0px 0' }}>
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {/* Monthly overview: pie chart + total time */}
                <div style={chartCard}>
                  <p style={heatmapTitle}>MONTHLY OVERVIEW</p>
                  {monthTotals.totalMinutes === 0 ? (
                    <p style={{ fontSize: '13px', color: 'rgba(55,53,47,0.4)', textAlign: 'center', padding: '16px 0', margin: 0 }}>No data this month</p>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={Object.entries(monthTotals.subjectMap).map(([name, value]) => ({ name, value }))}
                              cx="50%"
                              cy="50%"
                              outerRadius="48%"
                              innerRadius="28%"
                              dataKey="value"
                              stroke="none"
                              animationDuration={600}
                            >
                              {Object.keys(monthTotals.subjectMap).map((name, i) => (
                                <Cell key={name} fill={subjectColors[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}m`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.4)', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>TOTAL</span>
                          <span style={{ fontSize: '24px', fontWeight: 700, color: '#37352f', fontFamily: 'monospace' }}>
                            {formatDuration(monthTotals.totalMinutes)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {Object.entries(monthTotals.subjectMap)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, mins], i) => {
                              const pct = Math.round((mins / monthTotals.totalMinutes) * 100)
                              return (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                  <span style={{ ...legendDot(subjectColors[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]), flexShrink: 0, margin: 0 }} />
                                  <span style={{ flex: 1, color: '#37352f', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                  <span style={{ color: 'rgba(55,53,47,0.5)', fontFamily: 'monospace', flexShrink: 0 }}>{pct}%</span>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trend: sessions bar + time line */}
                <div style={chartCard}>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={filteredChartData} onClick={(p: any) => { if (p?.activePayload?.[0]?.payload?.fullDate) handleSelectDate(p.activePayload[0].payload.fullDate) }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                        <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} dy={8} interval={4} tick={{ fill: 'rgba(55,53,47,0.45)' }} />
                        <YAxis yAxisId="sess" fontSize={10} tickLine={false} axisLine={false} dx={-4} allowDecimals={false} />
                        <YAxis yAxisId="min" orientation="right" fontSize={10} tickLine={false} axisLine={false} dx={4} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          cursor={{ fill: 'rgba(55,53,47,0.04)' }}
                          labelFormatter={(label) => `${baseMonth.split('-')[0]}/${label}`}
                          formatter={(value, name) =>
                            name === 'sessions'
                              ? [formatSessions(value as number), 'Sessions']
                              : [formatDuration(value as number), 'Time']
                          }
                        />
                        <Bar yAxisId="sess" dataKey="sessions" fill="#19a576" radius={[2, 2, 0, 0]} animationDuration={600} />
                        <Line yAxisId="min" type="monotone" dataKey="totalMinutes" stroke="#2383e2" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={800} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={chartLegend}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={legendDot('#19a576')} />Sessions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={legendDot('#2383e2')} />Time
                    </span>
                  </div>
                </div>

                {/* Heatmap: time slot × day */}
                <div style={chartCard}>
                  <p style={heatmapTitle}>By Time Slot</p>
                  <Heatmap data={filteredChartData} selectedDate={selectedDate} onSelect={handleSelectDate} />
                </div>

                {/* Day detail panel */}
                {selectedDate && (
                  <div style={detailPanel}>
                    <div style={detailHeader}>
                      <span style={detailDateLabel}>{formatDetailDate(selectedDate)}</span>
                      <button style={detailCloseBtn} onClick={() => { setSelectedDate(null); setDetailLog(null) }}>×</button>
                    </div>
                    {detailLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : detailLog ? (
                      <DayDetail log={detailLog} />
                    ) : (
                      <p style={detailEmpty}>No record for this day</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleCopyScreen}
        style={{
          position: 'fixed',
          left: '16px',
          bottom: 'calc(68px + env(safe-area-inset-bottom))',
          zIndex: 200,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          border: '1px solid rgba(55,53,47,0.12)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(55,53,47,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      {isCopyModalOpen && (
        <StatusCopyModal
          onClose={() => setIsCopyModalOpen(false)}
          onCopy={handleFinalCopy}
          text={copyText}
          copied={logCopied}
        />
      )}

      {isModalOpen && (
        <div style={modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalTitle}>Select Date</h3>
            <input
              type="date"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
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

// ── ヒートマップ ─────────────────────────────────────────────────────────────

type HeatmapRow = { date: string; fullDate: string; morning: number; lunch: number; night: number }

const SLOT_LABELS: { key: 'morning' | 'lunch' | 'night'; label: string }[] = [
  { key: 'morning', label: 'AM' },
  { key: 'lunch',   label: 'PM' },
  { key: 'night',   label: 'Eve' },
]

function slotColor(minutes: number): string {
  if (minutes === 0) return 'rgba(55,53,47,0.06)'
  if (minutes < 30)  return 'rgba(25,165,118,0.18)'
  if (minutes < 60)  return 'rgba(25,165,118,0.38)'
  if (minutes < 120) return 'rgba(25,165,118,0.62)'
  return 'rgba(25,165,118,0.90)'
}

function Heatmap({ data, selectedDate, onSelect }: { data: HeatmapRow[]; selectedDate: string | null; onSelect: (d: string) => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: `${28 + data.length * 14}px` }}>
        {SLOT_LABELS.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <div style={heatmapSlotLabel}>{label}</div>
            {data.map((d) => (
              <div
                key={d.date}
                title={`${d.date} ${label}: ${d[key]}分`}
                onClick={() => onSelect(d.fullDate)}
                style={{
                  flex: 1,
                  height: '18px',
                  borderRadius: '2px',
                  backgroundColor: slotColor(d[key]),
                  cursor: 'pointer',
                  outline: selectedDate === d.fullDate ? '2px solid #19a576' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 日別詳細パネル ────────────────────────────────────────────────────────────

function formatDetailDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const DAYS = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAYS[d.getDay()]}）`
}

function DayDetail({ log }: { log: DailyLog }) {
  const subjectMap: Record<string, number> = {}
  const slotMap: Record<string, number> = { morning: 0, lunch: 0, night: 0 }
  for (const s of log.studySessions) {
    subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + s.minutes
    slotMap[s.timeSlot] = (slotMap[s.timeSlot] ?? 0) + s.minutes
  }
  const subjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])
  const maxMin = subjects[0]?.[1] ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* By Subject */}
      {subjects.length > 0 && (
        <div>
          <p style={detailSectionLabel}>By Subject</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {subjects.map(([subj, min]) => (
              <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={detailSubjectName}>{subj}</span>
                <div style={detailBarTrack}>
                  <div style={{ ...detailBar, width: `${(min / maxMin) * 100}%` }} />
                </div>
                <span style={detailMinutes}>{min}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot + Sessions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {SLOT_LABELS.map(({ key, label }) => (
          <div key={key} style={detailSlotChip}>
            <span style={detailSlotLabel}>{label}</span>
            <span style={detailSlotMin}>{slotMap[key]}m</span>
          </div>
        ))}
        <div style={detailSlotChip}>
          <span style={detailSlotLabel}>Sessions</span>
          <span style={detailSlotMin}>{log.studySessions.length}</span>
        </div>
      </div>

      {/* Reflection */}
      {log.reflection && (
        <div>
          <p style={detailSectionLabel}>Reflection</p>
          <p style={detailReflection}>{log.reflection}</p>
        </div>
      )}
    </div>
  )
}

function legendDot(color: string): React.CSSProperties {
  return { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: color, marginRight: 4 }
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
  flexDirection: 'column',
  padding: '14px 8px',
  textDecoration: 'none',
  color: 'inherit',
  borderBottom: '1px solid rgba(55, 53, 47, 0.06)',
  gap: '6px',
}
const itemRow1: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const itemDate: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
}
const dateTxt: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }
const reflectionSnippet: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.45)',
}
const itemTime: React.CSSProperties = {
  flexShrink: 0,
  textAlign: 'right',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'monospace',
}
const statusMark: React.CSSProperties = {
  marginRight: '6px',
  fontSize: '13px',
  color: 'rgba(55, 53, 47, 0.45)',
}
const itemMemo: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(55, 53, 47, 0.5)',
  lineHeight: '1.5',
  paddingLeft: '20px',
}
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
  padding: '12px',
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
const chartLegend: React.CSSProperties = {
  display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(55,53,47,0.5)', marginTop: '10px', gap: '4px',
}
const heatmapTitle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.4)', letterSpacing: '0.06em', marginBottom: '10px',
}
const heatmapSlotLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: 'rgba(55,53,47,0.4)', display: 'flex', alignItems: 'center',
}
const detailPanel: React.CSSProperties = {
  border: '1px solid rgba(55,53,47,0.09)', borderRadius: '12px', padding: '20px', backgroundColor: '#fcfcfc',
  animation: 'fadeSlideIn 0.18s ease',
}
const detailHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
}
const detailDateLabel: React.CSSProperties = {
  fontSize: '15px', fontWeight: 700, color: '#37352f',
}
const detailCloseBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '18px', color: 'rgba(55,53,47,0.4)', cursor: 'pointer', padding: '0 4px',
}
const detailEmpty: React.CSSProperties = {
  fontSize: '13px', color: 'rgba(55,53,47,0.4)', textAlign: 'center', padding: '16px 0',
}
const detailSectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'rgba(55,53,47,0.35)', letterSpacing: '0.06em', marginBottom: '8px',
}
const detailSubjectName: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#37352f', width: '80px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const detailBarTrack: React.CSSProperties = {
  flex: 1, height: '6px', backgroundColor: 'rgba(55,53,47,0.06)', borderRadius: '3px', overflow: 'hidden',
}
const detailBar: React.CSSProperties = {
  height: '100%', backgroundColor: '#2383e2', borderRadius: '3px', transition: 'width 0.3s ease',
}
const detailMinutes: React.CSSProperties = {
  fontSize: '12px', color: 'rgba(55,53,47,0.55)', fontFamily: 'monospace', width: '36px', textAlign: 'right', flexShrink: 0,
}
const detailSlotChip: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(55,53,47,0.08)', backgroundColor: '#fff',
}
const detailSlotLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: 'rgba(55,53,47,0.35)',
}
const detailSlotMin: React.CSSProperties = {
  fontSize: '14px', fontWeight: 700, color: '#37352f',
}
const detailReflection: React.CSSProperties = {
  fontSize: '13px', color: 'rgba(55,53,47,0.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
  padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(55,53,47,0.03)',
  border: '1px solid rgba(55,53,47,0.06)',
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
