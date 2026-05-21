import type {AlertStatusItem, DailyLog, DashboardStats} from '../types/workspace'
import {formatDuration, formatDurationForDashboardStats, todayString} from '../types/workspace'
import {useSettingsStore} from '../lib/store/settings'
import {useEffect, useMemo, useState} from 'react'
import {fetchGeminiContext} from '@/lib/api/gemini.ts'
import {completeDailyLog, fetchDailyLog, fetchDashboardStats} from '../lib/api/workspace'
import {fetchAlertStatus} from '../lib/api/subjectAlertSettings'
import {SubjectStatus} from '../components/dashboard/SubjectStatus'
import {AlertWidget} from '../components/dashboard/AlertWidget'
import {StatCard} from '../components/dashboard/StatCard'
import {ChartSection} from '../components/dashboard/ChartSection'
import {Link, useNavigate} from 'react-router-dom'
import {loadAllDrafts, type PracticeDraft} from '@/lib/practiceDraft.ts'
import {getCached, setCached} from '@/lib/pageCache'
import {StatusCopyModal} from '@/components/common/StatusCopyModal.tsx'
import {buildDashboardStatusText} from '@/lib/dashboardUtils.ts'

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[rgba(55,53,47,0.06)] rounded ${className}`} />
)

export default function DashboardPage() {
  const subjects = useSettingsStore((s) => s.subjects)
  const navigate = useNavigate()
  const now = new Date()
  const [practiceDrafts] = useState<Array<{ subject: string; draft: PracticeDraft }>>(() => loadAllDrafts())

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [alertItems, setAlertItems] = useState<AlertStatusItem[]>([])
  const [todayLogLoading, setTodayLogLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const isInitialLoading = todayLogLoading

  const isPastCutoff = now.getHours() >= 4
  const [prevDayLog, setPrevDayLog] = useState<DailyLog | null>(null)
  const [prevDayCompleting, setPrevDayCompleting] = useState(false)

  // Chart month navigation (kept here for the copy function)
  const [chartYear, setChartYear] = useState(now.getFullYear())
  const [chartMonth, setChartMonth] = useState(now.getMonth() + 1)

  const [showAlert, setShowAlert] = useState(false)
  const [statsCopied, setStatsCopied] = useState(false)
  const [statsCopying, setStatsCopying] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyText, setCopyText] = useState('')

  useEffect(() => {
    const todayKey = `dashboard-today-log-${todayString()}`
    const calendarYesterday = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()

    const cachedTodayLog = getCached<DailyLog>(todayKey)
    if (cachedTodayLog) { setTodayLog(cachedTodayLog); setTodayLogLoading(false) }
    fetchDailyLog(todayString())
      .then((log) => { setTodayLog(log); setCached(todayKey, log) })
      .catch(console.error)
      .finally(() => setTodayLogLoading(false))

    const cachedStats = getCached<DashboardStats>('dashboard-stats')
    if (cachedStats) { setStats(cachedStats); setStatsLoading(false) }
    Promise.all([
      fetchDashboardStats(),
      fetchAlertStatus(),
      isPastCutoff ? fetchDailyLog(calendarYesterday) : Promise.resolve(null),
    ])
      .then(([s, alert, prevLog]) => {
        setStats(s)
        setCached('dashboard-stats', s)
        setAlertItems(alert)
        if (prevLog && !prevLog.isCompleted && prevLog.totalMinutes > 0) setPrevDayLog(prevLog)
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => {
    if (!isInitialLoading) {
      const timer = setTimeout(() => setShowAlert(true), 200)
      return () => clearTimeout(timer)
    }
  }, [isInitialLoading])

  const handleCompletePrevDay = async () => {
    if (!prevDayLog) return
    setPrevDayCompleting(true)
    try { await completeDailyLog(prevDayLog.date); setPrevDayLog(null) }
    catch { /* silent fail */ }
    finally { setPrevDayCompleting(false) }
  }

  const navigateMonth = (delta: number) => {
    setChartMonth((prev) => {
      const newMonth = prev + delta
      if (newMonth < 1) { setChartYear((y) => y - 1); return 12 }
      if (newMonth > 12) { setChartYear((y) => y + 1); return 1 }
      return newMonth
    })
  }

  const todaySubjects = useMemo(() => {
    if (!todayLog?.studySessions.length) return []
    const map = new Map<string, number>()
    for (const s of todayLog.studySessions) map.set(s.subject, (map.get(s.subject) ?? 0) + s.minutes)
    return Array.from(map.entries()).map(([subject, minutes]) => ({ subject, minutes })).sort((a, b) => b.minutes - a.minutes)
  }, [todayLog])

  const subjectTouched = useMemo(() => {
    const raw = stats?.lastTouchedBySubject ?? subjects.map((s) => ({ subject: s, lastdate: null }))
    return raw
      .map((item) => ({ subject: item.subject, lastDate: item.lastdate }))
      .sort((a, b) => {
        if (!a.lastDate && !b.lastDate) return 0
        if (!a.lastDate) return 1
        if (!b.lastDate) return -1
        return a.lastDate < b.lastDate ? 1 : -1
      })
  }, [stats, subjects])

  const handlePrepareStats = async () => {
    if (statsCopying) return
    setStatsCopying(true)
    try {
      const ctx = await fetchGeminiContext(chartYear, chartMonth)
      const text = buildDashboardStatusText(ctx, todaySubjects, todayLog, todayString())
      setCopyText(text)
      setIsCopyModalOpen(true)
    } catch (e) {
      console.error(e)
    } finally {
      setStatsCopying(false)
    }
  }

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setStatsCopied(true)
      setTimeout(() => { setStatsCopied(false); setIsCopyModalOpen(false) }, 800)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-white min-h-screen text-n-text">
      <div className="max-w-[800px] mx-auto px-5 pt-10 pb-[120px]">
        {/* TODAY card */}
        {isInitialLoading ? (
          <div className="mb-6 rounded-xl border border-[rgba(55,53,47,0.06)] overflow-hidden">
            <div className="px-5 pt-4 pb-3 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
            <div className="px-5 py-3 bg-[rgba(55,53,47,0.02)] border-t border-[rgba(55,53,47,0.06)] flex justify-between">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <Link
            to={`/workspace/${todayString()}`}
            className="block mb-6 rounded-xl border border-[var(--nt-blue-border)] bg-white no-underline overflow-hidden transition-transform active:scale-[0.99]"
          >
            <div className="px-5 pt-4 pb-3">
              <div className="text-[10px] font-bold tracking-widest text-n-blue uppercase mb-3">
                TODAY &nbsp;·&nbsp; {todayString().replace(/-/g, '/')}
              </div>
              {todaySubjects.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {todaySubjects.map(({ subject, minutes }) => (
                    <div key={subject} className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-n-text">{subject}</span>
                      <span className="text-[14px] font-semibold text-[rgba(55,53,47,0.45)] tabular-nums">{formatDuration(minutes)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); navigate('/morning-bugfix') }}
                  className="flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3.5 py-2.5 cursor-pointer border"
                  style={{ color: '#19a576', backgroundColor: 'rgba(39,174,96,0.08)', borderColor: 'rgba(39,174,96,0.25)' }}
                >
                  MorningBugfix
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--nt-blue-bg)] border-t border-[var(--nt-blue-border)]">
              <span className="text-[15px] font-bold text-n-text tabular-nums">
                {todaySubjects.length > 0 ? formatDuration(todayLog!.totalMinutes) : '0m'}
              </span>
              <div className="flex items-center gap-1.5 text-n-blue text-[12px] font-semibold">
                <span>Open workspace</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* 前日未完了バナー */}
        {prevDayLog && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(242,171,38,0.3)] bg-[rgba(242,171,38,0.06)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f2ab26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#37352f] leading-none mb-0.5">Yesterday's log is not completed</p>
              <p className="text-[11px] text-[rgba(55,53,47,0.45)]">{prevDayLog.date} &nbsp;·&nbsp; {formatDuration(prevDayLog.totalMinutes)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/workspace/${prevDayLog.date}`} className="text-[11px] font-semibold text-[rgba(55,53,47,0.5)] border border-[rgba(55,53,47,0.15)] rounded-md px-2.5 py-1.5 no-underline hover:bg-[rgba(55,53,47,0.04)] transition-colors">Review</Link>
              <button onClick={handleCompletePrevDay} disabled={prevDayCompleting} className="text-[11px] font-semibold text-white bg-[#f2ab26] border-none rounded-md px-2.5 py-1.5 cursor-pointer disabled:opacity-50">
                {prevDayCompleting ? '...' : 'Mark done'}
              </button>
            </div>
          </div>
        )}

        {/* 演習の続き */}
        {practiceDrafts.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl border border-[var(--nt-blue-border)] bg-[var(--nt-blue-bg)]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-n-blue tracking-widest uppercase mb-2.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Practice sessions in progress
            </div>
            <div className="flex flex-col gap-2">
              {practiceDrafts.map(({ subject, draft }) => (
                <div key={subject} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white border border-[var(--nt-blue-border)]">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[14px] font-bold text-n-text truncate">{subject}</span>
                    <span className="text-[11px] text-[rgba(55,53,47,0.45)] font-medium">{draft.log.length} answered · up to Q{draft.currentIndex}</span>
                  </div>
                  <button className="shrink-0 px-3.5 py-1.5 rounded-md bg-n-blue text-white text-[12px] font-bold border-none cursor-pointer whitespace-nowrap" onClick={() => navigate(`/practice/${encodeURIComponent(subject)}`)}>
                    Resume →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アラート */}
        {showAlert && <div className="animate-pop"><AlertWidget alertItems={alertItems} /></div>}

        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-[rgba(55,53,47,0.06)] space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : (
            <>
              <StatCard label="All Total" value={formatDurationForDashboardStats(stats?.allTotalMinutes ?? 0)} sub={`${stats?.allTotalDays ?? 0}day`} />
              <StatCard label="Monthly" value={formatDurationForDashboardStats(stats?.thisMonthMinutes ?? 0)} sub={`${stats?.thisMonthDays ?? 0}day`} />
              <StatCard label="Streak" value={`${stats?.currentStreak ?? 0}day`} sub={`${formatDurationForDashboardStats(stats?.thisWeekTotalMinutes ?? 0)} / week`} />
            </>
          )}
        </div>

        {/* バーンダウンチャート */}
        <ChartSection year={chartYear} month={chartMonth} onNavigate={navigateMonth} />

        {/* 科目別ステータス */}
        {statsLoading ? (
          <div className="mb-10 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          </div>
        ) : (
          <SubjectStatus
            subjectTouched={subjectTouched}
            subjectMinutes={stats?.subjectMinutes ?? []}
            allSubjectMinutes={stats?.allSubjectMinutes ?? []}
            todaySubjectMinutes={todaySubjects}
            alertItems={alertItems}
          />
        )}

        {/* 指標コピー */}
        <div className="flex gap-2 mt-10 pt-8 border-t border-[var(--nt-border)]">
          <button
            onClick={handlePrepareStats}
            disabled={statsCopying || isInitialLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-[var(--nt-border)] bg-[rgba(55,53,47,0.03)] text-[rgba(55,53,47,0.5)] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
          >
            {statsCopied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              </svg>
            )}
            <span>{statsCopied ? 'Copied' : statsCopying ? 'Loading...' : 'Copy status'}</span>
          </button>
        </div>
      </div>

      {isCopyModalOpen && (
        <StatusCopyModal text={copyText} copied={statsCopied} onCopy={handleFinalCopy} onClose={() => setIsCopyModalOpen(false)} />
      )}
    </div>
  )
}
