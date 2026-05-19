import {fetchSprints, fetchTickets} from './sprint'
import type {StudyTicket} from '../../types/sprint'
import {PRIORITY_LABEL, TICKET_TYPE_LABEL} from '../../types/sprint'

export async function fetchSprintAiContext(): Promise<string> {
  const [sprints, allTickets] = await Promise.all([fetchSprints(), fetchTickets()])

  const lines: string[] = []
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  lines.push(`# スプリント管理データ（生成: ${today}）`)
  lines.push('')

  // ── 進行中スプリント ──────────────────────────────────────
  const activeSprints = sprints.filter((s) => s.type !== 'backlog' && s.status !== 'completed')
  for (const sprint of activeSprints) {
    const tickets = allTickets.filter((t) => t.sprintId === sprint.id)
    lines.push(`## スプリント: ${sprint.name}`)
    if (sprint.goal) lines.push(`目標: ${sprint.goal}`)
    if (sprint.startDate) lines.push(`期間: ${sprint.startDate} 〜 ${sprint.endDate ?? '?'}`)
    lines.push('')

    for (const [status, label] of [
      ['doing', 'DOING（作業中）'],
      ['todo', 'TODO（未着手）'],
      ['done', 'DONE（完了）'],
    ] as const) {
      const group = tickets.filter((t) => t.status === status)
      if (group.length === 0) continue
      lines.push(`### ${label} — ${group.length}件`)
      group.forEach((t) => appendTicket(t, lines))
      lines.push('')
    }
  }

  // ── バックログ ────────────────────────────────────────────
  const backlogSprint = sprints.find((s) => s.type === 'backlog')
  if (backlogSprint) {
    const backlog = allTickets.filter((t) => t.sprintId === backlogSprint.id)
    lines.push(`## バックログ — ${backlog.length}件`)
    if (backlog.length === 0) {
      lines.push('（なし）')
    } else {
      const sorted = [...backlog].sort((a, b) => {
        const ord = { high: 0, medium: 1, low: 2 }
        return ord[a.priority] - ord[b.priority]
      })
      sorted.forEach((t) => appendTicket(t, lines))
    }
    lines.push('')
  }

  // ── 完了済みスプリント（直近3件のサマリーのみ） ──────────
  const completed = sprints
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 3)
  if (completed.length > 0) {
    lines.push('## 完了済みスプリント（直近）')
    completed.forEach((s) => {
      const tickets = allTickets.filter((t) => t.sprintId === s.id)
      const done = tickets.filter((t) => t.status === 'done').length
      lines.push(`- ${s.name}（完了: ${s.completedAt?.slice(0, 10) ?? '?'} / チケット完了: ${done}/${tickets.length}件）`)
      if (s.retrospective) lines.push(`  振り返り: ${s.retrospective.slice(0, 80)}${s.retrospective.length > 80 ? '…' : ''}`)
    })
    lines.push('')
  }
  return lines.join('\n')
}

function appendTicket(t: StudyTicket, lines: string[]): void {
  const prio = PRIORITY_LABEL[t.priority]
  const type = TICKET_TYPE_LABEL[t.ticketType]
  const cats = t.subCategories.map((c) => c.name).join(', ')
  lines.push(`- ${prio} [${t.subject}] ${t.title}`)
  lines.push(`  種別: ${type} | 期日: ${t.dueDate}${cats ? ` | 分野: ${cats}` : ''}`)
  if (t.acceptanceCriteria) lines.push(`  完了条件: ${t.acceptanceCriteria}`)
}
