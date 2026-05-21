import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getCached, setCached} from "@/lib/pageCache";
import {
    deleteSubject,
    fetchFlashcards,
    fetchSubjectMonthlyGoal,
    fetchSubjectSettings,
    renameSubject,
    saveSubjectMonthlyGoal,
    saveSubjectSettings
} from "@/lib/api/subjects.ts";
import {SubjectHeader} from "@/components/subject/SubjectHeader.tsx";
import {TodaysFive} from "@/components/subject/TodaysFive.tsx";
import {SubjectActivity} from "@/components/subject/SubjectActivity.tsx";
import type {FailureType, Flashcard, SubjectAlertSettings, SubjectSettings} from "@/types/workspace.ts";
import {DEFAULT_SUBJECT_ALERT_SETTINGS, formatHours} from "@/types/workspace.ts";
import {subjectUi} from "@/styles/subjectUI.ts";
import {fetchSubjectAlertSettings, updateSubjectAlertSettings} from "@/lib/api/subjectAlertSettings.ts";
import {useSettingsStore} from "@/lib/store/settings.ts";
import type {FlashBugfixConfig} from "@/lib/api/morningQuiz.ts";
import {FlashBugfixConfigModal} from "@/components/practice/FlashBugfixConfigModal.tsx";
import {StrategySection} from "@/components/subject/StrategySection.tsx";
import {SubjectExamStats} from "@/components/subject/SubjectExamStats.tsx";
import {flashBugfixBtn} from "@/styles/flashBugficUI.ts";
import {PROF_COLORS} from "@/components/common/ProficiencySelector.tsx";
import {FAILURE_COLORS, FAILURE_TYPES} from "@/components/common/FailureTypeSlecter.tsx";
import {Skeleton} from "@/components/common/Skeleton.tsx";
import {SubjectSettingsModal} from "@/components/subject/SubjectSettingsModal.tsx";
import {SubCategoryList} from "@/components/subject/SubCategoryList.tsx"
import {fetchGeminiContext} from "@/lib/api/gemini.ts"
import {StatusCopyModal} from "@/components/common/StatusCopyModal.tsx";


export default function SubjectPage() {
    const { name: encodedName } = useParams<{ name: string }>()
    const subjectName = decodeURIComponent(encodedName ?? '')
    const navigate = useNavigate()

    const subjects = useSettingsStore((s) => s.subjects)
    const setSubjects = useSettingsStore((s) => s.setSubjects)
    const subCategories = useSettingsStore((s) => s.subCategories)
    const setSubCategories = useSettingsStore((s) => s.setSubCategories)

    const now = new Date()
    const [viewYear, setViewYear] = useState(now.getFullYear())
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

    const [monthlyGoal, setMonthlyGoal] = useState('')
    const [goalLoading, setGoalLoading] = useState(false)

    const [settings, setSettings] = useState<SubjectSettings>({ finalTarget: null, themeColor: null })
    const [settingsLoaded, setSettingsLoaded] = useState(false)
    const setSubjectColor = useSettingsStore((s) => s.setSubjectColor)

    const setSubjectAlertSettings = useSettingsStore((s) => s.setSubjectAlertSettings)
    const [subjectAlertSettings, setLocalSubjectAlertSettings] = useState<SubjectAlertSettings>(DEFAULT_SUBJECT_ALERT_SETTINGS)
    const [alertSaving, setAlertSaving] = useState(false)
    const [alertSaved, setAlertSaved] = useState(false)

    const [statsLoading, setStatsLoading] = useState(false);

    const [flashcards, setFlashcards] = useState<any[]>([]);
    const items = subCategories.filter((sc) => sc.subject === subjectName)
    const [showFlashConfig, setShowFlashConfig] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [statsCopying, setStatsCopying] = useState(false)
    const [statsCopied, setStatsCopied] = useState(false)
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
    const [copyText, setCopyText] = useState('')
    const handleFlashStart = (config: FlashBugfixConfig) => {
        setShowFlashConfig(false)
        navigate(`/subjects/${encodeURIComponent(subjectName)}/flash-bugfix`, { state: { config } })
    }

    const prevMonth = () => {
        if (viewMonth === 1) {
            setViewYear(y => y - 1)
            setViewMonth(12)
        } else {
            setViewMonth(m => m - 1)
        }
    }

    const nextMonth = () => {
        if (viewMonth === 12) {
            setViewYear(y => y + 1)
            setViewMonth(1)
        } else {
            setViewMonth(m => m + 1)
        }
    }

    // Phase 1: settings — キャッシュで即表示、バックグラウンド更新
    useEffect(() => {
        const cacheKey = `subject-settings-${subjectName}`
        const cached = getCached<SubjectSettings>(cacheKey)
        if (cached) {
            setSettings(cached)
            setSubjectColor(subjectName, cached.themeColor)
            setSettingsLoaded(true)
        }
        fetchSubjectSettings(subjectName)
            .then((s) => {
                setSettings(s)
                setSubjectColor(subjectName, s.themeColor)
                setSettingsLoaded(true)
                setCached(cacheKey, s)
            })
            .catch(() => setSettingsLoaded(true))

        // Phase 3: alert settings — モーダル専用、独立実行
        fetchSubjectAlertSettings(subjectName)
            .then((s) => setLocalSubjectAlertSettings(s))
            .catch(() => {})

        // Phase 4: flashcards — スクロール下部、初期レンダー後に遅延起動
        const timer = setTimeout(() => {
            setStatsLoading(true)
            fetchFlashcards(subjectName, 500)
                .then((cards) => setFlashcards(cards as Flashcard[]))
                .catch(() => {})
                .finally(() => setStatsLoading(false))
        }, 0)
        return () => clearTimeout(timer)
    }, [subjectName])

    // Phase 2: monthly goal — 月切り替えのたびにキャッシュ付き再フェッチ
    useEffect(() => {
        const cacheKey = `subject-goal-${subjectName}-${viewYear}-${viewMonth}`
        const cached = getCached<string>(cacheKey)
        if (cached !== null) {
            setMonthlyGoal(cached)
            setGoalLoading(false)
        } else {
            setGoalLoading(true)
        }
        fetchSubjectMonthlyGoal(subjectName, viewYear, viewMonth)
            .then((g) => {
                const goal = g.goal ?? ''
                setMonthlyGoal(goal)
                setCached(cacheKey, goal)
            })
            .catch(() => {})
            .finally(() => setGoalLoading(false))
    }, [subjectName, viewYear, viewMonth])

    const handleAlertSave = async () => {
        setAlertSaving(true)
        try {
            const saved = await updateSubjectAlertSettings(subjectName, subjectAlertSettings)
            setLocalSubjectAlertSettings(saved)
            setSubjectAlertSettings(subjectName, saved)
            setAlertSaved(true)
            setTimeout(() => setAlertSaved(false), 2000)
        } catch {
            // silent fail
        } finally {
            setAlertSaving(false)
        }
    }


    const handlePrepareStats = async () => {
        if (statsCopying) return
        setStatsCopying(true)
        try {
            const ctx = await fetchGeminiContext(viewYear, viewMonth)
            const s = ctx.subjects.find((s) => s.subject === subjectName)
            const lines = [`【科目ステータス: ${subjectName}】`]
            lines.push(`期間: ${ctx.year}年${ctx.month}月`)
            if (s?.finalTarget) lines.push(`最終目標: ${s.finalTarget}`)
            if (s?.monthlyGoal) lines.push(`今月の目標: ${s.monthlyGoal}`)
            lines.push('')
            lines.push('【学習状況】')
            lines.push(`学習時間: ${formatHours(s?.studyMinutes ?? 0)}`)
            lines.push(`問題数: ${s?.problemCount ?? 0}問`)
            if ((s?.failureStats ?? []).length > 0) {
                lines.push('')
                lines.push('【学習観点】')
                s!.failureStats.forEach((f) =>
                    lines.push(`  ・${f.type}: ${f.count}問 (${Math.round(f.ratio * 100)}%)`)
                )
            }
            if (s?.recentExamScore) {
                const { examYear, score, completedAt } = s.recentExamScore
                const dateStr = completedAt ? ` (${completedAt.replace(/-/g, '/')})` : ''
                lines.push('')
                lines.push('【直近の過去問】')
                lines.push(`  ${examYear}年度 ${score}点${dateStr}`)
            }
            setCopyText(lines.join('\n'))
            setIsCopyModalOpen(true)
        } catch (e) {
            console.error(e)
        } finally {
            setStatsCopying(false)
        }
    }

    const handleFinalCopy = async () => {
        try {
            await navigator.clipboard.writeText(copyText)
            setStatsCopied(true)
            setTimeout(() => {
                setStatsCopied(false)
                setIsCopyModalOpen(false)
            }, 800)
        } catch (e) {
            console.error(e)
        }
    }

    // ── Derived Stats (all-time, not month-filtered) ─────────────────────────
    const profCounts = { '○': 0, '△': 0, '×': 0 }
    flashcards.forEach((f) => {
        const p = f.back.proficiency
        if (p === '○' || p === '△' || p === '×') profCounts[p as keyof typeof profCounts]++
    })
    const weakCards = flashcards.filter(
        (f) => f.back.proficiency === '△' || f.back.proficiency === '×'
    )
    const ftCounts: Record<string, number> = { 定義: 0, 解法: 0, ケアレス: 0 }
    weakCards.forEach((f) =>
        f.back.failureTypes.forEach((ft:FailureType) => {
            if (ft in ftCounts) ftCounts[ft]++
        })
    )
    const ftTotal = Object.values(ftCounts).reduce((a, b) => a + b, 0)


    return (
        <>
        <div style={subjectUi.page}>
            <div style={subjectUi.container}>

                {/* HEADER */}
                <section>
                    <SubjectHeader
                        subjectName={subjectName}
                        renameSubject={renameSubject}
                        subjects={subjects}
                        setSubjects={setSubjects}
                        subCategories={subCategories}
                        setSubCategories={setSubCategories}
                        navigate={navigate}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                </section>

                {/* TODAY */}
                <section>
                    <TodaysFive subjectName={subjectName} navigate={navigate} />
                </section>

                <StrategySection
                    settingsLoaded={settingsLoaded}
                    settings={settings}
                    setSettings={setSettings}
                    saveSubjectSettings={saveSubjectSettings}
                    subjectName={subjectName}
                />

                {/* ACTIVITY */}
                <section style={subjectUi.card}>
                    <div>
                        <h3 style={subjectUi.title}>ACTIVITY</h3>
                    </div>

                    <SubjectActivity
                        subjectName={subjectName}
                        viewYear={viewYear}
                        viewMonth={viewMonth}
                        monthlyGoal={monthlyGoal}
                        setMonthlyGoal={setMonthlyGoal}
                        goalLoading={goalLoading}
                        saveSubjectMonthlyGoal={saveSubjectMonthlyGoal}
                        prevMonth={prevMonth}
                        nextMonth={nextMonth}
                    />
                </section>

                {/* 統計 */}
                <section style={subjectUi.card}>
                    {statsLoading ? (
                        <div style={block}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                        <Skeleton width={20} height={20} borderRadius={4} />
                                        <Skeleton width={28} height={22} borderRadius={4} />
                                    </div>
                                ))}
                                <Skeleton width={48} height={14} style={{ marginLeft: 'auto' }} />
                            </div>
                            <Skeleton height={1} borderRadius={0} style={{ margin: '0 0 12px' }} />
                            <Skeleton width={80} height={10} style={{ marginBottom: 10 }} />
                            <Skeleton height={8} borderRadius={4} style={{ marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {[0, 1, 2].map((i) => (
                                    <Skeleton key={i} width={48} height={12} borderRadius={4} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '24px',
                                    marginBottom: '8px',
                                }}
                            >
                                <p style={{ ...subSectionLabel, marginTop: 0, marginBottom: 0 }}>ANALYSIS</p>
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
                                        {(['○', '△', '×'] as const).map((p) => (
                                            <div key={p} style={profCell}>
                                                <span style={{ ...profBadge, color: PROF_COLORS[p] }}>{p}</span>
                                                <span style={profCount}>{profCounts[p]}</span>
                                            </div>
                                        ))}
                                        <div
                                            style={{
                                                ...profCell,
                                                marginLeft: 'auto',
                                                color: 'rgba(55,53,47,0.35)',
                                                fontSize: '12px',
                                            }}
                                        >
                                            計 {flashcards.length}問
                                        </div>
                                    </div>
                                    {weakCards.length > 0 && (
                                        <>
                                            <div style={divider} />
                                            <p style={miniSectionLabel}>学習観点（△/×）</p>
                                            {ftTotal > 0 ? (
                                                <>
                                                    <div style={ftBarTrack}>
                                                        {FAILURE_TYPES.map((ft) => {
                                                            const w = ftTotal > 0 ? (ftCounts[ft] / ftTotal) * 100 : 0
                                                            return w > 0 ? (
                                                                <div
                                                                    key={ft}
                                                                    style={{
                                                                        width: `${w}%`,
                                                                        height: '100%',
                                                                        backgroundColor: FAILURE_COLORS[ft],
                                                                    }}
                                                                />
                                                            ) : null
                                                        })}
                                                    </div>
                                                    <div style={ftLabelRow}>
                                                        {FAILURE_TYPES.map((ft) => {
                                                            const pct = ftTotal > 0 ? Math.round((ftCounts[ft] / ftTotal) * 100) : 0
                                                            return (
                                                                <div key={ft} style={ftLabelCell}>
                                                                    <span style={{ ...ftDot, backgroundColor: FAILURE_COLORS[ft] }} />
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
                        </>
                    )}
                </section>

                {/* EXAM 分析 */}
                <SubjectExamStats subjectName={subjectName} />

                {showFlashConfig && (
                    <FlashBugfixConfigModal
                        subjectName={subjectName}
                        subCategories={items}
                        onClose={() => setShowFlashConfig(false)}
                        onStart={handleFlashStart}
                    />
                )}

                {/* SUB CATEGORIES */}
                <section style={subjectUi.card}>
                    <SubCategoryList
                        subjectName={subjectName}
                        subCategories={subCategories}
                        setSubCategories={setSubCategories}
                        flashcards={flashcards}
                    />
                </section>

                {/* ステータスコピー */}
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(55,53,47,0.08)' }}>
                    <button
                        onClick={handlePrepareStats}
                        disabled={statsCopying}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-[rgba(55,53,47,0.12)] bg-[rgba(55,53,47,0.03)] text-[rgba(55,53,47,0.5)] text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                        {statsCopied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="2" width="6" height="4" rx="1" />
                                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                            </svg>
                        )}
                        <span>{statsCopied ? 'コピー済み' : statsCopying ? '取得中...' : 'ステータスをコピー'}</span>
                    </button>
                </div>

                {showSettings && (
                    <SubjectSettingsModal
                        subjectName={subjectName}
                        settings={settings}
                        setSettings={setSettings}
                        saveSubjectSettings={saveSubjectSettings}
                        settingsLoaded={settingsLoaded}
                        subjectAlertSettings={subjectAlertSettings}
                        setLocalSubjectAlertSettings={setLocalSubjectAlertSettings}
                        handleAlertSave={handleAlertSave}
                        alertSaving={alertSaving}
                        alertSaved={alertSaved}
                        subCategories={subCategories}
                        setSubCategories={setSubCategories}
                        deleteSubject={deleteSubject}
                        subjects={subjects}
                        setSubjects={setSubjects}
                        navigate={navigate}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </div>
        </div>

        {isCopyModalOpen && (
            <StatusCopyModal
                text={copyText}
                copied={statsCopied}
                onCopy={handleFinalCopy}
                onClose={() => setIsCopyModalOpen(false)}
            />
        )}
        </>
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

