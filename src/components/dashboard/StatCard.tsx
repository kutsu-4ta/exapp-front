'use client'

type Props = {
    label: string
    value: string
    sub?: string
}

export function StatCard({ label, value, sub }: Props) {
    return (
        <div style={container}>
            <p style={labelStyle}>{label}</p>
            <p style={valueStyle}>{value}</p>
            {sub && <p style={subStyle}>{sub}</p>}
        </div>
    )
}

export const cardBase: React.CSSProperties = {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(55, 53, 47, 0.09)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    transition: 'background 0.2s ease',
}

export const cardLabel: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55, 53, 47, 0.45)',
    fontWeight: 600,
    marginBottom: '6px',
    letterSpacing: '0.02em',
}

export const cardSub: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55, 53, 47, 0.35)',
    marginTop: '6px',
}

const container = cardBase

const labelStyle = cardLabel

const valueStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    color: '#37352f',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
}

const subStyle = cardSub
