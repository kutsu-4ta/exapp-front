import {
    ResponsiveContainer, ComposedChart, CartesianGrid,
    XAxis, YAxis, Area, ReferenceLine, Tooltip, Line,
} from 'recharts';
import type { ChartDataPoint } from "../../types/workspace";
import { todayString } from "../../types/workspace";

type Props = {
    data: ChartDataPoint[];
    targetMin: number;
    targetMax: number;
};

export function DashboardChart({ data, targetMin, targetMax }: Props) {
    const todayStr = todayString();
    console.log(data)
    // Y軸の最大値を動的に決定（目標最大値、実績、予測のいずれか高い方に基づく）
    const currentMax = data.reduce((acc, p) => {
        const val = Math.max(p.actual || 0, p.forecast || 0, (p.range ? p.range[1] : 0));
        return Math.max(acc, val);
    }, targetMax);
    const yMax = Math.ceil((currentMax + 10) / 20) * 20;

    // 今日のデータを探す（縦線用）
    const todayData = data.find(d => d.date === todayStr);

    return (
        <div style={{ width: '100%', height: 260, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    {/* 背景グリッド：Notion風に横線のみ */}
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

                    {/* 1. 目標範囲の帯 (Area) - baseValueを削除し、配列データに対応 */}
                    <Area
                        type="monotone"
                        dataKey="range"
                        stroke="none"
                        fill="#10b981"
                        fillOpacity={0.08} // 少し濃くして視認性アップ
                        isAnimationActive={false}
                    />

                    {/* 2. 上限・下限の基準線 */}
                    <ReferenceLine
                        y={targetMin}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: `Min: ${targetMin}`, position: 'right', fill: '#f59e0b', fontSize: 9 }}
                    />
                    <ReferenceLine
                        y={targetMax}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: `Max: ${targetMax}`, position: 'right', fill: '#f43f5e', fontSize: 9 }}
                    />

                    {/* 3. 今日の日付を示す縦線 */}
                    {todayData && (
                        <ReferenceLine x={todayData.day} stroke="#e2e8f0" strokeWidth={1} />
                    )}

                    <Tooltip content={<CustomTooltip />} />

                    {/* 4. 予測線（点線） */}
                    <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={false}
                        connectNulls={true}
                    />

                    {/* 5. 実績累計線（太い実線） */}
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
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as ChartDataPoint;

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '6px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            fontSize: '12px'
        }}>
            {/* 日付：落ち着いたニュートラルグレー */}
            <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                {d.date.replace(/-/g, '/')}
            </div>

            {/* 実績：少し主張を抑えた青 */}
            {d.actual !== undefined && (
                <div style={{ color: '#0369a1', fontWeight: 700 }}>
                    実績累計: <span style={{ fontFamily: 'monospace' }}>{d.actual}h</span>
                </div>
            )}

            {/* 予測：実績より一段階明るい青 */}
            {d.actual === undefined && d.forecast !== undefined && (
                <div style={{ color: '#0ea5e9', fontWeight: 600 }}>
                    予測累計: <span style={{ fontFamily: 'monospace' }}>{d.forecast}h</span>
                </div>
            )}

            {/* 目標範囲：補足情報として淡いグレー */}
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                目標範囲: {d.range[0]} 〜 {d.range[1]}h
            </div>
        </div>
    );
};