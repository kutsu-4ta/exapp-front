import {useNavigate} from 'react-router-dom'
import {c, font} from '@/styles/notion'
import {subjectPalette} from '@/styles/subjectUI'
import {PRACTICE_THEME, type PracticeThemeKey} from '@/styles/practiceUI'
import type {useFlashCardSession} from '@/hooks/useFlashCardSession'

type Props = ReturnType<typeof useFlashCardSession> & {
  handleComplete: () => void
  headerBadge?: React.ReactNode
  themeKey?: PracticeThemeKey
}

export function FlashCardSessionView({
  phase,
  errorMsg,
  currentIdx,
  flipped,
  results,
  total,
  currentQ,
  handleFlip,
  handleSelfEval,
  handleComplete,
  headerBadge,
  themeKey = 'flash',
}: Props) {
  const navigate = useNavigate()
  const theme = PRACTICE_THEME[themeKey]

  if (phase === 'loading') {
    return (
      <div style={loadingPage}>
        <div style={loadingBox}>
          <div style={{...loadingSpinner, borderTopColor: theme.color}} />
          <p style={loadingText}>準備しています...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={page}>
        <div style={centerBox}>
          <p style={{fontSize: font.base, color: c.red, marginBottom: '16px'}}>{errorMsg}</p>
          <button style={backBtnStyle} onClick={() => navigate(-1)}>
            ← 戻る
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'result' || phase === 'saving') {
    const correctCount = results.filter((r) => r.selfCorrect).length
    return (
      <div style={page}>
        <div style={inner}>
          <div style={resultHeader}>
            <p style={resultTitle}>完了！</p>
            <p style={resultScore}>
              <span style={{...resultNum, color: theme.color}}>{correctCount}</span>
              <span style={resultDenom}> / {total} 枚 わかった</span>
            </p>
          </div>

          <div style={resultList}>
            {results.map((r, i) => {
              const p = subjectPalette(r.question.subject)
              return (
                <div key={i} style={resultRow}>
                  <span style={resultIcon}>{r.selfCorrect ? '○' : '×'}</span>
                  <span style={{...subjectBadge, backgroundColor: p.bg, color: p.color}}>
                    {r.question.subject}
                  </span>
                  <span style={resultRef}>{r.question.problem_context.original_ref}</span>
                </div>
              )
            })}
          </div>

          <button
            style={{...completeBtn, backgroundColor: theme.color, opacity: phase === 'saving' ? 0.6 : 1}}
            onClick={handleComplete}
            disabled={phase === 'saving'}
          >
            {phase === 'saving' ? '記録中...' : '完了する'}
          </button>
        </div>
      </div>
    )
  }

  if (!currentQ) return null

  const {quiz, subject, sub_category, problem_context} = currentQ
  const palette = subjectPalette(subject)

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
              style={{marginRight: '4px'}}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            戻る
          </button>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            {headerBadge}
            <span style={progressLabel}>
              {results.length + 1}{' '}
              <span style={{color: c.textFaint, fontWeight: 400}}>/ {total}</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={progressBarWrap}>
          {Array.from({length: total}, (_, i) => (
            <div
              key={i}
              style={{
                ...progressSegment,
                backgroundColor:
                  i < results.length
                    ? theme.color
                    : i === currentIdx
                      ? theme.colorLight
                      : 'rgba(55,53,47,0.08)',
              }}
            />
          ))}
        </div>

        {/* Subject + sub_category + ref */}
        <div style={subjectRow}>
          <span style={{...subjectBadge, backgroundColor: palette.bg, color: palette.color}}>
            {subject}
          </span>
          {sub_category && <span style={subCatLabel}>{sub_category}</span>}
          <span style={problemRef}>{problem_context.original_ref}</span>
        </div>

        {/* Card */}
        <div style={cardPerspective}>
          <div
            style={{
              ...cardInner,
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div style={cardFace} onClick={handleFlip}>
              <p style={cardLabel}>問い</p>
              <p style={cardText}>{quiz.question}</p>
              {!flipped && <p style={flipHint}>タップして答えを確認</p>}
            </div>

            {/* Back */}
            <div style={{...cardFaceBack, backgroundColor: theme.bg, borderColor: theme.border}}>
              <p style={cardLabel}>解説</p>
              <p style={cardText}>{quiz.explanation}</p>
            </div>
          </div>
        </div>

        {/* Self-eval buttons (shown after flip) */}
        {flipped && (
          <div style={evalRow}>
            <button style={evalBtnWrong} onClick={() => handleSelfEval(false)}>
              × わからなかった
            </button>
            <button style={evalBtnCorrect} onClick={() => handleSelfEval(true)}>
              ○ わかった
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {backgroundColor: c.bg, minHeight: '100vh', color: c.text}
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
const progressLabel: React.CSSProperties = {fontSize: '13px', fontWeight: 700, color: c.text}

const progressBarWrap: React.CSSProperties = {display: 'flex', gap: '4px', marginBottom: '20px'}
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
  marginBottom: '20px',
  flexWrap: 'wrap',
}
const subjectBadge: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
}
const subCatLabel: React.CSSProperties = {fontSize: font.sm, color: c.textHint}
const problemRef: React.CSSProperties = {fontSize: font.sm, color: c.textFaint}

const cardPerspective: React.CSSProperties = {
  perspective: '800px',
  marginBottom: '24px',
}
const cardInner: React.CSSProperties = {
  position: 'relative',
  transformStyle: 'preserve-3d',
  transition: 'transform 0.45s ease',
  minHeight: '200px',
}
const cardFaceBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  borderRadius: '14px',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: '200px',
}
const cardFace: React.CSSProperties = {
  ...cardFaceBase,
  backgroundColor: '#fff',
  border: `1px solid ${c.border}`,
  cursor: 'pointer',
}
const cardFaceBack: React.CSSProperties = {
  ...cardFaceBase,
  backgroundColor: 'rgba(35,131,226,0.04)',
  border: '1px solid rgba(35,131,226,0.18)',
  transform: 'rotateY(180deg)',
  cursor: 'default',
}
const cardLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(55,53,47,0.35)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: 0,
}
const cardText: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 500,
  color: 'rgba(55,53,47,0.9)',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  margin: 0,
  flex: 1,
}
const flipHint: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(55,53,47,0.3)',
  textAlign: 'center',
  margin: '8px 0 0',
}

const evalRow: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
}
const evalBtnBase: React.CSSProperties = {
  flex: 1,
  padding: '13px',
  borderRadius: '10px',
  border: 'none',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}
const evalBtnWrong: React.CSSProperties = {
  ...evalBtnBase,
  backgroundColor: 'rgba(235,87,87,0.08)',
  color: '#eb5757',
  border: '1px solid rgba(235,87,87,0.25)',
}
const evalBtnCorrect: React.CSSProperties = {
  ...evalBtnBase,
  backgroundColor: 'rgba(39,174,96,0.08)',
  color: '#19a576',
  border: '1px solid rgba(39,174,96,0.25)',
}

const resultHeader: React.CSSProperties = {textAlign: 'center', padding: '32px 0 28px'}
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
const resultDenom: React.CSSProperties = {fontSize: '16px', color: c.textSub, fontWeight: 600}

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
const loadingText: React.CSSProperties = {fontSize: font.base, color: c.textSub}
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
