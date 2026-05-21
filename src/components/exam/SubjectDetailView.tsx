import {useEffect, useState} from 'react'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {fetchExamSession, fetchSubjectStats} from '../../lib/api/exam'
import type {ExamSession, ExamSessionSummary, ExamSubjectStats, Rank} from '../../types/exam'
import {DoubtIcon} from '@/lib/icon/DoubtIcon.tsx'
import {ExamToTicketsModal} from './ExamToTicketsModal'

interface SubjectDetailViewProps {
  subject: string
  sessions: ExamSessionSummary[]
  onBack: () => void
  onEdit?: (sessionId: number) => void
}

export default function SubjectDetailView({ subject, sessions, onBack, onEdit }: SubjectDetailViewProps) {
  const [stats, setStats] = useState<ExamSubjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [copyText, setCopyText] = useState('')
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false)
  const [ticketCreatedMsg, setTicketCreatedMsg] = useState<string | null>(null)

  const handleSessionTap = async (sessionId: number) => {
    setSessionLoading(true)
    try {
      const session = await fetchExamSession(sessionId)
      setSelectedSession(session)
      const lines: string[] = []
      lines.push(`【試験詳細】${session.subject} - ${session.examYear}`)
      lines.push(`日時: ${session.createdAt.slice(0, 10).replace(/-/g, '/')}`)
      lines.push(`TOTAL: ${session.totalScore} / PURE: ${session.pureScore}`)
      lines.push(`正解: ${session.correctCount}問 / 不正解: ${session.incorrectCount}問 / 疑問: ${session.doubtfulCount}問`)
      if (session.questions.length > 0) {
        lines.push('')
        lines.push('【問題一覧】')
        session.questions.forEach((q) => {
          const result = q.isCorrect === true ? '○' : q.isCorrect === false ? '✗' : '-'
          const doubt = q.isDoubtful ? ' ?' : ''
          const note = q.note ? ` ｜${q.note}` : ''
          lines.push(`${q.displayId} [${q.rank}] ${result}${doubt}${note}`)
        })
      }
      setCopyText(lines.join('\n'))
    } catch {
      // ignore
    } finally {
      setSessionLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjectStats(subject)
      .then(setStats)
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [subject])

  return (
    <div style={detailContainer}>
      <div style={detailHeader}>
        <button onClick={onBack} style={backBtn}>
          ← 戻る
        </button>
        <h2 style={detailTitle}>{subject} 分析</h2>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <LoadingSpinner />
        </div>
      )}
      {error && <p style={{ ...stateText, color: '#eb5757' }}>{error}</p>}

      {stats && (
        <>
          <div style={rankSummaryCard}>
            <h3 style={sectionLabel}>ランク別正答率</h3>
            <div style={rankGrid}>
              {stats.rankStats.map((r) => (
                <div key={r.rank} style={rankStatItem}>
                  <span style={rankLabel}>{r.rank}</span>
                  <span style={rankPercent}>{Math.round(r.correctRate * 100)}%</span>
                  <div style={rankBarBase}>
                    <div style={{ ...rankBarFill, width: `${r.correctRate * 100}%` }} />
                  </div>
                  <span style={rankCount}>{r.count}問</span>
                </div>
              ))}
              {stats.rankStats.length === 0 && <p style={stateText}>データがありません</p>}
            </div>
          </div>

          <div style={sessionListCard}>
            <div style={sessionListHeader}>
              <h3 style={sectionLabel}>受験履歴</h3>
            </div>
            {sessions.length === 0 && <p style={stateText}>記録がありません</p>}
            {[...sessions]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((s) => (
                <div
                  key={s.id}
                  style={sessionRow}
                  onClick={() => handleSessionTap(s.id)}
                >
                  <div style={sessionRowLeft}>
                    <span style={sessionDate}>
                      {s.createdAt.slice(5, 10).replace('-', '/')}
                    </span>
                    <span style={sessionYear}>{s.examYear}</span>
                  </div>
                  <div style={sessionRowScores}>
                    <span style={scoreLabel}>TOTAL</span>
                    <span style={scoreValue}>{s.totalScore}</span>
                    <span style={scoreDivider}>|</span>
                    <span style={scoreLabel}>PURE</span>
                    <span style={scoreValue}>{s.pureScore}</span>
                  </div>
                  {onEdit && (
                    <button
                      style={editSessionBtn}
                      onClick={(e) => { e.stopPropagation(); onEdit(s.id) }}
                    >
                      編集
                    </button>
                  )}
                </div>
              ))}
          </div>

        </>
      )}
      {/* セッション詳細モーダル */}
      {(sessionLoading || selectedSession) && (
        <div style={modalOverlay} onClick={() => setSelectedSession(null)}>
          <div style={modalSheet} onClick={(e) => e.stopPropagation()}>
            {sessionLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <LoadingSpinner />
              </div>
            ) : selectedSession && (
              <>
                <div style={modalHeader}>
                  <div>
                    <div style={modalTitle}>{selectedSession.examYear}</div>
                    <div style={modalSubtitle}>
                      {selectedSession.createdAt.slice(0, 10).replace(/-/g, '/')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {selectedSession.questions.length > 0 && (
                      <button
                        style={ticketizeBtn}
                        onClick={() => setTicketsModalOpen(true)}
                        title="チケット一括生成"
                      >
                        + チケット化
                      </button>
                    )}
                    <button
                      style={copyIconBtn}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(copyText)
                          setSelectedSession(null)
                        } catch { /* ignore */ }
                      }}
                      title="コピー"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2" width="6" height="4" rx="1" />
                        <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                      </svg>
                    </button>
                    <button style={modalCloseBtn} onClick={() => setSelectedSession(null)}>✕</button>
                  </div>
                </div>

                <div style={modalScoreRow}>
                  <div style={modalScoreBlock}>
                    <span style={modalScoreLabel}>TOTAL</span>
                    <span style={modalScoreValue}>{selectedSession.totalScore}</span>
                  </div>
                  <div style={modalScoreDivider} />
                  <div style={modalScoreBlock}>
                    <span style={modalScoreLabel}>PURE</span>
                    <span style={modalScoreValue}>{selectedSession.pureScore}</span>
                  </div>
                  <div style={modalScoreDivider} />
                  <div style={modalScoreBlock}>
                    <span style={modalScoreLabel}>正解</span>
                    <span style={{ ...modalScoreValue, color: '#19a576' }}>{selectedSession.correctCount}</span>
                  </div>
                  <div style={modalScoreDivider} />
                  <div style={modalScoreBlock}>
                    <span style={modalScoreLabel}>不正解</span>
                    <span style={{ ...modalScoreValue, color: '#eb5757' }}>{selectedSession.incorrectCount}</span>
                  </div>
                  <div style={modalScoreDivider} />
                  <div style={modalScoreBlock}>
                    <span style={modalScoreLabel}>疑問</span>
                    <span style={{ ...modalScoreValue, color: '#f2ab26' }}>{selectedSession.doubtfulCount}</span>
                  </div>
                </div>

                {selectedSession.questions.length > 0 && (
                  <div style={modalQuestionList}>
                    <div style={sectionLabel}>問題一覧</div>
                    {selectedSession.questions.map((q) => (
                      <div key={q.id} style={modalQuestionRow}>
                        <span style={modalQId}>{q.displayId}</span>
                        <span style={{ ...rankTag, ...rankColors[q.rank] }}>{q.rank}</span>
                        <span style={modalQResult(q.isCorrect)}>
                          {q.isCorrect === true ? '○' : q.isCorrect === false ? '✗' : '－'}
                        </span>
                        {q.isDoubtful && <DoubtIcon />}
                        {q.note && <span style={modalQNote}>{q.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {stats && stats.rankStats.length > 0 && (
                  <div style={modalRankSection}>
                    <div style={sectionLabel}>ランク別正答率</div>
                    <div style={rankGrid}>
                      {stats.rankStats.map((r) => (
                        <div key={r.rank} style={rankStatItem}>
                          <span style={rankLabel}>{r.rank}</span>
                          <span style={rankPercent}>{Math.round(r.correctRate * 100)}%</span>
                          <div style={rankBarBase}>
                            <div style={{ ...rankBarFill, width: `${r.correctRate * 100}%` }} />
                          </div>
                          <span style={rankCount}>{r.count}問</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {ticketsModalOpen && selectedSession && (
        <ExamToTicketsModal
          session={selectedSession}
          onClose={() => setTicketsModalOpen(false)}
          onCreated={(count) => {
            setTicketsModalOpen(false)
            setTicketCreatedMsg(`${count}件のチケットをバックログに追加しました`)
            setTimeout(() => setTicketCreatedMsg(null), 3000)
          }}
        />
      )}

      {ticketCreatedMsg && (
        <div style={toastMsg}>{ticketCreatedMsg}</div>
      )}
    </div>
  )
}

// ── Styles ──
const rankColors: Record<Rank, React.CSSProperties> = {
  A: { background: '#e1f0ff', color: '#2383e2' },
  B: { background: '#e6f6eb', color: '#19a576' },
  C: { background: '#fff5e0', color: '#f2ab26' },
  D: { background: '#ffebe9', color: '#eb5757' },
  E: { background: '#f3f3f2', color: '#8a7b6e' },
}

const detailContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}
const detailHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '10px',
}
const backBtn: React.CSSProperties = {
  border: 'none',
  background: '#f4f4f3',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}
const detailTitle: React.CSSProperties = { fontSize: '18px', fontWeight: 900 }
const sectionLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#888',
  marginBottom: '8px',
}
const rankSummaryCard: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid #f0f0ef',
}
const rankGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' }
const rankStatItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const rankLabel: React.CSSProperties = { fontSize: '12px', fontWeight: 900, width: '12px' }
const rankPercent: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  width: '36px',
  textAlign: 'right',
}
const rankCount: React.CSSProperties = { fontSize: '10px', color: '#aaa', width: '28px' }
const rankBarBase: React.CSSProperties = {
  flex: 1,
  height: '6px',
  backgroundColor: '#f0f0f0',
  borderRadius: '3px',
  overflow: 'hidden',
}
const rankBarFill: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#2383e2',
  transition: 'width 0.4s ease',
}
const rankTag: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 900,
}
const stateText: React.CSSProperties = { fontSize: '13px', color: '#aaa', padding: '8px 0' }
const sessionListCard: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid #f0f0ef',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}
const sessionListHeader: React.CSSProperties = { marginBottom: '4px' }
const sessionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 0',
  borderBottom: '1px solid #f5f5f4',
  cursor: 'pointer',
}
const sessionRowLeft: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center', minWidth: '80px' }
const sessionDate: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#aaa' }
const sessionYear: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#37352f' }
const sessionRowScores: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flex: 1,
}
const scoreLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 700, color: '#aaa' }
const scoreValue: React.CSSProperties = { fontSize: '13px', fontWeight: 900, color: '#37352f' }
const scoreDivider: React.CSSProperties = { fontSize: '10px', color: '#ddd', margin: '0 2px' }
const editSessionBtn: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid #e5e5e4',
  borderRadius: '6px',
  background: '#fff',
  color: '#37352f',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1001,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}
