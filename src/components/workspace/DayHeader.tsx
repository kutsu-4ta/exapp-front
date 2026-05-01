import type {DailyLog} from "../../types/workspace";
import {formatDate, formatMinutes} from "../../types/workspace";

function IconCalendar() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(55,53,47,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    )
}

type Props = {
    log: DailyLog
}

export function DayHeader({ log }: Props) {
    const subjectTotals = log.studySessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.subject] = (acc[s.subject] ?? 0) + s.minutes
        return acc
    }, {})

    return (
        <div style={headerContainer}>
            <div style={titleRow}>
                <div style={titleGroup}>
                    <IconCalendar />
                    <h1 style={titleText}>{formatDate(log.date)}</h1>
                </div>
                <div style={log.isCompleted ? statusBadgeCompleted : statusBadgeOpen}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {log.isCompleted ? 'Completed' : 'Open'}
                </div>
            </div>

            <div style={metaRow}>
                <div style={mainStat}>
                    <span style={labelStyle}>Total time</span>
                    <span style={valueStyle}>{formatMinutes(log.totalMinutes)}</span>
                </div>

                {Object.keys(subjectTotals).length > 0 && (
                    <div style={subjectGrid}>
                        {Object.entries(subjectTotals).map(([subj, mins]) => (
                            <div key={subj} style={subjectTag}>
                                <span style={subjectName}>{subj.split('・')[0]}</span>
                                <span style={subjectTime}>{formatMinutes(mins)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Styles
const headerContainer: React.CSSProperties = {
    marginBottom: '32px',
    paddingTop: '4px'
}

const titleRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '12px',
}

const titleGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}

const titleText: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#37352f',
    margin: 0,
    letterSpacing: '-0.02em',
}

const statusBadgeBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
}

const statusBadgeCompleted: React.CSSProperties = {
    ...statusBadgeBase,
    backgroundColor: 'rgba(35, 131, 226, 0.1)',
    color: '#2383e2',
}

const statusBadgeOpen: React.CSSProperties = {
    ...statusBadgeBase,
    backgroundColor: 'rgba(55, 53, 47, 0.08)',
    color: 'rgba(55, 53, 47, 0.5)',
}

const metaRow: React.CSSProperties = {
    padding: '16px 0',
    borderTop: '1px solid rgba(55, 53, 47, 0.08)',
    borderBottom: '1px solid rgba(55, 53, 47, 0.08)',
}

const mainStat: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '12px'
}

const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(55, 53, 47, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    width: '85px',
}

const valueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#37352f',
    fontVariantNumeric: 'tabular-nums'
}

const subjectGrid: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingLeft: '0',
}

const subjectTag: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    backgroundColor: 'rgba(55, 53, 47, 0.04)',
    borderRadius: '4px',
    fontSize: '13px',
}

const subjectName: React.CSSProperties = {
    color: 'rgba(55, 53, 47, 0.6)',
}

const subjectTime: React.CSSProperties = {
    fontWeight: 600,
    color: '#37352f',
}