import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer, LineChart, CartesianGrid,
    XAxis, YAxis, Tooltip, ReferenceLine, Line,
} from 'recharts'
import { createDailyLog, fetchDailyLogs } from '../lib/api/workspace'
import type { DailyLogSummary } from '../types/workspace'

type ViewMode = 'list' | 'chart'

// --- Icons ---
function IconList({ active }: { active: boolean }) {
    const c = active ? '#37352f' : 'rgba(55,53,47,0.45)'
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    )
}

function IconTrend({ active }: { active: boolean }) {
    const c = active ? '#37352f' : 'rgba(55,53,47,0.45)'
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </svg>
    )
}

export default function DailyLogsPage() {
    const navigate = useNavigate()
    const [logs, setLogs] = useState<DailyLogSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('list')

    // 選択中の日付を保持するState
    const [selectedDate, setSelectedDate] = useState('')

    const [baseMonth, setBaseMonth] = useState(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchDailyLogs()
                setLogs(data.sort((a, b) => b.date.localeCompare(a.date)))
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    // ボタン押下時の実行処理
    const handleConfirmDate = async () => {
        if (!selectedDate || selectedDate.length < 10) return

        const exists = logs.find(log => log.date === selectedDate)
        if (!exists) {
            try {
                await createDailyLog(selectedDate)
            } catch (err) {
                console.error(err)
                return
            }
        }
        navigate(`/workspace/${selectedDate}`)
    }

    const chartStartMonth = useMemo(() => {
        const [y, m] = baseMonth.split('-').map(Number)
        const d = new Date(y, m - 3, 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }, [baseMonth])

    const filteredChartData = useMemo(() => {
        return [...logs]
            .filter(log => {
                const m = log.date.slice(0, 7)
                return m >= chartStartMonth && m <= baseMonth
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(log => ({
                date: log.date.slice(5),
                minutes: log.totalMinutes,
            }))
    }, [logs, chartStartMonth, baseMonth])

    const availableMonths = useMemo(() => {
        const months = logs.map(log => log.date.slice(0, 7))
        const current = new Date().toISOString().slice(0, 7)
        return Array.from(new Set([...months, current])).sort((a, b) => b.localeCompare(a))
    }, [logs])

    if (loading) return <div style={loaderStyle}>Loading...</div>

    return (
        <div style={pageWrapper}>
            <div style={tabBar}>
                <button
                    onClick={() => setViewMode('list')}
                    style={{...tabItem, ...(viewMode === 'list' ? activeTab : {})}}
                >
                    <IconList active={viewMode === 'list'} /> リスト
                </button>
                <button
                    onClick={() => setViewMode('chart')}
                    style={{...tabItem, ...(viewMode === 'chart' ? activeTab : {})}}
                >
                    <IconTrend active={viewMode === 'chart'} /> 推移
                </button>
            </div>

            <div style={content}>
                <header style={header}>
                    <div style={titleRow}>
                        <div>
                            <h1 style={title}>Daily Logs</h1>
                            <p style={description}>日々の積み上げと内省の記録</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {viewMode === 'chart' ? (
                                <select
                                    value={baseMonth}
                                    onChange={(e) => setBaseMonth(e.target.value)}
                                    style={monthSelect}
                                >
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{m.replace('-', '年')}月</option>
                                    ))}
                                </select>
                            ) : (
                                <div style={toolbar}>
                                    <div style={calendarArea}>
                                        <div style={calendarInputWrapper}>
                                            <span style={calendarIcon}>📅</span>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                style={nativeDateInput}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                            />
                                            {selectedDate && <span style={dateDisplay}>{selectedDate}</span>}
                                        </div>
                                        <button
                                            onClick={handleConfirmDate}
                                            disabled={!selectedDate}
                                            style={{
                                                ...confirmButton,
                                                ...(selectedDate ? confirmButtonActive : confirmButtonDisabled)
                                            }}
                                        >
                                            開く
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {viewMode === 'list' ? (
                    <div style={scrollContainer}>
                        <div style={listContainer}>
                            <div style={listHeader}>
                                <div style={{ flex: 2 }}>日付</div>
                                <div style={{ flex: 1, textAlign: 'right' }}>時間</div>
                                <div style={{ flex: 1, textAlign: 'center' }}>状態</div>
                            </div>

                            {logs.length > 0 ? logs.map((log) => {
                                const hours = Math.floor(log.totalMinutes / 60)
                                const mins = log.totalMinutes % 60
                                return (
                                    <Link key={log.date} to={`/workspace/${log.date}`} style={logItem}>
                                        <div style={itemDate}>
                                            <span style={dateTxt}>{log.date}</span>
                                            <span style={reflectionSnippet}>
                                                {log.sessionCount ? `${log.sessionCount}セッション` : '記録なし'}
                                            </span>
                                        </div>
                                        <div style={itemTime}>{hours}h {mins}m</div>
                                        <div style={itemStatus}>
                                            {log.isCompleted ? (
                                                <span style={statusDone}>Done</span>
                                            ) : (
                                                <span style={statusDoing}>Open</span>
                                            )}
                                        </div>
                                    </Link>
                                )
                            }) : (
                                <div style={emptyMessage}>記録はありません</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={chartContainer}>
                        <div style={chartCard}>
                            <div style={chartNavRow}>
                                <span style={chartRangeLabel}>
                                    {chartStartMonth.replace('-', '/')} 〜 {baseMonth.replace('-', '/')} の推移
                                </span>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={filteredChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <ReferenceLine y={385} stroke="#eb5757" strokeDasharray="3 3" label={{ value: 'Target', fontSize: 10, fill: '#eb5757', position: 'insideBottomRight' }} />
                                        <Line
                                            type="monotone"
                                            dataKey="minutes"
                                            stroke="#2383e2"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#2383e2' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Styles ---
const titleRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const monthSelect: React.CSSProperties = {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(55, 53, 47, 0.16)',
    fontSize: '14px', fontWeight: 600, color: '#37352f', backgroundColor: '#fff', cursor: 'pointer', outline: 'none'
}
const toolbar: React.CSSProperties = { display: 'flex', alignItems: 'center' }

// カレンダー選択エリア
const calendarArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const calendarInputWrapper: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', padding: '4px 8px', border: '1px solid rgba(55, 53, 47, 0.16)', borderRadius: '6px', backgroundColor: '#fff', minWidth: '40px', height: '32px' }
const calendarIcon: React.CSSProperties = { fontSize: '18px', pointerEvents: 'none' }
const nativeDateInput: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }
const dateDisplay: React.CSSProperties = { marginLeft: '8px', fontSize: '13px', fontWeight: 600, color: '#37352f' }

// 確定ボタン
const confirmButton: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }
const confirmButtonActive: React.CSSProperties = { backgroundColor: '#2383e2', color: '#fff' }
const confirmButtonDisabled: React.CSSProperties = { backgroundColor: 'rgba(55, 53, 47, 0.08)', color: 'rgba(55, 53, 47, 0.3)', cursor: 'not-allowed' }

const scrollContainer: React.CSSProperties = {
    height: 'calc(100vh - 250px)',
    overflowY: 'auto',
    border: '1px solid rgba(55, 53, 47, 0.06)',
    borderRadius: '8px',
    padding: '0 8px'
}

const emptyMessage: React.CSSProperties = { padding: '40px', textAlign: 'center', color: 'rgba(55, 53, 47, 0.4)', fontSize: '14px' }
const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f' }
const tabBar: React.CSSProperties = { display: 'flex', padding: '0 16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)', gap: '16px' }
const tabItem: React.CSSProperties = {
    background: 'none', border: 'none', padding: '12px 4px', fontSize: '14px',
    color: 'rgba(55, 53, 47, 0.45)', cursor: 'pointer', borderBottom: '2px solid transparent',
    display: 'flex', alignItems: 'center', gap: '6px',
}
const activeTab: React.CSSProperties = { color: '#37352f', borderBottom: '2px solid #37352f' }
const content: React.CSSProperties = { width: '100%', maxWidth: '720px', margin: '0 auto', padding: '40px 20px' }
const header: React.CSSProperties = { marginBottom: '32px' }
const title: React.CSSProperties = { fontSize: '32px', fontWeight: 700, marginBottom: '6px' }
const description: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.6)', fontSize: '15px' }
const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const listHeader: React.CSSProperties = { display: 'flex', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.35)', borderBottom: '1px solid rgba(55, 53, 47, 0.09)', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }
const logItem: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '16px 8px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid rgba(55, 53, 47, 0.06)' }
const itemDate: React.CSSProperties = { flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }
const dateTxt: React.CSSProperties = { fontWeight: 600, fontSize: '15px' }
const reflectionSnippet: React.CSSProperties = { fontSize: '12px', color: 'rgba(55, 53, 47, 0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const itemTime: React.CSSProperties = { flex: 1, textAlign: 'right', fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }
const itemStatus: React.CSSProperties = { flex: 1, textAlign: 'center' }
const statusDone: React.CSSProperties = { backgroundColor: '#e6f6eb', color: '#19a576', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }
const statusDoing: React.CSSProperties = { backgroundColor: '#fff5e0', color: '#f2ab26', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }
const chartContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '24px' }
const chartCard: React.CSSProperties = { padding: '24px', borderRadius: '12px', border: '1px solid rgba(55, 53, 47, 0.09)', backgroundColor: '#fcfcfc' }
const chartNavRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }
const chartRangeLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: 'rgba(55,53,47,0.55)' }
const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }
const loaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'rgba(55, 53, 47, 0.45)' }