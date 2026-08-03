import {CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts'
import type {SubjectActivityDay} from '../../types/workspace'

type ChartRow = { day: number; date: string; studyMinutes: number }

type Props = {
  data: SubjectActivityDay[]
  year: number
  month: number
}

export function SubjectActivityChart({ data, year, month }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const byDate = Object.fromEntries(data.map((d) => [d.date, d]))

  const rows: ChartRow[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = byDate[date]
    return {
      day,
      date,
      studyMinutes: entry?.studyMinutes ?? 0,
    }
  })

  const maxMinutes = Math.max(...rows.map((r) => r.studyMinutes), 1)

  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(55,53,47,0.05)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: 'rgba(55,53,47,0.3)', fontWeight: 600 }}
            interval={4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="minutes"
            domain={[0, Math.ceil(maxMinutes * 1.2)]}
            tick={{ fontSize: 9, fill: 'rgba(55,53,47,0.3)', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v === 0 ? '' : `${v}m`)}
          />
          <Tooltip content={<ActivityTooltip />} />
          <Line
            yAxisId="minutes"
            type="monotone"
            dataKey="studyMinutes"
            stroke="#2383e2"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#2383e2', strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function ActivityTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.studyMinutes === 0) return null
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(55,53,47,0.1)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
      }}
    >
      <div style={{ color: 'rgba(55,53,47,0.4)', fontWeight: 600, marginBottom: '4px' }}>
        {d.date.replace(/-/g, '/')}
      </div>
      {d.studyMinutes > 0 && (
        <div style={{ color: '#2383e2', fontWeight: 700 }}>{d.studyMinutes}分</div>
      )}
    </div>
  )
}
