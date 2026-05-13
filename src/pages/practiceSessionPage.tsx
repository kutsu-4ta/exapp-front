import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { QuestionDraft } from '../types/exam'
import type { Flashcard, Problem, ProblemInput } from '../types/workspace'
import { PracticeAnswerView } from '@/components/practice/PracticeAnswerView.tsx'
import { TodayCardModal } from '@/components/practice/TodayCardModal.tsx'
import { savePracticeSession } from '@/lib/api/practice.ts'
import { fetchProblem, updateProblem } from '@/lib/api/problem.ts'
import { c, font } from '@/styles/notion.ts'
import { type AnsweredRecord, clearDraft, loadDraft, saveDraft } from '@/lib/practiceDraft.ts'

type Phase = 'active' | 'complete'

function makeBlankQuestion(index: number): QuestionDraft {
    return {
        localId: crypto.randomUUID(),
        sortOrder: index,
        displayId: '',
        isSub: false,
        hasChildren: false,
        rank: 'B',
        myAnswer: '',
        isCorrect: null,
        isDoubtful: false,
        point: 4,
        note: null,
    }
}

function makeSubQuestion(parentIndex: number, subIndex: number): QuestionDraft {
    return {
        localId: crypto.randomUUID(),
        sortOrder: parentIndex,
        displayId: `設問${subIndex}`,
        isSub: true,
        hasChildren: false,
        rank: 'B',
        myAnswer: '',
        isCorrect: null,
        isDoubtful: false,
        point: 2,
        note: null,
    }
}

