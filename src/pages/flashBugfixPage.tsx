import {useLocation, useNavigate, useParams} from 'react-router-dom'
import type {DegBugfixConfig, FlashBugfixConfig} from '@/lib/api/morningQuiz'
import {fetchDegBugfix, fetchFlashBugfix} from '@/lib/api/morningQuiz'
import {addStudySession} from '@/lib/api/workspace'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {font} from '@/styles/notion'
import {useFlashCardSession} from '@/hooks/useFlashCardSession'
import {FlashCardSessionView} from '@/components/practice/FlashCardSessionView'

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  return 'night'
}

type PageState = {
  config?: FlashBugfixConfig
  mode?: 'deg'
  degConfig?: DegBugfixConfig
} | null

// ── Flash Bugfix（科目別）────────────────────────────────────────────────────

function FlashBugfixView({
  subjectName,
  config,
}: {
  subjectName: string
  config: FlashBugfixConfig
}) {
  const navigate = useNavigate()
  const cardSession = useFlashCardSession(() => fetchFlashBugfix(subjectName, config))
  const {phase, setPhase, startTimeRef} = cardSession

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      await addStudySession({
        dailyLogDate: todayString(),
        subject: subjectName,
        material: 'FlashBugfix',
        subCategory: null,
        minutes: totalMinutes,
        timeSlot: currentTimeSlot(),
        memo: null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      navigate(`/subjects/${encodeURIComponent(subjectName)}`)
    }
  }

  return (
    <FlashCardSessionView
      {...cardSession}
      handleComplete={handleComplete}
      headerBadge={<span style={{fontSize: font.sm, fontWeight: 700, color: '#37352f'}}>{subjectName}</span>}
      themeKey="flash"
    />
  )
}

// ── Deg Bugfix（良問リスト）──────────────────────────────────────────────────

function DegBugfixView({degConfig}: {degConfig: DegBugfixConfig}) {
  const navigate = useNavigate()
  const cardSession = useFlashCardSession(() => fetchDegBugfix(degConfig))
  const {phase, setPhase, results, startTimeRef} = cardSession

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      const timeSlot = currentTimeSlot()
      const uniqueSubjects = [...new Set(results.map((r) => r.question.subject))]
      const minutesPerSubject = Math.max(1, Math.ceil(totalMinutes / uniqueSubjects.length))
      await Promise.all(
        uniqueSubjects.map((subject) =>
          addStudySession({
            dailyLogDate: todayString(),
            subject,
            material: 'DegBugfix',
            subCategory: null,
            minutes: minutesPerSubject,
            timeSlot,
            memo: null,
          })
        )
      )
    } catch (e) {
      console.error(e)
    } finally {
      navigate('/notelist')
    }
  }

  return (
    <FlashCardSessionView
      {...cardSession}
      handleComplete={handleComplete}
      headerBadge={<span style={{fontSize: font.sm, fontWeight: 700, color: '#37352f'}}>DegBugfix</span>}
      themeKey="deg"
    />
  )
}

// ── メインページ ──────────────────────────────────────────────────────────────

export default function FlashBugfixPage() {
  const {name: encodedName} = useParams<{name: string}>()
  const subjectName = decodeURIComponent(encodedName ?? '')
  const location = useLocation()

  const locationState = location.state as PageState
  const isDeg = locationState?.mode === 'deg'
  const degConfig = locationState?.degConfig ?? null
  const config: FlashBugfixConfig = locationState?.config ?? {
    failureTypes: [],
    subCategoryIds: [],
    touchedOrder: null,
    limit: 5,
    proficiency: ['△', '×'],
  }

  if (isDeg && degConfig) {
    return <DegBugfixView degConfig={degConfig} />
  }

  return <FlashBugfixView subjectName={subjectName} config={config} />
}
