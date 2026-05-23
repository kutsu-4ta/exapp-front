import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {ExamQuestionInput, ExamSession, QuestionDraft, Rank,} from '../../types/exam'
import {QuestionRow} from './QuestionRow'
import {useTimer} from '../../context/TimerContext'
import {DoubtIcon} from '@/lib/icon/DoubtIcon.tsx'
import {
    container,
    contentBody,
    dotO,
    dotX,
    examBackBtn,
    examContextLine,
    finishBtn,
    footer,
    footerActionGroup,
    gridContainer,
    headerTopRow,
    saveBtn,
    scoreCell,
    scoreGrid,
    scoreLab,
    scoreVal,
    scoreValPure,
    scoreVLine,
    solvedBadge,
    solvedBtn,
    solvedMarker,
    statItem,
    statsBadge,
    stickyHeader,
} from './ExamInputView.styles'

type ExamDraft = {
  sessionId: number
  subject: string
  examYear: string
  questions: QuestionDraft[]
  isScoring: boolean
  solvedTimerValue?: number
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function draftKey(sessionId: number) {
  return `exam_draft_${sessionId}`
}

function loadDraft(sessionId: number): ExamDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(sessionId))
    if (!raw) return null
    return JSON.parse(raw) as ExamDraft
  } catch {
    return null
  }
}

function saveDraft(draft: ExamDraft) {
  try {
    localStorage.setItem(
        draftKey(draft.sessionId),
        JSON.stringify(draft)
    )
  } catch {
    //
  }
}

function clearDraft(sessionId: number) {
  localStorage.removeItem(draftKey(sessionId))
}

function makeDraft(
    overrides: Partial<QuestionDraft> = {}
): QuestionDraft {
  const base: QuestionDraft = {
    localId: crypto.randomUUID(),
    sortOrder: 0,
    displayId: '',
    isSub: false,
    hasChildren: false,
    rank: 'B',
    myAnswer: '',
    isCorrect: null,
    isDoubtful: false,
    point: 4,
    note: null,
    ...overrides,
  }
  // 親大問（hasChildren=true）はランクを持たない
  if (base.hasChildren) base.rank = null
  return base
}

function refreshDisplayIds(
    drafts: QuestionDraft[]
): QuestionDraft[] {
  let parentCount = 0

  return drafts.map((q) => {
    if (!q.isSub) {
      parentCount++
      return {
        ...q,
        displayId: `第${parentCount}問`,
      }
    }
    return q
  })
}

function renumberQuestions(
    questions: QuestionDraft[]
): QuestionDraft[] {
  let groupOrder = 0

  return refreshDisplayIds(
      questions.map((q) => {
        if (!q.isSub) groupOrder++
        return {
          ...q,
          sortOrder: groupOrder,
        }
      })
  )
}

function draftsToInputs(
    drafts: QuestionDraft[]
): ExamQuestionInput[] {
  return drafts.map((q, i) => ({
    sortOrder: i,
    displayId: q.displayId,
    isSub: q.isSub,
    hasChildren: q.hasChildren,
    rank: q.rank,
    myAnswer: q.myAnswer,
    isCorrect: q.isCorrect,
    isDoubtful: q.isDoubtful,
    point: q.point,
    note: q.note,
    answeredTimeMs: q.answeredTimeMs,
    answeredStartedAt: q.answeredStartedAt,
    answeredFinishedAt: q.answeredFinishedAt,
  }))
}

function initQuestions(
    session: ExamSession,
    savedDraft: ExamDraft | null,
    questionCount: number
): QuestionDraft[] {
  if (savedDraft?.questions.length) {
    return savedDraft.questions
  }

  if (session.questions.length) {
    return refreshDisplayIds(
        session.questions.map((q) => ({
          localId: `q-${q.id}`,
          sortOrder: q.sortOrder,
          displayId: q.displayId,
          isSub: q.isSub,
          hasChildren: q.hasChildren,
          rank: q.hasChildren ? null : (q.rank as Rank | null),
          myAnswer: q.myAnswer,
          isCorrect: q.isCorrect,
          isDoubtful: q.isDoubtful,
          point: q.point,
          note: q.note,
          answeredTimeMs: q.answeredTimeMs,
          answeredStartedAt: q.answeredStartedAt,
          answeredFinishedAt: q.answeredFinishedAt,
        }))
    )
  }

    return refreshDisplayIds(
        Array.from(
            { length: questionCount },
            (_, i) =>
                makeDraft({
                    sortOrder: i + 1,
                })
        )
    )
}

