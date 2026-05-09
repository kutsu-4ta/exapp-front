import { useState } from 'react'
import { daysAgo, formatHours } from '../../types/workspace'
import { useNavigate } from 'react-router-dom'

type SubjectEntry = { subject: string; lastDate: string | null }
type ViewMode = 'status' | 'time'

type Props = {
    subjectTouched: SubjectEntry[]
    subjectMinutes: { subject: string; minutes: number }[]
}

export function SubjectStatus({ subjectTouched, subjectMinutes }: Props) {
    const navigate = useNavigate()
    const [mode, setMode] = useState<ViewMode>('status')

    const minuteMap = Object.fromEntries(subjectMinutes.map(s => [s.subject, s.minutes]))
    const maxMinutes = Math.max(...subjectTouched.map(e => minuteMap[e.subject] ?? 0), 1)

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
                    <ToggleBtn active={mode === 'status'} onClick={() => setMode('status')}>最終学習</ToggleBtn>
                    <ToggleBtn active={mode === 'time'} onClick={() => setMode('time')}>学習時間</ToggleBtn>
                </div>
            </div>

            <div className="flex flex-col">
                {mode === 'status' && subjectTouched.map((entry) => {
                    const label = getStatusLabel(entry.lastDate)
                    return (
                        <button
                            key={entry.subject}
                            className="flex items-center justify-between min-h-[44px] w-full px-1 py-2 border-b border-[var(--nt-border-xs)] cursor-pointer hover:bg-[var(--nt-hover)] active:bg-[var(--nt-pressed)] transition-colors rounded text-left bg-transparent"
                            onClick={() => navigate(`/practice/${encodeURIComponent(entry.subject)}`)}
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <BookIcon />
                                <span className="text-[14px] font-medium text-n-text truncate leading-none">
                                    {entry.subject}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-3 shrink-0">
                                <StatusBadge label={label} />
                                <ChevronIcon />
                            </div>
                        </button>
                    )
                })}

                {mode === 'time' && timeRows.map((entry) => {
                    const minutes = minuteMap[entry.subject] ?? 0
                    const pct = Math.round((minutes / maxMinutes) * 100)
                    return (
                        <button
                            key={entry.subject}
                            className="flex items-center min-h-[44px] w-full px-1 py-2 border-b border-[var(--nt-border-xs)] cursor-pointer hover:bg-[var(--nt-hover)] active:bg-[var(--nt-pressed)] transition-colors rounded text-left bg-transparent gap-3"
                            onClick={() => navigate(`/practice/${encodeURIComponent(entry.subject)}`)}
                        >
                            <span className="text-[13px] font-medium text-n-text shrink-0 w-[72px] truncate">
                                {entry.subject}
                            </span>
                            <div className="flex-1 h-[5px] bg-[rgba(55,53,47,0.07)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-n-blue rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-[12px] font-semibold tabular-nums shrink-0"
                                style={{ color: 'rgba(55,53,47,0.45)', minWidth: '44px', textAlign: 'right' }}>
                                {formatHours(minutes)}
                            </span>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
    if (n === 0) return { text: '今日',     color: '#19a576', bg: 'rgba(45,106,31,0.10)' }
    if (n === 1) return { text: '昨日',     color: '#f2ab26', bg: 'rgba(242,171,38,0.12)' }
    if (n <= 6)  return { text: `${n}日前`, color: '#f2ab26', bg: 'rgba(242,171,38,0.10)' }
    return             { text: `${n}日前`, color: '#eb5757', bg: 'rgba(235,87,87,0.10)' }
}

function BookIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--nt-text-faint)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0"
        >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    )
}

function ChevronIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="var(--nt-text-faint)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}
