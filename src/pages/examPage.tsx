import { useState, useEffect } from 'react'
import { useSettingsStore } from '../lib/store/settings'
import type { ExamSession } from '../types/exam'
import type { ExamQuestionInput } from '../types/exam'
import { createExamSession, completeExamSession, fetchExamSessions, fetchExamSession } from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'

export default function ExamPage() {
  const subjects = useSettingsStore((s) => s.subjects)
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null)
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ダイアログ制御用のステート
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

  const handleStartExam = async () => {
    setStarting(true)
    setError(null)
    try {
      const sessions = await fetchExamSessions('in_progress')
      if (sessions.length > 0) {
        const sessionId = sessions[0].id
        const draftKey = `exam_draft_${sessionId}`
        const hasDraft = localStorage.getItem(draftKey) !== null

        if (hasDraft) {
          // 下書きがある場合は自作ダイアログを表示
          setPendingSessionId(sessionId)
          setShowResumeModal(true)
          return
        }

        // 下書きがなければそのまま再開
        const session = await fetchExamSession(sessionId)
        setActiveSession(session)
        return
      }

      // 新規セッション作成
      const session = await createExamSession({ subject: subjects[0] ?? '', examYear: 'R07' })
      setActiveSession(session)
    } catch {
      setError('試験セッションの作成に失敗しました')
    } finally {
      setStarting(false)
    }
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
    return <div style={container}><p style={loadingText}>読み込み中...</p></div>
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
        {/* 自作ダイアログ */}
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
          <button style={startBtn} onClick={handleStartExam} disabled={starting}>
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