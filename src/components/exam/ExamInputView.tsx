import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSettingsStore } from '../../lib/store/settings'
import type { ExamSession, QuestionDraft, ExamQuestionInput, Rank } from '../../types/exam'
import { QuestionRow } from './QuestionRow'
import { ExamStopWatchWidget } from './ExamStopWatchWidget'
import { useExamTimer } from '../../hooks/useExamTimer'
import {DoubtIcon} from "@/lib/icon/DoubtIcon.tsx";

type ExamDraft = {
  sessionId: number
  subject: string
  examYear: string
  questions: QuestionDraft[]
  isScoring: boolean
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
    localStorage.setItem(draftKey(draft.sessionId), JSON.stringify(draft))
  } catch {
    // localStorage full などは無視
  }
}

function clearDraft(sessionId: number) {
  localStorage.removeItem(draftKey(sessionId))
}

function makeDraft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    localId: `q-${Date.now()}-${Math.random()}`,
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
}

function refreshDisplayIds(drafts: QuestionDraft[]): QuestionDraft[] {
  let parentCount = 0
  return drafts.map(q => {
    if (!q.isSub) {
      parentCount++
      return { ...q, displayId: `第${parentCount}問` }
    }
    return q
  })
}

function draftsToInputs(drafts: QuestionDraft[]): ExamQuestionInput[] {
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
  }))
}

function initQuestions(session: ExamSession, savedDraft: ExamDraft | null): QuestionDraft[] {
  if (savedDraft && savedDraft.questions.length > 0) {
    return savedDraft.questions
  }
  if (session.questions.length > 0) {
    return refreshDisplayIds(
      session.questions.map(q => ({
        localId: `q-${q.id}`,
        sortOrder: q.sortOrder,
        displayId: q.displayId,
        isSub: q.isSub,
        hasChildren: q.hasChildren,
        rank: q.rank as Rank,
        myAnswer: q.myAnswer,
        isCorrect: q.isCorrect,
        isDoubtful: q.isDoubtful,
        point: q.point,
        note: q.note,
      })),
    )
  }
  return refreshDisplayIds([makeDraft({ sortOrder: 1 })])
}

interface ExamInputViewProps {
  session: ExamSession
  onComplete: (
    sessionId: number,
    subject: string,
    examYear: string,
    questions: ExamQuestionInput[],
  ) => Promise<void>
  onCancel: () => void
}

