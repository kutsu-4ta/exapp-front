'use client'

import { c, font, cardStyle, cardLabelStyle, cardSubStyle } from '@/styles/notion'

type Props = {
    targetMin: number
    targetMax: number
    isEditing: boolean
    onTargetMinChange: (v: number) => void
    onTargetMaxChange: (v: number) => void
    onEditStart: () => void
    onEditDone: () => void
}

export function MonthlyGoalCard({
    targetMin, targetMax, isEditing,
    onTargetMinChange, onTargetMaxChange, onEditStart, onEditDone,
}: Props) {
    return (
        <div style={cardStyle}>
            <span style={cardLabelStyle}>MONTHLY GOAL</span>
            {!isEditing ? (
                <div style={goalDisplay} onClick={onEditStart}>
                    <p style={valueStyle}>{targetMin}h <span style={rangeSep}>〜</span> {targetMax}h</p>
                    <span style={editIcon}>✎</span>
                </div>
            ) : (
                <div style={editGroup}>
                    <input type="number" value={targetMin} onChange={(e) => onTargetMinChange(Number(e.target.value))} style={goalInput} autoFocus />
                    <span style={rangeSep}>-</span>
                    <input type="number" value={targetMax} onChange={(e) => onTargetMaxChange(Number(e.target.value))} style={goalInput} />
                    <button style={saveBtn} onClick={onEditDone}>OK</button>
                </div>
            )}
            <p style={cardSubStyle}>Target Range</p>
        </div>
    )
}

const valueStyle: React.CSSProperties = {
    fontSize: '22px', fontWeight: 700, margin: 0,
    color: c.text, display: 'flex', alignItems: 'baseline', gap: '4px',
}
const goalDisplay: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', borderRadius: '4px', margin: '-4px', padding: '4px',
}
const editIcon: React.CSSProperties = { fontSize: '12px', color: c.textFaint, marginLeft: '8px' }
const rangeSep: React.CSSProperties = { fontSize: '14px', color: c.textFaint, fontWeight: 400, margin: '0 4px' }
const editGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }
const goalInput: React.CSSProperties = {
    width: '56px', padding: '2px 6px', fontSize: '18px', fontWeight: 600,
    border: `1px solid ${c.blue}`, borderRadius: '4px', backgroundColor: c.bg, outline: 'none', color: c.text,
}
const saveBtn: React.CSSProperties = {
    padding: '4px 8px', fontSize: font.sm, fontWeight: 700,
    backgroundColor: c.blue, color: c.bg, border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '4px',
}
