import {useLocation, useNavigate, useParams} from 'react-router-dom'
import type {DegBugfixConfig, FlashBugfixConfig, MorningQuizSession} from '@/lib/api/morningQuiz'
import {addStudySession} from '@/lib/api/workspace'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {font} from '@/styles/notion'
import {subjectPalette} from '@/styles/subjectUI'
import {type QuizSessionMode, useQuizSession} from '@/hooks/useQuizSession'
import {QuizSessionView} from '@/components/practice/QuizSessionView'

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  if (h < 18) return 'commute'
  return 'night'
}

export default function FlashBugfixPage() {
  const { name: encodedName } = useParams<{ name: string }>()
  const subjectName = decodeURIComponent(encodedName ?? '')
  const navigate = useNavigate()
  const location = useLocation()

  type LocationState = {
    config?: FlashBugfixConfig
    preloadedSession?: MorningQuizSession
    mode?: 'deg'
    degConfig?: DegBugfixConfig
  } | null
  const locationState = location.state as LocationState
  const config: FlashBugfixConfig = locationState?.config ?? {
    failureTypes: [],
    subCategoryIds: [],
    touchedOrder: null,
    limit: 5,
    proficiency: ['△', '×'],
  }
  const preloadedSession = locationState?.preloadedSession ?? null
  const isDeg = locationState?.mode === 'deg'
  const degConfig = locationState?.degConfig ?? null

  const quizMode: QuizSessionMode = preloadedSession
    ? {type: 'preloaded', session: preloadedSession}
    : isDeg && degConfig
      ? {type: 'deg', config: degConfig}
      : {type: 'flash', subjectName, config}

  const session = useQuizSession(quizMode)
  const { phase, setPhase, startTimeRef } = session

  const palette = subjectPalette(subjectName)
  const headerBadge = (
    <span style={{
      fontSize: font.sm,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '4px',
      backgroundColor: palette.bg,
      color: palette.color,
    }}>
      {subjectName}
    </span>
  )

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      await addStudySession({
        dailyLogDate: todayString(),
        subject: subjectName,
        material: isDeg ? 'DegBugfix' : 'FlashBugfix',
        subCategory: null,
        minutes: totalMinutes,
        timeSlot: currentTimeSlot(),
        memo: null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      navigate(isDeg ? '/notelist' : `/subjects/${encodeURIComponent(subjectName)}`)
    }
  }

  return (
    <QuizSessionView
      {...session}
      handleComplete={handleComplete}
      headerBadge={headerBadge}
      hideQuizzes={isDeg}
    />
  )
}
