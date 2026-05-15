import {useMemo, useState} from "react"
import type {FailureType, Flashcard} from "@/types/workspace.ts"
import {FlashBugfixConfigModal} from "@/components/practice/FlashBugfixConfigModal.tsx"
import type {FlashBugfixConfig} from "@/lib/api/morningQuiz.ts"
import {PROF_COLORS, subjectUi} from "@/styles/subjectUI.ts"
import {c} from "@/styles/notion.ts";

type Props = {
    subjectName: string
    flashcards: Flashcard[]
    statsLoading: boolean
    navigate: any
    subCategories: any[]
}

export function SubjectStats({
                                 subjectName,
                                 flashcards,
                                 statsLoading,
                                 navigate,
                                 subCategories,
                             }: Props) {
    const [showFlashConfig, setShowFlashConfig] = useState(false)

    const handleFlashStart = (config: FlashBugfixConfig) => {
        setShowFlashConfig(false)
        navigate(`/flash-bugfix/${encodeURIComponent(subjectName)}`, {state: { config },})
    }

    const FAILURE_COLORS: Record<string, string> = {
        定義: "#2383e2",
        解法: "#eb5757",
        ケアレス: "#f2ab26",
    }

    const FAILURE_TYPES = ["定義", "解法", "ケアレス"] as const

    const { profCounts, weakCards, ftCounts, ftTotal } = useMemo(() => {
        const profCounts = { "○": 0, "△": 0, "×": 0 }

        flashcards.forEach((f) => {
            const p = f.back.proficiency
            if (p in profCounts) profCounts[p as keyof typeof profCounts]++
        })

        const weakCards = flashcards.filter(
            (f) => f.back.proficiency === "△" || f.back.proficiency === "×"
        )

        const ftCounts: Record<string, number> = {
            定義: 0,
            解法: 0,
            ケアレス: 0,
        }

        const isFailureType = (v: string): v is FailureType =>
            (FAILURE_TYPES as readonly string[]).includes(v)

        weakCards.forEach((f) =>
            f.back.failureTypes.forEach((ft) => {
                if (isFailureType(ft)) {
                    ftCounts[ft]++
                }
            })
        )

        const ftTotal = Object.values(ftCounts).reduce((a, b) => a + b, 0)

        return { profCounts, weakCards, ftCounts, ftTotal }
    }, [flashcards])

    if (statsLoading) {
        return <p style={loadingText}>読み込み中...</p>
    }

    return (
        <section style={subjectUi.card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={subSectionLabel}>弱点分析</p>

                {flashcards.length > 0 && (
                    <button style={flashBugfixBtn} onClick={() => setShowFlashConfig(true)}>
                        ⚡ Flash Bugfix
                    </button>
                )}
            </div>

            {flashcards.length === 0 ? (
                <p style={emptyText}>この月のノート登録はありません</p>
            ) : (
                <div style={block}>
                    <div style={profRow}>
                        {(["○", "△", "×"] as const).map((p) => (
                            <div key={p} style={profCell}>
                                <span style={{ ...profBadge, color: PROF_COLORS[p] }}>{p}</span>
                                <span style={profCount}>{profCounts[p]}</span>
                            </div>
                        ))}

                        <div>計 {flashcards.length}問</div>
                    </div>

                    {weakCards.length > 0 && (
                        <>
                            <div style={divider} />
                            <p style={miniSectionLabel}>傾向（△/×）</p>

                            {ftTotal > 0 ? (
                                <>
                                    <div style={ftBarTrack}>
                                        {FAILURE_TYPES.map((ft) => {
                                            const w =
                                                ftTotal > 0
                                                    ? (ftCounts[ft] / ftTotal) * 100
                                                    : 0
                                            return w > 0 ? (
                                                <div
                                                    key={ft}
                                                    style={{
                                                        width: `${w}%`,
                                                        height: "100%",
                                                        backgroundColor: FAILURE_COLORS[ft],
                                                    }}
                                                />
                                            ) : null
                                        })}
                                    </div>

                                    <div style={ftLabelRow}>
                                        {FAILURE_TYPES.map((ft) => {
                                            const pct =
                                                ftTotal > 0
                                                    ? Math.round((ftCounts[ft] / ftTotal) * 100)
                                                    : 0
                                            return (
                                                <div key={ft} style={ftLabelCell}>
                                                    <span
                                                        style={{
                                                            ...ftDot,
                                                            backgroundColor:
                                                                FAILURE_COLORS[ft],
                                                        }}
                                                    />
                                                    <span style={ftLabelText}>{ft}</span>
                                                    <span style={ftLabelPct}>{pct}%</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p style={emptyText}>エラー種別の未分類</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {showFlashConfig && (
                <FlashBugfixConfigModal
                    subjectName={subjectName}
                    subCategories={subCategories}
                    onClose={() => setShowFlashConfig(false)}
                    onStart={handleFlashStart}
                />
            )}
        </section>
    )
}

const emptyText: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(55,53,47,0.4)',
    textAlign: 'center',
    padding: '24px 0'
}

const miniSectionLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(55,53,47,0.35)',
    marginBottom: '8px',
    letterSpacing: '0.05em'
}
const subSectionLabel: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(55,53,47,0.5)',
    marginBottom: '8px',
}
const flashBugfixBtn: React.CSSProperties = {
    padding: '5px 10px',
    backgroundColor: 'rgba(35,131,226,0.07)',
    color: c.blue,
    border: `1px solid rgba(35,131,226,0.2)`,
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
}
const block: React.CSSProperties = {
    border: `1px solid rgba(55, 53, 47, 0.08)`,
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '32px',
    backgroundColor: '#fff',
}
const divider: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'rgba(55, 53, 47, 0.05)',
    margin: '8px 0',
}
const loadingText: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(55,53,47,0.3)',
    padding: '12px 0',
}
const profRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const profCell: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '4px' }
const profBadge: React.CSSProperties = { fontSize: '16px', fontWeight: 700 }
const profCount: React.CSSProperties = { fontSize: '18px', fontWeight: 700 }

const ftBarTrack: React.CSSProperties = {
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    backgroundColor: 'rgba(55,53,47,0.05)',
    marginBottom: '8px',
}
const ftLabelRow: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' }
const ftLabelCell: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px' }
const ftDot: React.CSSProperties = { width: '6px', height: '6px', borderRadius: '50%' }
const ftLabelText: React.CSSProperties = { fontSize: '10px', color: 'rgba(55,53,47,0.5)' }
const ftLabelPct: React.CSSProperties = { fontSize: '10px', fontWeight: 700 }