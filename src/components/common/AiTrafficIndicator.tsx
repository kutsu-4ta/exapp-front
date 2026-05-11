import { useEffect, useState } from 'react'
import { useApiTrafficStore } from '../../lib/store/apiTraffic'

function rpdColor(pct: number): string {
    if (pct >= 100) return '#eb5757'
    if (pct >= 75)  return '#d48806'
    if (pct >= 50)  return '#e87c3e'
    if (pct > 0)    return '#2383e2'
    return 'rgba(55,53,47,0.22)'
}

export function AiTrafficIndicator() {
    const history       = useApiTrafficStore((s) => s.history)
    const rpdLimit      = useApiTrafficStore((s) => s.rpdLimit)
    const rpmLimit      = useApiTrafficStore((s) => s.rpmLimit)
    const activeModel   = useApiTrafficStore((s) => s.activeModel)
    const todayCount    = useApiTrafficStore((s) => s.todayCount)
    const lastMinuteCount  = useApiTrafficStore((s) => s.lastMinuteCount)
    const rpmRecoveryMs = useApiTrafficStore((s) => s.rpmRecoveryMs)
    const pruneHistory  = useApiTrafficStore((s) => s.pruneHistory)

    const [, setTick] = useState(0)
    const [hovering, setHovering] = useState(false)

    // 毎秒tickしてRPMカウントダウンとバーを更新する
    useEffect(() => {
        const id = setInterval(() => {
            pruneHistory()
            setTick((t) => t + 1)
        }, 1000)
        return () => clearInterval(id)
    }, [pruneHistory])

    const today   = todayCount()
    const lastMin = lastMinuteCount()
    const rpdPct  = Math.min(100, (today / rpdLimit) * 100)
    const rpmPct  = Math.min(100, (lastMin / rpmLimit) * 100)
    const rpmMs   = rpmRecoveryMs()
    const rpmLimited = lastMin >= rpmLimit
    const rpdLimited = today >= rpdLimit
    const isLimited  = rpmLimited || rpdLimited

    const chipColor = isLimited
        ? '#eb5757'
        : rpdColor(rpdPct)

    const chipBg = rpdPct >= 75
        ? 'rgba(235,87,87,0.07)'
        : rpdPct >= 50
            ? 'rgba(242,171,38,0.07)'
            : rpdPct > 0
                ? 'rgba(35,131,226,0.06)'
                : 'rgba(55,53,47,0.04)'

    return (
        <div
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* ── Chip（常時表示） ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                backgroundColor: chipBg,
                borderRadius: '4px',
                cursor: 'default',
                transition: 'background-color 0.4s',
            }}>
                <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: chipColor,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    transition: 'color 0.3s',
                }}>
                    AI
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* カウント */}
                    <span style={{
                        fontSize: '11px',
                        fontFamily: 'ia-writer-mono, "SF Mono", monospace',
                        fontWeight: 600,
                        color: chipColor,
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        transition: 'color 0.3s',
                    }}>
                        {today}/{rpdLimit}
                    </span>
                    {/* RPDバー */}
                    <div style={{
                        width: '32px',
                        height: '2px',
                        backgroundColor: 'rgba(55,53,47,0.08)',
                        borderRadius: '1px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${rpdPct}%`,
                            backgroundColor: rpdColor(rpdPct),
                            borderRadius: '1px',
                            transition: 'width 0.4s ease, background-color 0.4s',
                        }} />
                    </div>
                </div>
            </div>

            {/* ── Tooltip ── */}
            {hovering && (
                <div style={tooltipBox}>
                    <p style={tooltipHeading}>AI Resource</p>

                    {/* RPDゲージ */}
                    <div style={{ marginBottom: '10px' }}>
                        <div style={gaugeHeader}>
                            <span style={gaugeLabel}>Daily  (RPD)</span>
                            <span style={{ ...gaugeCount, color: rpdColor(rpdPct) }}>
                                {today} / {rpdLimit}
                            </span>
                        </div>
                        <div style={barTrack}>
                            <div style={{
                                ...barFill,
                                width: `${rpdPct}%`,
                                backgroundColor: rpdColor(rpdPct),
                            }} />
                        </div>
                        {rpdLimited && (
                            <p style={warningText}>本日の上限に達しました</p>
                        )}
                        {!rpdLimited && today > 0 && (
                            <p style={hintText}>残り {rpdLimit - today} 回</p>
                        )}
                    </div>

                    <div style={divider} />

                    {/* RPMゲージ */}
                    <div style={{ marginTop: '8px' }}>
                        <div style={gaugeHeader}>
                            <span style={gaugeLabel}>Per min (RPM)</span>
                            <span style={{
                                ...gaugeCount,
                                color: rpmLimited ? '#eb5757' : 'rgba(55,53,47,0.55)',
                            }}>
                                {lastMin} / {rpmLimit}
                            </span>
                        </div>
                        <div style={barTrack}>
                            <div style={{
                                ...barFill,
                                width: `${rpmPct}%`,
                                backgroundColor: rpmLimited ? '#eb5757' : '#19a576',
                            }} />
                        </div>
                        {rpmLimited && rpmMs !== null && (
                            <p style={recoveringText}>
                                {Math.ceil(rpmMs / 1000)}s後に回復
                            </p>
                        )}
                        {!rpmLimited && lastMin > 0 && (
                            <p style={hintText}>残り {rpmLimit - lastMin} 回 / 分</p>
                        )}
                    </div>

                    <div style={{ ...divider, marginTop: '10px' }} />
                    <p style={modelLabel}>{activeModel}</p>
                </div>
            )}
        </div>
    )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const tooltipBox: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    backgroundColor: '#fff',
    border: '1px solid rgba(55,53,47,0.12)',
    borderRadius: '10px',
    padding: '12px 14px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    zIndex: 2000,
    width: '200px',
    pointerEvents: 'none',
}
const tooltipHeading: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(55,53,47,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
}
const gaugeHeader: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '5px',
}
const gaugeLabel: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(55,53,47,0.4)',
    fontFamily: 'ia-writer-mono, "SF Mono", monospace',
}
const gaugeCount: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'ia-writer-mono, "SF Mono", monospace',
}
const barTrack: React.CSSProperties = {
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(55,53,47,0.07)',
    borderRadius: '2px',
    overflow: 'hidden',
}
const barFill: React.CSSProperties = {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease, background-color 0.3s',
}
const warningText: React.CSSProperties = {
    fontSize: '11px',
    color: '#eb5757',
    fontWeight: 600,
    marginTop: '4px',
}
const recoveringText: React.CSSProperties = {
    fontSize: '11px',
    color: '#19a576',
    fontWeight: 600,
    marginTop: '4px',
}
const hintText: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(55,53,47,0.3)',
    marginTop: '3px',
}
const divider: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'rgba(55,53,47,0.06)',
}
const modelLabel: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(55,53,47,0.22)',
    textAlign: 'right',
    marginTop: '6px',
    fontFamily: 'ia-writer-mono, "SF Mono", monospace',
}
