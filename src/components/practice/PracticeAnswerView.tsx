import { useEffect, useState } from 'react'
import type { QuestionDraft, Rank } from '@/types/exam.ts'
import { ANSWER_OPTIONS, RANKS } from '@/types/exam.ts'
import { DoubtIcon } from '@/lib/icon/DoubtIcon.tsx'
import { c, cardStyle, font } from '@/styles/notion.ts'
import { AddProblemModal } from '@/components/weak/AddProblemModal.tsx'
import { addProblem } from '@/lib/api/problem.ts'
import { fetchSubCategories } from '@/lib/api/subcategory.ts'
import type { ProblemInput, SubCategory } from '@/types/workspace.ts'

type ViewPhase = 'input' | 'confirm'

type AnswerState = {
    selectedOption: string            // '' | 'ア' | ...
    memos: Record<string, string>     // per-choice memo
    isDescriptive: boolean
    descriptiveText: string
    isDoubtful: boolean
    isCorrect: boolean | null
    rank: Rank
}

type Props = {
    question: QuestionDraft
    subQuestions: QuestionDraft[]
    subject: string
    onSubmit: (payload: {
        answers: { answer: string; isDoubtful: boolean; note: string | null; memos: Record<string, string> }[]
    }) => void
    onAddSubQuestion: () => void
    onRemoveSubQuestion: (localId: string) => void
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
    }
}

