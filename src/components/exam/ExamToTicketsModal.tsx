import {useEffect, useState} from 'react'
import type {ExamQuestion, ExamSession, Rank} from '../../types/exam'
import {RANKS} from '../../types/exam'
import {createTicket, fetchSprints} from '../../lib/api/sprint'
import type {Sprint, TicketPriority} from '../../types/sprint'
import {useSprintStore} from '../../lib/store/sprintStore'
import {fetchSubCategories} from '../../lib/api/subcategory'
import type {SubCategory} from '../../types/workspace'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {c, font, formInput, formLabel} from '../../styles/notion'

interface Props {
  session: ExamSession
  onClose: () => void
  onCreated: (count: number) => void
}

type FilterMode = 'both' | 'wrong' | 'doubt'

function rankToPriority(rank: Rank): TicketPriority {
  if (rank === 'A') return 'high'
  if (rank === 'B' || rank === 'C') return 'medium'
  return 'low'
}

const RANK_COLOR: Record<Rank, string> = {
  A: '#eb5757',
  B: '#f2ab26',
  C: '#2383e2',
  D: 'rgba(55,53,47,0.4)',
  E: 'rgba(55,53,47,0.25)',
}

const RANK_BG: Record<Rank, string> = {
  A: 'rgba(235,87,87,0.08)',
  B: 'rgba(242,171,38,0.08)',
  C: 'rgba(35,131,226,0.08)',
  D: 'rgba(55,53,47,0.04)',
  E: 'rgba(55,53,47,0.02)',
}

function buildCriteria(rank: Rank, questions: ExamQuestion[]): string {
  const lines = [`${rank}ランクの問題を正確に解けるようになる`, '', '対象問題:']
  questions.forEach((q) => {
    const status = q.isCorrect === false ? '✗' : '?'
    const note = q.note ? ` — ${q.note}` : ''
    lines.push(`・問${q.displayId}（${status}）${note}`)
  })
  return lines.join('\n')
}

