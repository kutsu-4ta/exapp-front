import type {DailyLog} from "../../types/workspace";
import {formatDate, formatMinutes} from "../../types/workspace";

function IconCalendar() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(55,53,47,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    )
}

type Props = {
    log: DailyLog
    onComplete: () => void
    onUncomplete: () => void
    loading: boolean
}

export function DayHeader({ log, onComplete, onUncomplete, loading }: Props) {
    const subjectTotals = log.studySessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.subject] = (acc[s.subject] ?? 0) + s.minutes
        return acc
    }, {})

    const subjectSummary = Object.entries(subjectTotals)
        .map(([subj, mins]) => `${subj.split('・')[0]} ${formatMinutes(mins)}`)
        .join('  ·  ')

    return (
        <div style={headerContainer}>
            <div style={titleRow}>
                <IconCalendar />
                <h1 style={titleText}>{formatDate(log.date)}</h1>
                <div style={completeArea}>
                    {log.isCompleted ? (
                        <>
                            <span style={statusBadge}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Completed
                            </span>
                            <button style={reopenBtn} onClick={onUncomplete} disabled={loading}>
                                Reopen
                            </button>
                        </>
                    ) : (
                        <button style={completeBtn} onClick={onComplete} disabled={loading}>
                            Complete
                        </button>
                    )}
                </div>
            </div>

            <div style={metaRow}>
                <div style={statsGroup}>
                    <div style={mainStat}>
                        <span style={labelStyle}>Total time</span>
                        <span style={valueStyle}>{formatMinutes(log.totalMinutes)}</span>
                    </div>
                    {subjectSummary && (
                        <div style={subStat}>{subjectSummary}</div>
                    )}
                </div>
            </div>
        </div>
    )
}

const headerContainer: React.CSSProperties = { marginBottom: '2.5rem' }

const titleRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
}

const titleText: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#37352f',
    margin: 0,
    letterSpacing: '-0.01em',
    flex: 1,
}

const completeArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }

const statusBadge: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    backgroundColor: 'rgba(35, 131, 226, 0.07)',
    color: '#2383e2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
}

const completeBtn: React.CSSProperties = {
    padding: '5px 14px',
    backgroundColor: '#2383e2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
}

const reopenBtn: React.CSSProperties = {
    padding: '5px 14px',
    backgroundColor: 'transparent',
    color: 'rgba(55, 53, 47, 0.45)',
    border: '1px solid rgba(55, 53, 47, 0.16)',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
}

const metaRow: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
}

const mainStat: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }

const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(55, 53, 47, 0.45)',
    width: '80px',
    flexShrink: 0,
}

const valueStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: '#37352f' }

const subStat: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(55, 53, 47, 0.45)',
    paddingLeft: '92px',
}

const statsGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
