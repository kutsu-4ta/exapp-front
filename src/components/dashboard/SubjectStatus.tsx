import {useState} from 'react'
import type {AlertStatusItem} from '../../types/workspace'
import {daysSince, formatDuration} from '../../types/workspace'
import {useNavigate} from 'react-router-dom'
import {useSettingsStore} from '@/lib/store/settings'
import {subjectPalette} from '@/styles/subjectUI'

type SubjectEntry = { subject: string; lastDate: string | null }
type ViewMode = 'status' | 'time'
type Period = 'all' | 'month' | 'today'

type MinuteEntry = { subject: string; minutes: number }

type Props = {
  subjectTouched: SubjectEntry[]
  subjectMinutes: MinuteEntry[]
  allSubjectMinutes?: MinuteEntry[]
  todaySubjectMinutes?: MinuteEntry[]
  alertItems?: AlertStatusItem[]
}

function formatDiff(diffMinutes: number): string {
  const abs = Math.abs(diffMinutes)
  const sign = diffMinutes >= 0 ? '+' : '−'
  if (abs >= 60) {
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return m === 0 ? `${sign}${h}h` : `${sign}${h}h${m}m`
  }
  return `${sign}${abs}m`
}

export function SubjectStatus({
  subjectTouched,
  subjectMinutes,
  allSubjectMinutes = [],
  todaySubjectMinutes = [],
  alertItems = [],
}: Props) {
  const navigate = useNavigate()
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const [mode, setMode] = useState<ViewMode>('status')
  const [period, setPeriod] = useState<Period>('all')

  const alertMap = Object.fromEntries(alertItems.map((a) => [a.subject, a]))

  const currentMinutes =
    period === 'all' ? allSubjectMinutes : period === 'month' ? subjectMinutes : todaySubjectMinutes

  const minuteMap = Object.fromEntries(currentMinutes.map((s) => [s.subject, s.minutes]))
  const maxMinutes = Math.max(...subjectTouched.map((e) => minuteMap[e.subject] ?? 0), 1)

  const timeRows = [...subjectTouched].sort(
    (a, b) => (minuteMap[b.subject] ?? 0) - (minuteMap[a.subject] ?? 0)
  )

  return (
    <section className="mb-12">
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--nt-text-hint)] tracking-[0.05em] uppercase">
          <span className="text-[8px]">▼</span>
          SUBJECT STATUS
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ToggleBtn active={mode === 'status'} onClick={() => setMode('status')}>
            Last Study
          </ToggleBtn>
          <ToggleBtn active={mode === 'time'} onClick={() => setMode('time')}>
            Study Time
          </ToggleBtn>
        </div>
      </div>

      {mode === 'time' && (
        <div className="flex justify-end gap-1 mb-2">
          <PeriodBtn active={period === 'all'} onClick={() => setPeriod('all')}>
            All Time
          </PeriodBtn>
          <PeriodBtn active={period === 'month'} onClick={() => setPeriod('month')}>
            This Month
          </PeriodBtn>
          <PeriodBtn active={period === 'today'} onClick={() => setPeriod('today')}>
            Today
          </PeriodBtn>
        </div>
      )}

      <div className="flex flex-col">
        {mode === 'status' &&
          subjectTouched.map((entry) => {
            const label = getStatusLabel(entry.lastDate)
            const palette = subjectPalette(entry.subject, subjectColors[entry.subject])
            return (
              <div
                key={entry.subject}
                className="flex items-center justify-between min-h-[44px] w-full px-1 py-1.5 border-b border-[var(--nt-border-xs)]"
              >
                <button
                  className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-none cursor-pointer py-0.5 rounded hover:bg-[var(--nt-hover)] transition-colors"
                  onClick={() => navigate(`/subjects/${encodeURIComponent(entry.subject)}`)}
                >
                  <span className="shrink-0 text-[18px] leading-none" style={{ color: palette.color }}>▌</span>
                  <span className="text-[14px] font-medium text-n-text truncate leading-none">
                    {entry.subject}
                  </span>
                </button>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <StatusBadge label={label} />
                  <PracticeBtn subject={entry.subject} navigate={navigate} />
                </div>
              </div>
            )
          })}

        {mode === 'time' &&
          timeRows.map((entry) => {
            const minutes = minuteMap[entry.subject] ?? 0
            const pct = Math.round((minutes / maxMinutes) * 100)

            const alert = alertMap[entry.subject]
            const alertEnabled = alert?.settings.minutesAlertEnabled ?? false
            const threshold = alert?.settings.minutesThreshold ?? 0
            const thresholdDays = alert?.settings.minutesThresholdDays ?? 7
            const recentMinutes = alert?.recentMinutes ?? 0
            const diff = recentMinutes - threshold
            const isBelow = alertEnabled && diff < 0

            const palette = subjectPalette(entry.subject, subjectColors[entry.subject])
            // when alertEnabled: semantic red/green for status feedback
            // when !alertEnabled: neutral — bar shows quantity not identity (▌ already shows subject color)
            const barColor = alertEnabled
              ? isBelow ? '#eb5757' : '#19a576'
              : 'rgba(55,53,47,0.22)'
            const timeColor = alertEnabled
              ? isBelow ? '#eb5757' : '#19a576'
              : 'rgba(55,53,47,0.45)'

            return (
              <div
                key={entry.subject}
                className="flex items-center min-h-[44px] w-full px-1 py-1.5 border-b border-[var(--nt-border-xs)] gap-3"
              >
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-n-text shrink-0 w-[84px] truncate text-left bg-transparent border-none cursor-pointer hover:underline"
                  onClick={() => navigate(`/subjects/${encodeURIComponent(entry.subject)}`)}
                >
                  <span className="shrink-0 text-[16px] leading-none" style={{ color: palette.color }}>▌</span>
                  <span className="truncate">{entry.subject}</span>
                </button>
                <div className="flex-1 h-[5px] bg-[rgba(55,53,47,0.07)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="shrink-0 text-right" style={{ minWidth: '44px' }}>
                  <div
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color: timeColor }}
                  >
                    {formatDuration(minutes)}
                  </div>
                  {alertEnabled && (
                    <div
                      className="text-[9px] font-medium tabular-nums"
                      style={{ color: 'rgba(55,53,47,0.3)' }}
                    >
                      Goal {threshold}m/{thresholdDays}d
                    </div>
                  )}
                </div>
                {alertEnabled ? (
                  <span
                    className="text-[11px] font-bold shrink-0 tabular-nums"
                    style={{ color: isBelow ? '#eb5757' : '#19a576', minWidth: '40px', textAlign: 'right' }}
                  >
                    {formatDiff(diff)}
                  </span>
                ) : (
                  <span style={{ minWidth: '40px' }} />
                )}
                {/*<PracticeBtn subject={entry.subject} navigate={navigate} />*/}
              </div>
            )
          })}
      </div>
    </section>
  )
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? 'rgba(55,53,47,0.08)' : 'transparent',
        color: active ? '#37352f' : 'rgba(55,53,47,0.4)',
        borderColor: active ? 'rgba(55,53,47,0.15)' : 'rgba(55,53,47,0.1)',
      }}
    >
      {children}
    </button>
  )
}

function PeriodBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? '#2383e2' : 'transparent',
        color: active ? '#fff' : 'rgba(55,53,47,0.4)',
        borderColor: active ? '#2383e2' : 'rgba(55,53,47,0.1)',
      }}
    >
      {children}
    </button>
  )
}

function StatusBadge({ label }: { label: ReturnType<typeof getStatusLabel> }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium whitespace-nowrap leading-none"
      style={{ color: label.color, backgroundColor: label.bg }}
    >
      {label.text}
    </span>
  )
}

function getStatusLabel(lastDate: string | null) {
  if (!lastDate) {
    return { text: 'Not studied', color: '#7c7168', bg: 'rgba(55,53,47,0.07)' }
  }
  const n = daysSince(lastDate)
  if (n === 0) return { text: 'Today', color: '#19a576', bg: 'rgba(45,106,31,0.10)' }
  if (n === 1) return { text: 'Yesterday', color: '#f2ab26', bg: 'rgba(242,171,38,0.12)' }
  if (n <= 6) return { text: `${n}d ago`, color: '#f2ab26', bg: 'rgba(242,171,38,0.10)' }
  return { text: `${n}d ago`, color: '#eb5757', bg: 'rgba(235,87,87,0.10)' }
}


function PracticeBtn({
  subject,
  navigate,
}: {
  subject: string
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <button
      onClick={() => navigate(`/practice/${encodeURIComponent(subject)}`)}
      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors hover:bg-[var(--nt-hover)]"
      style={{
        color: 'rgba(55,53,47,0.5)',
        borderColor: 'rgba(55,53,47,0.12)',
        backgroundColor: 'transparent',
      }}
      title="Start practice"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21" />
      </svg>
      Practice
    </button>
  )
}
