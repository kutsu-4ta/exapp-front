import { useState } from 'react'
import { ANSWER_OPTIONS, RANKS } from '../../types/exam'
import type { QuestionDraft, Rank } from '../../types/exam'
import { DoubtIcon } from '@/lib/icon/DoubtIcon.tsx'
import { c, font } from '@/styles/notion.ts'

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const rankColors: Record<Rank, React.CSSProperties> = {
  A: { background: '#e1f0ff', color: '#2383e2' },
  B: { background: '#e6f6eb', color: '#19a576' },
  C: { background: '#fff5e0', color: '#f2ab26' },
  D: { background: '#ffebe9', color: '#eb5757' },
  E: { background: '#f3f3f2', color: '#8a7b6e' },
}

interface QuestionRowProps {
  question: QuestionDraft
  isScoring: boolean
  onUpdate: (patch: Partial<QuestionDraft>) => void
  onAddParent: () => void
  onRemoveParent: () => void
  onRemoveSub: () => void
  onAddSub: () => void
  onSetQuestionType: (type: 'single' | 'multi') => void
}

export function QuestionRow({
  question: q,
  isScoring,
  onUpdate,
  onAddParent,
  onRemoveParent,
  onRemoveSub,
  onAddSub,
  onSetQuestionType,
}: QuestionRowProps) {
  const cycleRank = () => {
    const next = RANKS[(RANKS.indexOf(q.rank) + 1) % RANKS.length]
    onUpdate({ rank: next })
  }

  return (
    <div style={{
      ...questionItem,
      ...(q.isSub ? subStyle : parentStyle),
      borderLeft: q.hasChildren
        ? `4px solid ${c.border}`
        : q.isSub
        ? `4px solid ${c.blue}`
        : `1px solid ${c.border}`,
    }}>
      {/* ＋ / － side buttons */}
      {!isScoring && (
        <div style={sideControl}>
          <button
            style={{ ...sideBtn, color: c.red }}
            onClick={q.isSub ? onRemoveSub : onRemoveParent}
            title="削除"
          >
            －
          </button>
          <button
            style={sideBtn}
            onClick={q.isSub ? onAddSub : onAddParent}
            title="追加"
          >
            ＋
          </button>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={layoutContainer}>
          {/* 問番号 + 設問追加ボタン */}
          <div style={qNumberHeader}>
            <span style={q.isSub ? qNumberSub : qNumberParent}>{q.displayId}</span>
            {!q.isSub && !q.hasChildren && !isScoring && (
              <button style={addSubQBtn} onClick={() => onSetQuestionType('multi')}>
                ＋ 設問を追加
              </button>
            )}
          </div>

          {/* 解答コントロール */}
          {!q.hasChildren && (
            <div style={controlsContent}>
              {isScoring
                ? <ScoringControls q={q} onUpdate={onUpdate} onCycleRank={cycleRank} />
                : <AnswerControls q={q} onUpdate={onUpdate} />
              }
            </div>
          )}
        </div>

        {/* 採点モードのメモ欄 */}
        {isScoring && !q.hasChildren && (
          <input
            style={noteInput}
            placeholder="ミスの傾向、論点のメモ..."
            value={q.note ?? ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
          />
        )}
      </div>
    </div>
  )
}

// ── 解答入力コントロール ───────────────────────────────────────────────────────

function AnswerControls({ q, onUpdate }: { q: QuestionDraft; onUpdate: (p: Partial<QuestionDraft>) => void }) {
  const [isDescriptive, setIsDescriptive] = useState(
    () => q.myAnswer !== '' && !ANSWER_OPTIONS.includes(q.myAnswer as typeof ANSWER_OPTIONS[number])
  )

  const handleModeSwitch = (descriptive: boolean) => {
    setIsDescriptive(descriptive)
    onUpdate({ myAnswer: '', note: null })
  }

  return (
    <div style={answerGroup}>
      {/* 選択式 / 記述式 トグル */}
      <div style={typeToggleRow}>
        <button
          style={{ ...typeToggleBtn, ...(isDescriptive ? {} : typeToggleActive) }}
          onClick={() => handleModeSwitch(false)}
        >
          選択式
        </button>
        <button
          style={{ ...typeToggleBtn, ...(isDescriptive ? typeToggleActive : {}) }}
          onClick={() => handleModeSwitch(true)}
        >
          記述式
        </button>
      </div>

      {isDescriptive ? (
        <div style={descriptiveRow}>
          <textarea
            style={descriptiveTextarea}
            placeholder="解答を記述..."
            rows={2}
            value={q.myAnswer}
            onChange={(e) => {
              onUpdate({ myAnswer: e.target.value })
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
          />
          <button onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })} style={doubtBtnInline}>
            <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
          </button>
        </div>
      ) : (
        <>
          <div style={optionRow}>
            {ANSWER_OPTIONS.map(opt => (
              <button
                key={opt}
                style={{
                  ...optionBtn,
                  ...(q.myAnswer === opt ? optionActive : {}),
                }}
                onClick={() => onUpdate({ myAnswer: opt })}
              >
                {opt}
              </button>
            ))}
            <button onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })} style={doubtBtn}>
              <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
            </button>
          </div>

          {/* 選択中の選択肢のメモ */}
          {q.myAnswer && ANSWER_OPTIONS.includes(q.myAnswer as typeof ANSWER_OPTIONS[number]) && (
            <textarea
              key={q.myAnswer}
              style={memoTextarea}
              placeholder={`${q.myAnswer} のメモ...`}
              value={q.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── 採点コントロール ──────────────────────────────────────────────────────────

function ScoringControls({
  q,
  onUpdate,
  onCycleRank,
}: {
  q: QuestionDraft
  onUpdate: (p: Partial<QuestionDraft>) => void
  onCycleRank: () => void
}) {
  return (
    <div style={scoringGroup}>
      {/* 1行目: 自分の答え・○× ・疑義 */}
      <div style={scoringRow}>
        <div style={myAnswerDisplay}>{q.myAnswer || '-'}</div>
        <div style={scoringBtnGroup}>
          <button
            onClick={() => onUpdate({ isCorrect: q.isCorrect === true ? null : true })}
            style={{ ...statusBtn, ...(q.isCorrect === true ? activeCorrect : {}) }}
          >
            ○
          </button>
          <button
            onClick={() => onUpdate({ isCorrect: q.isCorrect === false ? null : false })}
            style={{ ...statusBtn, ...(q.isCorrect === false ? activeIncorrect : {}) }}
          >
            ×
          </button>
        </div>
        <button onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })} style={doubtBtn}>
          <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
        </button>
      </div>

      {/* 2行目: RANK / POINT / TIME */}
      <div style={scoringMeta}>
        <div style={metaGroup}>
          <span style={miniLabel}>RANK</span>
          <button onClick={onCycleRank} style={{ ...rankBadge, ...rankColors[q.rank] }}>
            {q.rank}
          </button>
        </div>
        <div style={metaGroup}>
          <span style={miniLabel}>POINT</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <input
              type="number"
              style={pointInput}
              value={q.point}
              onChange={(e) => onUpdate({ point: parseInt(e.target.value) || 0 })}
            />
            <span style={miniLabel}>pt</span>
          </div>
        </div>
        <div style={{ ...metaGroup, marginLeft: 'auto' }}>
          <span style={miniLabel}>TIME</span>
          <span style={timeValue}>{formatMs(q.answeredTimeMs)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const questionItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
}

const parentStyle: React.CSSProperties = {
  padding: '14px 12px',
  borderRadius: '10px',
  border: `1px solid ${c.border}`,
  backgroundColor: '#fff',
  marginTop: '10px',
}

const subStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '0 8px 8px 0',
  backgroundColor: c.surface,
  marginTop: '2px',
  marginLeft: '12px',
  borderBottom: `1px solid ${c.border}`,
}

const sideControl: React.CSSProperties = {
  width: '28px',
  marginRight: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  paddingTop: '2px',
}

const sideBtn: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  border: `1px dashed ${c.border}`,
  backgroundColor: 'transparent',
  color: c.textSub,
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

const layoutContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const qNumberHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
}

const controlsContent: React.CSSProperties = {
  width: '100%',
}

const qNumberParent: React.CSSProperties = {
  fontWeight: 900,
  fontSize: font.sm,
  color: c.text,
}

const qNumberSub: React.CSSProperties = {
  fontWeight: 700,
  fontSize: font.xs,
  color: c.textSub,
}

const addSubQBtn: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '3px 10px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px dashed ${c.border}`,
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
}

// ── AnswerControls ──

const answerGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const typeToggleRow: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
}

const typeToggleBtn: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: font.xs,
  fontWeight: 600,
  borderRadius: '4px',
  border: `1px solid ${c.border}`,
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
}

