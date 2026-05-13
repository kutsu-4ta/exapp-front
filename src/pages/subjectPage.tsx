import {useNavigate, useParams} from "react-router-dom";
import {useSettingsStore} from "@/lib/store/settings.ts";
import {c} from "@/styles/notion.ts";
import {useEffect, useState} from "react";
import {addSubCategory, deleteSubCategory, updateSubCategory} from "@/lib/api/subcategory.ts";
import {SubjectDangerZone} from "@/components/subject/SubjectDangerZone.tsx";
import {
    deleteSubject,
    fetchFlashcards,
    fetchSubjectMonthlyGoal,
    fetchSubjectSettings,
    renameSubject,
    saveSubjectMonthlyGoal,
    saveSubjectSettings
} from "@/lib/api/subjects.ts";
import {SubCategoryList} from "@/components/subject/SubCategoryList.tsx";
import {SubjectHeader} from "@/components/subject/SubjectHeader.tsx";
import {TodaysFive} from "@/components/subject/TodaysFive.tsx";
import {SubjectActivity} from "@/components/subject/SubjectActivity.tsx";
import type {FailureType, Flashcard, SubjectSettings} from "@/types/workspace.ts";
import {subjectUi} from "@/styles/subjectUI.ts";
import type {FlashBugfixConfig} from "@/lib/api/morningQuiz.ts";
import {FlashBugfixConfigModal} from "@/components/practice/FlashBugfixConfigModal.tsx";


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

    const [settings, setSettings] = useState<SubjectSettings>({ finalTarget: null })
    const [settingsLoaded, setSettingsLoaded] = useState(false)

    const [statsLoading, setStatsLoading] = useState(false);

    const [flashcards, setFlashcards] = useState<any[]>([]);
    const items = subCategories.filter((sc) => sc.subject === subjectName)
    const [showFlashConfig, setShowFlashConfig] = useState(false)
    const handleFlashStart = (config: FlashBugfixConfig) => {
        setShowFlashConfig(false)
        navigate(`/subjects/${encodeURIComponent(subjectName)}/flash-bugfix`, { state: { config } })
    }
    const FAILURE_COLORS: Record<string, string> = {
        定義: '#2383e2',
        解法: '#eb5757',
        ケアレス: '#f2ab26',
    }
    const FAILURE_TYPES = ['定義', '解法', 'ケアレス'] as const

    const PROF_COLORS: Record<string, string> = {
        '○': '#27ae60',
        '△': '#f2ab26',
        '×': '#eb5757',
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
                setSettingsLoaded(true)
            })
            .catch(() => setSettingsLoaded(true))
    }, [subjectName])

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
                    />
                </section>

                {/* TODAY */}
                <section>
                    <TodaysFive subjectName={subjectName} navigate={navigate} />
                </section>

                <section>
                    {!settingsLoaded ? (
                        <div style={subjectUi.muted}>読み込み中...</div>
                    ) : (
                        <div style={subjectUi.block}>
                                                <span style={{ ...strategyLabel, color: 'rgba(55,53,47,0.4)' }}>
                            <label style={subjectUi.label}>最終目標</label>
                    </span>
                            <input
                                style={strategyInput}
                                value={settings.finalTarget ?? ''}
                                onChange={(e) =>
                                    setSettings(s => ({
                                        ...s,
                                        finalTarget: e.target.value || null
                                    }))
                                }
                                onBlur={() => saveSubjectSettings(subjectName, settings)}
                                placeholder="ゴール設定"
                            />
                        </div>
                    )}
                </section>

                <section>

                    <div style={subjectUi.monthNav}>
                        <button style={subjectUi.navBtn} onClick={prevMonth}>‹</button>

                        <span style={{ ...strategyLabel, color: 'rgba(55,53,47,0.4)' }}>

                        </span>
                        <span style={subjectUi.monthLabel}>
                        {viewYear}年{viewMonth}月の注力ポイント
                            </span>

                        <button style={subjectUi.navBtn} onClick={nextMonth}>›</button>
                    </div>

                    {goalLoading ? (
                        <div style={subjectUi.muted}>読み込み中...</div>
                    ) : (
                        <textarea
                            style={strategyTextarea}
                            value={monthlyGoal}
                            onChange={(e) => setMonthlyGoal(e.target.value)}
                            onBlur={() =>
                                saveSubjectMonthlyGoal(
                                    subjectName,
                                    viewYear,
                                    viewMonth,
                                    monthlyGoal || null
                                )
                            }
                            placeholder="今月の方針"
                        />
                    )}
                </section>

                {/* ACTIVITY */}
                <section style={subjectUi.card}>
                    <div>
                        <h3 style={subjectUi.title}>ACTIVITY</h3>
                        <div style={subjectUi.monthNav}>
                            <button style={subjectUi.navBtn} onClick={prevMonth}>‹</button>
                            <span style={subjectUi.monthLabel}>{viewYear}/{viewMonth}</span>
                            <button style={subjectUi.navBtn} onClick={nextMonth}>›</button>
                        </div>
                    </div>

                    <SubjectActivity
                        subjectName={subjectName}
                        viewYear={viewYear}
                        viewMonth={viewMonth}
                    />
                </section>

                {/* 統計 */}
                <section style={subjectUi.card}>
                    {statsLoading ? (
                        <p style={loadingText}>読み込み中...</p>
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
                                <p style={{ ...subSectionLabel, marginTop: 0, marginBottom: 0 }}>弱点分析</p>
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

                {/* SUB CATEGORIES */}
                <section>
                    <SubCategoryList
                        subjectName={subjectName}
                        subCategories={subCategories}
                        setSubCategories={setSubCategories}
                        addSubCategory={addSubCategory}
                        updateSubCategory={updateSubCategory}
                        deleteSubCategory={deleteSubCategory}
                    />
                </section>

                {/* DANGER */}
                <section>
                    <SubjectDangerZone
                        subjectName={subjectName}
                        deleteSubject={deleteSubject}
                        subjects={subjects}
                        setSubjects={setSubjects}
                        subCategories={subCategories}
                        setSubCategories={setSubCategories}
                        navigate={navigate}
                    />
                </section>
                {showFlashConfig && (
                    <FlashBugfixConfigModal
                        subjectName={subjectName}
                        subCategories={items}
                        onClose={() => setShowFlashConfig(false)}
                        onStart={handleFlashStart}
                    />
                )}
            </div>
        </div>
    )
}

const strategyLabel: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: c.blue,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
}
const strategyTextarea: React.CSSProperties = {
    border: 'none',
    resize: 'none',
    fontSize: '14px',
    lineHeight: '1.6',
    color: c.text,
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
}
const strategyInput: React.CSSProperties = {
    border: 'none',
    fontSize: '15px',
    color: c.text,
    outline: 'none',
    backgroundColor: 'transparent',
    fontWeight: 600,
    width: '100%',
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