'use client'

import { useState } from 'react'
import { daysAgo } from '@/types/workspace'

type SubjectEntry = { subject: string; lastDate: string | null }

type Props = {
    warningSubjects: SubjectEntry[]
}

export function AlertWidget({ warningSubjects }: Props) {
    const [isCollapsed, setIsCollapsed] = useState(true)

    return (
        <div style={alertContainer}>
            <div style={alertHeader} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div style={alertTitleGroup}>
                    <span style={alertIcon}>⚠️</span>
                    <span style={alertTitle}>
                        {warningSubjects.length}科目の学習が滞っています
                    </span>
                </div>
                <span style={collapseToggle}>{isCollapsed ? '表示' : '隠す'}</span>
            </div>

            {!isCollapsed && (
                <div style={alertBody}>
                    <div style={chipContainer}>
                        {warningSubjects.map(({ subject, lastDate }) => (
                            <div key={subject} style={subjectChip}>
                                <span style={chipText}>{subject}</span>
                                <span style={chipSubText}>
                                    {lastDate ? `${daysAgo(lastDate)}日前` : '未学習'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p style={alertFooter}>「手薄な科目」を優先して、知識の風化を防ぎましょう。</p>
                </div>
            )}
        </div>
    )
}

const alertContainer: React.CSSProperties = {
    backgroundColor: 'rgba(235, 87, 87, 0.05)',
    border: '1px solid rgba(235, 87, 87, 0.15)',
    borderRadius: '8px',
    marginBottom: '24px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
}

const alertHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    cursor: 'pointer',
}

const alertTitleGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
}

const alertIcon: React.CSSProperties = { fontSize: '14px' }

const alertTitle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#eb5757',
}

const collapseToggle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(235, 87, 87, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
}

const alertBody: React.CSSProperties = {
    padding: '0 16px 16px',
    borderTop: '1px solid rgba(235, 87, 87, 0.08)',
}

const chipContainer: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '12px',
}

const subjectChip: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 10px',
    backgroundColor: '#fff',
    border: '1px solid rgba(235, 87, 87, 0.15)',
    borderRadius: '6px',
    minWidth: '100px',
}

const chipText: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#37352f',
}

const chipSubText: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(55, 53, 47, 0.45)',
    marginTop: '2px',
}

const alertFooter: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(235, 87, 87, 0.6)',
    marginTop: '12px',
    fontStyle: 'italic',
}
