import type {ChartDataPoint, DailyLog, DailyLogSummary} from '../types/workspace'
import {daysSince, formatDuration} from '../types/workspace'
import type {fetchGeminiContext} from './api/gemini'

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
  ctx: Awaited<ReturnType<typeof fetchGeminiContext>>,
  todaySubjects: Array<{ subject: string; minutes: number }>,
  todayLog: DailyLog | null,
  todayStr: string
): string {
  const d = ctx.dashboard
  const lines = ['[Study Summary]']
  lines.push(`Total: ${formatDuration(d.allTotalMinutes)} (${d.allTotalDays}日)`)
  lines.push(`This Month: ${formatDuration(d.thisMonthMinutes)} (${d.thisMonthDays}日)`)
  lines.push(`Streak: ${d.currentStreak}日`)
  lines.push(`This Week: ${formatDuration(d.thisWeekTotalMinutes)}`)
  lines.push('')
  const p = ctx.profile
  if (p.occupation || p.goal || p.weakAreas || p.strongAreas) {
    lines.push('[Profile]')
    if (p.occupation) lines.push(`  Occupation: ${p.occupation}`)
    if (p.goal) lines.push(`  Goal: ${p.goal}`)
    if (p.weakAreas) lines.push(`  Weak Areas: ${p.weakAreas}`)
    if (p.strongAreas) lines.push(`  Strong Areas: ${p.strongAreas}`)
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
  if (ctx.recentDailyLogs.length > 0) {
    lines.push('[Last 7 Days]')
    ctx.recentDailyLogs.forEach((log) => {
      const label = `${log.date}: ${formatDuration(log.studyMinutes)}`
      lines.push(log.reflection ? `  ${label} — ${log.reflection}` : `  ${label}`)
    })
    lines.push('')
  }
  lines.push(`[Subject Details (${ctx.year}/${String(ctx.month).padStart(2, '0')})]`)
  for (const s of ctx.subjects) {
    lines.push(`■ ${s.subject}`)
    if (s.finalTarget) lines.push(`  Final Target: ${s.finalTarget}`)
    if (s.monthlyGoal) lines.push(`  Monthly Goal: ${s.monthlyGoal}`)
    lines.push(`  Study Time: ${formatDuration(s.studyMinutes)}`)
    lines.push(`  Problems: ${s.problemCount}`)
    const lastDate = d.lastTouchedBySubject.find((e) => e.subject === s.subject)?.lastdate ?? null
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
