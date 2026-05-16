import {useNavigate} from 'react-router-dom'
import {ProblemQuickModal} from '@/components/note/ProblemQuickModal'
import {c, font} from '@/styles/notion'
import {subjectPalette} from '@/styles/subjectUI'
import {OPTION_LABELS} from '@/styles/practiceUI'
import type {useQuizSession} from '@/hooks/useQuizSession'

type Props = ReturnType<typeof useQuizSession> & {
  handleComplete: () => void
  headerBadge?: React.ReactNode
  hideQuizzes?: boolean
}

export function QuizSessionView({
  phase,
  setPhase: _setPhase,
  errorMsg,
  currentIdx,
  selected,
  revealed,
  results,
  selectedProblem,
  total,
  currentQ,
  currentProblemId,
  isMarked,
  handleSelect,
  handleNext,
  openProblemModal,
  handleProblemUpdate,
  handleToggleMark,
  closeSelectedProblem,
  handleComplete,
  headerBadge,
  hideQuizzes = false,
}: Props) {
  const navigate = useNavigate()

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={loadingPage}>
        <div style={loadingBox}>
          <div style={loadingSpinner} />
          <p style={loadingText}>準備しています...</p>
        </div>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
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

  // ── RESULT ────────────────────────────────────────────────────────────────
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
                    onClick={() => openProblemModal(parseInt(r.question.id, 10))}
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
        {selectedProblem !== null && (
          <ProblemQuickModal
            problem={selectedProblem}
            onClose={closeSelectedProblem}
            onDelete={closeSelectedProblem}
            onUpdate={handleProblemUpdate}
            hideQuizzes={hideQuizzes}
          />
        )}
      </div>
    )
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (!currentQ || currentProblemId === null) return null

  const { quiz, subject, sub_category, problem_context } = currentQ
  const palette = subjectPalette(subject)
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
            {headerBadge}
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

        {/* Subject + sub_category + material + problem ref */}
        <div style={subjectRow}>
          <span style={{ ...subjectBadge, backgroundColor: palette.bg, color: palette.color }}>
            {subject}
          </span>
          {sub_category && <span style={subCatLabel}>{sub_category}</span>}
          <button
            style={problemRefBtn}
            onClick={() => openProblemModal(currentProblemId)}
          >
            {problem_context.original_ref}
          </button>
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
            <button
              style={{ ...goodQuestionBtn, ...(isMarked ? goodQuestionBtnSaved : {}) }}
              onClick={handleToggleMark}
            >
              {isMarked ? '★ 保存済み' : '☆ 保存する'}
            </button>
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

      {selectedProblem !== null && (
        <ProblemQuickModal
          problem={selectedProblem}
          onClose={closeSelectedProblem}
          onDelete={closeSelectedProblem}
          onUpdate={handleProblemUpdate}
        />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  flexWrap: 'wrap',
}
const subjectBadge: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
}
const subCatLabel: React.CSSProperties = { fontSize: font.sm, color: c.textHint }
const problemRefBtn: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textFaint,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 0',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(55,53,47,0.2)',
  textUnderlineOffset: '2px',
}

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
const goodQuestionBtn: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(234,179,8,0.4)',
  backgroundColor: 'rgba(254,249,195,0.6)',
  color: '#92400e',
  cursor: 'pointer',
  transition: 'all 0.15s',
}
const goodQuestionBtnSaved: React.CSSProperties = {
  backgroundColor: 'rgba(253,224,71,0.25)',
  borderColor: 'rgba(234,179,8,0.6)',
  color: '#78350f',
}
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
const loadingText: React.CSSProperties = { fontSize: font.base, color: c.textSub }
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
