import {useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {useSettingsStore} from '../lib/store/settings'
import type {ExamQuestionInput, ExamSession} from '../types/exam'
import {completeExamSession, createExamSession, fetchExamSession, fetchExamSessions,} from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'
import {QuickScoreModal} from '../components/exam/QuickScoreModal'
import {useTimer} from '../context/TimerContext'
import {stopStopwatch} from '../lib/api/stopwatch'
import {c, font} from '../styles/notion'
import {LoadingSpinner} from '../components/common/LoadingSpinner'

export default function ExamPage() {
  const navigate = useNavigate()
  const subjects = useSettingsStore((s) => s.subjects)
  const {isActive: timerRunning, toggle: toggleTimer} = useTimer()

  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view')           // 'input' | 'quick-score' | null
  const sessionIdParam = searchParams.get('sessionId')
  const isEditMode = searchParams.get('edit') === '1'

  const [activeSession, setActiveSession] = useState<ExamSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showStopwatchModal, setShowStopwatchModal] = useState(false)
  const [stoppingTimer, setStoppingTimer] = useState(false)

  const [analysisKey, setAnalysisKey] = useState(0)

  const [showResumeModal, setShowResumeModal] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null)

  // リロード対応: URL に sessionId があるときセッションをフェッチする
  const activeSessionRef = useRef<ExamSession | null>(null)
  activeSessionRef.current = activeSession

  useEffect(() => {
    if (view !== 'input' || !sessionIdParam) return
    const targetId = Number(sessionIdParam)
    if (activeSessionRef.current?.id === targetId) return
    setSessionLoading(true)
    fetchExamSession(targetId)
      .then(setActiveSession)
      .catch(() => setError('セッションの読み込みに失敗しました'))
      .finally(() => setSessionLoading(false))
  }, [view, sessionIdParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── ナビゲーションヘルパー ─────────────────────────────────────────────────

  const navigateToInput = (session: ExamSession, edit = false) => {
    setActiveSession(session)
    const params: Record<string, string> = {view: 'input', sessionId: String(session.id)}
    if (edit) params.edit = '1'
    setSearchParams(params)
  }

  const navigateToAnalysis = (refresh = false) => {
    setActiveSession(null)
    setSearchParams({}, {replace: true})
    if (refresh) setAnalysisKey((k) => k + 1)
  }

  // ── ハンドラー ────────────────────────────────────────────────────────────

  const proceedToExam = async () => {
    setStarting(true)
    setError(null)
    try {
      const sessions = await fetchExamSessions('in_progress')
      if (sessions.length > 0) {
        const sessionId = sessions[0].id
        const hasDraft = localStorage.getItem(`exam_draft_${sessionId}`) !== null
        if (hasDraft) {
          setPendingSessionId(sessionId)
          setShowResumeModal(true)
          return
        }
        const session = await fetchExamSession(sessionId)
        navigateToInput(session)
        return
      }
      const session = await createExamSession({subject: subjects[0] ?? '', examYear: 'R07'})
      navigateToInput(session)
    } catch {
      setError('試験セッションの作成に失敗しました')
    } finally {
      setStarting(false)
    }
  }

  const handleStartExam = () => {
    if (timerRunning) {
      setShowStopwatchModal(true)
    } else {
      proceedToExam()
    }
  }

  const handleStopTimerAndProceed = async () => {
    setStoppingTimer(true)
    try {
      await stopStopwatch()
    } catch {
      /* ignore */
    } finally {
      toggleTimer()
      setStoppingTimer(false)
    }
    setShowStopwatchModal(false)
    proceedToExam()
  }

  const handleProceedWithTimer = () => {
    setShowStopwatchModal(false)
    proceedToExam()
  }

  const handleResume = async () => {
    if (!pendingSessionId) return
    const session = await fetchExamSession(pendingSessionId)
    navigateToInput(session)
    setShowResumeModal(false)
  }

  const handleRestart = async () => {
    if (!pendingSessionId) return
    localStorage.removeItem(`exam_draft_${pendingSessionId}`)
    const session = await fetchExamSession(pendingSessionId)
    navigateToInput(session)
    setShowResumeModal(false)
  }

  const handleComplete = async (
    sessionId: number,
    subject: string,
    examYear: string,
    questions: ExamQuestionInput[]
  ) => {
    await completeExamSession(sessionId, {subject, examYear, questions})
    navigateToAnalysis(true)
  }

  const handleEditSession = async (sessionId: number) => {
    try {
      const session = await fetchExamSession(sessionId)
      navigateToInput(session, true)
    } catch {
      setError('セッションの読み込みに失敗しました')
    }
  }

  const handleCancel = () => {
    // 履歴スタックに /exam を積む（ドラフトは localStorage に残っているので戻ることも可能）
    navigate(-1)
  }

  // ── view=input ──────────────────────────────────────────────────────────────

  if (view === 'input') {
    if (sessionLoading || !activeSession) return <LoadingSpinner fullPage />
    return (
      <ExamInputView
        session={activeSession}
        isEditMode={isEditMode}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    )
  }

  // ── AnalysisView + モーダル群 ────────────────────────────────────────────────

  return (
    <div style={page}>
      {/* stopwatch */}
      {showStopwatchModal && (
        <div style={overlay}>
          <div style={sheet}>
            <p style={sheetTitle}>ストップウォッチが動作中です</p>
            <p style={sheetBody}>
              タイマーが計測中です。停止してから試験を始めますか？
            </p>
            <div style={sheetActions}>
              <button style={primaryBtn} onClick={handleStopTimerAndProceed} disabled={stoppingTimer}>
                {stoppingTimer ? '停止中...' : '停止して進む'}
              </button>
              <button style={secondaryBtn} onClick={handleProceedWithTimer} disabled={stoppingTimer}>
                そのまま進む
              </button>
              <button style={ghostBtn} onClick={() => setShowStopwatchModal(false)} disabled={stoppingTimer}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 中断データ再開モーダル */}
      {showResumeModal && (
        <div style={overlay}>
          <div style={sheet}>
            <p style={sheetTitle}>中断したデータがあります</p>
            <p style={sheetBody}>
              前回作成した下書きが見つかりました。どうしますか？
            </p>
            <div style={sheetActions}>
              <button style={primaryBtn} onClick={handleResume}>続きから再開</button>
              <button style={secondaryBtn} onClick={handleRestart}>破棄して初めから</button>
              <button style={ghostBtn} onClick={() => setShowResumeModal(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* quick score */}
      {view === 'quick-score' && (
        <QuickScoreModal
          onClose={() => setSearchParams({}, {replace: true})}
          onSaved={() => {
            setSearchParams({}, {replace: true})
            setAnalysisKey((k) => k + 1)
          }}
        />
      )}

      <div style={sessionHeader}>
        <span style={pageTitle}>PAST EXAM</span>
        <div style={headerButtons}>
          <button
            style={quickBtn}
            onClick={() => setSearchParams({view: 'quick-score'}, {replace: true})}
            disabled={starting || stoppingTimer}
          >
            得点のみ記録
          </button>
          <button
            style={startBtn}
            onClick={handleStartExam}
            disabled={starting || stoppingTimer}
          >
            {starting ? '確認中...' : '＋ 解答を入力する'}
          </button>
        </div>
      </div>

      {error && <p style={errorMsg}>{error}</p>}

      <AnalysisView key={analysisKey} onEdit={handleEditSession} />
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px 16px 80px',
  color: c.text,
}

const sessionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
}

const pageTitle: React.CSSProperties =  { fontSize: '32px', fontWeight: 700, marginBottom: '6px' }

const headerButtons: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
}

const startBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: 'none',
  background: c.text,
  color: '#fff',
  fontSize: font.sm,
  fontWeight: 700,
  cursor: 'pointer',
}

const quickBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  color: c.textSub,
  fontSize: font.sm,
  fontWeight: 600,
  cursor: 'pointer',
}

const errorMsg: React.CSSProperties = {
  fontSize: font.base,
  color: c.red,
  marginBottom: '12px',
}

// ── Modal (bottom sheet) ──────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.25)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1000,
}

const sheet: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  backgroundColor: '#fff',
  borderRadius: '16px 16px 0 0',
  padding: '24px 20px 36px',
  boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
}

const sheetTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: c.text,
  marginBottom: '8px',
}

const sheetBody: React.CSSProperties = {
  fontSize: font.base,
  color: c.textSub,
  lineHeight: 1.6,
  marginBottom: '20px',
}

const sheetActions: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const primaryBtn: React.CSSProperties = {
  padding: '14px',
  border: 'none',
  borderRadius: '10px',
  background: c.text,
  color: '#fff',
  fontSize: font.base,
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  padding: '14px',
  border: `1px solid ${c.border}`,
  borderRadius: '10px',
  background: '#fff',
  color: c.text,
  fontSize: font.base,
  fontWeight: 600,
  cursor: 'pointer',
}


const ghostBtn: React.CSSProperties = {
  padding: '12px',
  border: 'none',
  borderRadius: '10px',
  background: 'transparent',
  color: c.textSub,
  fontSize: font.sm,
  fontWeight: 600,
  cursor: 'pointer',
}
