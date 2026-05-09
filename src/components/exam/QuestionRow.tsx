import { useState } from 'react'
import { ANSWER_OPTIONS, RANKS } from '../../types/exam'
import type { QuestionDraft } from '../../types/exam'
import { DoubtIcon } from '@/lib/icon/DoubtIcon.tsx'
import { c } from '@/styles/notion.ts'
import {
    rankColors, questionItem, parentStyle, subStyle,
    sideControl, sideBtn, layoutContainer, qNumberHeader, controlsContent,
    qNumberParent, qNumberSub, addSubQBtn, answerGroup,
    typeToggleRow, typeToggleBtn, typeToggleActive,
    optionRow, optionBtn, optionActive, memoTextarea,
    descriptiveRow, descriptiveTextarea, doubtBtn, doubtBtnInline,
    scoringGroup, scoringRow, myAnswerDisplay, scoringBtnGroup,
    statusBtn, activeCorrect, activeIncorrect, scoringMeta,
    metaGroup, miniLabel, rankBadge, pointInput, timeValue, noteInput,
} from './QuestionRow.styles'

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

