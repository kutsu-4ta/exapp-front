import {useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {useSettingsStore} from '../lib/store/settings'
import type {ExamQuestionInput, ExamSession} from '../types/exam'
import {completeExamSession, createExamSession, fetchExamSession, fetchExamSessions,} from '../lib/api/exam'
import AnalysisView from '../components/exam/AnalysisView'
import ExamInputView from '../components/exam/ExamInputView'
import {QuickScoreModal} from '../components/exam/QuickScoreModal'
import {PreExamStartModal} from '../components/exam/PreExamStartModal'
import {useTimer} from '../context/TimerContext'
import {stopStopwatch} from '../lib/api/stopwatch'
import {c, font} from '../styles/notion'
import {LoadingSpinner} from '../components/common/LoadingSpinner'
import {fetchGeminiContext} from '../lib/api/gemini'
import {StatusCopyModal} from '../components/common/StatusCopyModal'

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

  const [showStartModal, setShowStartModal] = useState(false)
  const pendingParams =
      useRef({
        subject: '',
        examYear: 'R07',
        questionCount: 25,
      })

  const [showStopwatchModal, setShowStopwatchModal] = useState(false)
  const [stoppingTimer, setStoppingTimer] = useState(false)

  const [analysisKey, setAnalysisKey] = useState(0)

  const [showResumeModal, setShowResumeModal] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null)
  const [statsCopying, setStatsCopying] = useState(false)
  const [statsCopied, setStatsCopied] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyText, setCopyText] = useState('')

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
      const {subject, examYear} = pendingParams.current
      const session = await createExamSession({subject, examYear})

      navigateToInput(session)
    } catch {
      setError(
          '試験セッションの作成に失敗しました'
      )
    } finally {
      setStarting(false)
    }
  }

  const handleStartExam = async () => {
    setStarting(true)
    setError(null)

    try {
      const sessions = await fetchExamSessions(
          'in_progress'
      )

      if (sessions.length > 0) {
        const sessionId = sessions[0].id
        const hasDraft =
            localStorage.getItem(
                `exam_draft_${sessionId}`
            ) !== null

        if (hasDraft) {
          setPendingSessionId(sessionId)
          setShowResumeModal(true)
          return
        }

        const session =
            await fetchExamSession(sessionId)

        navigateToInput(session)
        return
      }

      // 中断データがない時だけ開始モーダル
      setShowStartModal(true)
    } catch {
      setError(
          '試験セッションの確認に失敗しました'
      )
    } finally {
      setStarting(false)
    }
  }

  const handleStartModalConfirm = (
      subject: string,
      examYear: string,
      questionCount: number
  ) => {
    pendingParams.current = {
      subject,
      examYear,
      questionCount,
    }

    setShowStartModal(false)

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

  const handleRestart = () => {
    if (!pendingSessionId) return

    localStorage.removeItem(
        `exam_draft_${pendingSessionId}`
    )

    setShowResumeModal(false)

    // 次に開始モーダルを開く
    setShowStartModal(true)
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

  const now = new Date()
  const handlePrepareStats = async () => {
    if (statsCopying) return
    setStatsCopying(true)
    try {
      const ctx = await fetchGeminiContext(now.getFullYear(), now.getMonth() + 1)
      const lines = ['【過去問ステータス】']
      lines.push(`期間: ${ctx.year}年${ctx.month}月`)
      lines.push('')
      lines.push('【科目別 直近スコア】')
      for (const s of ctx.subjects) {
        if (s.recentExamScore) {
          const { examYear, score, completedAt } = s.recentExamScore
          const dateStr = completedAt ? ` (${completedAt.replace(/-/g, '/')})` : ''
          lines.push(`■ ${s.subject}: ${examYear}年度 ${score}点${dateStr}`)
        } else {
          lines.push(`■ ${s.subject}: 未実施`)
        }
      }
      const withErrors = ctx.subjects.filter((s) => s.failureStats.length > 0)
      if (withErrors.length > 0) {
        lines.push('')
        lines.push('【科目別 エラー傾向】')
        for (const s of withErrors) {
          lines.push(`■ ${s.subject}`)
          s.failureStats.forEach((f) =>
            lines.push(`  ・${f.type}: ${f.count}問 (${Math.round(f.ratio * 100)}%)`)
          )
        }
      }
      if (ctx.recentDailyLogs.length > 0) {
        lines.push('')
        lines.push('【直近7日間】')
        ctx.recentDailyLogs.forEach((log) => {
          const label = `${log.date.replace(/-/g, '/')}: ${log.studyMinutes}分`
          lines.push(log.reflection ? `  ${label} — ${log.reflection}` : `  ${label}`)
        })
      }
      setCopyText(lines.join('\n'))
      setIsCopyModalOpen(true)
    } catch (e) {
      console.error(e)
    } finally {
      setStatsCopying(false)
    }
  }

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setStatsCopied(true)
      setTimeout(() => {
        setStatsCopied(false)
        setIsCopyModalOpen(false)
      }, 800)
    } catch (e) {
      console.error(e)
    }
  }

  // ── view=input ──────────────────────────────────────────────────────────────

  if (view === 'input') {
    if (sessionLoading || !activeSession) return <LoadingSpinner fullPage />
    return (
        <ExamInputView
            session={activeSession}
            isEditMode={isEditMode}
            questionCount={
              pendingParams.current.questionCount
            }
            onComplete={handleComplete}
            onCancel={handleCancel}
        />
    )
  }

  // ── AnalysisView + モーダル群 ────────────────────────────────────────────────

  return (
    <div style={page}>

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

      {/* 試験開始前モーダル */}
      {showStartModal && (
        <PreExamStartModal
          subjects={subjects}
          onConfirm={handleStartModalConfirm}
          onClose={() => setShowStartModal(false)}
        />
      )}

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
            style={copyBtn}
            onClick={handlePrepareStats}
            disabled={statsCopying}
            title="ステータスをコピー"
          >
            {statsCopied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              </svg>
            )}
          </button>
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

      {isCopyModalOpen && (
        <StatusCopyModal
          text={copyText}
          copied={statsCopied}
          onCopy={handleFinalCopy}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}
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

const copyBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: '8px',
  border: `1px solid ${c.border}`,
  background: '#fff',
  color: c.textHint,
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
  zIndex: 1100,
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

