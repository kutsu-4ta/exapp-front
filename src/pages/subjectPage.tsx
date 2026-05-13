import {useNavigate, useParams} from "react-router-dom";
import {useSettingsStore} from "@/lib/store/settings.ts";
import {c} from "@/styles/notion.ts";
import {useEffect, useState} from "react";
import {addSubCategory, deleteSubCategory, updateSubCategory} from "@/lib/api/subcategory.ts";
import {SubjectDangerZone} from "@/components/subject/SubjectDangerZone.tsx";
import {
    deleteSubject,
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
import type {SubjectSettings} from "@/types/workspace.ts";
import {subjectUi} from "@/styles/subjectUI.ts";

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