const typeToggleActive: React.CSSProperties = {
  background: c.text,
  color: '#fff',
  border: `1px solid ${c.text}`,
}

const optionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const optionBtn: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: font.sm,
}

const optionActive: React.CSSProperties = {
  background: c.text,
  color: '#fff',
  border: `1px solid ${c.text}`,
}

const memoTextarea: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  padding: '8px 10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.sm,
  resize: 'vertical',
  boxSizing: 'border-box',
  background: '#fff',
  fontFamily: 'inherit',
}

const descriptiveRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
}

const descriptiveTextarea: React.CSSProperties = {
  flex: 1,
  minHeight: '72px',
  padding: '10px',
  borderRadius: '6px',
  border: `1px solid ${c.border}`,
  fontSize: font.base,
  resize: 'vertical',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

const doubtBtn: React.CSSProperties = {
  marginLeft: 'auto',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '4px',
  flexShrink: 0,
}

const doubtBtnInline: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '4px',
  flexShrink: 0,
}

// ── ScoringControls ──

const scoringGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

const scoringRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const myAnswerDisplay: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 800,
  color: c.text,
  backgroundColor: c.surface,
  padding: '4px 8px',
  borderRadius: '4px',
  minWidth: '30px',
  textAlign: 'center',
  border: `1px solid ${c.border}`,
}

