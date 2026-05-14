import {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  fetchFlashBugfix,
  type FlashBugfixConfig,
  type MorningQuizQuestion,
  type MorningQuizSession,
} from '@/lib/api/morningQuiz'
import {ProblemEditModal} from '@/components/practice/ProblemEditModal'
import {addStudySession, createDailyLog, fetchDailyLog} from '@/lib/api/workspace'
import type {TimeSlot} from '@/types/workspace'
import {todayString} from '@/types/workspace'
import {c, font} from '@/styles/notion'
import {SUBJECT_PALETTE} from "@/styles/subjectUI.ts";
import {OPTION_LABELS} from "@/styles/practiceUI.ts";

function subjectPalette(subject: string) {
  let h = 0
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) & 0xffff
  return SUBJECT_PALETTE[h % SUBJECT_PALETTE.length]
}

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  if (h < 18) return 'commute'
  return 'night'
}

type Phase = 'loading' | 'active' | 'error' | 'result' | 'saving'

type QuestionResult = {
  question: MorningQuizQuestion
  selectedIdx: number
  isCorrect: boolean
}

export default function FlashBugfixPage() {
  const { name: encodedName } = useParams<{ name: string }>()
  const subjectName = decodeURIComponent(encodedName ?? '')
  const navigate = useNavigate()
  const location = useLocation()
  const config: FlashBugfixConfig = (location.state as { config?: FlashBugfixConfig } | null)
    ?.config ?? {
    failureTypes: [],
    subCategoryIds: [],
    touchedOrder: null,
    limit: 5,
    proficiency: ['△', '×'],
  }

  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<MorningQuizSession | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const configRef = useRef<FlashBugfixConfig>(config)

  const total = session?.questions.length ?? 5
  const currentQ = session?.questions[currentIdx]

  const handleSelect = (idx: number) => {
    if (revealed || phase !== 'active') return
    setSelected(idx)
    setRevealed(true)
  }

  const handleNext = () => {
    if (selected === null || !currentQ) return
    const isCorrect = selected === currentQ.quiz.correct_index
    const newResults: QuestionResult[] = [
      ...results,
      { question: currentQ, selectedIdx: selected, isCorrect },
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

  const handleComplete = async () => {
    if (phase === 'saving') return
    setPhase('saving')
    try {
      const elapsedMs = Date.now() - startTimeRef.current
      const totalMinutes = Math.max(1, Math.ceil(elapsedMs / 60_000))
      const timeSlot = currentTimeSlot()
      await addStudySession({
        dailyLogDate: todayString(),
        subject: subjectName,
        material: 'FlashBugfix',
        subCategory: null,
        minutes: totalMinutes,
        timeSlot,
        memo: null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      navigate(`/subjects/${encodeURIComponent(subjectName)}`)
    }
  }

  const palette = subjectPalette(subjectName)

  const startQuiz = async () => {
    setPhase('loading')

    await new Promise(requestAnimationFrame)

    try {
      const existing = await fetchDailyLog(todayString())

      if (!existing) {
        await createDailyLog(todayString())
      }

      startTimeRef.current = Date.now()

      const sess = await fetchFlashBugfix(
          subjectName,
          configRef.current,
      )

      setSession(sess)
      setPhase('active')
    } catch (e) {
      setErrorMsg(
          e instanceof Error
              ? e.message
              : 'エラーが発生しました',
      )
      setPhase('error')
    }
  }

  useEffect(() => {
    startQuiz()
  }, [])

  // ── LOADING ────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
        <div style={loadingPage}>
          <div style={loadingBox}>
            <div style={loadingSpinner} />
            <p style={loadingText}>問題を準備しています...</p>
          </div>
        </div>
    )
  }

  // ── ERROR ───────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={page}>
        <div style={centerBox}>
          <p style={{ fontSize: font.base, color: c.red, marginBottom: '16px' }}>{errorMsg}</p>
          <button style={backBtnStyle} onClick={() => navigate(-1)}>
            ← 戻る
          </button>
        </div>
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result' || phase === 'saving') {
    const correctCount = results.filter((r) => r.isCorrect).length
    return (
      <div style={page}>
        <div style={inner}>
          <div style={resultHeader}>
            <p style={resultTitle}>完了！</p>
            <p style={resultScore}>
              <span style={resultNum}>{correctCount}</span>
              <span style={resultDenom}> / {total} 問正解</span>
            </p>
          </div>

          <div style={resultList}>
            {results.map((r, i) => {
              const p = subjectPalette(r.question.subject)
              return (
                <div key={i} style={resultRow}>
                  <span style={resultIcon}>{r.isCorrect ? '✓' : '✗'}</span>
                  <span style={{ ...subjectBadge, backgroundColor: p.bg, color: p.color }}>
                    {r.question.subject}
                  </span>
                  <span style={resultRef}>{r.question.problem_context.original_ref}</span>
                  <button
                    style={subjectLink}
                    onClick={() => setSelectedProblemId(parseInt(r.question.id, 10))}
                  >
                    →
                  </button>
                </div>
              )
            })}
          </div>

          <button
            style={{ ...completeBtn, opacity: phase === 'saving' ? 0.6 : 1 }}
            onClick={handleComplete}
            disabled={phase === 'saving'}
          >
            {phase === 'saving' ? '記録中...' : '完了する'}
          </button>
        </div>
        {selectedProblemId !== null && (
          <ProblemEditModal
            problemId={selectedProblemId}
            onClose={() => setSelectedProblemId(null)}
          />
        )}
      </div>
    )
  }

  // ── ACTIVE ──────────────────────────────────────────────────────────────────
  if (!currentQ) return null

  const { quiz, subject, sub_category, problem_context } = currentQ
  const isCorrect = revealed && selected === quiz.correct_index

  return (
    <div style={page}>
      <div style={inner}>
        {/* Header */}
        <div style={quizHeader}>
          <button style={backBtnStyle} onClick={() => navigate(-1)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ marginRight: '4px' }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            戻る
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...subjectBadge, backgroundColor: palette.bg, color: palette.color }}>
              {subjectName}
            </span>
            <span style={progressLabel}>
              {results.length + 1}{' '}
              <span style={{ color: c.textFaint, fontWeight: 400 }}>/ {total}</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={progressBarWrap}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                ...progressSegment,
                backgroundColor:
                  i < results.length
                    ? c.blue
                    : i === currentIdx
                      ? 'rgba(35,131,226,0.3)'
                      : 'rgba(55,53,47,0.08)',
              }}
            />
          ))}
        </div>

        {/* Subject */}
        <div style={subjectRow}>
          <span
            style={{
              ...subjectBadge,
              backgroundColor: subjectPalette(subject).bg,
              color: subjectPalette(subject).color,
            }}
          >
            {subject}
          </span>
          {sub_category && <span style={subCatLabel}>{sub_category}</span>}
        </div>

        {/* Question */}
        <p style={questionText}>{quiz.question}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {quiz.options.map((opt, i) => {
            const isSelected = i === selected
            const isCorrectOpt = i === quiz.correct_index

            let bg: string = '#fff'
            let border: string = 'rgba(55,53,47,0.12)'
            let color: string = c.text

            if (revealed) {
              if (isCorrectOpt) {
                bg = 'rgba(39,174,96,0.08)'
                border = 'rgba(39,174,96,0.4)'
                color = '#19a576'
              } else if (isSelected) {
                bg = 'rgba(235,87,87,0.07)'
                border = 'rgba(235,87,87,0.35)'
                color = '#eb5757'
              } else {
                color = 'rgba(55,53,47,0.3)'
                border = 'rgba(55,53,47,0.07)'
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                style={{ ...optionBtn, backgroundColor: bg, borderColor: border, color }}
              >
                <span
                  style={{
                    ...optionLabelBadge,
                    borderColor: revealed && isCorrectOpt ? '#19a576' : 'currentColor',
                    backgroundColor: revealed && isCorrectOpt ? '#19a576' : 'transparent',
                    color: revealed && isCorrectOpt ? '#fff' : 'currentColor',
                  }}
                >
                  {OPTION_LABELS[i]}
                </span>
                <span style={{ fontSize: font.base, lineHeight: 1.5 }}>{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div style={isCorrect ? feedbackCorrect : feedbackWrong}>
            <p style={{ ...feedbackTitle, color: isCorrect ? '#19a576' : '#eb5757' }}>
              {isCorrect ? '✓ 正解' : `✗ 不正解 — 正解は「${OPTION_LABELS[quiz.correct_index]}」`}
            </p>
            <p style={explanationText}>{quiz.explanation}</p>
          </div>
        )}

        {/* Footer */}
        {revealed && (
          <div style={footerRow}>
            <span style={problemRef}>{problem_context.original_ref}</span>
            <button style={nextBtn} onClick={handleNext}>
              {currentIdx + 1 >= total ? '結果を見る' : '次の問題'}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ marginLeft: '4px' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const page: React.CSSProperties = { backgroundColor: c.bg, minHeight: '100vh', color: c.text }
const inner: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '24px 20px 80px',
}
const centerBox: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '80px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
}

const quizHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
}
const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  color: c.textSub,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  padding: '4px 0',
}
const progressLabel: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: c.text }

const progressBarWrap: React.CSSProperties = { display: 'flex', gap: '4px', marginBottom: '20px' }
const progressSegment: React.CSSProperties = {
  flex: 1,
  height: '4px',
  borderRadius: '2px',
  transition: 'background-color 0.2s',
}

const subjectRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '14px',
}
const subjectBadge: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
}
const subCatLabel: React.CSSProperties = { fontSize: font.sm, color: c.textHint }

