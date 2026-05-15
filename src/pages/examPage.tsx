import {useState} from 'react'
import {useSettingsStore} from '../lib/store/settings'
import type {ExamQuestionInput, ExamSession} from '../types/exam'
import {completeExamSession, createExamSession} from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'
import {QuickScoreModal} from '../components/exam/QuickScoreModal'
import {useTimer} from '../context/TimerContext'
import {stopStopwatch} from '../lib/api/stopwatch'
import {c, font} from '../styles/notion'

export default function ExamPage() {
  const subjects = useSettingsStore((s) => s.subjects)
  const { isActive: timerRunning, toggle: toggleTimer } = useTimer()
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showStopwatchModal, setShowStopwatchModal] = useState(false)
  const [stoppingTimer, setStoppingTimer] = useState(false)

  const [showQuickScore, setShowQuickScore] = useState(false)
  const [analysisKey, setAnalysisKey] = useState(0)

  const proceedToExam = async () => {
    setStarting(true)
    setError(null)
    try {
      const session = await createExamSession({ subject: subjects[0] ?? '', examYear: 'R07' })
      setActiveSession(session)
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
      /* API失敗でもローカルは止める */
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

  const handleComplete = async (
    sessionId: number,
    subject: string,
    examYear: string,
    questions: ExamQuestionInput[]
  ) => {
    await completeExamSession(sessionId, { subject, examYear, questions })
    setActiveSession(null)
    setAnalysisKey((k) => k + 1)
  }

  const handleCancel = () => setActiveSession(null)

  if (activeSession) {
    return (
      <ExamInputView session={activeSession} onComplete={handleComplete} onCancel={handleCancel} />
    )
  }

  return (
    <div style={page}>
      {/* ストップウォッチ実行中モーダル */}
      {showStopwatchModal && (
        <div style={overlay}>
          <div style={sheet}>
            <p style={sheetTitle}>ストップウォッチが動作中です</p>
            <p style={sheetBody}>タイマーが計測中です。停止してから試験を始めますか？</p>
            <div style={sheetActions}>
              <button
                style={primaryBtn}
                onClick={handleStopTimerAndProceed}
                disabled={stoppingTimer}
              >
                {stoppingTimer ? '停止中...' : '停止して進む'}
              </button>
              <button
                style={secondaryBtn}
                onClick={handleProceedWithTimer}
                disabled={stoppingTimer}
              >
                そのまま進む
              </button>
              <button
                style={ghostBtn}
                onClick={() => setShowStopwatchModal(false)}
                disabled={stoppingTimer}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 中断データ再開モーダル */}
      {/* クイックスコア入力モーダル */}
      {showQuickScore && (
        <QuickScoreModal
          onClose={() => setShowQuickScore(false)}
          onSaved={() => {
            setShowQuickScore(false)
            setAnalysisKey((k) => k + 1)
          }}
        />
      )}

      {/* ヘッダー */}
      <div style={sessionHeader}>
        <span style={pageTitle}>学習実績</span>
        <div style={headerButtons}>
          <button style={quickBtn} onClick={() => setShowQuickScore(true)} disabled={starting || stoppingTimer}>
            得点のみ記録
          </button>
          <button style={startBtn} onClick={handleStartExam} disabled={starting || stoppingTimer}>
            {starting ? '確認中...' : '＋ 解答を入力する'}
          </button>
        </div>
      </div>

      {error && <p style={errorMsg}>{error}</p>}

      <AnalysisView key={analysisKey} />
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

const pageTitle: React.CSSProperties = {
  fontSize: font.md,
  fontWeight: 800,
  color: c.text,
}

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

const dangerBtn: React.CSSProperties = {
  padding: '14px',
  border: `1px solid ${c.redBorder}`,
  borderRadius: '10px',
  background: '#fff',
  color: c.red,
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
