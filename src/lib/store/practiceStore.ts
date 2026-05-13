import {create} from 'zustand'
import type {PracticeQuestionRecord, PracticeSessionPhase, SelfJudgement,} from '../../types/practice'

type PracticeState = {
  subject: string | null
  phase: PracticeSessionPhase
  questions: PracticeQuestionRecord[]
  currentIndex: number // 1-based; 現在答えようとしている問題番号
  sessionStartMs: number | null
  questionStartMs: number | null

  startSession: (subject: string) => void
  recordJudgement: (judgement: SelfJudgement, note?: string | null) => void
  completeSession: () => void
  reset: () => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  subject: null,
  phase: 'idle',
  questions: [],
  currentIndex: 1,
  sessionStartMs: null,
  questionStartMs: null,

  startSession: (subject) =>
    set({
      subject,
      phase: 'active',
      questions: [],
      currentIndex: 1,
      sessionStartMs: Date.now(),
      questionStartMs: Date.now(),
    }),

  recordJudgement: (judgement, note = null) => {
    const { currentIndex, questionStartMs, questions } = get()
    const elapsedMs = questionStartMs ? Date.now() - questionStartMs : 0
    set({
      questions: [...questions, { index: currentIndex, judgement, elapsedMs, note }],
      currentIndex: currentIndex + 1,
      questionStartMs: Date.now(),
    })
  },

  completeSession: () => set({ phase: 'complete' }),

  reset: () =>
    set({
      subject: null,
      phase: 'idle',
      questions: [],
      currentIndex: 1,
      sessionStartMs: null,
      questionStartMs: null,
    }),
}))
