'use client'

import { daysAgo } from '@/types/workspace'

type SubjectEntry = { subject: string; lastDate: string | null }

type Props = {
    subjectTouched: SubjectEntry[]
}

export function SubjectStatus({ subjectTouched }: Props) {
    return (
        <section style={section}>
            <div style={sectionLabel}><span style={triangle}>▼</span> SUBJECT STATUS</div>
            <div style={listContainer}>
                {subjectTouched.map(({ subject, lastDate }) => {
                    const { text, color, bg } = lastTouchedLabel(lastDate)
                    return (
                        <div key={subject} style={rowItem}>
                            <div style={subjectNameGroup}>
                                <span style={subjectIcon}>📔</span>
                                <span style={subjectText}>{subject}</span>
                            </div>
                            <span style={{ ...statusTag, color, backgroundColor: bg }}>
                                {text}
                            </span>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function lastTouchedLabel(lastDate: string | null): { text: string; color: string; bg: string } {
    if (!lastDate) return { text: '未学習', color: '#8a7b6e', bg: 'rgba(55, 53, 47, 0.08)' }
    const n = daysAgo(lastDate)
    if (n === 0) return { text: '今日', color: '#3a7a2a', bg: 'rgba(58, 122, 42, 0.1)' }
    if (n === 1) return { text: '昨日', color: '#5c3a1e', bg: 'rgba(92, 58, 30, 0.1)' }
    if (n <= 6) return { text: `${n}日前`, color: '#c8860a', bg: 'rgba(200, 134, 10, 0.1)' }
    return { text: `${n}日前`, color: '#eb5757', bg: 'rgba(235, 87, 87, 0.1)' }
}

const section: React.CSSProperties = { marginBottom: '48px' }

const sectionLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    letterSpacing: '0.05em',
    marginBottom: '12px',
}

const triangle: React.CSSProperties = { fontSize: '8px' }

const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }

const rowItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 4px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.04)',
}

const subjectNameGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' }
const subjectIcon: React.CSSProperties = { fontSize: '16px' }
const subjectText: React.CSSProperties = { fontSize: '14px', fontWeight: 500 }
const statusTag: React.CSSProperties = { padding: '2px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500 }
