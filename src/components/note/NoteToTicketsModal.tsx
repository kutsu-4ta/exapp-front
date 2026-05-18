import {useEffect, useMemo, useState} from 'react'
import type {FailureType, Problem, SubCategory} from '../../types/workspace'
import {createTicket, fetchSprints} from '../../lib/api/sprint'
import type {Sprint, TicketPriority, TicketType} from '../../types/sprint'
import {useSprintStore} from '../../lib/store/sprintStore'
import {LoadingSpinner} from '../common/LoadingSpinner'
import {c, font, formInput, formLabel} from '../../styles/notion'

interface Props {
  problems: Problem[]
  allSubCategories: SubCategory[]
  onClose: () => void
  onCreated: (count: number) => void
}

const PROFICIENCY_COLOR: Record<string, string> = {
  '×': c.red,
  '△': '#f2ab26',
}

function proficiencyToPriority(p: string): TicketPriority {
  return p === '×' ? 'high' : 'medium'
}

function failureTypesToTicketType(types: FailureType[]): TicketType {
  if (types.includes('定義')) return 'knowledge'
  if (types.includes('解法')) return 'practice'
  if (types.includes('ケアレス')) return 'understanding'
  return 'practice'
}

function autoResolveSubCatId(p: Problem, allSubCats: SubCategory[]): number | null {
  if (!p.subCategory) return null
  const match = allSubCats.find((sc) => sc.subject === p.subject && sc.name === p.subCategory)
  return match ? match.id : null
}

