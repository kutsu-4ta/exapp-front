import {c, cardLabelStyle, cardStyle, cardSubStyle} from "../../styles/notion";

type Props = { label: string; value: string; sub?: string }

export function StatCard({ label, value, sub }: Props) {
    return (
        <div style={cardStyle}>
            <p style={cardLabelStyle}>{label}</p>
            <p style={valueStyle}>{value}</p>
            {sub && <p style={cardSubStyle}>{sub}</p>}
        </div>
    )
}

const valueStyle: React.CSSProperties = {
    fontSize: '22px', fontWeight: 700, margin: 0,
    color: c.text, display: 'flex', alignItems: 'baseline', gap: '4px',
}
