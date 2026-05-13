import {useEffect, useState} from 'react'
import type {SubjectActivityDay} from '@/types/workspace'
import {SubjectActivityChart} from '@/components/subject/SubjectActivityChart'
import {fetchSubjectActivity} from '@/lib/api/subjects'
import {subjectUi} from "@/styles/subjectUI.ts";

export function SubjectActivity({
                                    subjectName,
                                    viewYear,
                                    viewMonth,
                                }: {
    subjectName: string
    viewYear: number
    viewMonth: number
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
            <div style={{ marginBottom: '32px' }}>
                    <span style={{ ...subjectUi.sectionHeading, marginLeft: '40vw', display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#2383e2' }}>─ 学習時間</span>
                        <span style={{ color: 'rgba(235,87,87,0.6)' }}>▌ 問題追加</span>
                    </span>
                {loading ? (
                    <div style={subjectUi.muted}>読み込み中...</div>
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