export default function PracticeSessionPage() {
    const { subject: enc } = useParams<{ subject: string }>()
    const subject = decodeURIComponent(enc ?? '')
    const navigate = useNavigate()
    const location = useLocation()

    // Today mode: started from subject page "今日の5問"
    const todayMode: boolean = location.state?.mode === 'today'
    const todayCards: Flashcard[] = location.state?.todayCards ?? []

    const [phase, setPhase] = useState<Phase>('active')
    const [currentIndex, setCurrentIndex] = useState(() =>
        todayMode ? 1 : (loadDraft(subject)?.currentIndex ?? 1)
    )
    const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>(() =>
        makeBlankQuestion(todayMode ? 1 : (loadDraft(subject)?.currentIndex ?? 1))
    )
    const [subQuestions, setSubQuestions] = useState<QuestionDraft[]>([])

    const [questionStartMs, setQuestionStartMs] = useState(Date.now())
    const [log, setLog] = useState<AnsweredRecord[]>(() =>
        todayMode ? [] : (loadDraft(subject)?.log ?? [])
    )
    const [totalElapsedMs, setTotalElapsedMs] = useState(0)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [pendingInitAnswers, setPendingInitAnswers] = useState<
        { answer: string; isDoubtful: boolean; memos: Record<string, string> }[] | undefined
    >(undefined)
    const [resumedFrom] = useState(() => {
        if (todayMode) return null
        const d = loadDraft(subject)
        return d && d.log.length > 0 ? d.currentIndex : null
    })

    // Today mode: review modal state
    const [reviewProblem, setReviewProblem] = useState<Problem | null>(null)
    const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null)
    const [pendingLog, setPendingLog] = useState<AnsweredRecord[] | null>(null)
    const [pendingStartMs, setPendingStartMs] = useState<number | null>(null)

    // ドラフト保存（today モードでは使わない）
    useEffect(() => {
        if (phase !== 'active' || todayMode) return
        saveDraft(subject, { currentIndex, log })
    }, [currentIndex, log, phase, subject, todayMode])

    // ── 設問追加 / 削除 ──
    const handleAddSubQuestion = () => {
        setSubQuestions(prev => [
            ...prev,
            makeSubQuestion(currentIndex, prev.length + 1),
        ])
    }

    const handleRemoveSubQuestion = (localId: string) => {
        setSubQuestions(prev => {
            const filtered = prev.filter(q => q.localId !== localId)
            return filtered.map((q, i) => ({ ...q, displayId: `設問${i + 1}` }))
        })
    }

    // ── 前進（次問へ / 完了） ──
    const performAdvance = (nextIdx: number, theLog: AnsweredRecord[], startMs: number) => {
        setReviewProblem(null)
        setPendingNextIndex(null)
        setPendingLog(null)
        setPendingStartMs(null)

        if (todayMode && nextIdx > todayCards.length) {
            const logTotal = theLog.reduce((s, r) => s + r.elapsedMs, 0)
            setTotalElapsedMs(logTotal)
            setPhase('complete')
            return
        }

        setCurrentIndex(nextIdx)
        setCurrentQuestion(makeBlankQuestion(nextIdx))
        setSubQuestions([])
        setQuestionStartMs(startMs)
        setPendingInitAnswers(undefined)
    }

    // ── 回答送信 ──
    const handleSubmit = (payload: {
        answers: { answer: string; isDoubtful: boolean; note: string | null; memos: Record<string, string> }[]
    }) => {
        const now = Date.now()
        const elapsed = now - questionStartMs
        const newRecord = { index: currentIndex, answers: payload.answers, elapsedMs: elapsed }
        const newLog = [...log, newRecord]
        const nextIdx = currentIndex + 1

        setLog(newLog)

        if (todayMode && currentIndex <= todayCards.length) {
            // Show review modal before advancing
            const card = todayCards[currentIndex - 1]
            setPendingNextIndex(nextIdx)
            setPendingLog(newLog)
            setPendingStartMs(now)
            fetchProblem(card.id)
                .then((p) => setReviewProblem(p))
                .catch(() => performAdvance(nextIdx, newLog, now))
        } else {
            performAdvance(nextIdx, newLog, now)
        }
    }

    // ── Today モード: モーダル確認 ──
    const handleModalConfirm = async (input: ProblemInput) => {
        if (reviewProblem) {
            await updateProblem(reviewProblem.id, input)
        }
        performAdvance(pendingNextIndex!, pendingLog!, pendingStartMs ?? Date.now())
    }

    // ── 前の問題へ戻る ──
    const handleGoBack = () => {
        const prev = log[log.length - 1]
        if (!prev) return

        setLog(log.slice(0, -1))
        setCurrentIndex(prev.index)
        setCurrentQuestion(makeBlankQuestion(prev.index))
        setSubQuestions(
            prev.answers.length > 1
                ? prev.answers.map((_, i) => makeSubQuestion(prev.index, i + 1))
                : []
        )
        setQuestionStartMs(Date.now())
        setPendingInitAnswers(prev.answers.map(a => ({
            answer: a.answer,
            isDoubtful: a.isDoubtful,
            memos: a.memos,
        })))
    }

    // ── 終了 ──
    const handleFinish = () => {
        const logTotal = log.reduce((s, r) => s + r.elapsedMs, 0)
        setTotalElapsedMs(logTotal + (Date.now() - questionStartMs))
        setPhase('complete')
    }

    const handleSaveAndNavigate = async () => {
        const minutes = Math.max(1, Math.round(totalElapsedMs / 60000))
        setSaving(true)
        setSaveError(null)
        try {
            await savePracticeSession({
                subject,
                date: new Date().toISOString().slice(0, 10),
                questions: log.map(r => ({
                    index: r.index,
                    judgement: r.answers.map(a => a.answer).join(','),
                    elapsedMs: r.elapsedMs,
                    note: r.answers.map(a => a.note).filter(Boolean).join('\n') || null,
                    memos: r.answers.map(a => a.memos),
                })),
                totalElapsedMs,
            })
            clearDraft(subject)
            navigate(
                `/workspace/today?minutes=${minutes}&subject=${encodeURIComponent(subject)}&material=${encodeURIComponent('演習')}`
            )
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
            setSaving(false)
        }
    }

    // ── 完了画面 ──
    if (phase === 'complete') {
        const minutes = Math.max(1, Math.round(totalElapsedMs / 60000))

        return (
            <div style={page}>
                <div style={completeWrap}>
                    <div style={completeTitle}>演習完了</div>

                    <div style={statsRow}>
                        <div style={statItem}>
                            <span style={statNum}>{log.length}</span>
                            <span style={statLabel}>問</span>
                        </div>
                        <div style={statDivider} />
                        <div style={statItem}>
                            <span style={statNum}>{minutes}</span>
                            <span style={statLabel}>分</span>
                        </div>
                    </div>

                    <button style={{ ...saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSaveAndNavigate} disabled={saving}>
                        {saving ? '保存中...' : 'ワークスペースへ記録する'}
                    </button>

                    {saveError && <p style={errorText}>{saveError}</p>}

                    <button style={discardBtn} onClick={() => { clearDraft(subject); navigate(-1) }} disabled={saving}>
                        記録せずに戻る
                    </button>
                </div>
            </div>
        )
    }

    // ── アクティブ ──
    return (
        <div style={page}>
            <div style={sessionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!todayMode && log.length > 0 && !reviewProblem && (
                        <button style={backBtn} onClick={handleGoBack} title="前の問題へ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Q{currentIndex - 1}
                        </button>
                    )}
                    <button
                        style={subjectLink}
                        onClick={() => navigate(`/subjects/${encodeURIComponent(subject)}`)}
                    >
                        {subject}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '4px', flexShrink: 0 }}>
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                    {todayMode && (
                        <span style={todayBadge}>TODAY'S FVIE</span>
                    )}
                    {resumedFrom !== null && (
                        <span style={resumeBadge}>Q{resumedFrom}から再開</span>
                    )}
                </div>
                {todayMode ? (
                    <span style={todayProgress}>{log.length}/{todayCards.length}</span>
                ) : (
                    <button style={finishBtn} onClick={handleFinish}>
                        終了する
                    </button>
                )}
            </div>

            {todayMode && todayCards[currentIndex - 1] && (
                <div style={todayCardRef}>
                    {todayCards[currentIndex - 1].front.material}_{todayCards[currentIndex - 1].front.questionRef}
                </div>
            )}

            <PracticeAnswerView
                key={currentQuestion.localId}
                question={currentQuestion}
                subQuestions={subQuestions}
                subject={subject}
                initialAnswers={pendingInitAnswers}
                onSubmit={handleSubmit}
                onAddSubQuestion={handleAddSubQuestion}
                onRemoveSubQuestion={handleRemoveSubQuestion}
            />

            {reviewProblem && (
                <TodayCardModal
                    problem={reviewProblem}
                    cardIndex={log.length}
                    totalCards={todayCards.length}
                    onConfirm={handleModalConfirm}
                />
            )}
        </div>
    )
}
const page: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px 16px 60px',
    color: c.text,
}

