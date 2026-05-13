import {useCallback, useEffect, useState} from 'react'
import type { QuestionDraft, Rank } from '@/types/exam.ts'
import { ANSWER_OPTIONS, RANKS } from '@/types/exam.ts'
import { DoubtIcon } from '@/lib/icon/DoubtIcon.tsx'
import { c } from '@/styles/notion.ts'
import {
    wrap, parentHeader, qLabel, subBtnRow, addSubBtn,
    subRowOuter, sideControl, sideBtn, block, qBlock, subLabel,
    typeToggleRow, typeToggleBtn, typeToggleActive,
    alphabetToggleBtn, alphabetToggleBtnActive, alphabetToggleBtnDisabled,
    optionLineRow, optionBtn, optionActive, optionExcluded, optionDisabled, optionRow,
    excludeBtn, excludeBtnActive, optionMemoInput,
    doubtRow, doubtBtn, doubtBtnInline, generalMemoTextarea,
    descriptiveTextarea,
    okBtn, confirmRow, myAnswerText, memoReviewBlock, memoReviewItem,
    memoReviewLabel, memoReviewText, judgeRow, judgeBtn,
    correctActive, incorrectActive, rankLabel, rankBtn,
    confirmHeader, backToEditBtn, confirmActions, addProblemBtn, nextBtn,
} from './PracticeAnswerView.styles'
import { AddProblemModal } from '../note/AddProblemModal.tsx'
import {addProblem, updateProblem} from '@/lib/api/problem.ts'
import type { ProblemInput } from '@/types/workspace.ts'
import { useSettingsStore } from '@/lib/store/settings.ts'
import {invalidateCache} from "@/lib/pageCache.ts";

type ViewPhase = 'input' | 'confirm'

type AnswerState = {
    selectedOption: string
    memos: Record<string, string>
    isDescriptive: boolean
    descriptiveText: string
    isDoubtful: boolean
    isCorrect: boolean | null
    rank: Rank
    isAlphabet: boolean
    excludedOptions: string[]
    generalMemo: string
}

type InitialAnswer = {
    answer: string
    isDoubtful: boolean
    memos: Record<string, string>
}

type Props = {
    question: QuestionDraft
    subQuestions: QuestionDraft[]
    subject: string
    initialAnswers?: InitialAnswer[]
    onSubmit: (payload: {
        answers: { answer: string; isDoubtful: boolean; note: string | null; memos: Record<string, string> }[]
    }) => void
    onAddSubQuestion: () => void
    onRemoveSubQuestion: (localId: string) => void
}

const ALPHA_MAP: Record<string, string> = {
    'ア': 'a', 'イ': 'b', 'ウ': 'c', 'エ': 'd', 'オ': 'e',
}

function displayLabel(opt: string, isAlphabet: boolean) {
    return isAlphabet ? (ALPHA_MAP[opt] ?? opt) : opt
}

function makeInitial(): AnswerState {
    return {
        selectedOption: '',
        memos: {},
        isDescriptive: false,
        descriptiveText: '',
        isDoubtful: false,
        isCorrect: null,
        rank: 'B',
        isAlphabet: false,
        excludedOptions: [],
        generalMemo: '',
    }
}