export function NoteToTicketsModal({ problems, allSubCategories, onClose, onCreated }: Props) {
  const loadTickets = useSprintStore((s) => s.loadTickets)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [sprintsLoading, setSprintsLoading] = useState(true)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [subCatMap, setSubCatMap] = useState<Record<number, number[]>>({})
  const [autoResolvedIds, setAutoResolvedIds] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)

  useEffect(() => {
    fetchSprints()
      .then(setSprints)
      .catch(console.error)
      .finally(() => setSprintsLoading(false))
  }, [])

  // 初期状態: 全問選択、小分類を自動解決
  useEffect(() => {
    const ids = new Set(problems.map((p) => p.id))
    setSelectedIds(ids)

    const map: Record<number, number[]> = {}
    const resolved = new Set<number>()
    problems.forEach((p) => {
      const autoId = autoResolveSubCatId(p, allSubCategories)
      if (autoId !== null) {
        map[p.id] = [autoId]
        resolved.add(p.id)
      } else {
        map[p.id] = []
      }
    })
    setSubCatMap(map)
    setAutoResolvedIds(resolved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const subjects = [...new Set(problems.map((p) => p.subject))]
    return subjects.map((subj) => ({
      subject: subj,
      items: problems.filter((p) => p.subject === subj),
    }))
  }, [problems])

  const toggleProblem = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAllInGroup = (items: Problem[]) => {
    const allSelected = items.every((p) => selectedIds.has(p.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      items.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)))
      return next
    })
  }

  const toggleSubCat = (problemId: number, subCatId: number) => {
    setSubCatMap((prev) => {
      const cur = prev[problemId] ?? []
      const next = cur.includes(subCatId)
        ? cur.filter((id) => id !== subCatId)
        : [...cur, subCatId]
      return { ...prev, [problemId]: next }
    })
    setAutoResolvedIds((prev) => {
      const next = new Set(prev)
      next.delete(problemId)
      return next
    })
  }

  const backlogSprint = sprints.find((s) => s.type === 'backlog')
  const selectedProblems = problems.filter((p) => selectedIds.has(p.id))
  const unassigned = selectedProblems.filter((p) => (subCatMap[p.id] ?? []).length === 0)
  const canSubmit = selectedProblems.length > 0 && unassigned.length === 0 && !submitting

  const handleCreate = async () => {
    if (!backlogSprint || !canSubmit) return
    setSubmitting(true)
    try {
      await Promise.all(
        selectedProblems.map((p) =>
          createTicket({
            sprintId: backlogSprint.id,
            subject: p.subject,
            title: p.questionRef ? `${p.questionRef} の復習` : `${p.subject} の復習`,
            acceptanceCriteria: p.note ?? '',
            dueDate,
            priority: proficiencyToPriority(p.proficiency),
            ticketType: failureTypesToTicketType(p.failureTypes),
            source: 'wrong_answer',
            estimateMinutes: 20,
            subCategoryIds: subCatMap[p.id] ?? [],
          })
        )
      )
      setCreatedCount(selectedProblems.length)
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
            Noteからチケット生成
          </h3>
          <button onClick={onClose} style={closeBtn} aria-label="閉じる">×</button>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: font.sm, color: c.textHint }}>
          ×/△の問題からスタディチケットを作成します
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
        ) : problems.length === 0 ? (
          <p style={{ fontSize: font.base, color: c.textHint, textAlign: 'center', padding: '32px 0' }}>
            ×/△の問題がありません
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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

            {/* 問題一覧（科目別） */}
            {grouped.map(({ subject, items }) => {
              const subjectSubCats = allSubCategories.filter((sc) => sc.subject === subject)
              const allSelected = items.every((p) => selectedIds.has(p.id))

              return (
                <div key={subject}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={formLabel}>{subject}</label>
                    <button
                      style={{
                        border: `1px solid ${c.border}`, background: 'transparent',
                        borderRadius: 6, padding: '3px 8px',
                        fontSize: font.xs, fontWeight: 700, color: c.textSub, cursor: 'pointer',
                      }}
                      onClick={() => toggleAllInGroup(items)}
                    >
                      {allSelected ? '全解除' : '全選択'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((p) => {
                      const isSelected = selectedIds.has(p.id)
                      const assignedIds = subCatMap[p.id] ?? []
                      const isUnassigned = isSelected && assignedIds.length === 0
                      const isAutoResolved = autoResolvedIds.has(p.id)
                      const ticketType = failureTypesToTicketType(p.failureTypes)

                      return (
                        <div
                          key={p.id}
                          style={{
                            borderRadius: 8,
                            border: `1px solid ${isUnassigned ? c.redBorder : c.border}`,
                            backgroundColor: isSelected ? c.bg : 'rgba(55,53,47,0.02)',
                            opacity: isSelected ? 1 : 0.5,
                            overflow: 'hidden',
                          }}
                        >
                          {/* 問題ヘッダー行 */}
                          <div
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '10px 12px', cursor: 'pointer',
                            }}
                            onClick={() => toggleProblem(p.id)}
                          >
                            {/* チェックボックス */}
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
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

                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* 問題参照＋バッジ行 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: c.text }}>
                                  {p.questionRef ?? '（問題参照なし）'}
                                </span>
                                {/* 習熟度バッジ */}
                                <span style={{
                                  fontSize: font.xs, fontWeight: 700,
                                  color: PROFICIENCY_COLOR[p.proficiency] ?? c.textSub,
                                  border: `1px solid ${PROFICIENCY_COLOR[p.proficiency] ?? c.border}`,
                                  borderRadius: 4, padding: '1px 5px',
                                }}>
                                  {p.proficiency}
                                </span>
                                {/* 苦手属性タグ */}
                                {p.failureTypes.map((ft) => (
                                  <span key={ft} style={{
                                    fontSize: font.xs, color: c.textSub,
                                    backgroundColor: 'rgba(55,53,47,0.06)',
                                    borderRadius: 4, padding: '1px 6px',
                                  }}>
                                    {ft}
                                  </span>
                                ))}
                                {/* チケット種別インジケーター */}
                                <span style={{
                                  fontSize: font.xs, color: c.blue,
                                  backgroundColor: 'rgba(35,131,226,0.07)',
                                  borderRadius: 4, padding: '1px 6px',
                                }}>
                                  {ticketType}
                                </span>
                              </div>

                              {/* メモ全文 */}
                              {p.note && (
                                <p style={{
                                  margin: 0,
                                  fontSize: font.sm,
                                  color: c.textSub,
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                }}>
                                  {p.note}
                                </p>
                              )}
                            </div>
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
                              {subjectSubCats.length === 0 ? (
                                <span style={{ fontSize: font.sm, color: c.textHint, fontStyle: 'italic' }}>
                                  小分類未登録
                                </span>
                              ) : (
                                <>
                                  {subjectSubCats.map((sc) => {
                                    const active = assignedIds.includes(sc.id)
                                    const isAuto = active && isAutoResolved && p.subCategory === sc.name
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
                                          display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                        onClick={() => toggleSubCat(p.id, sc.id)}
                                      >
                                        {sc.name}
                                        {isAuto && (
                                          <span style={{ fontSize: font.xs, opacity: 0.8 }}>自動</span>
                                        )}
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
              )
            })}

            {/* フッター */}
            <div style={{ marginTop: 4 }}>
              {unassigned.length > 0 && (
                <p style={{ margin: '0 0 8px', fontSize: font.sm, color: c.red, fontWeight: 600, textAlign: 'center' }}>
                  ⚠ {unassigned.length}件の問題に分野が未設定です
                </p>
              )}
              {unassigned.length === 0 && selectedProblems.length > 0 && (
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
                  : `${selectedProblems.length}件のチケットをバックログに追加`}
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