const questionText: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 500,
  color: 'rgba(55,53,47,0.9)',
  lineHeight: 1.7,
  marginBottom: '20px',
  whiteSpace: 'pre-wrap',
}

const optionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  width: '100%',
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
}
const optionLabelBadge: React.CSSProperties = {
  flexShrink: 0,
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '1px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: 700,
  marginTop: '1px',
}

const feedbackCorrect: React.CSSProperties = {
  backgroundColor: 'rgba(39,174,96,0.06)',
  border: '1px solid rgba(39,174,96,0.2)',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '16px',
}
const feedbackWrong: React.CSSProperties = {
  backgroundColor: 'rgba(235,87,87,0.05)',
  border: '1px solid rgba(235,87,87,0.15)',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '16px',
}
const feedbackTitle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: '6px',
}
const explanationText: React.CSSProperties = {
  fontSize: font.base,
  color: 'rgba(55,53,47,0.75)',
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap',
}

const footerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const problemRef: React.CSSProperties = { fontSize: font.sm, color: c.textFaint }
const nextBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 18px',
  backgroundColor: c.text,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
}

const resultHeader: React.CSSProperties = { textAlign: 'center', padding: '32px 0 28px' }
const resultTitle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  color: c.text,
  marginBottom: '8px',
}
const resultScore: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: '2px',
}
const resultNum: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 900,
  color: c.blue,
  lineHeight: 1,
}
const resultDenom: React.CSSProperties = { fontSize: '16px', color: c.textSub, fontWeight: 600 }

const resultList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginBottom: '32px',
  border: `1px solid ${c.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
}
const resultRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 14px',
  borderBottom: `1px solid ${c.border}`,
  backgroundColor: '#fff',
}
const resultIcon: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  width: '16px',
  flexShrink: 0,
}
const resultRef: React.CSSProperties = {
  fontSize: '12px',
  color: c.textSub,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const subjectLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  color: c.textHint,
  padding: '0 4px',
  flexShrink: 0,
}

const completeBtn: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  backgroundColor: c.text,
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: font.base,
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}
const loadingSpinner: React.CSSProperties = {
  width: '28px',
  height: '28px',
  border: '3px solid rgba(55,53,47,0.12)',
  borderTop: `3px solid ${c.blue}`,
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}

const loadingText: React.CSSProperties = {
  fontSize: font.base,
  color: c.textSub,
}
const loadingPage: React.CSSProperties = {
  backgroundColor: c.bg,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const loadingBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
}