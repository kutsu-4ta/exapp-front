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
  optionRightGroup,
  parentStyle,
  pointInput,
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
  subStyle,
  timeValue,
  typeToggleActive,
  typeToggleBtn,
  typeToggleColumn,
} from './QuestionRow.styles'

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
    const next = RANKS[(RANKS.indexOf(q.rank) + 1) % RANKS.length]

    onUpdate({
      rank: next,
    })
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
      {!isScoring && (
        <div style={sideControl}>
          <button
            type="button"
            style={{ ...sideBtn, color: c.red }}
            onClick={q.isSub ? onRemoveSub : onRemoveParent}
          >
            －
          </button>

          <button type="button" style={sideBtn} onClick={q.isSub ? onAddSub : onAddParent}>
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
                <ScoringControls q={q} onUpdate={onUpdate} onCycleRank={cycleRank} />
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
          <input
            style={{
              ...noteInput,
              fontSize: 16,
            }}
            placeholder="ミスの傾向、論点のメモ..."
            value={q.note ?? ''}
            onFocus={(e) => focusFix(e.currentTarget)}
            onChange={(e) =>
              onUpdate({
                note: e.target.value,
              })
            }
          />
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

const ALPHA_MAP: Record<string, string> = {
  ア: 'A',
  イ: 'B',
  ウ: 'C',
  エ: 'D',
  オ: 'E',
}

const ALPHABET_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

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
      const cleanedMemo = currentMemo.replace(new RegExp(`\\s*${appendText}\\s*`), ' ').trim()

      onUpdate({
        excludedOptions: excludedOptions.filter((o) => o !== opt),
        memos: {
          ...memos,
          [opt]: cleanedMemo,
        },
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
      memos: {
        ...memos,
        [opt]: nextMemo,
      },
    })
  }

  const label = (opt: string) => (isAlphabet ? (ALPHA_MAP[opt] ?? opt) : opt)

  return (
    <div style={answerGroup}>
      {isDescriptive ? (
        <div style={doubtRow}>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                isDoubtful: !q.isDoubtful,
              })
            }
            style={doubtBtnInline}
          >
            <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
          </button>

          <textarea
            style={{
              ...descriptiveTextarea,
              fontSize: 16,
              touchAction: 'manipulation',
            }}
            rows={2}
            placeholder="解答を記述..."
            value={q.myAnswer}
            onFocus={(e) => focusFix(e.currentTarget)}
            onChange={(e) => {
              onUpdate({
                myAnswer: e.target.value,
              })

              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
          />
        </div>
      ) : (
        <>
          {isAlphabet ? (
            <>
              {/* A〜E 消去法メモ行 */}
              {ALPHABET_OPTIONS.map((alpha) => {
                const isExcluded = excludedOptions.includes(alpha)
                return (
                  <div
                    key={`alpha-row-${alpha}`}
                    style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
                  >
                    <button
                      type="button"
                      style={{
                        ...optionBtn,
                        ...excludeBtn,
                        ...(isExcluded ? excludeBtnActive : {}),
                        marginRight: '10px',
                        minWidth: '40px',
                      }}
                      onClick={() => toggleExclude(alpha)}
                    >
                      <span style={isExcluded ? { textDecoration: 'line-through' } : {}}>
                        {alpha}
                      </span>
                    </button>
                    <div style={optionRightGroup}>
                      <input
                        type="text"
                        style={{ ...optionMemoInput, fontSize: 16 }}
                        placeholder={`${alpha}のメモ`}
                        value={memos[alpha] ?? ''}
                        onFocus={(e) => focusFix(e.currentTarget)}
                        onChange={(e) =>
                          onUpdate({
                            memos: { ...memos, [alpha]: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
              {/* 回答ボタン（ア〜オ）横並び */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {ANSWER_OPTIONS.map((opt) => {
                  const isSelected = q.myAnswer === opt
                  const isExcluded = excludedOptions.includes(opt)
                  return (
                    <button
                      key={`ans-${opt}`}
                      type="button"
                      style={{
                        ...optionBtn,
                        ...(isSelected ? optionActive : {}),
                        ...(isExcluded && !isSelected ? optionExcluded : {}),
                      }}
                      onClick={() => onUpdate({ myAnswer: isSelected ? '' : opt })}
                    >
                      <span>{opt}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            ANSWER_OPTIONS.map((opt) => {
              const isSelected = q.myAnswer === opt

              const isExcluded = excludedOptions.includes(opt)

              return (
                <div key={opt} style={optionLineRow}>
                  <button
                    type="button"
                    style={{
                      ...optionBtn,
                      ...(isSelected ? optionActive : {}),
                      ...(isExcluded && !isSelected ? optionExcluded : {}),
                      marginRight: '10px',
                    }}
                    onClick={() =>
                      onUpdate({
                        myAnswer: isSelected ? '' : opt,
                      })
                    }
                  >
                    <span
                      style={
                        isExcluded && !isSelected
                          ? {
                              textDecoration: 'line-through',
                            }
                          : {}
                      }
                    >
                      {label(opt)}
                    </span>
                  </button>

                  <div style={optionRightGroup}>
                    <button
                      type="button"
                      style={{
                        ...excludeBtn,
                        ...(isExcluded ? excludeBtnActive : {}),
                      }}
                      onClick={() => toggleExclude(opt)}
                      title="消去法"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                      >
                        <line
                          x1="2"
                          y1="2"
                          x2="12"
                          y2="12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    <input
                      type="text"
                      style={{
                        ...optionMemoInput,
                        fontSize: 16,
                      }}
                      placeholder={`${label(opt)}のメモ`}
                      value={memos[opt] ?? ''}
                      onFocus={(e) => focusFix(e.currentTarget)}
                      onChange={(e) =>
                        onUpdate({
                          memos: {
                            ...memos,
                            [opt]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )
            })
          )}

          <div style={doubtRow}>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  isDoubtful: !q.isDoubtful,
                })
              }
              style={doubtBtnInline}
            >
              <DoubtIcon size={18} color={q.isDoubtful ? '#f2994a' : c.textFaint} />
            </button>

            <textarea
              style={{
                ...generalMemoTextarea,
                fontSize: 16,
              }}
              placeholder="メモ"
              value={q.note ?? ''}
              onFocus={(e) => focusFix(e.currentTarget)}
              onChange={(e) =>
                onUpdate({
                  note: e.target.value,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}

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
              ...rankColors[q.rank],
            }}
          >
            {q.rank}
          </button>
        </div>

        <div style={metaGroup}>
          <span style={miniLabel}>POINT</span>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '1px',
            }}
          >
            <input
              type="number"
              style={{
                ...pointInput,
                fontSize: 16,
              }}
              value={q.point}
              onChange={(e) =>
                onUpdate({
                  point: parseInt(e.target.value) || 0,
                })
              }
            />
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
          <span style={timeValue}>{formatMs(q.answeredTimeMs)}</span>
        </div>
      </div>
    </div>
  )
}
