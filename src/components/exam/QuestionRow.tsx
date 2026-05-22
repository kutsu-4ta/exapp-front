import {useState} from 'react'
import type {QuestionDraft} from '../../types/exam'
import {ANSWER_OPTIONS, RANKS} from '../../types/exam'
import {DoubtIcon} from '@/lib/icon/DoubtIcon.tsx'
import {c} from '@/styles/notion.ts'
import {
    activeCorrect,
    activeIncorrect,
    alphabetToggleBtn,
    alphabetToggleBtnActive,
    controlsContent,
    doubtBtn,
    layoutContainer,
    memoOpt,
    memoRow,
    memosPanel,
    memosToggleBtn,
    memoText,
    metaGroup,
    miniLabel,
    myAnswerDisplay,
    noteInput,
    parentStyle,
    pointStepper,
    pointValueConfirmed,
    pointValueDefault,
    qNumberHeader,
    qNumberParent,
    qNumberSub,
    questionItem,
    questionTypeActive,
    questionTypeBtn,
    questionTypeToggle,
    rankBadge,
    rankColors,
    scoringBtnGroup,
    scoringGroup,
    scoringMeta,
    scoringRow,
    sideBtn,
    sideControl,
    statusBtn,
    stepperBtn,
    subStyle,
    timeValue,
    typeToggleActive,
    typeToggleBtn,
    typeToggleColumn,
} from './QuestionRow.styles'
import {AnswerInputPanel} from './AnswerInputPanel'