export function PracticeAnswerView({
    question,
    subQuestions,
    subject,
    onSubmit,
    onAddSubQuestion,
    onRemoveSubQuestion,
}: Props) {
    const targets = subQuestions.length > 0 ? subQuestions : [question]

    const [phase, setPhase] = useState<ViewPhase>('input')
    const [answers, setAnswers] = useState<AnswerState[]>(() => targets.map(() => makeInitial()))
    const [showModal, setShowModal] = useState(false)
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [subCatFetched, setSubCatFetched] = useState(false)

    // 設問が追加/削除されたとき
    useEffect(() => {
        setAnswers(prev => {
            if (prev.length === targets.length) return prev
            // 設問が全削除されて単体に戻った → 回答リセット
            if (subQuestions.length === 0) return [makeInitial()]
            // 追加
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

    const handleConfirm = () => setPhase('confirm')

    const handleNext = () => {
        onSubmit({
            answers: answers.map(a => ({
                answer: a.isDescriptive ? a.descriptiveText : a.selectedOption,
                isDoubtful: a.isDoubtful,
                note: a.isDescriptive
                    ? (a.descriptiveText || null)
                    : (a.memos[a.selectedOption] ?? null),
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
            const entries = Object.entries(a.memos).filter(([, v]) => v.trim())
            if (entries.length === 0) return null
            return `${prefix}${entries.map(([opt, text]) => `${opt}: ${text}`).join('\n')}`
        }).filter(Boolean)
        return parts.join('\n\n')
    }

    const handleOpenModal = async () => {
        if (!subCatFetched) {
            try { setSubCategories(await fetchSubCategories()) } catch { /* ignore */ }
            setSubCatFetched(true)
        }
        setShowModal(true)
    }

    // 新規作成API
    const handleAddProblem = async (input: ProblemInput) => {
        await addProblem(input)
        setShowModal(false)
    }

    // ── 確認フェーズ ─────────────────────────────────────────────────────────
    if (phase === 'confirm') {
        return (
            <div style={wrap}>
                {question.displayId && (
                    <div style={parentHeader}>
                        <span style={qLabel}>{question.displayId}</span>
                    </div>
                )}

                <div style={block}>
                    {answers.map((a, i) => {
                        const q = targets[i]
                        const memoEntries = Object.entries(a.memos).filter(([, v]) => v.trim())

                        return (
                            <div key={q?.localId ?? i} style={qBlock}>
                                {subQuestions.length > 0 && (
                                    <span style={subLabel}>{q?.displayId || `設問${i + 1}`}</span>
                                )}

                                {/* 回答表示 */}
                                <div style={confirmRow}>
                                    {a.isDescriptive ? (
                                        <div style={myAnswerText}>{a.descriptiveText || '（記述なし）'}</div>
                                    ) : (
                                        <div style={optionRow}>
                                            {ANSWER_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    style={{
                                                        ...optionBtn,
                                                        ...(a.selectedOption === opt ? optionActive : optionDisabled),
                                                    }}
                                                    disabled
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                        style={doubtBtn}
                                    >
                                        <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
                                    </button>
                                </div>

                                {/* メモ表示 */}
                                {memoEntries.length > 0 && (
                                    <div style={memoReviewBlock}>
                                        {memoEntries.map(([opt, text]) => (
                                            <div key={opt} style={memoReviewItem}>
                                                <span style={memoReviewLabel}>{opt}</span>
                                                <span style={memoReviewText}>{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 自己採点 */}
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
                    <button style={addProblemBtn} onClick={handleOpenModal}>
                        Problemへ追加
                    </button>
                    <button style={nextBtn} onClick={handleNext}>
                        次の問題へ →
                    </button>
                </div>

                {showModal && (
                    <AddProblemModal
                        onSubmit={handleAddProblem}
                        onClose={() => setShowModal(false)}
                        subCategories={subCategories}
                        initial={{
                            subject,
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

            {/* サブ問がないときだけ「＋ 設問を追加」ボタンを上部に表示 */}
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
                            {/* サイドボタン（サブ問のみ） */}
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

                                {/* 選択式 / 記述式 トグル */}
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
                                </div>

                                {a.isDescriptive ? (
                                    <div style={descriptiveRow}>
                                        <textarea
                                            style={descriptiveTextarea}
                                            placeholder="解答を記述..."
                                            value={a.descriptiveText}
                                            onChange={(e) => update(i, { descriptiveText: e.target.value })}
                                        />
                                        <button
                                            onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                            style={doubtBtnInline}
                                        >
                                            <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
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
                                                        ...(a.selectedOption === opt ? optionActive : {}),
                                                    }}
                                                    onClick={() => update(i, { selectedOption: opt })}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => update(i, { isDoubtful: !a.isDoubtful })}
                                                style={doubtBtn}
                                            >
                                                <DoubtIcon size={18} color={a.isDoubtful ? '#f2994a' : c.textFaint} />
                                            </button>
                                        </div>

                                        {a.selectedOption && (
                                            <textarea
                                                key={a.selectedOption}
                                                style={memoTextarea}
                                                placeholder={`${a.selectedOption}のメモ...`}
                                                value={a.memos[a.selectedOption] ?? ''}
                                                onChange={(e) => updateMemo(i, a.selectedOption, e.target.value)}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <button style={okBtn} onClick={handleConfirm}>
                OK
            </button>
        </div>
    )
}

/* ── styles ── */

const wrap: React.CSSProperties = { ...cardStyle, gap: '16px' }

const parentHeader: React.CSSProperties = {
    fontSize: font.md,
    fontWeight: 800,
    color: c.text,
}

const qLabel: React.CSSProperties = { fontWeight: 800 }

const subBtnRow: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
}

const addSubBtn: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: font.sm,
    borderRadius: '6px',
    border: `1px dashed ${c.border}`,
    background: 'transparent',
    cursor: 'pointer',
    color: c.textSub,
}

const subRowOuter: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
}

const sideControl: React.CSSProperties = {
    width: '28px',
    marginRight: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '10px',
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

const block: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
}

const qBlock: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    background: c.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
}

const subLabel: React.CSSProperties = {
    fontSize: font.sm,
    fontWeight: 700,
    color: c.textSub,
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

const optionDisabled: React.CSSProperties = {
    opacity: 0.3,
    cursor: 'default',
}

const doubtBtn: React.CSSProperties = {
    marginLeft: 'auto',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px',
}

const doubtBtnInline: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
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
}

const descriptiveRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
}

const descriptiveTextarea: React.CSSProperties = {
    flex: 1,
    minHeight: '80px',
    padding: '10px',
    borderRadius: '6px',
    border: `1px solid ${c.border}`,
    fontSize: font.base,
    resize: 'vertical',
    boxSizing: 'border-box',
}

const okBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    background: c.text,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: font.base,
}

// ── confirm styles ──

const confirmRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}

const myAnswerText: React.CSSProperties = {
    flex: 1,
    fontSize: font.base,
    fontWeight: 500,
    color: c.text,
    whiteSpace: 'pre-wrap',
}

const memoReviewBlock: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'rgba(55,53,47,0.03)',
    border: `1px solid rgba(55,53,47,0.06)`,
}

const memoReviewItem: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
}

const memoReviewLabel: React.CSSProperties = {
    fontSize: font.xs,
    fontWeight: 800,
    color: c.textSub,
    minWidth: '14px',
    marginTop: '1px',
}

const memoReviewText: React.CSSProperties = {
    fontSize: font.sm,
    color: c.textSub,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
}

const judgeRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
}

const judgeBtn: React.CSSProperties = {
    width: '40px',
    height: '30px',
    borderRadius: '6px',
    border: `1px solid ${c.border}`,
    background: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: font.sm,
}

const correctActive: React.CSSProperties = {
    background: c.blue,
    color: '#fff',
    border: `1px solid ${c.blue}`,
}

const incorrectActive: React.CSSProperties = {
    background: c.red,
    color: '#fff',
    border: `1px solid ${c.red}`,
}

const rankLabel: React.CSSProperties = {
    fontSize: font.xs,
    fontWeight: 700,
    color: c.textHint,
    marginLeft: '8px',
}

const rankBtn: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: '4px',
    border: `1px solid ${c.border}`,
    background: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: font.sm,
}

const confirmActions: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
}

const addProblemBtn: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${c.border}`,
    background: '#fff',
    color: c.text,
    fontWeight: 600,
    fontSize: font.sm,
    cursor: 'pointer',
}

const nextBtn: React.CSSProperties = {
    flex: 2,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: c.text,
    color: '#fff',
    fontWeight: 700,
    fontSize: font.base,
    cursor: 'pointer',
}
