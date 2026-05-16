import {useLocation, useNavigate, useParams} from 'react-router-dom'
import type {DegBugfixConfig, FlashBugfixConfig, MorningQuizSession} from '@/lib/api/morningQuiz'
import {addStudySession} from '@/lib/api/workspace'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {font} from '@/styles/notion'
import {subjectPalette} from '@/styles/subjectUI'
import {type QuizSessionMode, useQuizSession} from '@/hooks/useQuizSession'
import {QuizSessionView} from '@/components/practice/QuizSessionView'
import {useFlashCardSession} from '@/hooks/useFlashCardSession'
import {FlashCardSessionView} from '@/components/practice/FlashCardSessionView'
import {PRACTICE_THEME} from '@/styles/practiceUI'
import {useSettingsStore} from '@/lib/store/settings'

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  if (h < 18) return 'commute'
  return 'night'
}

type PageState = {
  config?: FlashBugfixConfig
  preloadedSession?: MorningQuizSession
  mode?: 'deg'
  degConfig?: DegBugfixConfig
} | null

function SubjectBadge({ name }: { name: string }) {
  const subjectColors = useSettingsStore((s) => s.subjectColors)
  const palette = subjectPalette(name, subjectColors[name])
  return (
    <span style={{
      fontSize: font.sm,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '4px',
      backgroundColor: palette.bg,
      color: palette.color,
    }}>
      {name}
    </span>
  )
}

// ── 一問一答ビュー ────────────────────────────────────────────────────────────

function MultipleChoiceView({
  subjectName,
  quizSessionMode,
  isDeg,
}: {
  subjectName: string
  quizSessionMode: QuizSessionMode
  isDeg: boolean
}) {
  const themeKey = isDeg ? 'deg' : 'flash'
  const theme = PRACTICE_THEME[themeKey]

  function makeThemeHeaderBadge(name: string) {
    return (
      <span style={{
        fontSize: font.sm,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '4px',
        backgroundColor: theme.bg,
        color: theme.color,
      }}>
        {name}
      </span>
    )
  }
  const navigate = useNavigate()
  const session = useQuizSession(quizSessionMode)
  const {phase, setPhase, startTimeRef} = session

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

  const headerLabel = isDeg ? 'DegBugfix' : subjectName
  return (
    <QuizSessionView
      {...session}
      handleComplete={handleComplete}
      headerBadge={makeThemeHeaderBadge(headerLabel)}
      hideQuizzes={isDeg}
      themeKey={themeKey}
    />
  )
}

// ── 単語カードビュー ──────────────────────────────────────────────────────────

function WordCardView({
  subjectName,
  config,
}: {
  subjectName: string
  config: FlashBugfixConfig
}) {
  const navigate = useNavigate()
  const cardSession = useFlashCardSession(subjectName, config)
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
      headerBadge={<SubjectBadge name={subjectName} />}
      themeKey="flash"
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

  const isWordCard = !preloadedSession && !isDeg && config.quizMode === 'word_card'

  if (isWordCard) {
    return <WordCardView subjectName={subjectName} config={config} />
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
    />
  )
}