const sessionHeader: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
}

const backBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '2px',
    padding: '4px 8px', borderRadius: '6px',
    border: `1px solid ${c.border}`, background: '#fff',
    color: c.textSub, fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
}

const subjectLink: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: font.md,
    fontWeight: 800,
    color: c.text,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
}

const resumeBadge: React.CSSProperties = {
    fontSize: font.xs,
    fontWeight: 600,
    color: c.blue,
    background: 'rgba(35,131,226,0.08)',
    border: '1px solid rgba(35,131,226,0.2)',
    borderRadius: '4px',
    padding: '2px 7px',
}

const todayBadge: React.CSSProperties = {
    fontSize: font.xs,
    fontWeight: 700,
    color: '#27ae60',
    background: 'rgba(39,174,96,0.1)',
    border: '1px solid rgba(39,174,96,0.2)',
    borderRadius: '4px',
    padding: '2px 7px',
}

const todayProgress: React.CSSProperties = {
    fontSize: font.base,
    fontWeight: 700,
    color: c.text,
    letterSpacing: '-0.01em',
}

const todayCardRef: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(55,53,47,0.5)',
    padding: '6px 0 12px',
    borderBottom: `1px solid rgba(55,53,47,0.06)`,
    marginBottom: '16px',
}

const finishBtn: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '8px',
    border: `1px solid ${c.border}`,
    background: '#fff',
    color: c.textSub,
    fontSize: font.sm,
    fontWeight: 600,
    cursor: 'pointer',
}

const completeWrap: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginTop: '60px',
}

const completeTitle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 900,
    color: c.text,
}

const statsRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '20px 40px',
    borderRadius: '12px',
    border: `1px solid ${c.border}`,
    background: c.surface,
}

const statItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
}

const statNum: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 900,
    color: c.text,
}

const statLabel: React.CSSProperties = {
    fontSize: font.base,
    color: c.textSub,
    fontWeight: 600,
}

const statDivider: React.CSSProperties = {
    width: '1px',
    height: '32px',
    background: c.border,
}

const saveBtn: React.CSSProperties = {
    width: '100%',
    maxWidth: '320px',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: c.text,
    color: '#fff',
    fontSize: font.base,
    fontWeight: 800,
    cursor: 'pointer',
}

const discardBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: font.sm,
    color: c.textSub,
    fontWeight: 600,
}

const errorText: React.CSSProperties = {
    fontSize: font.sm,
    color: c.red,
    margin: 0,
}