interface Props {
    session: ExamSession
    isEditMode?: boolean
    isViewMode?: boolean
    questionCount?: number
    onComplete: (
        sessionId: number,
        subject: string,
        examYear: string,
        questions: ExamQuestionInput[]
    ) => Promise<void>
    onCancel: () => void
}

export default function ExamInputView({
                                          session,
                                          isEditMode,
                                          isViewMode,
                                          questionCount = 25,
                                          onComplete,
                                          onCancel,
                                      }: Props) {
  const savedDraft = useMemo(
      () => loadDraft(session.id),
      [session.id]
  )

  const [subject] = useState(
      savedDraft?.subject ?? session.subject
  )

  const [examYear] = useState(
      savedDraft?.examYear ?? session.examYear
  )

  const [isScoring, setIsScoring] = useState(
      savedDraft?.isScoring ??
      (isEditMode || isViewMode || session.status === 'scoring')
  )

  const [isEditing, setIsEditing] = useState(false)

  const [saving, setSaving] = useState(false)
  const [kbOffset, setKbOffset] = useState(0)

  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    initQuestions(session, savedDraft, questionCount)
  )

  const [solvedTimerValue, setSolvedTimerValue] = useState<number | undefined>(
    savedDraft?.solvedTimerValue
  )
  const solvedRef = useRef(savedDraft?.solvedTimerValue !== undefined)

  const {time: timerTime} = useTimer()
  const timerTimeRef = useRef(timerTime)
  const isEditModeRef = useRef(!!(isEditMode || isViewMode))

  const [lastUsedPoint, setLastUsedPoint] = useState(4)
  const lastUsedPointRef = useRef(4)

  useEffect(() => {
    lastUsedPointRef.current = lastUsedPoint
  }, [lastUsedPoint])

  useEffect(() => {
    timerTimeRef.current = timerTime
  }, [timerTime])

  useEffect(() => {

    saveDraft({
      sessionId: session.id,
      subject,
      examYear,
      questions,
      isScoring,
      solvedTimerValue,
    })
  }, [
    session.id,
    subject,
    examYear,
    questions,
    isScoring,
    solvedTimerValue,
  ])

  useEffect(() => {
    const handler = (
        e: BeforeUnloadEvent
    ) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener(
        'beforeunload',
        handler
    )

    return () =>
        window.removeEventListener(
            'beforeunload',
            handler
        )
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      setKbOffset(
          Math.max(
              0,
              window.innerHeight -
              vv.height -
              vv.offsetTop
          )
      )
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    return () => {
      vv.removeEventListener(
          'resize',
          update
      )
      vv.removeEventListener(
          'scroll',
          update
      )
    }
  }, [])

  const stats = useMemo(() => {
    const targets = questions.filter(
        (q) => !q.hasChildren
    )

    return {
      correctCount: targets.filter(
          (q) => q.isCorrect === true
      ).length,

      incorrectCount: targets.filter(
          (q) => q.isCorrect === false
      ).length,

      doubtfulCount: targets.filter(
          (q) => q.isDoubtful
      ).length,

      totalScore: targets.reduce(
          (s, q) =>
              q.isCorrect ? s + q.point : s,
          0
      ),

      pureScore: targets.reduce(
          (s, q) =>
              q.isCorrect &&
              !q.isDoubtful
                  ? s + q.point
                  : s,
          0
      ),
    }
  }, [questions])

  const updateQuestion = useCallback(
      (
          localId: string,
          patch: Partial<QuestionDraft>
      ) => {
        if (typeof patch.point === 'number') {
          setLastUsedPoint(patch.point)
          lastUsedPointRef.current = patch.point
        }

        setQuestions((prev) =>
            prev.map((q) => {
              if (q.localId !== localId)
                return q

              const isBeingScored =
                  'isCorrect' in patch &&
                  patch.isCorrect !== null &&
                  q.isCorrect === null

              const shouldRecordTime =
                  patch.myAnswer &&
                  q.myAnswer === '' &&
                  q.answeredTimeMs ===
                  undefined

              const now = new Date().toISOString()
              const preserveTimestamps = isEditModeRef.current || solvedRef.current

              // 未採点の問題への point 変更は lastUsedPoint 更新のみ（q.point は変えない）
              const patchToApply = {...patch}
              if (q.isCorrect === null && !isBeingScored && 'point' in patchToApply) {
                delete patchToApply.point
              }

              return {
                ...q,
                ...patchToApply,
                // 採点確定時に lastUsedPoint を q.point として固定
                ...(isBeingScored
                    ? {point: lastUsedPointRef.current}
                    : {}),
                ...(shouldRecordTime
                    ? {answeredTimeMs: timerTimeRef.current}
                    : {}),
                ...(!preserveTimestamps && 'myAnswer' in patch ? {
                  answeredStartedAt: q.answeredStartedAt ?? now,
                  answeredFinishedAt: now,
                } : {}),
              }
            })
        )
      },
      []
  )

  const addParentQuestion =
      useCallback((afterId: string) => {
        setQuestions((prev) => {
          const idx = prev.findIndex(
              (q) => q.localId === afterId
          )
          if (idx === -1) return prev

          const target = prev[idx]

          // hasChildren=true の大問は配下の設問が直後に並んでいるため、
          // 設問をすべてスキップした位置に挿入する
          let insertIdx = idx + 1
          if (target.hasChildren) {
            while (
                insertIdx < prev.length &&
                prev[insertIdx].isSub &&
                prev[insertIdx].sortOrder === target.sortOrder
            ) {
              insertIdx++
            }
          }

          const next = [
            ...prev.slice(0, insertIdx),
            makeDraft(),
            ...prev.slice(insertIdx),
          ]

          return renumberQuestions(next)
        })
      }, [])

  const removeParentQuestion =
      useCallback((localId: string) => {
        setQuestions((prev) => {
          const target = prev.find(
              (q) => q.localId === localId
          )
          if (!target) return prev

          const filtered =
              prev.filter(
                  (q) =>
                      q.localId !== localId &&
                      !(
                          q.isSub &&
                          q.sortOrder ===
                          target.sortOrder
                      )
              )

          return renumberQuestions(
              filtered
          )
        })
      }, [])

  const addSubQuestion =
      useCallback((parentId: string) => {
        setQuestions((prev) => {
          const parent = prev.find(
              (q) => q.localId === parentId
          )

          if (!parent) return prev

          const subs = prev.filter(
              (q) =>
                  q.sortOrder ===
                  parent.sortOrder &&
                  q.isSub
          )

          const newSub = makeDraft({
            sortOrder:
            parent.sortOrder,
            displayId: `設問${
                subs.length + 1
            }`,
            isSub: true,
            point: 2,
          })

          return [
            ...prev,
            newSub,
          ].sort(
              (a, b) =>
                  a.sortOrder -
                  b.sortOrder ||
                  Number(a.isSub) -
                  Number(b.isSub)
          )
        })
      }, [])

  const removeSubQuestion =
      useCallback((localId: string) => {
        setQuestions((prev) =>
            prev.filter(
                (q) =>
                    q.localId !== localId
            )
        )
      }, [])

  const setQuestionType =
      useCallback(
          (
              localId: string,
              type:
                  | 'single'
                  | 'multi'
          ) => {
            setQuestions((prev) => {
              const target =
                  prev.find(
                      (q) =>
                          q.localId ===
                          localId
                  )

              if (!target)
                return prev

              const others =
                  prev.filter(
                      (q) =>
                          q.sortOrder !==
                          target.sortOrder
                  )

              const newItems =
                  type ===
                  'multi'
                      ? [
                        makeDraft({
                          sortOrder:
                          target.sortOrder,
                          hasChildren:
                              true,
                          point: 0,
                        }),
                        makeDraft({
                          sortOrder:
                          target.sortOrder,
                          displayId:
                              '設問1',
                          isSub:
                              true,
                          point: 2,
                        }),
                      ]
                      : [
                        makeDraft({
                          sortOrder:
                          target.sortOrder,
                        }),
                      ]

              return refreshDisplayIds(
                  [...others, ...newItems].sort(
                      (
                          a,
                          b
                      ) =>
                          a.sortOrder -
                          b.sortOrder ||
                          Number(
                              a.isSub
                          ) -
                          Number(
                              b.isSub
                          )
                  )
              )
            })
          },
          []
      )

  const handleFinishExam = () => {
    if (
        !window.confirm(
            '試験を終了して自己採点を開始しますか？'
        )
    )
      return

    setIsScoring(true)

    window.scrollTo({
      top: 0,
      behavior:
          'smooth',
    })
  }

  const handleSolved = () => {
    const val = timerTimeRef.current
    setSolvedTimerValue(val)
    solvedRef.current = true
  }

  const handleCancel = () => {
    if (
        !window.confirm(
            '入力内容は下書きとして保存されます。閉じますか？'
        )
    )
      return

    onCancel()
  }

  const handleSave =
      async () => {
        setSaving(true)

        try {
          await onComplete(
              session.id,
              subject,
              examYear,
              draftsToInputs(
                  questions
              )
          )

          clearDraft(
              session.id
          )
        } finally {
          setSaving(
              false
          )
        }
      }

  return (
      <div style={container}>
        <div style={stickyHeader}>
          <div style={headerTopRow}>
            <div style={examContextLine}>
              {examYear}{' '}
              {subject}
            </div>

            {!isScoring && solvedTimerValue !== undefined && (
                <div style={solvedBadge}>✓ {formatMs(solvedTimerValue)}</div>
            )}

            {isScoring && (
                <div style={statsBadge}>
                  <div style={statItem}>
                <span style={dotO}>
                  ○
                </span>{' '}
                    {
                      stats.correctCount
                    }
                  </div>

                  <div style={statItem}>
                <span style={dotX}>
                  ×
                </span>{' '}
                    {
                      stats.incorrectCount
                    }
                  </div>

                  <div style={statItem}>
                    <DoubtIcon />{' '}
                    {
                      stats.doubtfulCount
                    }
                  </div>
                </div>
            )}
          </div>

          {isScoring && (
              <div style={scoreGrid}>
                <div style={scoreCell}>
              <span style={scoreLab}>
                TOTAL
              </span>

                  <span
                      style={
                        scoreVal
                      }
                  >
                {
                  stats.totalScore
                }
              </span>
                </div>

                <div
                    style={
                      scoreVLine
                    }
                />

                <div style={scoreCell}>
              <span style={scoreLab}>
                PURE
              </span>

                  <span
                      style={
                        scoreValPure
                      }
                  >
                {
                  stats.pureScore
                }
              </span>
                </div>
              </div>
          )}
        </div>

        <div style={contentBody}>
          <div style={gridContainer}>
            {questions.map(
                (q) => (
                    <QuestionRow
                        key={
                          q.localId
                        }
                        question={
                          q
                        }
                        isScoring={
                          isScoring
                        }
                        isReadOnly={
                          isViewMode && !isEditing
                        }
                        defaultPoint={
                          lastUsedPoint
                        }
                        canRemoveSub={
                          !q.isSub ||
                          questions.filter(
                            (s) => s.isSub && s.sortOrder === q.sortOrder
                          ).length > 1
                        }
                        onUpdate={(
                            patch
                        ) =>
                            updateQuestion(
                                q.localId,
                                patch
                            )
                        }
                        onAddParent={() =>
                            addParentQuestion(
                                q.localId
                            )
                        }
                        onRemoveParent={() =>
                            removeParentQuestion(
                                q.localId
                            )
                        }
                        onAddSub={() =>
                            addSubQuestion(
                                q.localId
                            )
                        }
                        onRemoveSub={() =>
                            removeSubQuestion(
                                q.localId
                            )
                        }
                        onSetQuestionType={(
                            type
                        ) =>
                            setQuestionType(
                                q.localId,
                                type
                            )
                        }
                    />
                )
            )}
          </div>
        </div>

        <footer
            style={{
              ...footer,
              paddingBottom: `calc(40px + ${kbOffset}px)`,
            }}
        >
          {!isScoring ? (
              <div style={footerActionGroup}>
                <button style={examBackBtn} onClick={handleCancel}>中断</button>
                {solvedTimerValue === undefined ? (
                    <button style={solvedBtn} onClick={handleSolved}>解答完了</button>
                ) : (
                    <div style={solvedMarker}>✓ {formatMs(solvedTimerValue)}</div>
                )}
                <button style={finishBtn} onClick={handleFinishExam}>試験終了</button>
              </div>
          ) : isViewMode && !isEditing ? (
              <div style={footerActionGroup}>
                <button style={examBackBtn} onClick={onCancel}>閉じる</button>
                <button style={saveBtn} onClick={() => setIsEditing(true)}>編集</button>
              </div>
          ) : (
              <div style={footerActionGroup}>
                {(isEditMode || isEditing) && (
                    <button style={examBackBtn} onClick={onCancel}>キャンセル</button>
                )}
                <button style={examBackBtn} onClick={() => setIsScoring(false)}>解答を修正</button>
                <button
                    style={saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                  {saving ? '保存中...' : '保存して実績確認'}
                </button>
              </div>
          )}
        </footer>
      </div>
  )
}