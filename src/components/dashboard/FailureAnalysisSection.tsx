import { useMemo, useState } from 'react'
import { BarChartIcon, PieChartIcon } from '@/lib/icon/ChartIcons.tsx'
import type { Problem } from '@/types/workspace'
import { FAILURE_TYPE_VALUES } from '@/types/workspace'

type Props = { problems: Problem[]; subjects: string[] }

const COLORS = ['#2383e2', '#eb5757', '#f2ab26', '#19a576', '#8a7b6e', '#5c3a1e']

export function FailureAnalysisSection({ problems, subjects }: Props) {
    const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar')
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

    const filteredProblems = useMemo(() =>
        selectedSubject ? problems.filter(p => p.subject === selectedSubject) : problems
    , [problems, selectedSubject])

    const failureData = useMemo(() =>
        FAILURE_TYPE_VALUES.map(ft => ({
            type: ft,
            count: filteredProblems.filter(p => p.failureTypes.includes(ft)).length,
        }))
    , [filteredProblems])

    const totalCount = useMemo(() => failureData.reduce((s, d) => s + d.count, 0), [failureData])
    const maxCount = Math.max(...failureData.map(d => d.count), 1)

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
        <section className="mb-12">
            <div className="flex justify-between items-center mb-3">
                <SectionLabel>FAILURE ANALYSIS</SectionLabel>
                <div className="flex gap-0.5 p-0.5 rounded">
                    <ToggleBtn active={viewMode === 'bar'} onClick={() => setViewMode('bar')} label="棒グラフ">
                        <BarChartIcon color={viewMode === 'bar' ? '#37352f' : 'rgba(55,53,47,0.3)'} />
                    </ToggleBtn>
                    <ToggleBtn active={viewMode === 'pie'} onClick={() => setViewMode('pie')} label="円グラフ">
                        <PieChartIcon color={viewMode === 'pie' ? '#37352f' : 'rgba(55,53,47,0.3)'} />
                    </ToggleBtn>
                </div>
            </div>

            {/* Subject filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                <FilterPill
                    label="ALL"
                    active={selectedSubject === null}
                    onClick={() => setSelectedSubject(null)}
                />
                {subjects.map(s => (
                    <FilterPill
                        key={s}
                        label={s}
                        active={selectedSubject === s}
                        onClick={() => setSelectedSubject(prev => prev === s ? null : s)}
                    />
                ))}
            </div>

            {viewMode === 'bar' ? (
                <div className="flex flex-col divide-y divide-[var(--nt-border-xs)]">
                    {failureData.map(({ type, count }) => (
                        <div key={type} className="py-3">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-[14px] text-n-text font-medium">{type}</span>
                                <span className="text-[13px] text-[var(--nt-text-sub)]">{count} cases</span>
                            </div>
                            <div className="h-1.5 bg-[var(--nt-surface)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-[width] duration-500"
                                    style={{
                                        width: `${(count / maxCount) * 100}%`,
                                        backgroundColor: count > 10 ? '#eb5757' : '#37352f',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-8 py-6">
                    <div className="relative w-44 h-44 shrink-0">
                        <div className="w-full h-full rounded-full" style={{ background: pieGradient }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div
                                className="flex flex-col items-center justify-center rounded-full bg-white"
                                style={{ width: '120px', height: '120px' }}
                            >
                                <span className="text-[28px] font-extrabold text-n-text leading-none">{totalCount}</span>
                                <span className="text-[10px] text-[var(--nt-text-sub)] font-semibold uppercase tracking-wide mt-1">
                                    Total Cases
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full">
                        {failureData.map(({ type, count }, i) => (
                            <div key={type} className="flex items-start gap-2">
                                <div
                                    className="w-2 h-2 rounded-[2px] mt-1 shrink-0"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <div>
                                    <div className="text-[12px] font-medium text-n-text">{type}</div>
                                    <div className="text-[11px] text-[var(--nt-text-sub)]">
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

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={[
                'px-2.5 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-colors',
                active
                    ? 'bg-n-text text-white'
                    : 'bg-[rgba(55,53,47,0.06)] text-[rgba(55,53,47,0.5)] hover:bg-[rgba(55,53,47,0.1)]',
            ].join(' ')}
        >
            {label}
        </button>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--nt-text-hint)] tracking-[0.05em] uppercase">
            <span className="text-[8px]">▼</span>
            {children}
        </div>
    )
}

function ToggleBtn({
    active, onClick, label, children,
}: {
    active: boolean; onClick: () => void; label: string; children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={[
                'w-7 h-6 flex items-center justify-center rounded border-none cursor-pointer p-0 transition-colors',
                active ? 'bg-[rgba(55,53,47,0.08)]' : 'bg-transparent',
            ].join(' ')}
        >
            {children}
        </button>
    )
}
