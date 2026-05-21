export const RANKS = ['A', 'B', 'C', 'D', 'E'] as const
export type Rank = (typeof RANKS)[number]

export const ANSWER_OPTIONS = ['ア', 'イ', 'ウ', 'エ', 'オ'] as const

export type ExamSessionStatus = 'in_progress' | 'scoring' | 'completed'

export type ExamQuestion = {
  id: number
  examSessionId: number
  sortOrder: number
  displayId: string
  isSub: boolean
  hasChildren: boolean
  rank: Rank | null
  myAnswer: string
  isCorrect: boolean | null
  isDoubtful: boolean
  point: number
  note: string | null
}

export type ExamSession = {
  id: number
  subject: string
  examYear: string
  status: ExamSessionStatus
  questions: ExamQuestion[]
  totalScore: number
  pureScore: number
  correctCount: number
  incorrectCount: number
  doubtfulCount: number
  createdAt: string
  completedAt: string | null
}

export type ExamSessionSummary = {
  id: number
  subject: string
  examYear: string
  totalScore: number
  pureScore: number
  createdAt: string
  completedAt: string | null
}

export type ExamQuestionInput = {
  sortOrder: number
  displayId: string
  isSub: boolean
  hasChildren: boolean
  rank: Rank | null
  myAnswer: string
  isCorrect: boolean | null
  isDoubtful: boolean
  point: number
  note: string | null
  answeredTimeMs?: number
}

export type ExamMistakeNote = {
  questionId: number
  sessionId: number
  examYear: string
  displayId: string
  rank: Rank
  note: string
  isDoubtful: boolean
  completedAt: string
}

export type ExamRankStat = {
  rank: Rank
  correctRate: number
  count: number
}

export type ExamSubjectStats = {
  subject: string
  sessionCount: number
  avgTotalScore: number
  avgPureScore: number
  rankStats: ExamRankStat[]
  recentMistakes: ExamMistakeNote[]
}

// フロントエンド専用: APIに送る前のローカル編集状態
export type QuestionDraft = {
  localId: string
  sortOrder: number
  displayId: string
  isSub: boolean
  hasChildren: boolean
  rank: Rank | null
  myAnswer: string
  isCorrect: boolean | null
  isDoubtful: boolean
  point: number
  note: string | null
  answeredTimeMs?: number
  memos?: Record<string, string>
  excludedOptions?: string[]
}