const modalSheet: React.CSSProperties = {
  background: '#fff',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '85vh',
  borderRadius: '20px 20px 0 0',
  padding: '20px 16px 40px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}
const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}
const modalTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 900, color: '#37352f' }
const modalSubtitle: React.CSSProperties = { fontSize: '11px', color: '#aaa', fontWeight: 700, marginTop: '2px' }
const modalCloseBtn: React.CSSProperties = {
  border: 'none',
  background: '#f4f4f3',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const copyIconBtn: React.CSSProperties = {
  border: '1px solid #e5e5e4',
  background: '#fff',
  borderRadius: '8px',
  width: '32px',
  height: '28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#37352f',
}
const modalScoreRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  backgroundColor: '#f9f9f8',
  borderRadius: '12px',
  padding: '12px',
}
const modalScoreBlock: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
}
const modalScoreLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 700, color: '#aaa' }
const modalScoreValue: React.CSSProperties = { fontSize: '16px', fontWeight: 900, color: '#37352f' }
const modalScoreDivider: React.CSSProperties = { width: '1px', height: '28px', background: '#e5e5e4' }
const modalQuestionList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' }
const modalQuestionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
  borderRadius: '8px',
  background: '#f9f9f8',
}
const modalQId: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#37352f', minWidth: '32px' }
const modalQNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const ticketizeBtn: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid rgba(35,131,226,0.35)',
  borderRadius: '6px',
  background: 'rgba(35,131,226,0.08)',
  color: '#2383e2',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const toastMsg: React.CSSProperties = {
  position: 'fixed',
  bottom: 'calc(80px + env(safe-area-inset-bottom))',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#37352f',
  color: '#fff',
  padding: '10px 18px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 700,
  zIndex: 500,
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
}
const modalQResult = (isCorrect: boolean | null): React.CSSProperties => ({
  fontSize: '13px',
  fontWeight: 900,
  color: isCorrect === true ? '#19a576' : isCorrect === false ? '#eb5757' : '#aaa',
  minWidth: '16px',
})
const modalRankSection: React.CSSProperties = {
  backgroundColor: '#f9f9f8',
  borderRadius: '12px',
  padding: '12px',
}
