import {useEffect, useRef, useState} from 'react'
import {
  fetchFlashCard,
  type FlashBugfixConfig,
  type MorningQuizQuestion,
  type MorningQuizSession,
} from '@/lib/api/morningQuiz'
import {addProblemQuiz, fetchProblem} from '@/lib/api/problem'
import {createDailyLog, fetchDailyLog} from '@/lib/api/workspace'
import type {Problem} from '@/types/workspace'
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
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [prefetchedProblems, setPrefetchedProblems] = useState<Record<number, Problem>>({})
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set())
  const startTimeRef = useRef<number>(Date.now())

  const total = session?.questions.length ?? config.limit
  const currentQ = session?.questions[currentIdx] ?? null
  const currentProblemId = currentQ ? parseInt(currentQ.id, 10) : null
  const isMarked = currentProblemId !== null && markedIds.has(currentProblemId)

  const handleFlip = () => {
    if (phase !== 'active' || flipped) return
    setFlipped(true)
  }

  const handleSelfEval = (selfCorrect: boolean) => {
    if (!currentQ) return
    const problemId = parseInt(currentQ.id, 10)
    if (markedIds.has(problemId)) {
      addProblemQuiz(problemId, {
        quizType: 'word_card',
        question: currentQ.quiz.question,
        explanation: currentQ.quiz.explanation,
      }).catch(() => {})
    }
    const newResults = [...results, {question: currentQ, selfCorrect}]
    setResults(newResults)
    if (currentIdx + 1 >= total) {
      setPhase('result')
    } else {
      setCurrentIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  const openProblemModal = async (id: number) => {
    if (prefetchedProblems[id]) {
      setSelectedProblem(prefetchedProblems[id])
      return
    }
    try {
      const p = await fetchProblem(id)
      setPrefetchedProblems((prev) => ({...prev, [id]: p}))
      setSelectedProblem(p)
    } catch {
      /* silent */
    }
  }

  const handleProblemUpdate = (updated: Problem) => {
    setPrefetchedProblems((prev) => ({...prev, [updated.id]: updated}))
    setSelectedProblem(updated)
  }

  const handleToggleMark = () => {
    if (currentProblemId === null) return
    const id = currentProblemId
    setMarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  useEffect(() => {
    if (!session) return
    const ids = session.questions.map((q) => parseInt(q.id, 10))
    ids.forEach((id) => {
      fetchProblem(id)
        .then((p) => setPrefetchedProblems((prev) => ({...prev, [id]: p})))
        .catch(() => {})
    })
  }, [session])

  return {
    phase,
    setPhase,
    session,
    errorMsg,
    currentIdx,
    flipped,
    results,
    selectedProblem,
    prefetchedProblems,
    startTimeRef,
    total,
    currentQ,
    currentProblemId,
    isMarked,
    handleFlip,
    handleSelfEval,
    openProblemModal,
    handleProblemUpdate,
    handleToggleMark,
    closeSelectedProblem: () => setSelectedProblem(null),
  }
}
