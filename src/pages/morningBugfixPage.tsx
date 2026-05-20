import {useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {addStudySession} from '@/lib/api/workspace'
import {fetchStopwatch, resetStopwatch, startStopwatch, stopStopwatch} from '@/lib/api/stopwatch'
import {useTimer} from '@/context/TimerContext'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {useQuizSession} from '@/hooks/useQuizSession'
import {QuizSessionView} from '@/components/practice/QuizSessionView'
import {font} from '@/styles/notion'

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  return 'night'
}

export default function MorningBugfixPage() {
  const navigate = useNavigate()
  const { setTime, setIsActive } = useTimer()

  const session = useQuizSession({ type: 'morning' })
  const { phase, setPhase, session: quizSession, results } = session

  useEffect(() => {
    if (!quizSession) return
    const initStopwatch = async () => {
      try {
        await resetStopwatch()
        await startStopwatch()
        setTime(0)
        setIsActive(true)
      } catch {}
    }
    initStopwatch()
  }, [quizSession, setTime, setIsActive])

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      await stopStopwatch()
      setIsActive(false)
      const sw = await fetchStopwatch()
      const totalMinutes = Math.max(1, Math.ceil(sw.elapsedSeconds / 60))
      const uniqueSubjects = [...new Set(results.map((r) => r.question.subject))]
      const minutesPerSubject = Math.max(1, Math.ceil(totalMinutes / uniqueSubjects.length))
      const timeSlot = currentTimeSlot()
      await Promise.all(
        uniqueSubjects.map((subject) => {
          const first = results.find((r) => r.question.subject === subject)!
          return addStudySession({
            dailyLogDate: todayString(),
            subject,
            material: 'MorningBugfix',
            subCategory: first.question.sub_category || null,
            minutes: minutesPerSubject,
            timeSlot,
            memo: null,
          })
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      navigate(`/workspace/${todayString()}`)
    }
  }

  const headerBadge = (
    <span style={{ fontSize: font.sm, fontWeight: 700, color: '#37352f' }}>
      Morning Bugfix
    </span>
  )

  return (
    <QuizSessionView
      {...session}
      handleComplete={handleComplete}
      headerBadge={headerBadge}
      themeKey="morning"
    />
  )
}
