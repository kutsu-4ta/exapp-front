import {useEffect, useRef, useState} from 'react'
import {
    fetchFlashCard,
    type FlashBugfixConfig,
    type MorningQuizQuestion,
    type MorningQuizSession,
} from '@/lib/api/morningQuiz'
import {createDailyLog, fetchDailyLog} from '@/lib/api/workspace'
import {todayString} from '@/types/workspace'

export type FlashCardPhase = 'loading' | 'active' | 'error' | 'result' | 'saving'

export type CardResult = {
  question: MorningQuizQuestion
  selfCorrect: boolean
}

export function useFlashCardSession(subjectName: string, config: FlashBugfixConfig) {
  const [phase, setPhase] = useState<FlashCardPhase>('loading')
  const [session, setSession] = useState<MorningQuizSession | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<CardResult[]>([])
  const startTimeRef = useRef<number>(Date.now())

  const total = session?.questions.length ?? config.limit
  const currentQ = session?.questions[currentIdx] ?? null

  const handleFlip = () => {
    if (phase !== 'active' || flipped) return
    setFlipped(true)
  }

  const handleSelfEval = (selfCorrect: boolean) => {
    if (!currentQ) return
    const newResults = [...results, {question: currentQ, selfCorrect}]
    setResults(newResults)
    if (currentIdx + 1 >= total) {
      setPhase('result')
    } else {
      setCurrentIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        const existing = await fetchDailyLog(todayString())
        if (!existing) await createDailyLog(todayString())
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'エラーが発生しました')
        setPhase('error')
        return
      }

      startTimeRef.current = Date.now()

      try {
        const sess = await fetchFlashCard(subjectName, config)
        setSession(sess)
        setPhase('active')
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'エラーが発生しました')
        setPhase('error')
      }
    }
    run()
  }, [])

  return {
    phase,
    setPhase,
    session,
    errorMsg,
    currentIdx,
    flipped,
    results,
    startTimeRef,
    total,
    currentQ,
    handleFlip,
    handleSelfEval,
  }
}
