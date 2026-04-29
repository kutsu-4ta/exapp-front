import {
    ResponsiveContainer, ComposedChart, CartesianGrid,
    XAxis, YAxis, Area, ReferenceLine, Tooltip, Line,
} from 'recharts'
import type {ChartDataPoint} from "../../types/workspace";
import {todayString} from "../../types/workspace";


type Props = {
    data: ChartDataPoint[];
    targetMin: number;
    targetMax: number;
}

export function DashboardChart({ data, targetMin, targetMax }: Props) {
    const todayStr = todayString();

    // Y軸の最大値を動的に決定
    const currentMax = data.reduce((acc, p) => Math.max(acc, p.actual || 0, p.forecast || 0), targetMax);
    const yMax = Math.ceil(currentMax / 20) * 20; // 20時間刻みで余裕を持たせる

    return (
        <div style={{ width: '100%', height: 260, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        interval={4}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, yMax]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                    />

                    {/* ターゲット範囲の背景（線形） */}
                    <Area
                        type="monotone"
                        dataKey="range"
                        stroke="none"
                        fill="#10b981"
                        fillOpacity={0.06}
                        isAnimationActive={false}
                    />

                    {/* 下限・上限の最終ライン */}
                    <ReferenceLine y={targetMin} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                    <ReferenceLine y={targetMax} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1} />

                    {/* 今日の縦線 */}
                    <ReferenceLine x={parseInt(todayStr.slice(8))} stroke="#e2e8f0" strokeWidth={1} />

                    <Tooltip content={<CustomTooltip />} />

                    {/* 予測線（点線） */}
                    <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={true}
                    />

                    {/* 実績累計線（太い実線） */}
                    <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#0369a1"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: '#0369a1', strokeWidth: 0 }}
                        isAnimationActive={true}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload as ChartDataPoint
    return (
        <div style={{
            background: '#1e293b',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #334155',
        }}>
            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                {data.date.replace(/-/g, '/')}
            </div>
            {data.actual !== undefined && (
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 800, fontSize: 13 }}>
                    実績累計: {data.actual}h
                </div>
            )}
            {data.forecast !== undefined && data.actual === undefined && (
                <div style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                    予測累計: {data.forecast}h
                </div>
            )}
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                目標範囲: {data.range[0]}〜{data.range[1]}h
            </div>
        </div>
    )
}