import {useMemo, useState} from 'react'
import {BottomSheet} from '@/components/common/BottomSheet'
import type {
  Sprint,
  StudyTicket,
  StudyTicketInput,
  StudyTicketUpdateInput,
  TicketPriority,
  TicketSource,
  TicketType,
} from '../../types/sprint'
import type {SubCategoryRank} from '../../types/workspace'
import {useSettingsStore} from '../../lib/store/settings'
import {c, font, formInput, formLabel, formTextarea} from '../../styles/notion'
import {MarkdownContent} from '@/components/common/MarkdownContent.tsx'

type CreateProps = {
  mode: 'create'
  sprints: Sprint[]
  defaultSprintId: number | null
  onSave: (input: StudyTicketInput) => Promise<void>
  onClose: () => void
}

type EditProps = {
  mode: 'edit'
  ticket: StudyTicket
  sprints: Sprint[]
  onSave: (input: StudyTicketUpdateInput) => Promise<void>
  onClose: () => void
}

type Props = CreateProps | EditProps

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'knowledge', label: '知識補強' },
  { value: 'practice', label: '演習' },
  { value: 'understanding', label: '理解整理' },
  { value: 'memorization', label: '暗記' },
]

const SOURCE_OPTIONS: { value: TicketSource; label: string }[] = [
  { value: 'wrong_answer', label: '過去問ミス' },
  { value: 'load_map', label: 'ロードマップ' },
  { value: 'review', label: '見直し' },
  { value: 'manual', label: '手動' },
]

const RANK_COLORS: Record<SubCategoryRank, string> = {
  A: '#eb5757',
  B: '#f5a623',
  C: '#2383e2',
  D: 'rgba(55,53,47,0.4)',
  E: 'rgba(55,53,47,0.25)',
}

function rankBadgeColor(rank: SubCategoryRank): string {
  return RANK_COLORS[rank]
}

