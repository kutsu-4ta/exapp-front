import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type {ChartDataPoint} from '../../types/workspace'
import {todayString} from '../../types/workspace'

type Props = {
  data: ChartDataPoint[]
  targetMin: number
  targetMax: number
}

export function DashboardChart({ data, targetMin, targetMax }: Props) {
  const todayStr = todayString()

  const currentMax = data.reduce((acc, p) => {
    const val = Math.max(p.actual ?? 0, p.forecast ?? 0, p.range?.[1] ?? 0)
    return Math.max(acc, val)
  }, targetMax)
  const yMax = Math.ceil((currentMax + 10) / 20) * 20

  const todayData = data.find((d) => d.date === todayStr)

  return (
    <div className="w-full mt-4" style={{ height: 'clamp(200px, 35vw, 280px)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            interval={4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />

          {/* 目標範囲の帯 */}
          <Area
            type="monotone"
            dataKey="range"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.08}
            isAnimationActive={false}
          />

          {/* 下限・上限の基準線 */}
          <ReferenceLine
            y={targetMin}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: `${targetMin}h`, position: 'right', fill: '#f59e0b', fontSize: 9 }}
          />
          <ReferenceLine
            y={targetMax}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: `${targetMax}h`, position: 'right', fill: '#f43f5e', fontSize: 9 }}
          />

          {/* 今日の縦線 */}
          {todayData && <ReferenceLine x={todayData.day} stroke="#e2e8f0" strokeWidth={1} />}

          <Tooltip content={<CustomTooltip />} />

          {/* 予測線（点線） */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />

          {/* 実績累計線 */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0369a1"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#0369a1', strokeWidth: 0 }}
            isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartDataPoint }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="bg-white rounded-lg px-3.5 py-2.5 shadow-lg border border-slate-200 text-[12px]">
      <div className="text-slate-500 font-semibold mb-1.5">{d.date.replace(/-/g, '/')}</div>
      {d.actual !== undefined && (
        <div className="text-[#0369a1] font-bold">
          実績: <span className="font-mono">{d.actual}h</span>
        </div>
      )}
      {d.actual === undefined && d.forecast !== undefined && (
        <div className="text-[#0ea5e9] font-semibold">
          予測: <span className="font-mono">{d.forecast}h</span>
        </div>
      )}
      <div className="text-slate-400 text-[11px] mt-1">
        目標 {d.range[0]}〜{d.range[1]}h
      </div>
    </div>
  )
}