const scoringBtnGroup: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginLeft: 'auto',
}

const statusBtn: React.CSSProperties = {
  width: '40px',
  height: '30px',
  border: `1px solid ${c.border}`,
  borderRadius: '6px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: font.base,
  fontWeight: 800,
}

const activeCorrect: React.CSSProperties = {
  backgroundColor: c.blue,
  color: '#fff',
  borderColor: c.blue,
}

const activeIncorrect: React.CSSProperties = {
  backgroundColor: c.red,
  color: '#fff',
  borderColor: c.red,
}

const scoringMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingTop: '8px',
  borderTop: `1px dashed ${c.border}`,
}

const metaGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const miniLabel: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: c.textFaint,
  letterSpacing: '0.05em',
}

const rankBadge: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '5px',
  border: 'none',
  fontSize: font.xs,
  fontWeight: 900,
  cursor: 'pointer',
}

const pointInput: React.CSSProperties = {
  width: '22px',
  border: 'none',
  fontSize: font.base,
  fontWeight: 900,
  textAlign: 'right',
  background: 'transparent',
}

const timeValue: React.CSSProperties = {
  fontSize: font.sm,
  fontFamily: 'monospace',
  fontWeight: 700,
  color: c.textSub,
}

const noteInput: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
  padding: '8px 10px',
  fontSize: font.sm,
  border: `1px solid ${c.border}`,
  borderRadius: '6px',
  backgroundColor: c.surface,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
