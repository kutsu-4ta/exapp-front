import { useState, useEffect } from 'react'
import { SUBJECTS } from '../types/workspace'
import type { ExamSession } from '../types/exam'
import type { ExamQuestionInput } from '../types/exam'
import { createExamSession, completeExamSession, fetchExamSessions, fetchExamSession } from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'

export default function ExamPage() {
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null)
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // マウント時に進行中セッションを自動復元
  useEffect(() => {
    const checkInProgress = async () => {
      try {
        const sessions = await fetchExamSessions('in_progress')
        if (sessions.length > 0) {
          const session = await fetchExamSession(sessions[0].id)
          setActiveSession(session)
        }
      } catch {
        // 取得失敗時は無視して通常表示
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
      // 既存のin_progressセッションがあれば再開
      const sessions = await fetchExamSessions('in_progress')
      if (sessions.length > 0) {
        const session = await fetchExamSession(sessions[0].id)
        setActiveSession(session)
        return
      }
      const session = await createExamSession({ subject: SUBJECTS[0], examYear: 'R07' })
      setActiveSession(session)
    } catch {
      setError('試験セッションの作成に失敗しました')
    } finally {
      setStarting(false)
    }
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

// ── Styles ──
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '0 16px', color: '#37352f' }
const analysisHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }
const title: React.CSSProperties = { fontSize: '18px', fontWeight: 900 }
const startBtn: React.CSSProperties = { padding: '10px 16px', backgroundColor: '#37352f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }
const errorText: React.CSSProperties = { color: '#eb5757', fontSize: '13px', marginBottom: '12px' }
const loadingText: React.CSSProperties = { color: '#888', fontSize: '13px', padding: '20px 0' }
