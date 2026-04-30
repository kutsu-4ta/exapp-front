import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer, LineChart, CartesianGrid,
    XAxis, YAxis, Tooltip, ReferenceLine, Line,
} from 'recharts'
import { createDailyLog, fetchDailyLogs } from '../lib/api/workspace'
import type { DailyLogSummary } from '../types/workspace'

type ViewMode = 'list' | 'chart'

export default function DailyLogsPage() {
    const navigate = useNavigate()
    const [logs, setLogs] = useState<DailyLogSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('list')

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

    const handleDateSelect = async (date: string) => {
        if (!date) return
        const exists = logs.find(log => log.date === date)
        if (exists) {
            navigate(`/workspace/${date}`)
        } else {
            try {
                await createDailyLog(date)
            } catch (err) {
                console.error('Failed to create log:', err)
            } finally {
                navigate(`/workspace/${date}`)
            }
        }
    }

    const chartData = useMemo(() => {
        return [...logs]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(log => ({
                date: log.date.slice(5),
                minutes: log.totalMinutes,
            }))
    }, [logs])

    if (loading) return <div style={loaderStyle}>Loading...</div>

    return (
        <div style={pageWrapper}>
            <nav style={navBar}>
                <div style={breadcrumb}>
                    <span style={navIcon}>📝</span>
                    <Link to="/workspace/daily-logs" style={navLink}>Workspace</Link>
                    <span style={sep}>/</span>
                    <span style={activeNav}>Daily Logs</span>
                </div>
            </nav>

            <div style={tabBar}>
                <button
                    onClick={() => setViewMode('list')}
                    style={{...tabItem, ...(viewMode === 'list' ? activeTab : {})}}
                >
                    <span style={tabIcon}>☰</span> リスト
                </button>
                <button
                    onClick={() => setViewMode('chart')}
                    style={{...tabItem, ...(viewMode === 'chart' ? activeTab : {})}}
                >
                    <span style={tabIcon}>📈</span> 推移
                </button>
            </div>

            <div style={content}>
                <header style={header}>
                    <h1 style={title}>Daily Logs</h1>
                    <p style={description}>日々の積み上げと内省の記録</p>
                </header>

                <div style={toolbar}>
                    <label style={calendarLabel}>
                        <span style={{ fontSize: '18px' }}>📅</span>
                        <input
                            type="date"
                            style={hiddenDateInput}
                            onChange={(e) => handleDateSelect(e.target.value)}
                        />
                    </label>
                </div>

                {viewMode === 'list' ? (
                    <div style={listContainer}>
                        <div style={listHeader}>
                            <div style={{ flex: 2 }}>日付</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>時間</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>状態</div>
                        </div>

                        {logs.map((log) => {
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
                        })}
                    </div>
                ) : (
                    <div style={chartContainer}>
                        <div style={chartCard}>
                            <h3 style={chartLabel}>学習時間推移 (min)</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData}>
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

const pageWrapper: React.CSSProperties = { backgroundColor: '#fff', minHeight: '100vh', color: '#37352f' }
const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }
const breadcrumb: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const navIcon: React.CSSProperties = { marginRight: '6px' }
const navLink: React.CSSProperties = { color: 'inherit', textDecoration: 'none' }
const sep: React.CSSProperties = { margin: '0 6px', color: 'rgba(55, 53, 47, 0.16)' }
const activeNav: React.CSSProperties = { fontWeight: 500, color: '#37352f' }

const tabBar: React.CSSProperties = { display: 'flex', padding: '0 16px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)', gap: '16px' }
const tabItem: React.CSSProperties = {
    background: 'none', border: 'none', padding: '8px 4px', fontSize: '14px',
    color: 'rgba(55, 53, 47, 0.45)', cursor: 'pointer', borderBottom: '2px solid transparent',
    display: 'flex', alignItems: 'center', gap: '6px'
}
const activeTab: React.CSSProperties = { color: '#37352f', borderBottom: '2px solid #37352f' }
const tabIcon: React.CSSProperties = { fontSize: '16px' }

const content: React.CSSProperties = { width: '100%', maxWidth: '720px', margin: '0 auto', padding: '60px 20px' }
const header: React.CSSProperties = { marginBottom: '40px' }
const title: React.CSSProperties = { fontSize: '40px', fontWeight: 700, marginBottom: '8px' }
const description: React.CSSProperties = { color: 'rgba(55, 53, 47, 0.6)', fontSize: '16px' }

const toolbar: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }
const calendarLabel: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '44px', height: '44px', backgroundColor: '#fff',
    border: '1px solid rgba(55, 53, 47, 0.16)', borderRadius: '4px',
    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
}
const hiddenDateInput: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    opacity: 0, cursor: 'pointer',
    zIndex: 1, fontSize: '16px',
}

const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const listHeader: React.CSSProperties = { display: 'flex', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: 'rgba(55, 53, 47, 0.35)', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }
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
const chartLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: 'rgba(55, 53, 47, 0.45)', marginBottom: '16px' }
const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }
const loaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'rgba(55, 53, 47, 0.45)' }
