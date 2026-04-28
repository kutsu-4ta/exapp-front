'use client'

import { useState, useMemo } from 'react'

type FailureEntry = { type: string; count: number }

type Props = {
    failureData: FailureEntry[]
}

export function FailureAnalysisSection({ failureData }: Props) {
    const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar')
    const totalCount = useMemo(() => failureData.reduce((sum, d) => sum + d.count, 0), [failureData])

    const pieGradient = useMemo(() => {
        let currentPercent = 0
        const colors = ['#2383e2', '#eb5757', '#f2ab26', '#19a576', '#8a7b6e', '#5c3a1e']
        const stops = failureData.map((d, i) => {
            const start = currentPercent
            const ratio = totalCount > 0 ? (d.count / totalCount) * 100 : 0
            currentPercent += ratio
            return `${colors[i % colors.length]} ${start}% ${currentPercent}%`
        })
        return `conic-gradient(${stops.join(', ')})`
    }, [failureData, totalCount])

    return (
        <section style={sectionContainer}>
            <div style={sectionHeader}>
                <div style={sectionLabel}>
                    <span style={triangle}>▼</span> FAILURE ANALYSIS
                </div>
                <div style={toggleContainer}>
                    <button
                        onClick={() => setViewMode('bar')}
                        style={{ ...toggleIconBtn, color: viewMode === 'bar' ? '#37352f' : 'rgba(55, 53, 47, 0.3)', backgroundColor: viewMode === 'bar' ? 'rgba(55, 53, 47, 0.08)' : 'transparent' }}
                    >📊</button>
                    <button
                        onClick={() => setViewMode('pie')}
                        style={{ ...toggleIconBtn, color: viewMode === 'pie' ? '#37352f' : 'rgba(55, 53, 47, 0.3)', backgroundColor: viewMode === 'pie' ? 'rgba(55, 53, 47, 0.08)' : 'transparent' }}
                    >🍩</button>
                </div>
            </div>

            <div style={listContainer}>
                {viewMode === 'bar' ? (
                    failureData.map(({ type, count }) => (
                        <div key={type} style={analysisRow}>
                            <div style={analysisHeader}>
                                <span style={analysisText}>{type}</span>
                                <span style={countText}>{count} cases</span>
                            </div>
                            <div style={progressBarBg}>
                                <div style={{
                                    ...progressBarFill,
                                    width: `${(count / (Math.max(...failureData.map(d => d.count)) || 1)) * 100}%`,
                                    backgroundColor: count > 10 ? '#eb5757' : '#37352f',
                                }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={pieViewContainer}>
                        <div style={pieFrame}>
                            <div style={{ ...pieChart, background: pieGradient }} />
                            <div style={pieHole}>
                                <div style={pieCenterText}>{totalCount}</div>
                                <div style={pieCenterSub}>Total Cases</div>
                            </div>
                        </div>
                        <div style={legendGrid}>
                            {failureData.map(({ type, count }, i) => {
                                const colors = ['#2383e2', '#eb5757', '#f2ab26', '#19a576', '#8a7b6e', '#5c3a1e']
                                const ratio = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0
                                return (
                                    <div key={type} style={legendItem}>
                                        <div style={{ ...colorDot, backgroundColor: colors[i % colors.length] }} />
                                        <div style={legendContent}>
                                            <span style={legendText}>{type}</span>
                                            <span style={legendRatio}>{ratio}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

const sectionContainer: React.CSSProperties = { marginBottom: '48px' }

const sectionHeader: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
}

const sectionLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55, 53, 47, 0.35)',
    letterSpacing: '0.05em',
}

const triangle: React.CSSProperties = { fontSize: '8px' }

const toggleContainer: React.CSSProperties = {
    display: 'flex',
    gap: '2px',
    padding: '2px',
    borderRadius: '4px',
}

const toggleIconBtn: React.CSSProperties = {
    width: '28px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    padding: 0,
    lineHeight: 1,
}

const listContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }

const analysisRow: React.CSSProperties = { padding: '12px 0' }
const analysisHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }
const analysisText: React.CSSProperties = { fontSize: '14px' }
const countText: React.CSSProperties = { fontSize: '13px', color: 'rgba(55, 53, 47, 0.45)' }
const progressBarBg: React.CSSProperties = { height: '6px', backgroundColor: 'rgba(55, 53, 47, 0.05)', borderRadius: '3px', overflow: 'hidden' }
const progressBarFill: React.CSSProperties = { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' }

const pieViewContainer: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    padding: '24px 0',
}

const pieFrame: React.CSSProperties = { position: 'relative', width: '180px', height: '180px' }

const pieChart: React.CSSProperties = { width: '100%', height: '100%', borderRadius: '50%', transition: 'transform 0.6s ease' }

const pieHole: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)',
}

const pieCenterText: React.CSSProperties = { fontSize: '28px', fontWeight: 800, color: '#37352f' }
const pieCenterSub: React.CSSProperties = { fontSize: '10px', color: 'rgba(55, 53, 47, 0.4)', fontWeight: 600, textTransform: 'uppercase' }

const legendGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', width: '100%' }

const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '8px' }
const colorDot: React.CSSProperties = { width: '8px', height: '8px', borderRadius: '2px', marginTop: '4px' }
const legendContent: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const legendText: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#37352f' }
const legendRatio: React.CSSProperties = { fontSize: '11px', color: 'rgba(55, 53, 47, 0.45)' }
