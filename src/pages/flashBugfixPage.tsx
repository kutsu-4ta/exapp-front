import {useLocation, useNavigate, useParams} from 'react-router-dom'
import type {DegBugfixConfig, FlashBugfixConfig, MorningQuizSession} from '@/lib/api/morningQuiz'
import {fetchDegWordCard, fetchFlashCard} from '@/lib/api/morningQuiz'
import {addStudySession} from '@/lib/api/workspace'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {font} from '@/styles/notion'
import {type QuizSessionMode, useQuizSession} from '@/hooks/useQuizSession'
import {QuizSessionView} from '@/components/practice/QuizSessionView'
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
  preloadedSession?: MorningQuizSession
  mode?: 'deg'
  degConfig?: DegBugfixConfig
} | null

// ── 一問一答ビュー ────────────────────────────────────────────────────────────

function MultipleChoiceView({
  subjectName,
  quizSessionMode,
  isDeg,
  degConfig,
}: {
  subjectName: string
  quizSessionMode: QuizSessionMode
  isDeg: boolean
  degConfig: DegBugfixConfig | null
}) {
  const themeKey = isDeg ? 'deg' : 'flash'
  const navigate = useNavigate()
  const session = useQuizSession(quizSessionMode)
  const {phase, setPhase, startTimeRef, results} = session

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      const timeSlot = currentTimeSlot()

      if (isDeg && !degConfig?.subject) {
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
      } else {
        await addStudySession({
          dailyLogDate: todayString(),
          subject: subjectName,
          material: isDeg ? 'DegBugfix' : 'FlashBugfix',
          subCategory: null,
          minutes: totalMinutes,
          timeSlot,
          memo: null,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      navigate(isDeg ? '/notelist' : `/subjects/${encodeURIComponent(subjectName)}`)
    }
  }

  const headerBadge = (
    <span style={{ fontSize: font.sm, fontWeight: 700, color: '#37352f' }}>
      {isDeg ? 'DegBugfix' : subjectName}
    </span>
  )

  return (
    <QuizSessionView
      {...session}
      handleComplete={handleComplete}
      headerBadge={headerBadge}
      hideQuizzes={isDeg}
      themeKey={themeKey}
    />
  )
}

// ── 単語カードビュー（FlashBugfix） ──────────────────────────────────────────

function WordCardView({
  subjectName,
  config,
}: {
  subjectName: string
  config: FlashBugfixConfig
}) {
  const navigate = useNavigate()
  const cardSession = useFlashCardSession(() => fetchFlashCard(subjectName, config))
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
      headerBadge={<span style={{ fontSize: font.sm, fontWeight: 700, color: '#37352f' }}>{subjectName}</span>}
      themeKey="flash"
    />
  )
}

// ── 単語カードビュー（DegBugfix） ─────────────────────────────────────────────

function DegWordCardView({degConfig}: {degConfig: DegBugfixConfig}) {
  const navigate = useNavigate()
  const cardSession = useFlashCardSession(() => fetchDegWordCard(degConfig))
  const {phase, setPhase, startTimeRef, results} = cardSession

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      const timeSlot = currentTimeSlot()

      if (!degConfig.subject) {
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
      } else {
        await addStudySession({
          dailyLogDate: todayString(),
          subject: degConfig.subject,
          material: 'DegBugfix',
          subCategory: null,
          minutes: totalMinutes,
          timeSlot,
          memo: null,
        })
      }
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
      headerBadge={<span style={{ fontSize: font.sm, fontWeight: 700, color: '#37352f' }}>DegBugfix</span>}
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
  const config: FlashBugfixConfig = locationState?.config ?? {
    failureTypes: [],
    subCategoryIds: [],
    touchedOrder: null,
    limit: 5,
    proficiency: ['△', '×'],
    quizMode: 'multiple_choice',
    formulaOnly: false,
  }
  const preloadedSession = locationState?.preloadedSession ?? null
  const isDeg = locationState?.mode === 'deg'
  const degConfig = locationState?.degConfig ?? null

  if (!preloadedSession && !isDeg && config.quizMode === 'word_card') {
    return <WordCardView subjectName={subjectName} config={config} />
  }

  if (isDeg && degConfig?.quizMode === 'word_card') {
    return <DegWordCardView degConfig={degConfig} />
  }

  const quizSessionMode: QuizSessionMode = preloadedSession
    ? {type: 'preloaded', session: preloadedSession}
    : isDeg && degConfig
      ? {type: 'deg', config: degConfig}
      : {type: 'flash', subjectName, config}

  return (
    <MultipleChoiceView
      subjectName={subjectName}
      quizSessionMode={quizSessionMode}
      isDeg={isDeg}
      degConfig={degConfig}
    />
  )
}
