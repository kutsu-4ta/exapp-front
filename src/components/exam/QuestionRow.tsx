import {useState} from 'react'
import type {QuestionDraft} from '../../types/exam'
import {ANSWER_OPTIONS, RANKS} from '../../types/exam'
import {DoubtIcon} from '@/lib/icon/DoubtIcon.tsx'
import {c} from '@/styles/notion.ts'
import {
    activeCorrect,
    activeIncorrect,
    addSubQBtn,
    alphabetToggleBtn,
    alphabetToggleBtnActive,
    alphabetToggleBtnDisabled,
    answerGroup,
    controlsContent,
    descriptiveTextarea,
    doubtBtn,
    doubtBtnInline,
    doubtRow,
    excludeBtn,
    excludeBtnActive,
    generalMemoTextarea,
    layoutContainer,
    metaGroup,
    miniLabel,
    myAnswerDisplay,
    noteInput,
    optionActive,
    optionBtn,
    optionExcluded,
    optionLineRow,
    optionMemoInput,
    parentStyle,
    pointInput,
    qNumberHeader,
    qNumberParent,
    qNumberSub,
    questionItem,
    rankBadge,
    rankColors,
    scoringBtnGroup,
    scoringGroup,
    scoringMeta,
    scoringRow,
    sideBtn,
    sideControl,
    statusBtn,
    subStyle,
    timeValue,
    typeToggleActive,
    typeToggleBtn,
    typeToggleRow,
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
    <div
      style={{
        ...questionItem,
        ...(q.isSub ? subStyle : parentStyle),
        borderLeft: q.hasChildren
          ? `4px solid ${c.border}`
          : q.isSub
            ? `4px solid ${c.blue}`
            : `1px solid ${c.border}`,
      }}
    >
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
          <button style={sideBtn} onClick={q.isSub ? onAddSub : onAddParent} title="追加">
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
              {isScoring ? (
                <ScoringControls q={q} onUpdate={onUpdate} onCycleRank={cycleRank} />
              ) : (
                <AnswerControls q={q} onUpdate={onUpdate} />
              )}
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

const ALPHA_MAP: Record<string, string> = {
  ア: 'a',
  イ: 'b',
  ウ: 'c',
  エ: 'd',
  オ: 'e',
}

function AnswerControls({
  q,
  onUpdate,
}: {
  q: QuestionDraft
  onUpdate: (p: Partial<QuestionDraft>) => void
}) {
  const [isDescriptive, setIsDescriptive] = useState(
    () =>
      q.myAnswer !== '' && !ANSWER_OPTIONS.includes(q.myAnswer as (typeof ANSWER_OPTIONS)[number])
  )
  const [isAlphabet, setIsAlphabet] = useState(false)

  const memos = q.memos ?? {}
  const excludedOptions = q.excludedOptions ?? []

  const handleModeSwitch = (descriptive: boolean) => {
    setIsDescriptive(descriptive)
    onUpdate({ myAnswer: '', note: null, memos: {}, excludedOptions: [] })
  }

  const toggleExclude = (opt: string) => {
    const already = excludedOptions.includes(opt)
    onUpdate({
      excludedOptions: already
        ? excludedOptions.filter((o) => o !== opt)
        : [...excludedOptions, opt],
    })
  }

  const label = (opt: string) => (isAlphabet ? (ALPHA_MAP[opt] ?? opt) : opt)

  return (
    <div style={answerGroup}>
      {/* トグル行: [選択式][記述式][a↔ア] */}
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
        <button
          style={{
            ...alphabetToggleBtn,
            ...(isAlphabet ? alphabetToggleBtnActive : {}),
            ...(isDescriptive ? alphabetToggleBtnDisabled : {}),
          }}
          onClick={() => {
            if (!isDescriptive) setIsAlphabet((v) => !v)
          }}
          disabled={isDescriptive}
          title="ア→a / a→ア 切り替え"
        >
          a↔ア
        </button>
      </div>

      {isDescriptive ? (
        /* 記述式: DoubtIcon + textarea */
        <div style={doubtRow}>
          <button onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })} style={doubtBtnInline}>
            <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
          </button>
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
        </div>
      ) : (
        /* 選択式: 各選択肢行 + DoubtIcon + 共通メモ */
        <>
          {ANSWER_OPTIONS.map((opt) => {
            const isSelected = q.myAnswer === opt
            const isExcluded = excludedOptions.includes(opt)
            return (
              <div key={opt} style={optionLineRow}>
                {/* 記号ボタン */}
                <button
                  style={{
                    ...optionBtn,
                    ...(isSelected ? optionActive : {}),
                    ...(isExcluded && !isSelected ? optionExcluded : {}),
                  }}
                  onClick={() => onUpdate({ myAnswer: isSelected ? '' : opt })}
                >
                  <span style={isExcluded && !isSelected ? { textDecoration: 'line-through' } : {}}>
                    {label(opt)}
                  </span>
                </button>

                {/* 斜線ボタン */}
                <button
                  style={{ ...excludeBtn, ...(isExcluded ? excludeBtnActive : {}) }}
                  onClick={() => toggleExclude(opt)}
                  title="消去法"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <line
                      x1="1"
                      y1="1"
                      x2="11"
                      y2="11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* メモ入力 */}
                <input
                  type="text"
                  style={optionMemoInput}
                  placeholder={`${label(opt)}のメモ`}
                  value={memos[opt] ?? ''}
                  onChange={(e) => onUpdate({ memos: { ...memos, [opt]: e.target.value } })}
                />
              </div>
            )
          })}

          {/* DoubtIcon + 共通メモ */}
          <div style={doubtRow}>
            <button onClick={() => onUpdate({ isDoubtful: !q.isDoubtful })} style={doubtBtnInline}>
              <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
            </button>
            <textarea
              style={generalMemoTextarea}
              placeholder="メモ（選択肢に依存しない）"
              value={q.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
            />
          </div>
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