export function ExamToTicketsModal({ session, onClose, onCreated }: Props) {
  const loadTickets = useSprintStore((s) => s.loadTickets)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [sprintsLoading, setSprintsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterMode>('both')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  // ランク単位の選択・小分類
  const [selectedRanks, setSelectedRanks] = useState<Set<Rank>>(new Set())
  const [rankSubCats, setRankSubCats] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)

  useEffect(() => {
    Promise.all([fetchSprints(), fetchSubCategories(session.subject)])
      .then(([s, sc]) => { setSprints(s); setSubCategories(sc) })
      .catch(console.error)
      .finally(() => setSprintsLoading(false))
  }, [])

  // フィルター変更 → 全ランク選択にリセット
  const candidates = session.questions.filter((q) => {
    if (filter === 'wrong') return q.isCorrect === false
    if (filter === 'doubt') return q.isDoubtful
    return q.isCorrect === false || q.isDoubtful
  })

  // ランクごとにグループ化（RANKS順）
  const rankGroups: { rank: Rank; questions: ExamQuestion[] }[] = RANKS
    .map((rank) => ({ rank, questions: candidates.filter((q) => q.rank === rank) }))
    .filter((g) => g.questions.length > 0)

  useEffect(() => {
    setSelectedRanks(new Set(rankGroups.map((g) => g.rank)))
    setRankSubCats((prev) => {
      const next: Record<string, number[]> = {}
      rankGroups.forEach((g) => { next[g.rank] = prev[g.rank] ?? [] })
      return next
    })
  }, [filter])

  const toggleRank = (rank: Rank) =>
    setSelectedRanks((prev) => {
      const next = new Set(prev)
      next.has(rank) ? next.delete(rank) : next.add(rank)
      return next
    })

  const toggleAllRanks = () =>
    setSelectedRanks(
      selectedRanks.size === rankGroups.length
        ? new Set()
        : new Set(rankGroups.map((g) => g.rank))
    )

  const toggleSubCat = (rank: Rank, subCatId: number) =>
    setRankSubCats((prev) => {
      const cur = prev[rank] ?? []
      return {
        ...prev,
        [rank]: cur.includes(subCatId)
          ? cur.filter((id) => id !== subCatId)
          : [...cur, subCatId],
      }
    })

  const backlogSprint = sprints.find((s) => s.type === 'backlog')
  const selectedGroups = rankGroups.filter((g) => selectedRanks.has(g.rank))
  const unassignedRanks = selectedGroups.filter((g) => (rankSubCats[g.rank] ?? []).length === 0)
  const canSubmit = selectedGroups.length > 0 && unassignedRanks.length === 0 && !submitting

  const handleCreate = async () => {
    if (!backlogSprint || !canSubmit) return
    setSubmitting(true)
    try {
      await Promise.all(
        selectedGroups.map((g) =>
          createTicket({
            sprintId: backlogSprint.id,
            subject: session.subject,
            title: `[${session.examYear}] ${g.rank}ランク 問題の復習（${g.questions.length}問）`,
            acceptanceCriteria: buildCriteria(g.rank, g.questions),
            dueDate,
            priority: rankToPriority(g.rank),
            ticketType: 'practice',
            source: 'wrong_answer',
            estimateMinutes: g.questions.length * 15,
            subCategoryIds: rankSubCats[g.rank] ?? [],
          })
        )
      )
      setCreatedCount(selectedGroups.length)
      setDone(true)
      loadTickets(backlogSprint.id).catch(() => {})
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1001,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: `20px 20px calc(20px + env(safe-area-inset-bottom))`,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          backgroundColor: 'rgba(55,53,47,0.1)',
          margin: '-8px auto 16px',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: font.md, fontWeight: 700, color: c.text }}>
            チケット一括生成
          </h3>
          <button onClick={onClose} style={closeBtn} aria-label="閉じる">×</button>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: font.sm, color: c.textHint }}>
          {session.subject} — {session.examYear}
        </p>

        {sprintsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <LoadingSpinner />
          </div>
        ) : !backlogSprint ? (
          <p style={{ fontSize: font.base, color: c.textHint, textAlign: 'center', padding: '32px 0' }}>
            バックログスプリントが見つかりません。<br />
            スプリントページでバックログを作成してください。
          </p>
        ) : done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#e6f6eb', color: '#19a576',
              fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>✓</div>
            <p style={{ margin: 0, fontSize: font.base, fontWeight: 700, color: c.text, textAlign: 'center' }}>
              {createdCount}件のチケットをバックログに追加しました
            </p>
            <button style={btnPrimary} onClick={() => { onCreated(createdCount); onClose() }}>
              閉じる
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 対象フィルター */}
            <div>
              <label style={formLabel}>対象</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {([
                  { value: 'both', label: '不正解＋疑問' },
                  { value: 'wrong', label: '不正解のみ' },
                  { value: 'doubt', label: '疑問マークのみ' },
                ] as { value: FilterMode; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    style={{
                      padding: '5px 12px', borderRadius: 20,
                      border: filter === value ? 'none' : `1px solid ${c.border}`,
                      background: filter === value ? c.blue : 'transparent',
                      color: filter === value ? '#fff' : c.textSub,
                      fontSize: font.sm,
                      fontWeight: filter === value ? 700 : 500,
                      cursor: 'pointer',
                    }}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 期日 */}
            <div>
              <label style={formLabel}>期日 *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ ...formInput, marginTop: 4 }}
              />
            </div>

            {/* ランクグループ一覧 */}
            {rankGroups.length === 0 ? (
              <p style={{ fontSize: font.base, color: c.textHint, textAlign: 'center', padding: '16px 0' }}>
                該当する問題がありません
              </p>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={formLabel}>
                    ランク別チケット（{selectedRanks.size} / {rankGroups.length} ランク選択中）
                  </label>
                  <button
                    style={{
                      border: `1px solid ${c.border}`, background: 'transparent',
                      borderRadius: 6, padding: '3px 8px',
                      fontSize: font.xs, fontWeight: 700, color: c.textSub, cursor: 'pointer',
                    }}
                    onClick={toggleAllRanks}
                  >
                    {selectedRanks.size === rankGroups.length ? '全解除' : '全選択'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rankGroups.map(({ rank, questions }) => {
                    const isSelected = selectedRanks.has(rank)
                    const assignedIds = rankSubCats[rank] ?? []
                    const isUnassigned = isSelected && assignedIds.length === 0

                    return (
                      <div
                        key={rank}
                        style={{
                          borderRadius: 8,
                          border: `1px solid ${isUnassigned ? c.redBorder : c.border}`,
                          backgroundColor: isSelected ? c.bg : 'rgba(55,53,47,0.02)',
                          opacity: isSelected ? 1 : 0.5,
                          overflow: 'hidden',
                        }}
                      >
                        {/* ランクヘッダー行 */}
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', cursor: 'pointer',
                            backgroundColor: RANK_BG[rank],
                          }}
                          onClick={() => toggleRank(rank)}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: isSelected ? 'none' : `1.5px solid ${c.border}`,
                            background: isSelected ? c.blue : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isSelected && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 900, color: RANK_COLOR[rank] }}>
                            {rank}ランク
                          </span>
                          <span style={{ fontSize: font.sm, fontWeight: 600, color: c.textSub }}>
                            {questions.length}問
                          </span>
                        </div>

                        {/* 問題一覧（メモ全文表示） */}
                        <div style={{ borderTop: `1px solid ${c.border}` }}>
                          {questions.map((q, i) => (
                            <div
                              key={q.id}
                              style={{
                                padding: '8px 12px',
                                borderBottom: i < questions.length - 1 ? `1px solid ${c.border}` : 'none',
                                backgroundColor: c.bg,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: q.note ? 4 : 0 }}>
                                <span style={{ fontSize: font.sm, fontWeight: 700, color: c.text, minWidth: 36 }}>
                                  問{q.displayId}
                                </span>
                                {q.isCorrect === false && (
                                  <span style={{
                                    fontSize: font.xs, fontWeight: 700, color: '#fff',
                                    background: c.red, borderRadius: 4, padding: '1px 5px',
                                  }}>✗</span>
                                )}
                                {q.isDoubtful && (
                                  <span style={{
                                    fontSize: font.xs, fontWeight: 700, color: '#fff',
                                    background: '#f2ab26', borderRadius: 4, padding: '1px 5px',
                                  }}>?</span>
                                )}
                              </div>
                              {q.note && (
                                <p style={{
                                  margin: 0,
                                  fontSize: font.sm,
                                  color: c.textSub,
                                  lineHeight: 1.6,
                                  paddingLeft: 36,
                                }}>
                                  {q.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 小分類チップ（選択中のみ） */}
                        {isSelected && (
                          <div
                            style={{
                              display: 'flex', flexWrap: 'wrap', gap: 6,
                              padding: '8px 12px 10px',
                              borderTop: `1px solid ${c.border}`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {subCategories.length === 0 ? (
                              <span style={{ fontSize: font.sm, color: c.textHint, fontStyle: 'italic' }}>
                                小分類未登録
                              </span>
                            ) : (
                              <>
                                {subCategories.map((sc) => {
                                  const active = assignedIds.includes(sc.id)
                                  return (
                                    <button
                                      key={sc.id}
                                      style={{
                                        padding: '4px 12px', borderRadius: 20,
                                        border: active ? 'none' : `1px solid ${c.border}`,
                                        background: active ? c.blue : 'transparent',
                                        color: active ? '#fff' : c.textSub,
                                        fontSize: font.sm,
                                        fontWeight: active ? 700 : 500,
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => toggleSubCat(rank, sc.id)}
                                    >
                                      {sc.name}
                                    </button>
                                  )
                                })}
                                {assignedIds.length === 0 && (
                                  <span style={{ fontSize: font.sm, color: c.red, fontWeight: 600 }}>
                                    ← 分野を選択してください
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* フッター */}
            <div style={{ marginTop: 4 }}>
              {unassignedRanks.length > 0 && (
                <p style={{ margin: '0 0 8px', fontSize: font.sm, color: c.red, fontWeight: 600, textAlign: 'center' }}>
                  ⚠ {unassignedRanks.map((g) => g.rank).join('・')}ランクの分野が未設定です
                </p>
              )}
              {unassignedRanks.length === 0 && selectedGroups.length > 0 && (
                <p style={{ margin: '0 0 8px', fontSize: font.sm, color: c.textHint, textAlign: 'center' }}>
                  バックログ「{backlogSprint.name}」に追加されます
                </p>
              )}
              <button
                style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                disabled={!canSubmit}
                onClick={handleCreate}
              >
                {submitting
                  ? '追加中…'
                  : `${selectedGroups.length}件のチケットをバックログに追加`}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '18px',
  color: 'rgba(55,53,47,0.4)',
  lineHeight: 1,
  padding: '0 2px',
  flexShrink: 0,
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#2383e2',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
}
