import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
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
import {DEFAULT_SUBJECT_ALERT_SETTINGS} from "@/types/workspace.ts";
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
import {SubCategoryList} from "@/components/subject/SubCategoryList.tsx";


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

    useEffect(() => {
        setGoalLoading(true)

        fetchSubjectMonthlyGoal(subjectName, viewYear, viewMonth)
            .then((g) => setMonthlyGoal(g.goal ?? ''))
            .finally(() => setGoalLoading(false))
    }, [subjectName, viewYear, viewMonth])

    useEffect(() => {
        fetchSubjectSettings(subjectName)
            .then((s) => {
                setSettings(s)
                setSubjectColor(subjectName, s.themeColor)
                setSettingsLoaded(true)
            })
            .catch(() => setSettingsLoaded(true))
    }, [subjectName])

    useEffect(() => {
        fetchSubjectAlertSettings(subjectName)
            .then((s) => setLocalSubjectAlertSettings(s))
            .catch(() => {})
    }, [subjectName])

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

    useEffect(() => {
        setStatsLoading(true)
        Promise.all([
            // fetchSubjectStats(subjectName).catch(() => null),
            fetchFlashcards(subjectName, 500).catch(() => []),
        ]).then(([cards]) => {
            // setExamStats(stats as ExamSubjectStats | null)
            setFlashcards(cards as Flashcard[])
            setStatsLoading(false)
        })
    }, [subjectName])

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
                                            <p style={miniSectionLabel}>エラー傾向（△/×）</p>
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
                    />
                </section>

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

