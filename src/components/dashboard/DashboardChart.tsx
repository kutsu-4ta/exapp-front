import {
    ComposedChart, Line, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {todayString} from "@/types/workspace";

export function DashboardChart({ data }: { data: { date: string; minutes: number }[] }) {
    // 1日の理想的な学習時間（週45時間 / 7日 ≒ 385分）をガイドラインとして表示
    const targetMin = 342 // 週40時間ベース (約5.7h)
    const targetMax = 385 // 週45時間ベース (約6.4h)

    // グラフ用のデータ整形
    const chartData = data.map(d => ({
        ...d,
        displayDate: d.date.slice(5), // MM-DD
        range: [targetMin, targetMax] // 目標帯
    }))

    const maxVal = Math.max(...data.map(d => d.minutes), targetMax + 60)

    return (
        <div style={{ width: '100%', height: 160, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece8" />
                    <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 9, fill: '#b5a99a' }}
                        interval={6}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, maxVal]}
                        tick={{ fontSize: 9, fill: '#b5a99a' }}
                        tickLine={false}
                        axisLine={false}
                    />

                    {/* 目標学習時間のレンジ表示 */}
                    <Area
                        type="monotone"
                        dataKey="range"
                        stroke="none"
                        fill="#5a9a4a"
                        fillOpacity={0.08}
                        isAnimationActive={false}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* 実績ライン */}
                    <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#5c3a1e"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#5c3a1e' }}
                        isAnimationActive={true}
                    />

                    {/* 今日の基準線 */}
                    <ReferenceLine x={todayString().slice(5)} stroke="#c9b49a" strokeWidth={1} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
        <div style={{
            background: '#1a1108',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #3a2a1a',
        }}>
            <div style={{ color: '#b5a99a', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                {data.date.replace(/-/g, '/')}
            </div>
            <div style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 800, fontSize: 13 }}>
                実績 {Math.round(data.minutes / 6 * 10) / 100}h
            </div>
        </div>
    )
}