export function PracticeAnswerView({
    question,
    subQuestions,
    subject,
    initialAnswers,
    onSubmit,
    onAddSubQuestion,
    onRemoveSubQuestion,
}: Props) {
    const targets = subQuestions.length > 0 ? subQuestions : [question]
    const materialName = useSettingsStore((s) => s.materials)[0] // TODO: 直近で選択したものをStoreに持つように改修する

    const [phase, setPhase] = useState<ViewPhase>('input')
    const [answers, setAnswers] = useState<AnswerState[]>(() =>
        targets.map((_, i) => {
            const init = initialAnswers?.[i]
            if (!init) return makeInitial()
            const isDescriptive = !ANSWER_OPTIONS.includes(init.answer as typeof ANSWER_OPTIONS[number])
            return {
                ...makeInitial(),
                selectedOption: isDescriptive ? '' : init.answer,
                isDescriptive,
                descriptiveText: isDescriptive ? init.answer : '',
                isDoubtful: init.isDoubtful,
                memos: init.memos,
            }
        })
    )
    const [showModal, setShowModal] = useState(false)
    const subCategories = useSettingsStore((s) => s.subCategories)

    useEffect(() => {
        setAnswers(prev => {
            if (prev.length === targets.length) return prev
            if (subQuestions.length === 0) return [makeInitial()]
            if (prev.length < targets.length) {
                const extra = Array(targets.length - prev.length).fill(null).map(() => makeInitial())
                return [...prev, ...extra]
            }
            return prev.slice(0, targets.length)
        })
    }, [targets.length, subQuestions.length])

    const update = (i: number, patch: Partial<AnswerState>) =>
        setAnswers(prev => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a))

    const updateMemo = (i: number, option: string, text: string) =>
        setAnswers(prev => prev.map((a, idx) => idx === i
            ? { ...a, memos: { ...a.memos, [option]: text } }
            : a
        ))

    const toggleExclude = (i: number, opt: string) => {
        setAnswers(prev => prev.map((a, idx) => {
            if (idx !== i) return a
            const already = a.excludedOptions.includes(opt)
            return {
                ...a,
                excludedOptions: already
                    ? a.excludedOptions.filter(o => o !== opt)
                    : [...a.excludedOptions, opt],
            }
        }))
    }

    const handleNext = () => {
        onSubmit({
            answers: answers.map(a => ({
                answer: a.isDescriptive ? a.descriptiveText : a.selectedOption,
                isDoubtful: a.isDoubtful,
                note: a.isDescriptive
                    ? (a.descriptiveText || null)
                    : (a.generalMemo || a.memos[a.selectedOption] || null),
                memos: a.isDescriptive ? {} : a.memos,
            })),
        })
    }

    const buildMemoNote = (): string => {
        const parts = answers.map((a, i) => {
            const prefix = subQuestions.length > 0
                ? `【${targets[i]?.displayId || `設問${i + 1}`}】\n`
                : ''
            if (a.isDescriptive) {
                return a.descriptiveText.trim() ? `${prefix}${a.descriptiveText.trim()}` : null
            }
            const lines: string[] = []
            if (a.generalMemo.trim()) lines.push(a.generalMemo.trim())
            const entries = Object.entries(a.memos).filter(([, v]) => v.trim())
            if (entries.length > 0) lines.push(entries.map(([opt, text]) => `${opt}: ${text}`).join('\n'))
            if (lines.length === 0) return null
            return `${prefix}${lines.join('\n')}`
        }).filter(Boolean)
        return parts.join('\n\n')
    }

    const handleAddProblem = async (
        input: ProblemInput
    ) => {
        const created = await addProblem(input)
        return created
    }

    const handleProblemUpdate = useCallback(
        async (id: number, input: ProblemInput) => {
            const updated = await updateProblem(id, input)
            invalidateCache('note-problems')
            return updated
        },
        []
    )

    // ── 確認フェーズ ─────────────────────────────────────────────────────────
    if (phase === 'confirm') {
        return (
            <div style={wrap}>
                <div style={confirmHeader}>
                    <button style={backToEditBtn} onClick={() => setPhase('input')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        修正
                    </button>
                    {question.displayId && (
                        <span style={{ ...qLabel, marginLeft: '8px' }}>{question.displayId}</span>
                    )}
                </div>

                <div style={block}>
                    {answers.map((a, i) => {
                        const q = targets[i]
                        const memoEntries = Object.entries(a.memos).filter(([, v]) => v.trim())

                        return (
                            <div key={q?.localId ?? i} style={qBlock}>
                                {subQuestions.length > 0 && (
                                    <span style={subLabel}>{q?.displayId || `設問${i + 1}`}</span>
                                )}

                                <div style={confirmRow}>
                                    {a.isDescriptive ? (
                                        <div style={myAnswerText}>{a.descriptiveText || '（記述なし）'}</div>
                                    ) : (
                                        <div style={optionRow}>
                                            {ANSWER_OPTIONS.map(opt => {
                                                const isSelected = a.selectedOption === opt
                                                const isExcluded = a.excludedOptions.includes(opt)
                                                return (
                                                    <button
                                                        key={opt}
                                                        style={{
                                                            ...optionBtn,
                                                            ...(isSelected ? optionActive : {}),
                                                            ...(!isSelected && isExcluded ? optionExcluded : {}),
                                                            ...(!isSelected && !isExcluded ? optionDisabled : {}),
                                                            cursor: 'default',
                                                        }}
                                                        disabled
                                                    >
                                                        <span style={isExcluded && !isSelected ? { textDecoration: 'line-through' } : {}}>
                                                            {displayLabel(opt, a.isAlphabet)}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                        style={doubtBtn}
                                    >
                                        <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
                                    </button>
                                </div>

                                {(a.generalMemo.trim() || memoEntries.length > 0) && (
                                    <div style={memoReviewBlock}>
                                        {a.generalMemo.trim() && (
                                            <div style={memoReviewItem}>
                                                <span style={memoReviewText}>{a.generalMemo}</span>
                                            </div>
                                        )}
                                        {memoEntries.map(([opt, text]) => (
                                            <div key={opt} style={memoReviewItem}>
                                                <span style={memoReviewLabel}>{displayLabel(opt, a.isAlphabet)}</span>
                                                <span style={memoReviewText}>{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={judgeRow}>
                                    <button
                                        style={{ ...judgeBtn, ...(a.isCorrect === true ? correctActive : {}) }}
                                        onClick={() => update(i, { isCorrect: a.isCorrect === true ? null : true })}
                                    >
                                        ○
                                    </button>
                                    <button
                                        style={{ ...judgeBtn, ...(a.isCorrect === false ? incorrectActive : {}) }}
                                        onClick={() => update(i, { isCorrect: a.isCorrect === false ? null : false })}
                                    >
                                        ×
                                    </button>
                                    <span style={rankLabel}>RANK</span>
                                    <button
                                        style={rankBtn}
                                        onClick={() => {
                                            const next = RANKS[(RANKS.indexOf(a.rank) + 1) % RANKS.length]
                                            update(i, { rank: next })
                                        }}
                                    >
                                        {a.rank}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div style={confirmActions}>
                    <button style={addProblemBtn} onClick={() => setShowModal(true)}>
                        Problemへ追加
                    </button>
                    <button style={nextBtn} onClick={handleNext}>
                        次の問題へ →
                    </button>
                </div>

                {showModal && (
                    <AddProblemModal
                        onSubmit={handleAddProblem}
                        onUpdate={handleProblemUpdate}
                        onClose={() => setShowModal(false)}
                        subCategories={subCategories}
                        initial={{
                            subject,
                            materialName,
                            solvedAt: new Date().toISOString().slice(0, 10),
                            note: buildMemoNote() || null,
                        }}
                    />
                )}
            </div>
        )
    }

    // ── 入力フェーズ ─────────────────────────────────────────────────────────
    const hasSubs = subQuestions.length > 0

    return (
        <div style={wrap}>
            {question.displayId && (
                <div style={parentHeader}>
                    <span style={qLabel}>{question.displayId}</span>
                </div>
            )}

            {!hasSubs && (
                <div style={subBtnRow}>
                    <button style={addSubBtn} onClick={onAddSubQuestion}>
                        ＋ 設問を追加
                    </button>
                </div>
            )}

            <div style={block}>
                {targets.map((q, i) => {
                    const a = answers[i] ?? makeInitial()
                    return (
                        <div key={q.localId ?? i} style={hasSubs ? subRowOuter : qBlock}>
                            {hasSubs && (
                                <div style={sideControl}>
                                    <button
                                        style={{ ...sideBtn, color: c.red }}
                                        onClick={() => onRemoveSubQuestion(q.localId)}
                                        title="削除"
                                    >
                                        －
                                    </button>
                                    <button
                                        style={sideBtn}
                                        onClick={onAddSubQuestion}
                                        title="追加"
                                    >
                                        ＋
                                    </button>
                                </div>
                            )}

                            <div style={{ ...qBlock, flex: hasSubs ? 1 : undefined, marginTop: 0 }}>
                                {hasSubs && (
                                    <span style={subLabel}>{q.displayId || `設問${i + 1}`}</span>
                                )}

                                {/* トグル行: [選択式][記述式][a↔ア] */}
                                <div style={typeToggleRow}>
                                    <button
                                        style={{ ...typeToggleBtn, ...(a.isDescriptive ? {} : typeToggleActive) }}
                                        onClick={() => update(i, { isDescriptive: false })}
                                    >
                                        選択式
                                    </button>
                                    <button
                                        style={{ ...typeToggleBtn, ...(a.isDescriptive ? typeToggleActive : {}) }}
                                        onClick={() => update(i, { isDescriptive: true })}
                                    >
                                        記述式
                                    </button>
                                    <button
                                        style={{
                                            ...alphabetToggleBtn,
                                            ...(a.isAlphabet ? alphabetToggleBtnActive : {}),
                                            ...(a.isDescriptive ? alphabetToggleBtnDisabled : {}),
                                        }}
                                        onClick={() => { if (!a.isDescriptive) update(i, { isAlphabet: !a.isAlphabet }) }}
                                        disabled={a.isDescriptive}
                                        title="ア→a / a→ア 切り替え"
                                    >
                                        a↔ア
                                    </button>
                                </div>

                                {a.isDescriptive ? (
                                    /* 記述式: DoubtIcon + textarea */
                                    <div style={doubtRow}>
                                        <button
                                            onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                            style={doubtBtnInline}
                                        >
                                            <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
                                        </button>
                                        <textarea
                                            style={descriptiveTextarea}
                                            placeholder="解答を記述..."
                                            value={a.descriptiveText}
                                            onChange={(e) => update(i, { descriptiveText: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    /* 選択式: 各選択肢行 + DoubtIcon */
                                    <>
                                        {ANSWER_OPTIONS.map(opt => {
                                            const label = displayLabel(opt, a.isAlphabet)
                                            const isSelected = a.selectedOption === opt
                                            const isExcluded = a.excludedOptions.includes(opt)
                                            return (
                                                <div key={opt} style={optionLineRow}>
                                                    {/* 記号ボタン */}
                                                    <button
                                                        style={{
                                                            ...optionBtn,
                                                            ...(isSelected ? optionActive : {}),
                                                            ...(isExcluded && !isSelected ? optionExcluded : {}),
                                                        }}
                                                        onClick={() => update(i, {
                                                            selectedOption: isSelected ? '' : opt,
                                                        })}
                                                    >
                                                        <span style={isExcluded && !isSelected ? { textDecoration: 'line-through' } : {}}>
                                                            {label}
                                                        </span>
                                                    </button>

                                                    {/* 斜線ボタン */}
                                                    <button
                                                        style={{
                                                            ...excludeBtn,
                                                            ...(isExcluded ? excludeBtnActive : {}),
                                                        }}
                                                        onClick={() => toggleExclude(i, opt)}
                                                        title="消去法"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                    </button>

                                                    {/* メモ入力 */}
                                                    <input
                                                        type="text"
                                                        style={optionMemoInput}
                                                        placeholder={`${label}のメモ`}
                                                        value={a.memos[opt] ?? ''}
                                                        onChange={(e) => updateMemo(i, opt, e.target.value)}
                                                    />
                                                </div>
                                            )
                                        })}

                                        {/* DoubtIcon + 共通メモ */}
                                        <div style={doubtRow}>
                                            <button
                                                onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                                style={doubtBtnInline}
                                            >
                                                <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
                                            </button>
                                            <textarea
                                                style={generalMemoTextarea}
                                                placeholder="メモ（選択肢に依存しない）"
                                                value={a.generalMemo}
                                                onChange={(e) => update(i, { generalMemo: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <button style={okBtn} onClick={() => setPhase('confirm')}>
                OK
            </button>
        </div>
    )
}
