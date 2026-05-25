import {useEffect, useState} from 'react'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {deleteExamSession, fetchExamSession, fetchSubjectStats} from '../../lib/api/exam'
import type {ExamQuestion, ExamSession, ExamSessionSummary, ExamSubjectStats, Rank} from '../../types/exam'
import {RANKS} from '../../types/exam'
import {ExamToTicketsModal} from './ExamToTicketsModal'
import {DoubtIcon} from "@/lib/icon/DoubtIcon.tsx";
import {sheetBottomCloseBtnStyle} from '@/components/common/BottomSheet'

function buildSubjectDetailText(subject: string, stats: ExamSubjectStats, sessions: ExamSessionSummary[]): string {
  const lines = [`【${subject} 分析】`, '']
  if (stats.rankStats.length > 0) {
    lines.push('【ランク別正答率】')
    stats.rankStats.forEach((r) => {
      lines.push(`${r.rank}: ${Math.round(r.correctRate * 100)}% (${r.count}問)`)
    })
    lines.push('')
  }
  if (sessions.length > 0) {
    lines.push('【受験履歴】')
    ;[...sessions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((s) => {
        const date = s.createdAt.slice(0, 10).replace(/-/g, '/')
        lines.push(`${date} ${s.examYear}年度: TOTAL ${s.totalScore} / PURE ${s.pureScore}`)
      })
  }
  return lines.join('\n')
}

function calcDurationMs(started?: string, finished?: string): number | undefined {
  if (!started || !finished) return undefined
  const d = new Date(finished).getTime() - new Date(started).getTime()
  return d >= 0 ? d : undefined
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function computeSessionRankStats(
  questions: ExamQuestion[]
): Array<{ rank: Rank; correctRate: number; count: number }> {
  const scored = questions.filter(
    (q) => !q.hasChildren && q.rank !== null && q.isCorrect !== null
  )
  const byRank = new Map<Rank, { correct: number; total: number }>()
  for (const q of scored) {
    const r = q.rank as Rank
    const cur = byRank.get(r) ?? { correct: 0, total: 0 }
    byRank.set(r, { correct: cur.correct + (q.isCorrect ? 1 : 0), total: cur.total + 1 })
  }
  return RANKS
    .filter((r) => byRank.has(r))
    .map((r) => {
      const { correct, total } = byRank.get(r)!
      return { rank: r, correctRate: total > 0 ? correct / total : 0, count: total }
    })
}

interface SubjectDetailViewProps {
  subject: string
  sessions: ExamSessionSummary[]
  onBack: () => void
  onDetail?: (sessionId: number) => void
  onDelete?: (sessionId: number) => void
  onSubjectCopyTextReady?: (text: string) => void
}

export default function SubjectDetailView({ subject, sessions, onBack, onDetail, onDelete, onSubjectCopyTextReady }: SubjectDetailViewProps) {
  const [stats, setStats] = useState<ExamSubjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false)
  const [ticketCreatedMsg, setTicketCreatedMsg] = useState<string | null>(null)
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set())

  const toggleNote = (id: number) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSessionTap = async (sessionId: number) => {
    setSessionLoading(true)
    setExpandedNoteIds(new Set())
    try {
      const session = await fetchExamSession(sessionId)
      setSelectedSession(session)
    } catch {
      // ignore
    } finally {
      setSessionLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('この受験回を削除しますか？この操作は取り消せません。')) return
    try {
      await deleteExamSession(sessionId)
      if (selectedSession?.id === sessionId) setSelectedSession(null)
      onDelete?.(sessionId)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchSubjectStats(subject)
      .then((s) => {
        setStats(s)
        onSubjectCopyTextReady?.(buildSubjectDetailText(subject, s, sessions))
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [subject]) // eslint-disable-line react-hooks/exhaustive-deps

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

          {openMenuId !== null && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpenMenuId(null)}
            />
          )}

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
                  style={{ ...sessionRow, position: 'relative' }}
                  onClick={() => { if (openMenuId === s.id) setOpenMenuId(null); else handleSessionTap(s.id) }}
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
                  <button
                    style={menuTriggerBtn}
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id) }}
                  >
                    ⋯
                  </button>
                  {openMenuId === s.id && (
                    <div style={menuDropdown}>
                      {onDetail && (
                        <button
                          style={menuItem}
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onDetail(s.id) }}
                        >
                          詳細
                        </button>
                      )}
                      <button
                        style={{ ...menuItem, color: '#eb5757' }}
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteSession(s.id) }}
                      >
                        削除
                      </button>
                    </div>
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

                {(() => {
                  const sessionRankStats = computeSessionRankStats(selectedSession.questions)
                  return sessionRankStats.length > 0 ? (
                    <div style={modalRankSection}>
                      <div style={sectionLabel}>ランク別正答率</div>
                      <div style={rankGrid}>
                        {sessionRankStats.map((r) => (
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
                  ) : null
                })()}

                {selectedSession.questions.length > 0 && (() => {
                  const groups: ExamQuestion[][] = []
                  for (const q of selectedSession.questions) {
                    if (!q.isSub) {
                      groups.push([q])
                    } else {
                      const last = groups[groups.length - 1]
                      if (last) last.push(q)
                      else groups.push([q])
                    }
                  }
                  return (
                    <div style={modalQuestionList}>
                      <div style={sectionLabel}>解答用紙</div>
                      {groups.map((group, gi) => (
                        <div key={gi} style={modalQuestionGroup}>
                          {group.map((q) => {
                            const isExpanded = expandedNoteIds.has(q.id)
                            return (
                              <div
                                key={q.id}
                                style={{
                                  ...(q.isSub ? modalQuestionRowSub : modalQuestionRow),
                                  ...(q.note ? { cursor: 'pointer' } : {}),
                                  ...(isExpanded ? { alignItems: 'flex-start' } : {}),
                                }}
                                onClick={q.note ? () => toggleNote(q.id) : undefined}
                              >
                                <span style={modalQId}>{q.displayId}</span>
                                {q.rank && <span style={{ ...rankTag, ...rankColors[q.rank] }}>{q.rank}</span>}
                                {!q.hasChildren && (
                                  <span style={modalQResult(q.isCorrect)}>
                                    {q.isCorrect === true ? '○' : q.isCorrect === false ? '✗' : '－'}
                                  </span>
                                )}
                                {q.isDoubtful && <DoubtIcon />}
                                {!q.hasChildren && calcDurationMs(q.answeredStartedAt, q.answeredFinishedAt) !== undefined && (
                                  <span style={modalQTime}>{formatMs(calcDurationMs(q.answeredStartedAt, q.answeredFinishedAt))}</span>
                                )}
                                {q.note && (
                                  <span style={isExpanded ? modalQNoteExpanded : modalQNote}>{q.note}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                <div style={{ paddingTop: '8px' }}>
                  <button onClick={() => setSelectedSession(null)} style={sheetBottomCloseBtnStyle}>閉じる</button>
                </div>
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
const menuTriggerBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  color: '#aaa',
  padding: '0 4px',
  lineHeight: 1,
  flexShrink: 0,
}
const menuDropdown: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: 100,
  background: '#fff',
  border: '1px solid #e5e5e4',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  minWidth: '80px',
}
const menuItem: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#37352f',
  cursor: 'pointer',
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
const modalQuestionGroup: React.CSSProperties = {
  background: '#f9f9f8',
  borderRadius: '8px',
  overflow: 'hidden',
}
const modalQuestionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
}
const modalQuestionRowSub: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '5px 8px 5px 22px',
  borderTop: '1px solid rgba(55,53,47,0.06)',
}
const modalQId: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#37352f', minWidth: '32px' }
const modalQTime: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#aaa',
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
}
const modalQNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const modalQNoteExpanded: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  flex: 1,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.5,
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
