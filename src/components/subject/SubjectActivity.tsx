import {useEffect, useState} from 'react'
import type {SubjectActivityDay} from '@/types/workspace'
import {SubjectActivityChart} from '@/components/subject/SubjectActivityChart'
import {fetchSubjectActivity} from '@/lib/api/subjects'
import {subjectUi} from "@/styles/subjectUI.ts";
import {Skeleton} from "@/components/common/Skeleton.tsx";

export function SubjectActivity({
                                    subjectName,
                                    viewYear,
                                    viewMonth,
                                    monthlyGoal,
                                    setMonthlyGoal,
                                    goalLoading,
                                    saveSubjectMonthlyGoal,
                                    prevMonth,
                                    nextMonth,
                                }: {
    subjectName: string
    viewYear: number
    viewMonth: number
    monthlyGoal: string
    setMonthlyGoal: (v: string) => void
    goalLoading: boolean
    saveSubjectMonthlyGoal: (
        subjectName: string,
        year: number,
        month: number,
        goal: string | null
    ) => void

    prevMonth: () => void
    nextMonth: () => void
}) {
    const [activityData, setActivityData] = useState<SubjectActivityDay[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        fetchSubjectActivity(subjectName, viewYear, viewMonth)
            .then(setActivityData)
            .finally(() => setLoading(false))
    }, [subjectName, viewYear, viewMonth])

    return (
        <div style={subjectUi.subContainer}>

            {/* 月次方針 + 月送り */}
            <section>
                <div style={monthNav}>
                    <button style={navBtn} onClick={prevMonth}>‹</button>
                    <span style={monthLabel}>
                        {viewYear}年{viewMonth}
                    </span>
                    <button style={navBtn} onClick={nextMonth}>›</button>
                </div>

                {goalLoading ? (
                    <Skeleton height={54} borderRadius={8} style={{ marginBottom: 8 }} />
                ) : (
                    <div>
                        <label style={label}>月次方針</label>
                        <textarea
                            style={textarea}
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
                    </div>
                )}
            </section>

            <div style={{ marginBottom: '32px' }}>
                    <span style={{ ...subjectUi.sectionHeading, marginLeft: '40vw', display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#2383e2' }}>─ 学習時間</span>
                        <span style={{ color: 'rgba(235,87,87,0.6)' }}>▌ 問題追加</span>
                    </span>
                {loading ? (
                    <Skeleton height={120} borderRadius={8} style={{ marginTop: 8 }} />
                ) : (
                    <SubjectActivityChart
                        data={activityData}
                        year={viewYear}
                        month={viewMonth}
                    />
                )}
            </div>
        </div>
    )
}

/* styles */
const label: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(55,53,47,0.4)",
    marginBottom: "8px",
    display: "block",
}

const textarea: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: "14px",
    lineHeight: "1.6",
    background: "transparent",
}


const monthNav: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
}

const navBtn: React.CSSProperties = {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fff",
    cursor: "pointer",
}

const monthLabel: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
}