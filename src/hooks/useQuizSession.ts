import {useEffect, useRef, useState} from 'react'
import {
  type DegBugfixConfig,
  fetchDegBugfix,
  fetchFlashBugfix,
  fetchMorningQuiz,
  type FlashBugfixConfig,
  type MorningQuizQuestion,
  type MorningQuizSession,
} from '@/lib/api/morningQuiz'
import {addProblemQuiz, fetchProblem} from '@/lib/api/problem'
import {createDailyLog, fetchDailyLog} from '@/lib/api/workspace'
import type {Problem} from '@/types/workspace'
import {todayString} from '@/types/workspace'

export type QuizSessionMode =
  | {type: 'morning'}
  | {type: 'flash'; subjectName: string; config: FlashBugfixConfig}
  | {type: 'deg'; config: DegBugfixConfig}
  | {type: 'preloaded'; session: MorningQuizSession}

export type QuizPhase = 'loading' | 'active' | 'error' | 'result' | 'saving'

export type QuestionResult = {
  question: MorningQuizQuestion
  selectedIdx: number
  isCorrect: boolean
}

export function useQuizSession(mode: QuizSessionMode) {
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [session, setSession] = useState<MorningQuizSession | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [prefetchedProblems, setPrefetchedProblems] = useState<Record<number, Problem>>({})
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set())
  const startTimeRef = useRef<number>(Date.now())
  const modeRef = useRef(mode)
  const initializedRef = useRef(false)

  const total = session?.questions.length ?? 5
  const currentQ = session?.questions[currentIdx] ?? null
  const currentProblemId = currentQ ? parseInt(currentQ.id, 10) : null
  const isMarked = currentProblemId !== null && markedIds.has(currentProblemId)

  const handleSelect = (idx: number) => {
    if (revealed || phase !== 'active') return
    setSelected(idx)
    setRevealed(true)
  }

  const handleNext = () => {
    if (selected === null || !currentQ || !currentQ.quiz) return
    const isCorrect = selected === currentQ.quiz.correct_index
    const problemId = parseInt(currentQ.id, 10)

    if (markedIds.has(problemId)) {
      addProblemQuiz(problemId, {
        quizType: 'multiple_choice',
        question: currentQ.quiz.question,
        options: currentQ.quiz.options,
        correctIndex: currentQ.quiz.correct_index,
        explanation: currentQ.quiz.explanation,
      }).catch(() => {})
    }

    const newResults: QuestionResult[] = [
      ...results,
      {question: currentQ, selectedIdx: selected, isCorrect},
    ]
    setResults(newResults)

    if (currentIdx + 1 >= total) {
      setPhase('result')
    } else {
      setCurrentIdx((i) => i + 1)
      setSelected(null)
      setRevealed(false)
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
    if (initializedRef.current) return
    initializedRef.current = true

    const m = modeRef.current

    const run = async () => {
      if (m.type === 'preloaded') {
        startTimeRef.current = Date.now()
        setSession(m.session)
        setPhase('active')
        return
      }

      if (m.type === 'morning' || m.type === 'flash') {
        try {
          const existing = await fetchDailyLog(todayString())
          if (!existing) await createDailyLog(todayString())
        } catch (e) {
          setErrorMsg(e instanceof Error ? e.message : 'エラーが発生しました')
          setPhase('error')
          return
        }
      }

      startTimeRef.current = Date.now()

      try {
        let sess: MorningQuizSession
        if (m.type === 'morning') {
          sess = await fetchMorningQuiz()
        } else if (m.type === 'flash') {
          sess = await fetchFlashBugfix(m.subjectName, m.config)
        } else {
          sess = await fetchDegBugfix(m.config)
        }

        const filtered = { ...sess, questions: sess.questions.filter((q) => q.quiz !== null) }
        if (filtered.questions.length === 0) {
          setErrorMsg('出題できる問題がありません')
          setPhase('error')
          return
        }
        setSession(filtered)
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
    selected,
    revealed,
    results,
    selectedProblem,
    prefetchedProblems,
    startTimeRef,
    total,
    currentQ,
    currentProblemId,
    isMarked,
    handleSelect,
    handleNext,
    openProblemModal,
    handleProblemUpdate,
    handleToggleMark,
    closeSelectedProblem: () => setSelectedProblem(null),
  }
}
