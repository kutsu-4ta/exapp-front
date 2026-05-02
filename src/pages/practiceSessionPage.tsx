import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { QuestionDraft } from '../types/exam'
import { PracticeAnswerView } from '@/components/practice/PracticeAnswerView.tsx'
import { savePracticeSession } from '@/lib/api/practice.ts'
import { c, font } from '@/styles/notion.ts'

type Phase = 'active' | 'complete'

type AnsweredRecord = {
    index: number
    answers: { answer: string; isDoubtful: boolean; note: string | null }[]
    elapsedMs: number
}

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

    const [phase, setPhase] = useState<Phase>('active')
    const [currentIndex, setCurrentIndex] = useState(1)
    const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>(() => makeBlankQuestion(1))
    const [subQuestions, setSubQuestions] = useState<QuestionDraft[]>([])

    const [sessionStartMs] = useState(Date.now())
    const [questionStartMs, setQuestionStartMs] = useState(Date.now())
    const [log, setLog] = useState<AnsweredRecord[]>([])
    const [totalElapsedMs, setTotalElapsedMs] = useState(0)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // ── 設問追加 / リセット ──
    const handleAddSubQuestion = () => {
        setSubQuestions(prev => [
            ...prev,
            makeSubQuestion(currentIndex, prev.length + 1),
        ])
    }

    const handleResetSubQuestions = () => {
        setSubQuestions([])
    }

    // ── 回答送信 ──
    const handleSubmit = (payload: {
        answers: { answer: string; isDoubtful: boolean; note: string | null }[]
    }) => {
        const now = Date.now()
        const elapsed = now - questionStartMs

        setLog(prev => [
            ...prev,
            {
                index: currentIndex,
                answers: payload.answers,
                elapsedMs: elapsed,
            },
        ])

        const next = currentIndex + 1
        setCurrentIndex(next)
        setCurrentQuestion(makeBlankQuestion(next))
        setSubQuestions([]) // ← 次の問題でリセット
        setQuestionStartMs(now)
    }

    // ── 終了 ──
    const handleFinish = () => {
        setTotalElapsedMs(Date.now() - sessionStartMs)
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
                })),
                totalElapsedMs,
            })
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

                    <button style={discardBtn} onClick={() => navigate(-1)} disabled={saving}>
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
                <span style={indexLabel}>{subject} </span>
                <button style={finishBtn} onClick={handleFinish}>
                    終了する
                </button>
            </div>

            <PracticeAnswerView
                key={currentQuestion.localId}
                question={currentQuestion}
                subQuestions={subQuestions}
                subject={subject}
                onSubmit={handleSubmit}
                onAddSubQuestion={handleAddSubQuestion}
                onResetSubQuestions={handleResetSubQuestions}
            />
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

const indexLabel: React.CSSProperties = {
    fontSize: font.md,
    fontWeight: 800,
    color: c.text,
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