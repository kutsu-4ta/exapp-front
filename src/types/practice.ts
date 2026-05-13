export type SelfJudgement = '○' | '△' | '×'

export type PracticeQuestionRecord = {
  index: number
  judgement: SelfJudgement
  elapsedMs: number
  note: string | null
}

export type PracticeSessionPhase = 'idle' | 'active' | 'complete'
