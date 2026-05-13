import {useEffect, useRef, useState} from 'react'
import {fetchMorningQuiz, type MorningQuizAnswer, type MorningQuizSession,} from '@/lib/api/morningQuiz'

const OPTION_LABELS = ['ア', 'イ', 'ウ', 'エ']

const SUBJECT_COLORS = [
  { bg: 'rgba(35,131,226,0.1)', color: '#2383e2' },
  { bg: 'rgba(235,87,87,0.1)', color: '#eb5757' },
  { bg: 'rgba(242,171,38,0.1)', color: '#d4920f' },
  { bg: 'rgba(39,174,96,0.1)', color: '#19a576' },
  { bg: 'rgba(155,89,182,0.1)', color: '#8e44ad' },
  { bg: 'rgba(230,126,34,0.1)', color: '#c0392b' },
]

function subjectColor(subject: string) {
  let h = 0
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) & 0xffff
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length]
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

type Phase = 'loading' | 'error' | 'active' | 'saving'

type CompletionPayload = {
  sessionId: string
  answers: MorningQuizAnswer[]
  elapsedMs: number
  correctCount: number
}

type Props = {
  onComplete: (payload: CompletionPayload) => Promise<void>
  onCancel: () => void
}

export function MorningQuiz({ onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<MorningQuizSession | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<MorningQuizAnswer[]>([])
  const [correctCount, setCorrectCount] = useState(0)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    fetchMorningQuiz()
      .then((s) => {
        setSession(s)
        setPhase('active')
      })
      .catch((e) => {
        setErrorMsg(e.message ?? 'エラーが発生しました')
        setPhase('error')
      })
  }, [])

  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  const currentQ = session?.questions[currentIdx]
  const total = session?.questions.length ?? 5

  const handleSelect = (idx: number) => {
    if (revealed || phase !== 'active') return
    setSelected(idx)
    setRevealed(true)
  }

  const handleNext = async () => {
    if (selected === null || !currentQ || !session) return

    const isCorrect = selected === currentQ.quiz.correct_index
    const newAnswers = [...answers, { question_id: currentQ.id, selected_index: selected }]
    const newCorrect = correctCount + (isCorrect ? 1 : 0)

    setAnswers(newAnswers)
    setCorrectCount(newCorrect)

    if (currentIdx + 1 >= total) {
      setPhase('saving')
      await onComplete({
        sessionId: session.session_id,
        answers: newAnswers,
        elapsedMs: Date.now() - startRef.current,
        correctCount: newCorrect,
      })
    } else {
      setCurrentIdx((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  if (phase === 'loading') {
    return (
      <div className="rounded-xl border border-[rgba(55,53,47,0.08)] bg-white p-6 mb-4 flex items-center justify-center gap-2 text-[13px] text-[rgba(55,53,47,0.35)]">
        <svg
          className="animate-spin"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        クイズを準備しています...
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-[rgba(235,87,87,0.15)] bg-[rgba(235,87,87,0.03)] p-5 mb-4">
        <p className="text-[13px] text-[rgba(235,87,87,0.7)] mb-3">{errorMsg}</p>
        <button
          onClick={onCancel}
          className="text-[12px] text-[rgba(55,53,47,0.4)] underline cursor-pointer border-none bg-transparent"
        >
          キャンセル
        </button>
      </div>
    )
  }

  if (!currentQ) return null

  const { quiz, subject, sub_category } = currentQ
  const sc = subjectColor(subject)
  const isCorrect = selected === quiz.correct_index
  const isOver = elapsedSeconds >= 300

  return (
    <div className="rounded-xl border border-[rgba(55,53,47,0.08)] bg-white mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(55,53,47,0.06)] bg-[rgba(55,53,47,0.01)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-[rgba(55,53,47,0.3)] uppercase">
            MORNING BUGFIX
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: sc.bg, color: sc.color }}
          >
            {subject}
          </span>
          {sub_category && (
            <span className="text-[11px] text-[rgba(55,53,47,0.35)]">{sub_category}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={[
              'text-[12px] font-mono font-semibold tabular-nums',
              isOver ? 'text-[#eb5757]' : 'text-[rgba(55,53,47,0.3)]',
            ].join(' ')}
          >
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-[11px] font-bold text-[rgba(55,53,47,0.4)]">
            {currentIdx + 1}
            <span className="font-normal text-[rgba(55,53,47,0.25)]">/{total}</span>
          </span>
          <button
            onClick={onCancel}
            disabled={phase === 'saving'}
            className="text-[rgba(55,53,47,0.2)] hover:text-[rgba(55,53,47,0.5)] transition-colors border-none bg-transparent cursor-pointer"
            title="終了"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-[rgba(55,53,47,0.05)]">
        <div
          className="h-full bg-n-blue transition-all duration-300"
          style={{ width: `${((currentIdx + (revealed ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="p-5">
        {/* Question */}
        <p className="text-[14px] font-medium text-[rgba(55,53,47,0.85)] leading-relaxed mb-5 whitespace-pre-wrap">
          {quiz.question}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2 mb-4">
          {quiz.options.map((opt, i) => {
            const isSelected = selected === i
            const isCorrectOption = i === quiz.correct_index
            let style = 'bg-white border-[rgba(55,53,47,0.12)] text-[rgba(55,53,47,0.8)]'
            if (revealed) {
              if (isCorrectOption)
                style = 'bg-[rgba(39,174,96,0.08)] border-[rgba(39,174,96,0.4)] text-[#19a576]'
              else if (isSelected && !isCorrectOption)
                style =
                  'bg-[rgba(235,87,87,0.07)] border-[rgba(235,87,87,0.35)] text-[rgba(235,87,87,0.8)]'
              else style = 'bg-white border-[rgba(55,53,47,0.07)] text-[rgba(55,53,47,0.3)]'
            } else {
              style =
                'bg-white border-[rgba(55,53,47,0.12)] text-[rgba(55,53,47,0.8)] hover:bg-[rgba(35,131,226,0.04)] hover:border-[rgba(35,131,226,0.3)] cursor-pointer'
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border text-[13px] transition-colors ${style}`}
              >
                <span
                  className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{
                    borderColor:
                      revealed && isCorrectOption
                        ? '#19a576'
                        : revealed && isSelected
                          ? 'rgba(235,87,87,0.5)'
                          : 'currentColor',
                    backgroundColor:
                      revealed && isCorrectOption
                        ? '#19a576'
                        : revealed && isSelected && !isCorrectOption
                          ? 'rgba(235,87,87,0.15)'
                          : 'transparent',
                    color: revealed && isCorrectOption ? '#fff' : 'currentColor',
                  }}
                >
                  {OPTION_LABELS[i]}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback + Explanation */}
        {revealed && (
          <div
            className={[
              'rounded-lg px-4 py-3 mb-4 border',
              isCorrect
                ? 'bg-[rgba(39,174,96,0.06)] border-[rgba(39,174,96,0.2)]'
                : 'bg-[rgba(235,87,87,0.05)] border-[rgba(235,87,87,0.15)]',
            ].join(' ')}
          >
            <p
              className={[
                'text-[12px] font-bold mb-1.5',
                isCorrect ? 'text-[#19a576]' : 'text-[#eb5757]',
              ].join(' ')}
            >
              {isCorrect
                ? '✓ 正解'
                : '✗ 不正解 — 正解は「' + OPTION_LABELS[quiz.correct_index] + '」'}
            </p>
            <p className="text-[13px] text-[rgba(55,53,47,0.7)] leading-relaxed whitespace-pre-wrap">
              {quiz.explanation}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[rgba(55,53,47,0.25)]">
            {currentQ.problem_context.original_ref}
          </span>
          {revealed && (
            <button
              onClick={handleNext}
              disabled={phase === 'saving'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-n-text text-white text-[12px] font-bold border-none cursor-pointer disabled:opacity-50"
            >
              {phase === 'saving' ? '保存中...' : currentIdx + 1 >= total ? '完了する' : '次の問題'}
              {phase !== 'saving' && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
