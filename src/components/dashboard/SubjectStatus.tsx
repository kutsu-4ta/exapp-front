import {useState} from 'react'
import {daysAgo, formatHours} from '../../types/workspace'
import {useNavigate} from 'react-router-dom'

type SubjectEntry = { subject: string; lastDate: string | null }
type ViewMode = 'status' | 'time'
type Period = 'all' | 'month' | 'today'

type MinuteEntry = { subject: string; minutes: number }

type Props = {
  subjectTouched: SubjectEntry[]
  subjectMinutes: MinuteEntry[]
  allSubjectMinutes?: MinuteEntry[]
  todaySubjectMinutes?: MinuteEntry[]
}

export function SubjectStatus({
  subjectTouched,
  subjectMinutes,
  allSubjectMinutes = [],
  todaySubjectMinutes = [],
}: Props) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<ViewMode>('status')
  const [period, setPeriod] = useState<Period>('all')

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
            最終学習
          </ToggleBtn>
          <ToggleBtn active={mode === 'time'} onClick={() => setMode('time')}>
            学習時間
          </ToggleBtn>
        </div>
      </div>

      {mode === 'time' && (
        <div className="flex justify-end gap-1 mb-2">
          <PeriodBtn active={period === 'all'} onClick={() => setPeriod('all')}>
            全期間
          </PeriodBtn>
          <PeriodBtn active={period === 'month'} onClick={() => setPeriod('month')}>
            今月
          </PeriodBtn>
          <PeriodBtn active={period === 'today'} onClick={() => setPeriod('today')}>
            今日
          </PeriodBtn>
        </div>
      )}

      <div className="flex flex-col">
        {mode === 'status' &&
          subjectTouched.map((entry) => {
            const label = getStatusLabel(entry.lastDate)
            return (
              <div
                key={entry.subject}
                className="flex items-center justify-between min-h-[44px] w-full px-1 py-1.5 border-b border-[var(--nt-border-xs)]"
              >
                <button
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left bg-transparent border-none cursor-pointer py-0.5 rounded hover:bg-[var(--nt-hover)] transition-colors"
                  onClick={() => navigate(`/subjects/${encodeURIComponent(entry.subject)}`)}
                >
                  <BookIcon />
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
            return (
              <div
                key={entry.subject}
                className="flex items-center min-h-[44px] w-full px-1 py-1.5 border-b border-[var(--nt-border-xs)] gap-3"
              >
                <button
                  className="text-[13px] font-medium text-n-text shrink-0 w-[72px] truncate text-left bg-transparent border-none cursor-pointer hover:underline"
                  onClick={() => navigate(`/subjects/${encodeURIComponent(entry.subject)}`)}
                >
                  {entry.subject}
                </button>
                <div className="flex-1 h-[5px] bg-[rgba(55,53,47,0.07)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-n-blue rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className="text-[12px] font-semibold tabular-nums shrink-0"
                  style={{ color: 'rgba(55,53,47,0.45)', minWidth: '44px', textAlign: 'right' }}
                >
                  {formatHours(minutes)}
                </span>
                <PracticeBtn subject={entry.subject} navigate={navigate} />
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
    return { text: '未学習', color: '#7c7168', bg: 'rgba(55,53,47,0.07)' }
  }
  const n = daysAgo(lastDate)
  if (n === 0) return { text: '今日', color: '#19a576', bg: 'rgba(45,106,31,0.10)' }
  if (n === 1) return { text: '昨日', color: '#f2ab26', bg: 'rgba(242,171,38,0.12)' }
  if (n <= 6) return { text: `${n}日前`, color: '#f2ab26', bg: 'rgba(242,171,38,0.10)' }
  return { text: `${n}日前`, color: '#eb5757', bg: 'rgba(235,87,87,0.10)' }
}

function BookIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--nt-text-faint)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
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
      title="演習を開始"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21" />
      </svg>
      演習
    </button>
  )
}
