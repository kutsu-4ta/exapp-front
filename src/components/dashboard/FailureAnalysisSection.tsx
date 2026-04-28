'use client'

import { useState, useMemo } from 'react'
import { c, font, sectionLabelStyle, triangleStyle } from '@/styles/notion'

type FailureEntry = { type: string; count: number }
type Props = { failureData: FailureEntry[] }

const COLORS = ['#2383e2', '#eb5757', '#f2ab26', '#19a576', '#8a7b6e', '#5c3a1e']

export function FailureAnalysisSection({ failureData }: Props) {
    const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar')
    const totalCount = useMemo(() => failureData.reduce((sum, d) => sum + d.count, 0), [failureData])

    const pieGradient = useMemo(() => {
        let current = 0
        const stops = failureData.map((d, i) => {
            const start = current
            current += totalCount > 0 ? (d.count / totalCount) * 100 : 0
            return `${COLORS[i % COLORS.length]} ${start}% ${current}%`
        })
        return `conic-gradient(${stops.join(', ')})`
    }, [failureData, totalCount])

    return (
        <section style={section}>
            <div style={sectionHeader}>
                <div style={sectionLabelStyle}><span style={triangleStyle}>▼</span> FAILURE ANALYSIS</div>
                <div style={toggleGroup}>
                    <ToggleBtn active={viewMode === 'bar'} onClick={() => setViewMode('bar')}>📊</ToggleBtn>
                    <ToggleBtn active={viewMode === 'pie'} onClick={() => setViewMode('pie')}>🍩</ToggleBtn>
                </div>
            </div>

            {viewMode === 'bar' ? (
                <div style={list}>
                    {failureData.map(({ type, count }) => (
                        <div key={type} style={barRow}>
                            <div style={barHeader}>
                                <span style={barLabel}>{type}</span>
                                <span style={barCount}>{count} cases</span>
                            </div>
                            <div style={barBg}>
                                <div style={{
                                    ...barFill,
                                    width: `${(count / (Math.max(...failureData.map(d => d.count)) || 1)) * 100}%`,
                                    backgroundColor: count > 10 ? c.red : c.text,
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={pieView}>
                    <div style={pieFrame}>
                        <div style={{ ...pieCircle, background: pieGradient }} />
                        <div style={pieHole}>
                            <div style={pieCenterNum}>{totalCount}</div>
                            <div style={pieCenterSub}>Total Cases</div>
                        </div>
                    </div>
                    <div style={legend}>
                        {failureData.map(({ type, count }, i) => (
                            <div key={type} style={legendItem}>
                                <div style={{ ...dot, backgroundColor: COLORS[i % COLORS.length] }} />
                                <div>
                                    <div style={legendLabel}>{type}</div>
                                    <div style={legendRatio}>
                                        {totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} style={{
            ...toggleBtn,
            color: active ? c.text : c.textFaint,
            backgroundColor: active ? 'rgba(55, 53, 47, 0.08)' : 'transparent',
        }}>{children}</button>
    )
}

const section: React.CSSProperties = { marginBottom: '48px' }
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const toggleGroup: React.CSSProperties = { display: 'flex', gap: '2px', padding: '2px', borderRadius: '4px' }
const toggleBtn: React.CSSProperties = {
    width: '28px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, lineHeight: 1,
}
const list: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }
const barRow: React.CSSProperties = { padding: '12px 0' }
const barHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }
const barLabel: React.CSSProperties = { fontSize: font.base }
const barCount: React.CSSProperties = { fontSize: '13px', color: c.textSub }
const barBg: React.CSSProperties = { height: '6px', backgroundColor: c.surface, borderRadius: '3px', overflow: 'hidden' }
const barFill: React.CSSProperties = { height: '100%', borderRadius: '3px', transition: 'width 0.6s ease' }

const pieView: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '24px 0' }
const pieFrame: React.CSSProperties = { position: 'relative', width: '180px', height: '180px' }
const pieCircle: React.CSSProperties = { width: '100%', height: '100%', borderRadius: '50%' }
const pieHole: React.CSSProperties = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '120px', height: '120px', backgroundColor: c.bg, borderRadius: '50%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
}
const pieCenterNum: React.CSSProperties = { fontSize: '28px', fontWeight: 800, color: c.text }
const pieCenterSub: React.CSSProperties = { fontSize: font.xs, color: c.textSub, fontWeight: 600, textTransform: 'uppercase' }
const legend: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', width: '100%' }
const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '8px' }
const dot: React.CSSProperties = { width: '8px', height: '8px', borderRadius: '2px', marginTop: '4px' }
const legendLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: c.text }
const legendRatio: React.CSSProperties = { fontSize: font.sm, color: c.textSub }
