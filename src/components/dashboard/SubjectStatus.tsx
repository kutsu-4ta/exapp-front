import { daysAgo } from '../../types/workspace'
import { useNavigate } from 'react-router-dom'

type SubjectEntry = { subject: string; lastDate: string | null }

type Props = {
    subjectTouched: SubjectEntry[]
}

export function SubjectStatus({ subjectTouched }: Props) {
    const navigate = useNavigate()

    return (
        <section className="mb-12">
            <SectionLabel>SUBJECT STATUS</SectionLabel>
            <div className="flex flex-col">
                {subjectTouched.map((entry) => {
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
            </div>
        </section>
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
    if (n === 0) return { text: '今日',   color: '#2d6a1f', bg: 'rgba(45,106,31,0.10)' }
    if (n === 1) return { text: '昨日',   color: '#5c3a1e', bg: 'rgba(92,58,30,0.10)' }
    if (n <= 6)  return { text: `${n}日前`, color: '#a16207', bg: 'rgba(161,98,7,0.10)' }
    return             { text: `${n}日前`, color: '#b91c1c', bg: 'rgba(185,28,28,0.10)' }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--nt-text-hint)] tracking-[0.05em] mb-3 uppercase">
            <span className="text-[8px]">▼</span>
            {children}
        </div>
    )
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