function calcDurationMs(started?: string, finished?: string): number | undefined {
  if (!started || !finished) return undefined
  const d = new Date(finished).getTime() - new Date(started).getTime()
  return d >= 0 ? d : undefined
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function focusFix(el: HTMLElement | null) {
  if (!el) return
  requestAnimationFrame(() => {
    el.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  })
}

interface QuestionRowProps {
  question: QuestionDraft
  isScoring: boolean
  isReadOnly?: boolean
  defaultPoint: number
  canRemoveSub: boolean
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
  isReadOnly,
  defaultPoint,
  canRemoveSub,
  onUpdate,
  onAddParent,
  onRemoveParent,
  onRemoveSub,
  onAddSub,
  onSetQuestionType,
}: QuestionRowProps) {
  const [showMemos, setShowMemos] = useState(false)
  const [isDescriptive, setIsDescriptive] = useState(
    () =>
      q.myAnswer !== '' && !ANSWER_OPTIONS.includes(q.myAnswer as (typeof ANSWER_OPTIONS)[number])
  )

  const [isAlphabet, setIsAlphabet] = useState(false)

  const handleModeSwitch = (descriptive: boolean) => {
    setIsDescriptive(descriptive)
    onUpdate({
      myAnswer: '',
      note: null,
      memos: {},
      excludedOptions: [],
    })
  }

  const cycleRank = () => {
    const idx = q.rank ? RANKS.indexOf(q.rank) : -1
    const next = RANKS[(idx + 1) % RANKS.length]
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
            ? `4px solid rgba(55,53,47,0.18)`
            : `1px solid ${c.border}`,
      }}
    >
      {!isScoring && (
        <div style={sideControl}>
            <button
              type="button"
              disabled={!(!q.isSub || canRemoveSub)}
              style={!(!q.isSub || canRemoveSub) ? { ...sideBtn, color: c.textSub } : { ...sideBtn, color: c.red }}
              onClick={q.isSub ? onRemoveSub : onRemoveParent}
            >
              －
            </button>

          <button
              type="button"
              style={{...sideBtn, color: "black"}}
              onClick={q.isSub ? onAddSub : onAddParent}>
            ＋
          </button>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={layoutContainer}>
          <div style={qNumberHeader}>
            <span style={q.isSub ? qNumberSub : qNumberParent}>{q.displayId}</span>

            {!q.isSub && !isScoring && (
              <div style={questionTypeToggle}>
                <button
                  type="button"
                  style={{
                    ...questionTypeBtn,
                    ...questionTypeActive,
                  }}
                  onClick={() => onSetQuestionType(q.hasChildren ? 'single' : 'multi')}
                >
                  {q.hasChildren ? '設問式' : '単独'}
                </button>
              </div>
            )}
          </div>

          {!q.hasChildren && (
            <div style={controlsContent}>
              {isScoring ? (
                <ScoringControls q={q} onUpdate={onUpdate} onCycleRank={cycleRank} defaultPoint={defaultPoint} isReadOnly={isReadOnly} />
              ) : (
                <AnswerControls
                  q={q}
                  onUpdate={onUpdate}
                  isDescriptive={isDescriptive}
                  isAlphabet={isAlphabet}
                />
              )}
            </div>
          )}
        </div>

        {isScoring && !q.hasChildren && (
          <>
            <input
              style={{
                ...noteInput,
                fontSize: 16,
              }}
              placeholder="ミスの傾向、論点のメモ..."
              value={q.note ?? ''}
              readOnly={isReadOnly}
              onFocus={(e) => focusFix(e.currentTarget)}
              onChange={(e) =>
                onUpdate({
                  note: e.target.value,
                })
              }
            />
            {Object.values(q.memos ?? {}).some((v) => v) && (
              <>
                <button
                  type="button"
                  style={memosToggleBtn}
                  onClick={() => setShowMemos((v) => !v)}
                >
                  {showMemos ? '選択肢メモを隠す ▲' : '選択肢メモを表示 ▼'}
                </button>
                {showMemos && (
                  <div style={memosPanel}>
                    {Object.entries(q.memos ?? {})
                      .filter(([, v]) => v)
                      .map(([opt, memo]) => (
                        <div key={opt} style={memoRow}>
                          <span style={memoOpt}>{opt}</span>
                          <span style={memoText}>{memo}</span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {!isScoring && !q.hasChildren && (
        <div style={typeToggleColumn}>
          <div style={typeToggleColumn}>
            <button
              type="button"
              style={{
                ...typeToggleBtn,
                ...typeToggleActive,
              }}
              onClick={() => handleModeSwitch(!isDescriptive)}
            >
              {isDescriptive ? '記述式' : '選択式'}
            </button>

            {!isDescriptive && (
              <button
                type="button"
                style={{
                  ...alphabetToggleBtn,
                  ...(isAlphabet ? alphabetToggleBtnActive : {}),
                }}
                onClick={() => setIsAlphabet((v) => !v)}
              >
                A↔ア
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AnswerControls({
    q,
    onUpdate,
    isDescriptive,
    isAlphabet,
}: {
    q: QuestionDraft
    onUpdate: (p: Partial<QuestionDraft>) => void
    isDescriptive: boolean
    isAlphabet: boolean
}) {
    const memos = q.memos ?? {}
    const excludedOptions = q.excludedOptions ?? []

    const toggleExclude = (opt: string) => {
        const already = excludedOptions.includes(opt)
        const appendText = '（×）'
        const currentMemo = memos[opt] ?? ''

        if (already) {
            const cleanedMemo = currentMemo
                .replace(new RegExp(`\\s*${appendText}\\s*`), ' ')
                .trim()
            onUpdate({
                excludedOptions: excludedOptions.filter((o) => o !== opt),
                memos: { ...memos, [opt]: cleanedMemo },
            })
            return
        }

        const nextMemo = currentMemo.includes(appendText)
            ? currentMemo
            : currentMemo
                ? `${currentMemo} ${appendText}`
                : appendText

        onUpdate({
            excludedOptions: [...excludedOptions, opt],
            memos: { ...memos, [opt]: nextMemo },
        })
    }

    return (
        <AnswerInputPanel
            isDescriptive={isDescriptive}
            isAlphabet={isAlphabet}
            selectedOption={q.myAnswer}
            excludedOptions={excludedOptions}
            memos={memos}
            isDoubtful={q.isDoubtful}
            generalMemo={q.note ?? ''}
            descriptiveText={q.myAnswer}
            onSelectOption={(opt) => onUpdate({ myAnswer: opt })}
            onToggleExclude={toggleExclude}
            onUpdateMemo={(opt, text) => onUpdate({ memos: { ...memos, [opt]: text } })}
            onToggleDoubtful={() => onUpdate({ isDoubtful: !q.isDoubtful })}
            onUpdateGeneralMemo={(text) => onUpdate({ note: text })}
            onUpdateDescriptiveText={(text) => onUpdate({ myAnswer: text })}
            onFocus={focusFix}
        />
    )
}

function ScoringControls({
  q,
  onUpdate,
  onCycleRank,
  defaultPoint,
  isReadOnly,
}: {
  q: QuestionDraft
  onUpdate: (p: Partial<QuestionDraft>) => void
  onCycleRank: () => void
  defaultPoint: number
  isReadOnly?: boolean
}) {
  const isScored = q.isCorrect !== null
  const displayPoint = isScored ? q.point : defaultPoint
  return (
    <div style={{ ...scoringGroup, ...(isReadOnly ? { pointerEvents: 'none', opacity: 0.7 } : {}) }}>
      <div style={scoringRow}>
        <div style={myAnswerDisplay}>{q.myAnswer || '-'}</div>

        <div style={scoringBtnGroup}>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                isCorrect: q.isCorrect === true ? null : true,
              })
            }
            style={{
              ...statusBtn,
              ...(q.isCorrect === true ? activeCorrect : {}),
            }}
          >
            ○
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdate({
                isCorrect: q.isCorrect === false ? null : false,
              })
            }
            style={{
              ...statusBtn,
              ...(q.isCorrect === false ? activeIncorrect : {}),
            }}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            onUpdate({
              isDoubtful: !q.isDoubtful,
            })
          }
          style={doubtBtn}
        >
          <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
        </button>
      </div>

      <div style={scoringMeta}>
        <div style={metaGroup}>
          <span style={miniLabel}>RANK</span>
          <button
            type="button"
            onClick={onCycleRank}
            style={{
              ...rankBadge,
              ...(q.rank ? rankColors[q.rank] : {}),
            }}
          >
            {q.rank ?? '?'}
          </button>
        </div>

        <div style={metaGroup}>
          <span style={miniLabel}>POINT</span>
          <div style={pointStepper}>
            <button
              type="button"
              style={stepperBtn}
              onClick={() => onUpdate({point: Math.max(0, displayPoint - 1)})}
            >−</button>
            <span style={isScored ? pointValueConfirmed : pointValueDefault}>
              {displayPoint}
            </span>
            <button
              type="button"
              style={stepperBtn}
              onClick={() => onUpdate({point: displayPoint + 1})}
            >＋</button>
            <span style={miniLabel}>pt</span>
          </div>
        </div>

        <div
          style={{
            ...metaGroup,
            marginLeft: 'auto',
          }}
        >
          <span style={miniLabel}>TIME</span>
          <span style={timeValue}>{formatMs(calcDurationMs(q.answeredStartedAt, q.answeredFinishedAt))}</span>
        </div>
      </div>
    </div>
  )
}