export default function ExamInputView({ session, onComplete, onCancel }: ExamInputViewProps) {
  const savedDraft = useMemo(() => loadDraft(session.id), [session.id])
  const subjects = useSettingsStore((s) => s.subjects)

  const [subject, setSubject] = useState(savedDraft?.subject ?? session.subject)
  const [examYear, setExamYear] = useState(savedDraft?.examYear ?? session.examYear)
  const [isScoring, setIsScoring] = useState(savedDraft?.isScoring ?? session.status === 'scoring')
  const [saving, setSaving] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    initQuestions(session, savedDraft),
  )

  const timer = useExamTimer()
  // 最新のタイマー値をコールバック内で参照するためのref
  const timerTimeRef = useRef(timer.time)
  useEffect(() => { timerTimeRef.current = timer.time }, [timer.time])

  // 下書き自動保存
  useEffect(() => {
    saveDraft({ sessionId: session.id, subject, examYear, questions, isScoring })
  }, [session.id, subject, examYear, questions, isScoring])

  // ブラウザバック・タブ閉じ時の警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const stats = useMemo(() => {
    const targets = questions.filter(q => !q.hasChildren)
    return {
      correctCount: targets.filter(q => q.isCorrect === true).length,
      incorrectCount: targets.filter(q => q.isCorrect === false).length,
      doubtfulCount: targets.filter(q => q.isDoubtful).length,
      totalScore: targets.reduce((s, q) => q.isCorrect === true ? s + q.point : s, 0),
      pureScore: targets.reduce((s, q) => (q.isCorrect === true && !q.isDoubtful) ? s + q.point : s, 0),
    }
  }, [questions])

  const updateQuestion = useCallback((localId: string, patch: Partial<QuestionDraft>) => {
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      // 初回解答時にストップウォッチの時刻を記録
      const shouldRecordTime =
        patch.myAnswer !== undefined &&
        patch.myAnswer !== '' &&
        q.myAnswer === '' &&
        q.answeredTimeMs === undefined
      return {
        ...q,
        ...patch,
        ...(shouldRecordTime ? { answeredTimeMs: timerTimeRef.current } : {}),
      }
    }))
  }, [])

  const addParentQuestion = useCallback((afterLocalId: string) => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.localId === afterLocalId)
      const parentsBefore = prev.slice(0, idx + 1).filter(q => !q.isSub).length
      const next = [...prev]
      next.splice(idx + 1, 0, makeDraft({ sortOrder: parentsBefore + 0.5 }))
      const sorted = next.sort((a, b) => a.sortOrder - b.sortOrder).map((q, i) => ({ ...q, sortOrder: i + 1 }))
      return refreshDisplayIds(sorted)
    })
  }, [])

  const removeParentQuestion = useCallback((localId: string) => {
    setQuestions(prev => {
      const parentCount = prev.filter(q => !q.isSub).length
      if (parentCount <= 1) return prev
      const filtered = prev.filter(q => q.localId !== localId)
      return refreshDisplayIds(filtered.map((q, i) => ({ ...q, sortOrder: i + 1 })))
    })
  }, [])

  const addSubQuestion = useCallback((parentLocalId: string) => {
    setQuestions(prev => {
      const parent = prev.find(q => q.localId === parentLocalId)
      if (!parent) return prev
      const subs = prev.filter(q => q.sortOrder === parent.sortOrder && q.isSub)
      const newSub = makeDraft({
        sortOrder: parent.sortOrder,
        displayId: `設問${subs.length + 1}`,
        isSub: true,
        hasChildren: false,
        point: 2,
      })
      const inserted = [...prev, newSub].sort((a, b) =>
        a.sortOrder - b.sortOrder || a.localId.localeCompare(b.localId),
      )
      return inserted
    })
  }, [])

  const setQuestionType = useCallback((localId: string, type: 'single' | 'multi') => {
    setQuestions(prev => {
      const target = prev.find(q => q.localId === localId)
      if (!target) return prev
      const others = prev.filter(q => q.sortOrder !== target.sortOrder)
      const newItems: QuestionDraft[] =
        type === 'multi'
          ? [
              makeDraft({ localId: `p-${target.sortOrder}`, sortOrder: target.sortOrder, hasChildren: true, point: 0 }),
              makeDraft({ localId: `s-${target.sortOrder}-1`, sortOrder: target.sortOrder, displayId: '設問1', isSub: true, point: 2 }),
            ]
          : [makeDraft({ localId: `p-${target.sortOrder}`, sortOrder: target.sortOrder })]
      const sorted = [...others, ...newItems].sort((a, b) =>
        a.sortOrder - b.sortOrder || a.localId.localeCompare(b.localId),
      )
      return refreshDisplayIds(sorted)
    })
    setActiveMenu(null)
  }, [])

  const handleFinishExam = () => {
    if (!window.confirm('試験を終了して自己採点を開始しますか？')) return
    setIsScoring(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    if (!window.confirm('入力内容は下書きとして保存されます。解答画面を閉じますか？')) return
    onCancel()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onComplete(session.id, subject, examYear, draftsToInputs(questions))
      clearDraft(session.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={container}>
      <div style={stickyHeader}>
        <div style={headerTopRow}>
          <div style={metaArea}>
            <div style={subjTxt}>{subject}</div>
            <div style={yearTxt}>{examYear} {isScoring ? '自己採点中' : '解答用紙'}</div>
          </div>
          {isScoring && (
            <div style={statsBadge}>
              <div style={statItem}><span style={dotO}>○</span> {stats.correctCount}</div>
              <div style={statItem}><span style={dotX}>×</span> {stats.incorrectCount}</div>
              <div style={statItem}><DoubtIcon/> {stats.doubtfulCount}</div>
            </div>
          )}
        </div>

        {!isScoring && (
          <div style={timerWrapper}>
            <ExamStopWatchWidget timer={timer} />
          </div>
        )}

        {isScoring && (
          <div style={scoreGrid}>
            <div style={scoreCell}>
              <span style={scoreLab}>TOTAL</span>
              <span style={{ ...scoreVal, color: stats.totalScore >= 60 ? '#2383e2' : '#eb5757' }}>
                {stats.totalScore}
              </span>
            </div>
            <div style={scoreVLine} />
            <div style={scoreCell}>
              <span style={scoreLab}>PURE</span>
              <span style={scoreValPure}>{stats.pureScore}</span>
            </div>
          </div>
        )}
      </div>

      <div style={contentBody}>
        {!isScoring && (
          <div style={setupRow}>
            <div style={{ flex: 1 }}>
              <input
                list="subject-options"
                style={autoCompleteInput}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="科目名..."
              />
              <datalist id="subject-options">
                {subjects.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <input
              style={yearInput}
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              placeholder="年度"
            />
          </div>
        )}

        <div style={gridContainer}>
          {questions.map((q) => (
            <QuestionRow
              key={q.localId}
              question={q}
              isScoring={isScoring}
              isMenuOpen={activeMenu === q.localId}
              onUpdate={(patch) => updateQuestion(q.localId, patch)}
              onAddParent={() => addParentQuestion(q.localId)}
              onRemoveParent={() => removeParentQuestion(q.localId)}
              onAddSub={() => addSubQuestion(q.localId)}
              onToggleMenu={() => setActiveMenu(activeMenu === q.localId ? null : q.localId)}
              onSetQuestionType={(type) => setQuestionType(q.localId, type)}
            />
          ))}
        </div>
      </div>

      <footer style={footer}>
        {!isScoring ? (
          <div style={footerActionGroup}>
            <button style={backBtn} onClick={handleCancel}>キャンセル</button>
            <button style={finishBtn} onClick={handleFinishExam}>試験終了（採点へ）</button>
          </div>
        ) : (
          <div style={footerActionGroup}>
            <button style={backBtn} onClick={() => setIsScoring(false)}>解答を修正する</button>
            <button style={saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存して実績を確認'}
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}

// ── Styles ──
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '0 16px', color: '#37352f' }
const stickyHeader: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #eee', margin: '0 -16px 20px', padding: '12px 20px' }
const headerTopRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }
const metaArea: React.CSSProperties = { flex: 1 }
const subjTxt: React.CSSProperties = { fontSize: '12px', fontWeight: 900 }
const yearTxt: React.CSSProperties = { fontSize: '10px', color: '#888', fontWeight: 700 }
const statsBadge: React.CSSProperties = { display: 'flex', gap: '10px', backgroundColor: '#f4f4f3', padding: '4px 12px', borderRadius: '20px' }
const statItem: React.CSSProperties = { fontSize: '11px', fontWeight: 800 }
const dotO: React.CSSProperties = { color: '#2383e2' }
const dotX: React.CSSProperties = { color: '#eb5757' }
const timerWrapper: React.CSSProperties = { margin: '0 -20px 0' }
const scoreGrid: React.CSSProperties = { display: 'flex', alignItems: 'center', paddingBottom: '8px' }
const scoreCell: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }
const scoreLab: React.CSSProperties = { fontSize: '9px', fontWeight: 800, color: '#aaa' }
const scoreVal: React.CSSProperties = { fontSize: '32px', fontWeight: 900 }
const scoreValPure: React.CSSProperties = { fontSize: '32px', fontWeight: 900, color: '#19a576' }
const scoreVLine: React.CSSProperties = { width: '1px', height: '30px', backgroundColor: '#eee' }
const contentBody: React.CSSProperties = { paddingTop: '10px' }
const setupRow: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '24px' }
const autoCompleteInput: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }
const yearInput: React.CSSProperties = { width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #eee', fontSize: '13px', textAlign: 'center' }
const gridContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const footer: React.CSSProperties = { marginTop: '40px', paddingBottom: '40px' }
const footerActionGroup: React.CSSProperties = { display: 'flex', gap: '10px' }
const finishBtn: React.CSSProperties = { flex: 2, padding: '16px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }
const saveBtn: React.CSSProperties = { flex: 2, padding: '16px', backgroundColor: '#37352f', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }
const backBtn: React.CSSProperties = { flex: 1, padding: '16px', backgroundColor: '#fff', color: '#37352f', border: '1px solid #eee', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }
