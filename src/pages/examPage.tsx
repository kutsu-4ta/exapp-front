import { useState, useEffect } from 'react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useSettingsStore } from '../lib/store/settings'
import type { ExamSession } from '../types/exam'
import type { ExamQuestionInput } from '../types/exam'
import { createExamSession, completeExamSession, fetchExamSessions, fetchExamSession } from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'
import { useTimer } from '../context/TimerContext'
import { stopStopwatch } from '../lib/api/stopwatch'

export default function ExamPage() {
  const subjects = useSettingsStore((s) => s.subjects)
  const { isActive: timerRunning, toggle: toggleTimer } = useTimer()
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null)
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ストップウォッチ実行中モーダル
  const [showStopwatchModal, setShowStopwatchModal] = useState(false)
  const [stoppingTimer, setStoppingTimer] = useState(false)

  // 中断データ再開モーダル
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null)

  useEffect(() => {
    const checkInProgress = async () => {
      try {
        const sessions = await fetchExamSessions('in_progress')
        if (sessions.length > 0) {
          const session = await fetchExamSession(sessions[0].id)
          setActiveSession(session)
        }
      } catch {
        // 取得失敗時は無視
      } finally {
        setLoading(false)
      }
    }
    checkInProgress()
  }, [])

  // 試験開始の本体処理（タイマーチェック後に呼ばれる）
  const proceedToExam = async () => {
    setStarting(true)
    setError(null)
    try {
      const sessions = await fetchExamSessions('in_progress')
      if (sessions.length > 0) {
        const sessionId = sessions[0].id
        const draftKey = `exam_draft_${sessionId}`
        const hasDraft = localStorage.getItem(draftKey) !== null
        if (hasDraft) {
          setPendingSessionId(sessionId)
          setShowResumeModal(true)
          return
        }
        const session = await fetchExamSession(sessionId)
        setActiveSession(session)
        return
      }
      const session = await createExamSession({ subject: subjects[0] ?? '', examYear: 'R07' })
      setActiveSession(session)
    } catch {
      setError('試験セッションの作成に失敗しました')
    } finally {
      setStarting(false)
    }
  }

  // ボタン押下：タイマーが動いていればモーダルを挟む
  const handleStartExam = () => {
    if (timerRunning) {
      setShowStopwatchModal(true)
    } else {
      proceedToExam()
    }
  }

  // 「停止して進む」：API で止めてからローカルも停止し遷移
  const handleStopTimerAndProceed = async () => {
    setStoppingTimer(true)
    try {
      await stopStopwatch()
    } catch {
      // API 失敗でもローカルは止める（最低限の一貫性を保つ）
    } finally {
      toggleTimer()     // isActive: true → false
      setStoppingTimer(false)
    }
    setShowStopwatchModal(false)
    proceedToExam()
  }

  // 「そのまま進む」：タイマーは動かしたまま遷移
  const handleProceedWithTimer = () => {
    setShowStopwatchModal(false)
    proceedToExam()
  }

  // --- ダイアログ用ハンドラ ---
  const handleResume = async () => {
    if (!pendingSessionId) return
    const session = await fetchExamSession(pendingSessionId)
    setActiveSession(session)
    setShowResumeModal(false)
  }

  const handleRestart = async () => {
    if (!pendingSessionId) return
    localStorage.removeItem(`exam_draft_${pendingSessionId}`)
    const session = await fetchExamSession(pendingSessionId)
    setActiveSession(session)
    setShowResumeModal(false)
  }

  const handleComplete = async (
      sessionId: number,
      subject: string,
      examYear: string,
      questions: ExamQuestionInput[],
  ) => {
    await completeExamSession(sessionId, { subject, examYear, questions })
    setActiveSession(null)
  }

  const handleCancel = () => {
    setActiveSession(null)
  }

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (activeSession) {
    return (
        <ExamInputView
            session={activeSession}
            onComplete={handleComplete}
            onCancel={handleCancel}
        />
    )
  }

  return (
      <div style={container}>
        {/* ストップウォッチ実行中ダイアログ */}
        {showStopwatchModal && (
            <div style={modalOverlay}>
              <div style={modalCard}>
                <h3 style={modalTitle}>ストップウォッチが動作中です</h3>
                <p style={modalText}>タイマーが計測中です。停止してから試験を始めますか？</p>
                <div style={modalActionArea}>
                  <button style={resumeBtn} onClick={handleStopTimerAndProceed} disabled={stoppingTimer}>
                    {stoppingTimer ? '停止中...' : '停止して進む'}
                  </button>
                  <button style={restartBtn} onClick={handleProceedWithTimer} disabled={stoppingTimer}>
                    そのまま進む
                  </button>
                  <button style={cancelBtn} onClick={() => setShowStopwatchModal(false)} disabled={stoppingTimer}>
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 中断データ再開ダイアログ */}
        {showResumeModal && (
            <div style={modalOverlay}>
              <div style={modalCard}>
                <h3 style={modalTitle}>中断したデータがあります</h3>
                <p style={modalText}>前回作成した下書きが見つかりました。どうしますか？</p>
                <div style={modalActionArea}>
                  <button style={resumeBtn} onClick={handleResume}>続きから再開</button>
                  <button style={restartBtn} onClick={handleRestart}>破棄して初めから</button>
                  <button style={cancelBtn} onClick={() => setShowResumeModal(false)}>キャンセル</button>
                </div>
              </div>
            </div>
        )}

        <div style={analysisHeader}>
          <h2 style={title}>学習実績</h2>
          <button style={startBtn} onClick={handleStartExam} disabled={starting || stoppingTimer}>
            {starting ? '確認中...' : '＋ 解答を入力する'}
          </button>
        </div>
        {error && <p style={errorText}>{error}</p>}
        <AnalysisView />
      </div>
  )
}

// ── Styles (追加・更新分) ──
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '0 16px', color: '#37352f', position: 'relative' }
const analysisHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }
const title: React.CSSProperties = { fontSize: '18px', fontWeight: 900 }
const startBtn: React.CSSProperties = { padding: '10px 16px', backgroundColor: '#37352f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }
const errorText: React.CSSProperties = { color: '#eb5757', fontSize: '13px', marginBottom: '12px' }
const loadingText: React.CSSProperties = { color: '#888', fontSize: '13px', padding: '20px 0' }

// モーダル関連のスタイル
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalCard: React.CSSProperties = { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }
const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#37352f' }
const modalText: React.CSSProperties = { fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: '1.5' }
const modalActionArea: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }

const resumeBtn: React.CSSProperties = { padding: '12px', backgroundColor: '#2383e2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }
const restartBtn: React.CSSProperties = { padding: '12px', backgroundColor: '#fff', color: '#eb5757', border: '1px solid #eb5757', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '12px', backgroundColor: '#fff', color: '#999', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }