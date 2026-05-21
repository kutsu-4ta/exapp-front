import type {ChartDataPoint, DailyLog, DailyLogSummary} from '../types/workspace'
import {daysAgo, formatHours} from '../types/workspace'
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
  const lines = ['【学習状況サマリー】']
  lines.push(`累計: ${formatHours(d.allTotalMinutes)} (${d.allTotalDays}日)`)
  lines.push(`今月: ${formatHours(d.thisMonthMinutes)} (${d.thisMonthDays}日)`)
  lines.push(`連続: ${d.currentStreak}日`)
  lines.push(`今週: ${formatHours(d.thisWeekTotalMinutes)}`)
  lines.push('')
  const p = ctx.profile
  if (p.occupation || p.goal || p.weakAreas || p.strongAreas) {
    lines.push('【プロフィール】')
    if (p.occupation) lines.push(`  職業: ${p.occupation}`)
    if (p.goal) lines.push(`  学習目標: ${p.goal}`)
    if (p.weakAreas) lines.push(`  苦手分野: ${p.weakAreas}`)
    if (p.strongAreas) lines.push(`  得意分野: ${p.strongAreas}`)
    lines.push('')
  }
  lines.push(`【本日 ${todayStr.replace(/-/g, '/')}】`)
  if (todaySubjects.length > 0) {
    lines.push(`合計: ${todayLog!.totalMinutes}分`)
    todaySubjects.forEach(({ subject, minutes }) => lines.push(`・${subject}: ${minutes}分`))
  } else {
    lines.push('まだ学習していません')
  }
  lines.push('')
  if (ctx.recentDailyLogs.length > 0) {
    lines.push('【直近7日間】')
    ctx.recentDailyLogs.forEach((log) => {
      const label = `${log.date.replace(/-/g, '/')}: ${log.studyMinutes}分`
      lines.push(log.reflection ? `  ${label} — ${log.reflection}` : `  ${label}`)
    })
    lines.push('')
  }
  lines.push(`【科目別詳細 (${ctx.year}年${ctx.month}月)】`)
  for (const s of ctx.subjects) {
    lines.push(`■ ${s.subject}`)
    if (s.finalTarget) lines.push(`  最終目標: ${s.finalTarget}`)
    if (s.monthlyGoal) lines.push(`  今月の目標: ${s.monthlyGoal}`)
    lines.push(`  学習時間: ${formatHours(s.studyMinutes)}`)
    lines.push(`  問題数: ${s.problemCount}問`)
    const lastDate = d.lastTouchedBySubject.find((e) => e.subject === s.subject)?.lastdate ?? null
    lines.push(lastDate ? `  最終学習: ${lastDate.replace(/-/g, '/')} (${daysAgo(lastDate)}日前)` : `  最終学習: 未学習`)

    if (s.recentExamScore) {
      const { examYear, score, completedAt } = s.recentExamScore
      const dateStr = completedAt ? ` (${completedAt.replace(/-/g, '/')})` : ''
      lines.push(`  直近過去問: ${examYear}年度 ${score}点${dateStr}`)
    }
  }
  lines.push('')
  return lines.join('\n')
}
