import type {ChartDataPoint, DailyLog, DailyLogSummary, DashboardStats, SubjectsSummary} from '../types/workspace'
import {daysSince, formatDuration} from '../types/workspace'
import type {UserProfile} from './api/profile'

export function buildChartData(
  year: number,
  month: number,
  logs: DailyLogSummary[],
  targetMin: number,
  targetMax: number,
  todayStr: string
): ChartDataPoint[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const logsByDate: Record<string, number> = {}
  for (const log of logs) logsByDate[log.date] = log.totalMinutes

  let cumulative = 0
  const chartPoints: ChartDataPoint[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const isFuture = dateStr > todayStr
    if (!isFuture) cumulative += logsByDate[dateStr] ?? 0
    return {
      day: dayNum,
      date: dateStr,
      actual: isFuture ? undefined : Number((cumulative / 60).toFixed(1)),
      range: [
        Number(((targetMin / daysInMonth) * dayNum).toFixed(1)),
        Number(((targetMax / daysInMonth) * dayNum).toFixed(1)),
      ] as [number, number],
    }
  })

  const elapsedDays = chartPoints.filter((p) => p.date <= todayStr).length
  const avgPerDay = cumulative / (elapsedDays || 1)
  let forecast = cumulative
  return chartPoints.map((p) => {
    if (p.date > todayStr) {
      forecast += avgPerDay
      return { ...p, forecast: Number((forecast / 60).toFixed(1)) }
    }
    return p.date === todayStr ? { ...p, forecast: p.actual } : p
  })
}

export function buildDashboardStatusText(
  summary: SubjectsSummary,
  profile: UserProfile,
  recentLogs: DailyLogSummary[],
  stats: DashboardStats,
  todaySubjects: Array<{ subject: string; minutes: number }>,
  todayLog: DailyLog | null,
  todayStr: string
): string {
  const lines = ['[Study Summary]']
  lines.push(`Total: ${formatDuration(stats.allTotalMinutes)} (${stats.allTotalDays}日)`)
  lines.push(`This Month: ${formatDuration(stats.thisMonthMinutes)} (${stats.thisMonthDays}日)`)
  lines.push(`Streak: ${stats.currentStreak}日`)
  lines.push(`This Week: ${formatDuration(stats.thisWeekTotalMinutes)}`)
  lines.push('')
  if (profile.occupation || profile.goal || profile.weakAreas || profile.strongAreas) {
    lines.push('[Profile]')
    if (profile.occupation) lines.push(`  Occupation: ${profile.occupation}`)
    if (profile.goal) lines.push(`  Goal: ${profile.goal}`)
    if (profile.weakAreas) lines.push(`  Weak Areas: ${profile.weakAreas}`)
    if (profile.strongAreas) lines.push(`  Strong Areas: ${profile.strongAreas}`)
    lines.push('')
  }
  lines.push(`[Today ${todayStr}]`)
  if (todaySubjects.length > 0) {
    lines.push(`Total: ${formatDuration(todayLog!.totalMinutes)}`)
    todaySubjects.forEach(({ subject, minutes }) => lines.push(`- ${subject}: ${formatDuration(minutes)}`))
  } else {
    lines.push('No study recorded yet')
  }
  lines.push('')
  if (recentLogs.length > 0) {
    lines.push('[Last 7 Days]')
    recentLogs.forEach((log) => {
      const label = `${log.date}: ${formatDuration(log.totalMinutes)}`
      lines.push(log.reflection ? `  ${label} — ${log.reflection}` : `  ${label}`)
    })
    lines.push('')
  }
  lines.push(`[Subject Details (${summary.year}/${String(summary.month).padStart(2, '0')})]`)
  for (const s of summary.subjects) {
    lines.push(`■ ${s.subject}`)
    if (s.finalTarget) lines.push(`  Final Target: ${s.finalTarget}`)
    if (s.monthlyGoal) lines.push(`  Monthly Goal: ${s.monthlyGoal}`)
    lines.push(`  Study Time: ${formatDuration(s.studyMinutes)}`)
    lines.push(`  Problems: ${s.problemCount}`)
    const lastDate = stats.lastTouchedBySubject.find((e) => e.subject === s.subject)?.lastdate ?? null
    lines.push(lastDate ? `  Last Study: ${lastDate} (${daysSince(lastDate)}日前)` : `  Last Study: Not studied`)
    if (s.recentExamScore) {
      const { examYear, score, completedAt, rankStats } = s.recentExamScore
      const dateStr = completedAt ? ` (${completedAt})` : ''
      lines.push(`  Recent Exam: ${examYear} ${score}pts${dateStr}`)
      if (rankStats.length > 0) {
        const rankLine = rankStats
          .map((r) => `${r.rank}:${Math.round(r.correctRate * 100)}%(${r.count})`)
          .join(' ')
        lines.push(`  By Rank: ${rankLine}`)
      }
    }
  }
  lines.push('')
  return lines.join('\n')
}