export function TicketFormModal(props: Props) {
  const { mode, onSave, onClose, sprints } = props
  const ticket = mode === 'edit' ? props.ticket : null

  const subjects = useSettingsStore((s) => s.subjects)
  const allSubCategories = useSettingsStore((s) => s.subCategories)

  const [subject, setSubject] = useState(ticket?.subject ?? subjects[0] ?? '')
  const [title, setTitle] = useState(ticket?.title ?? '')
  const [criteria, setCriteria] = useState(ticket?.acceptanceCriteria ?? '')
  const [dueDate, setDueDate] = useState(ticket?.dueDate ?? new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? 'medium')
  const [ticketType, setTicketType] = useState<TicketType>(ticket?.ticketType ?? 'knowledge')
  const [source, setSource] = useState<TicketSource>(ticket?.source ?? 'manual')
  const [estimateMinutes, setEstimateMinutes] = useState(
    ticket?.estimateMinutes ? String(ticket.estimateMinutes) : ''
  )
  const [selectedSubCatIds, setSelectedSubCatIds] = useState<number[]>(
    ticket?.subCategories.map((sc) => sc.id) ?? []
  )
  const [sprintId, setSprintId] = useState<number | null>(
    mode === 'edit' ? ticket!.sprintId : (props as CreateProps).defaultSprintId
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rankFilter, setRankFilter] = useState<SubCategoryRank | 'all' | 'none'>('all')
  const [criteriaPreview, setCriteriaPreview] = useState(false)

  // subCategories filtered by selected subject
  const filteredSubCategories = useMemo(
    () => allSubCategories.filter((sc) => sc.subject === subject),
    [allSubCategories, subject]
  )

  // Ranks present in current subject's subCategories (sorted A→E, null last)
  const availableRanks = useMemo(() => {
    const ranks = new Set<SubCategoryRank | 'none'>()
    for (const sc of filteredSubCategories) {
      if (sc.rank) ranks.add(sc.rank)
      else ranks.add('none')
    }
    const order: (SubCategoryRank | 'none')[] = ['A', 'B', 'C', 'D', 'E', 'none']
    return order.filter((r) => ranks.has(r))
  }, [filteredSubCategories])

  // Further filter by rank
  const visibleSubCategories = useMemo(() => {
    if (rankFilter === 'all') return filteredSubCategories
    if (rankFilter === 'none') return filteredSubCategories.filter((sc) => sc.rank === null)
    return filteredSubCategories.filter((sc) => sc.rank === rankFilter)
  }, [filteredSubCategories, rankFilter])

  // When subject changes, clear selected subCats that don't belong to the new subject
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject)
    setRankFilter('all')
    const validIds = allSubCategories
      .filter((sc) => sc.subject === newSubject)
      .map((sc) => sc.id)
    setSelectedSubCatIds((prev) => prev.filter((id) => validIds.includes(id)))
  }

  const toggleSubCat = (id: number) => {
    setSelectedSubCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const validate = (): string => {
    if (!subject) return '科目は必須です'
    if (!title.trim()) return 'タイトルは必須です'
    if (!criteria.trim()) return '達成条件は必須です'
    if (!dueDate) return '期限は必須です'
    if (selectedSubCatIds.length === 0) return '小分類を1つ以上選択してください'
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    try {
      const estimate = estimateMinutes ? parseInt(estimateMinutes, 10) : null
      if (mode === 'create') {
        await (onSave as (i: StudyTicketInput) => Promise<void>)({
          sprintId: sprintId ?? null,
          subject,
          title: title.trim(),
          acceptanceCriteria: criteria.trim(),
          dueDate,
          priority,
          ticketType,
          source,
          estimateMinutes: estimate,
          subCategoryIds: selectedSubCatIds,
        })
      } else {
        await (onSave as (i: StudyTicketUpdateInput) => Promise<void>)({
          subject,
          title: title.trim(),
          acceptanceCriteria: criteria.trim(),
          dueDate,
          priority,
          ticketType,
          source,
          estimateMinutes: estimate,
          subCategoryIds: selectedSubCatIds,
        })
      }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    ...formInput,
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2337352F' stroke-opacity='0.4' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
  }

  return (
    <BottomSheet onClose={onClose} zIndex={2000} maxWidth={600} maxHeight="92vh" paddingBottom="calc(20px + env(safe-area-inset-bottom))">
      <div style={{ padding: '20px 20px 0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: font.md, fontWeight: 700, color: c.text }}>
          {mode === 'create' ? 'チケット作成' : 'チケット編集'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Sprint selection (create only) */}
          {mode === 'create' && (
            <div>
              <label style={formLabel}>スプリント</label>
              <select
                style={{ ...selectStyle, marginTop: 4 }}
                value={sprintId ?? ''}
                onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : null)}
              >
                {sprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.type === 'backlog' ? `☰ ${sp.name}` : sp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject selector */}
          <div>
            <label style={formLabel}>科目 *</label>
            <select
              style={{ ...selectStyle, marginTop: 4 }}
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">（科目なし）</option>
              ) : (
                subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={formLabel}>タイトル *</label>
            <input
              style={{ ...formInput, marginTop: 4 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="弱点を一言で"
              maxLength={255}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={formLabel}>説明 *</label>
              <div style={{ display: 'flex', gap: 2 }}>
                {(['編集', 'プレビュー'] as const).map((tab) => {
                  const isPreview = tab === 'プレビュー'
                  const active = criteriaPreview === isPreview
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setCriteriaPreview(isPreview)}
                      style={{
                        padding: '2px 8px',
                        fontSize: font.xs,
                        fontWeight: active ? 700 : 500,
                        border: 'none',
                        borderRadius: 4,
                        backgroundColor: active ? c.blue : 'transparent',
                        color: active ? '#fff' : c.textHint,
                        cursor: 'pointer',
                      }}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>
            {criteriaPreview ? (
              <div
                style={{
                  ...formTextarea,
                  minHeight: 72,
                  cursor: 'default',
                  overflowY: 'auto',
                }}
              >
                {criteria.trim()
                  ? <MarkdownContent>{criteria}</MarkdownContent>
                  : <span style={{ color: c.textHint, fontSize: font.sm }}>プレビューなし</span>
                }
              </div>
            ) : (
              <textarea
                style={{ ...formTextarea, minHeight: 72 }}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="「〇〇が説明できる」「N問連続正解」など具体的な達成条件"
              />
            )}
          </div>

          <div>
            <label style={formLabel}>期限 *</label>
            <input
              type="date"
              style={{ ...formInput, marginTop: 4 }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label style={formLabel}>見積もり (分)</label>
            <input
              type="number"
              style={{ ...formInput, marginTop: 4 }}
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              placeholder="例: 60"
              min={1}
              max={480}
            />
          </div>

          <div>
            <label style={formLabel}>優先度</label>
            <select
              style={{ ...selectStyle, marginTop: 4 }}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={formLabel}>種別</label>
            <select
              style={{ ...selectStyle, marginTop: 4 }}
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as TicketType)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={formLabel}>発生源</label>
            <select
              style={{ ...selectStyle, marginTop: 4 }}
              value={source}
              onChange={(e) => setSource(e.target.value as TicketSource)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* SubCategory multi-select — filtered by subject + rank */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <label style={formLabel}>
                小分類 * ({selectedSubCatIds.length} 選択)
              </label>
              {subject && (
                <span style={{ fontSize: font.xs, fontWeight: 400, color: c.textHint }}>
                  {subject}
                </span>
              )}
            </div>

            {filteredSubCategories.length === 0 ? (
              <p style={{ fontSize: font.sm, color: c.textHint, margin: 0 }}>
                {subject ? `「${subject}」の小分類が未設定です` : '科目を選択してください'}
              </p>
            ) : (
              <>
                {/* Rank filter pills */}
                {availableRanks.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {(['all', ...availableRanks] as const).map((r) => {
                      const active = rankFilter === r
                      const label = r === 'all' ? 'すべて' : r === 'none' ? 'なし' : `ランク${r}`
                      const countInRank =
                        r === 'all'
                          ? filteredSubCategories.length
                          : r === 'none'
                            ? filteredSubCategories.filter((sc) => sc.rank === null).length
                            : filteredSubCategories.filter((sc) => sc.rank === r).length
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRankFilter(r)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            border: active
                              ? 'none'
                              : `1px solid rgba(55,53,47,0.14)`,
                            backgroundColor: active ? c.blue : 'transparent',
                            color: active ? '#fff' : c.textSub,
                            fontSize: font.xs,
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                          <span
                            style={{
                              marginLeft: 3,
                              fontSize: '10px',
                              opacity: active ? 0.8 : 0.6,
                            }}
                          >
                            {countInRank}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* SubCategory list */}
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    border: `1px solid rgba(55,53,47,0.12)`,
                    borderRadius: 6,
                    padding: '4px 0',
                  }}
                >
                  {visibleSubCategories.length === 0 ? (
                    <div style={{ padding: '12px 10px', fontSize: font.sm, color: c.textHint }}>
                      該当する小分類がありません
                    </div>
                  ) : (
                    visibleSubCategories.map((sc) => (
                      <label
                        key={sc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          cursor: 'pointer',
                          backgroundColor: selectedSubCatIds.includes(sc.id)
                            ? 'rgba(35,131,226,0.05)'
                            : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubCatIds.includes(sc.id)}
                          onChange={() => toggleSubCat(sc.id)}
                          style={{ accentColor: c.blue, width: 14, height: 14 }}
                        />
                        <span style={{ fontSize: font.base, color: c.text, flex: 1 }}>
                          {sc.name}
                        </span>
                        {sc.rank && (
                          <span
                            style={{
                              fontSize: font.xs,
                              fontWeight: 700,
                              color: '#fff',
                              backgroundColor: rankBadgeColor(sc.rank),
                              borderRadius: '3px',
                              padding: '1px 5px',
                              flexShrink: 0,
                            }}
                          >
                            {sc.rank}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {error && <p style={{ margin: 0, fontSize: '12px', color: c.red }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              border: `1px solid rgba(55,53,47,0.16)`,
              borderRadius: '8px',
              fontSize: font.base,
              fontWeight: 600,
              color: c.textSub,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 18px',
              backgroundColor: saving ? 'rgba(35,131,226,0.5)' : c.blue,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: font.base,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
