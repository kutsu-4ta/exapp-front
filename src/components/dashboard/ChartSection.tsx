import {useEffect, useMemo, useState} from 'react'
import type {DailyLogSummary} from '../../types/workspace'
import {todayString} from '../../types/workspace'
import {fetchMonthlyLogs, fetchMonthlySettings, updateMonthlySettings} from '../../lib/api/workspace'
import {getCached, setCached} from '../../lib/pageCache'
import {DashboardChart} from './DashboardChart'
import {buildChartData} from '../../lib/dashboardUtils'

interface Props {
  year: number
  month: number
  onNavigate: (delta: number) => void
}

export function ChartSection({ year, month, onNavigate }: Props) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const [chartLogs, setChartLogs] = useState<DailyLogSummary[]>([])
  const [targetMin, setTargetMin] = useState(140)
  const [targetMax, setTargetMax] = useState(180)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editMin, setEditMin] = useState(140)
  const [editMax, setEditMax] = useState(180)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    const cacheKey = `dashboard-monthly-${year}-${month}`
    type MonthlyCache = { logs: DailyLogSummary[]; settings: { targetMin: number; targetMax: number } }
    const cached = getCached<MonthlyCache>(cacheKey)
    setIsEditing(false)
    if (cached) {
      setChartLogs(cached.logs)
      setTargetMin(cached.settings.targetMin)
      setTargetMax(cached.settings.targetMax)
      setEditMin(cached.settings.targetMin)
      setEditMax(cached.settings.targetMax)
      setLoading(false)
    } else {
      setLoading(true)
    }
    Promise.all([fetchMonthlyLogs(year, month), fetchMonthlySettings(year, month)])
      .then(([logs, settings]) => {
        setChartLogs(logs)
        setTargetMin(settings.targetMin)
        setTargetMax(settings.targetMax)
        setEditMin(settings.targetMin)
        setEditMax(settings.targetMax)
        setCached(cacheKey, { logs, settings })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ready, year, month])

  const handleOpenGoalEditor = () => {
    setEditMin(targetMin)
    setEditMax(targetMax)
    setIsEditing(true)
  }

  const handleSaveGoal = async () => {
    setSaving(true)
    try {
      await updateMonthlySettings(year, month, { targetMin: editMin, targetMax: editMax })
      setTargetMin(editMin)
      setTargetMax(editMax)
      setIsEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const chartData = useMemo(
    () => buildChartData(year, month, chartLogs, targetMin, targetMax, todayString()),
    [year, month, chartLogs, targetMin, targetMax]
  )

  return (
    <section className="mb-12">
      <div className="p-3 border border-[rgba(55,53,47,0.06)] rounded-lg">
        {/* Month navigation */}
        <div className="flex items-center justify-center relative pb-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(-1)}
              className="flex items-center justify-center w-7 h-7 rounded border border-[rgba(55,53,47,0.12)] bg-white text-[rgba(55,53,47,0.6)] cursor-pointer"
              aria-label="前月"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[13px] font-bold text-[rgba(55,53,47,0.6)] min-w-[90px] text-center flex items-center justify-center gap-1.5">
              {year}/{String(month).padStart(2, '0')}
              {isCurrentMonth && (
                <span className="text-[10px] font-semibold text-n-blue bg-[var(--nt-blue-bg)] px-1.5 py-[1px] rounded-sm">今月</span>
              )}
            </span>
            <button
              onClick={() => onNavigate(1)}
              disabled={isCurrentMonth}
              className={['flex items-center justify-center w-7 h-7 rounded border bg-white', isCurrentMonth ? 'border-[rgba(55,53,47,0.06)] text-[rgba(55,53,47,0.2)] cursor-default' : 'border-[rgba(55,53,47,0.12)] text-[rgba(55,53,47,0.6)] cursor-pointer'].join(' ')}
              aria-label="翌月"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleOpenGoalEditor}
            className="absolute right-1 top-1 flex items-center justify-center w-7 h-7 rounded text-[rgba(55,53,47,0.25)] hover:text-[rgba(55,53,47,0.5)] hover:bg-[var(--nt-pressed)] transition-colors border-none bg-transparent cursor-pointer"
            aria-label="目標を編集"
            title={`目標: ${targetMin}h ~ ${targetMax}h`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {isEditing && (
          <div className="flex justify-center items-center gap-1.5 px-2 py-2 mb-3 bg-[var(--nt-surface)] border border-[rgba(55,53,47,0.06)] rounded-md">
            <span className="text-[10px] font-bold text-[rgba(55,53,47,0.3)] mr-1">GOAL:</span>
            <input type="number" value={editMin} onChange={(e) => setEditMin(Number(e.target.value))} className="w-11 text-[13px] font-semibold text-n-text border border-[rgba(55,53,47,0.12)] rounded text-center py-0.5 outline-none bg-white" min={0} />
            <span className="text-[13px] text-[rgba(55,53,47,0.45)]">-</span>
            <input type="number" value={editMax} onChange={(e) => setEditMax(Number(e.target.value))} className="w-11 text-[13px] font-semibold text-n-text border border-[rgba(55,53,47,0.12)] rounded text-center py-0.5 outline-none bg-white" min={0} />
            <span className="text-[13px] text-[rgba(55,53,47,0.45)]">h</span>
            <button onClick={handleSaveGoal} disabled={saving} className="ml-2 text-[11px] font-semibold px-2 py-1 rounded bg-n-blue text-white border-none cursor-pointer disabled:opacity-50">
              {saving ? '...' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)} className="text-[11px] text-[rgba(55,53,47,0.4)] border-none bg-transparent cursor-pointer px-2 py-1">
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center bg-[rgba(55,53,47,0.01)] rounded" style={{ height: 'clamp(200px, 35vw, 280px)' }}>
            <div className="w-full h-full p-4 flex flex-col justify-between">
              <div className="animate-pulse bg-[rgba(55,53,47,0.06)] rounded h-full w-full" />
            </div>
          </div>
        ) : (
          <DashboardChart data={chartData} targetMin={targetMin} targetMax={targetMax} />
        )}
      </div>
    </section>
  )
}
