import type {FailureType, Problem, ProblemInput, Proficiency, SubCategoryRank} from '../types/workspace'
import {FAILURE_TYPE_VALUES, PROFICIENCY_VALUES} from '../types/workspace'
import {StatusCopyModal} from '../components/common/StatusCopyModal'
import {useSettingsStore} from '../lib/store/settings'
import {ProblemCard} from '../components/note/ProblemCard'
import {ProblemQuickModal} from '../components/note/ProblemQuickModal'
import {addProblem, fetchProblems} from '../lib/api/problem'
import {getCached, invalidateCache, setCached} from '../lib/pageCache'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FilterPill} from '../components/note/FilterPill'
import {AddProblemModal} from '../components/note/AddProblemModal'
import {NoteToTicketsModal} from '../components/note/NoteToTicketsModal'
import {c, font, pageHeading} from '../styles/notion'
import {useNavigate, useSearchParams} from 'react-router-dom'
import type {DegBugfixConfig} from '@/lib/api/morningQuiz.ts'
import {DegBugfixConfigModal} from '@/components/practice/DegBugfixConfigModal.tsx'
import {BottomSheet, sheetBodyStyle, sheetCloseBtnStyle, sheetFlexHeaderStyle} from '@/components/common/BottomSheet'

type DetailFilter = {
  subCategory: string
  proficiency: Proficiency | 'all'
  failureType: FailureType | 'all'
  isGoodQuestion: boolean | null
  isFormula: boolean | null
  solvedFrom: string
  solvedTo: string
}

const DETAIL_INIT: DetailFilter = {
  subCategory: '',
  proficiency: 'all',
  failureType: 'all',
  isGoodQuestion: null,
  isFormula: null,
  solvedFrom: '',
  solvedTo: '',
}

const RANK_VALUES: SubCategoryRank[] = ['A', 'B', 'C', 'D', 'E']

const RANK_ACTIVE: Record<SubCategoryRank, { bg: string; color: string }> = {
  A: { bg: 'rgba(35,131,226,0.12)', color: '#2383e2' },
  B: { bg: 'rgba(25,165,118,0.12)', color: '#19a576' },
  C: { bg: 'rgba(242,171,38,0.15)', color: '#c98b00' },
  D: { bg: 'rgba(235,87,87,0.12)', color: '#eb5757' },
  E: { bg: 'rgba(55,53,47,0.08)', color: 'rgba(55,53,47,0.55)' },
}

function detailActiveCount(f: DetailFilter): number {
  return [
    f.subCategory !== '',
    f.proficiency !== 'all',
    f.failureType !== 'all',
    f.isGoodQuestion !== null,
    f.isFormula !== null,
    f.solvedFrom !== '',
    f.solvedTo !== '',
  ].filter(Boolean).length
}

function SkeletonCard({ isLast = false }: { isLast?: boolean }) {
  return (
    <div style={{ ...skeletonCard, borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
      <style>{`@keyframes weakSkeleton{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={skRow}>
        <div style={{ ...sk, width: 28, height: 28, borderRadius: '50%' }} />
        <div style={{ ...sk, width: 56, height: 12 }} />
        <div style={{ ...sk, width: 80, height: 12 }} />
        <div style={{ ...sk, width: 44, height: 12, marginLeft: 'auto' }} />
      </div>
      <div style={{ ...sk, width: '88%', height: 13 }} />
      <div style={{ ...sk, width: '55%', height: 13 }} />
    </div>
  )
}

function buildProblemDetailText(p: Problem): string {
  const lines: string[] = []
  const meta = [p.materialName, p.questionRef].filter(Boolean).join(' ')
  lines.push(`[${p.subject}] ${meta}`)
  lines.push(`習熟度: ${p.proficiency}`)
  if (p.subCategory) lines.push(`小分類: ${p.subCategory}`)
  if (p.failureTypes.length > 0) lines.push(`属性: ${p.failureTypes.join(', ')}`)
  const flags = [p.isGoodQuestion && '★ 良問', p.isFormula && '公式'].filter(Boolean)
  if (flags.length > 0) lines.push(flags.join(' '))
  if (p.note) { lines.push(''); lines.push('【ノート】'); lines.push(p.note) }
  return lines.join('\n')
}

function buildProblemListText(grouped: Array<{ subject: string; items: Problem[] }>): string {
  const total = grouped.reduce((sum, g) => sum + g.items.length, 0)
  const lines = [`Note一覧 (${total}件)`, '']
  grouped.forEach(({ subject, items }) => {
    if (subject !== 'all') lines.push(`■ ${subject}`)
    items.forEach((p, i) => {
      const meta = [p.materialName, p.questionRef].filter(Boolean).join(' ')
      lines.push(`${i + 1}. [${p.subject}] ${meta} (${p.proficiency})`)
      if (p.subCategory) lines.push(`   ${p.subCategory}`)
      if (p.failureTypes.length > 0) lines.push(`   ${p.failureTypes.join(' ')}`)
    })
    if (subject !== 'all') lines.push('')
  })
  return lines.join('\n')
}

export default function NoteListPage() {
  const navigate = useNavigate()

  const subjects = useSettingsStore((s) => s.subjects)
  const subCategories = useSettingsStore((s) => s.subCategories)
  const [problems, setProblems] = useState<Problem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [quickProblem, setQuickProblem] = useState<Problem | null>(null)

  const didMountRef = useRef(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const filterSubject = searchParams.get('subject') ?? 'all'

  const setFilterSubject = (v: string) =>
    setSearchParams((p) => { const n = new URLSearchParams(p); v === 'all' ? n.delete('subject') : n.set('subject', v); return n }, { replace: true })

  const [filterRank, setFilterRank] = useState<SubCategoryRank | 'all'>('all')
  const [detailFilter, setDetailFilter] = useState<DetailFilter>(DETAIL_INIT)
  const [showDetailFilter, setShowDetailFilter] = useState(false)

  const [showNoteToTickets, setShowNoteToTickets] = useState(false)
  const [showDegConfig, setShowDegConfig] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [copyText, setCopyText] = useState('')
  const [noteCopied, setNoteCopied] = useState(false)
  const handleDegStart = (config: DegBugfixConfig) => {
    setShowDegConfig(false)
    const label = config.subject ?? 'すべての科目'
    navigate(`/subjects/${encodeURIComponent(label)}/flash-bugfix`, {
      state: { mode: 'deg', degConfig: config },
    })
  }

  // 小分類 → ランク逆引きマップ
  const subCategoryRankMap = useMemo(() => {
    const map = new Map<string, SubCategoryRank | null>()
    subCategories.forEach((sc) => map.set(sc.name, sc.rank ?? null))
    return map
  }, [subCategories])

  // 詳細モーダルの小分類候補（現在の科目フィルター内のもの）
  const availableSubCategories = useMemo(() => {
    const src = filterSubject === 'all' ? problems : problems.filter((p) => p.subject === filterSubject)
    return [...new Set(src.map((p) => p.subCategory).filter(Boolean) as string[])].sort()
  }, [problems, filterSubject])

  // 初回ロード
  useEffect(() => {
    const initSubject = searchParams.get('subject')
    const hasFilter = !!initSubject

    if (!hasFilter) {
      const cached = getCached<Problem[]>('note-problems')
      if (cached) {
        setProblems(cached)
        setInitialLoading(false)
      }
    }
    fetchProblems({ subjects: initSubject ? [initSubject] : undefined })
      .then((p) => {
        setProblems(p)
        if (!hasFilter) setCached('note-problems', p)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
      .finally(() => setInitialLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 科目フィルター変化時の再フェッチ
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const subjectsParam = filterSubject === 'all' ? undefined : [filterSubject]
    fetchProblems({ subjects: subjectsParam })
      .then(setProblems)
      .catch(console.error)
  }, [filterSubject])

  const handleAddProblem = useCallback(async (input: ProblemInput) => {
    const p = await addProblem(input)
    setProblems((prev) => [p, ...prev])
    invalidateCache('note-problems')
    return p
  }, [])

  const handleUpdate = useCallback((updated: Problem) => {
    setProblems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setQuickProblem(updated)
    invalidateCache('note-problems')
  }, [])

  const handleDelete = useCallback((id: number) => {
    setProblems((prev) => prev.filter((p) => p.id !== id))
    setQuickProblem(null)
    invalidateCache('note-problems')
  }, [])

  const grouped = useMemo(() => {
    const filtered = problems
      .filter((p) => filterSubject === 'all' || p.subject === filterSubject)
      .filter((p) => filterRank === 'all' || subCategoryRankMap.get(p.subCategory ?? '') === filterRank)
      .filter((p) => !detailFilter.subCategory || p.subCategory === detailFilter.subCategory)
      .filter((p) => detailFilter.proficiency === 'all' || p.proficiency === detailFilter.proficiency)
      .filter((p) => detailFilter.failureType === 'all' || p.failureTypes.includes(detailFilter.failureType as FailureType))
      .filter((p) => detailFilter.isGoodQuestion === null || p.isGoodQuestion === detailFilter.isGoodQuestion)
      .filter((p) => detailFilter.isFormula === null || p.isFormula === detailFilter.isFormula)
      .filter((p) => !detailFilter.solvedFrom || p.solvedAt >= detailFilter.solvedFrom)
      .filter((p) => !detailFilter.solvedTo || p.solvedAt <= detailFilter.solvedTo)

    if (filterSubject === 'all') {
      return [{
        subject: 'all',
        items: [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }]
    }

    const subjectList = subjects.length > 0 ? subjects : [...new Set(filtered.map((p) => p.subject))]
    return subjectList
      .map((s) => ({ subject: s, items: filtered.filter((p) => p.subject === s) }))
      .filter((g) => g.items.length > 0)
  }, [problems, filterSubject, filterRank, detailFilter, subjects, subCategoryRankMap])

  const activeDetail = detailActiveCount(detailFilter)
  const totalItems = grouped.flatMap((g) => g.items).length

  const handleCopyScreen = useCallback(() => {
    if (quickProblem) {
      setCopyText(buildProblemDetailText(quickProblem))
    } else {
      setCopyText(buildProblemListText(grouped))
    }
    setIsCopyModalOpen(true)
  }, [quickProblem, grouped])

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setNoteCopied(true)
      setTimeout(() => { setNoteCopied(false); setIsCopyModalOpen(false) }, 800)
    } catch (e) { console.error(e) }
  }

  return (
    <div style={container}>
      <div style={stickyHeader}>
        <div style={headerInner}>
          {/* 1段目: タイトルとメインアクション */}
          <div style={titleRow}>
            <h1 style={{ ...pageHeading, marginBottom: 0 }}>Note</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {totalItems > 0 && (
                <button style={ticketizeBtn} onClick={() => setShowNoteToTickets(true)}>
                  チケット化 ({totalItems})
                </button>
              )}
              <button style={degBugfixBtn} onClick={() => setShowDegConfig(true)}>
                ★ DegBugfix
              </button>
            </div>
          </div>

          {/* 2段目: ランクフィルター + 詳細ボタン */}
          <div style={rankRow}>
            <div style={rankPills}>
              <button
                style={{
                  ...rankPillBase,
                  backgroundColor: filterRank === 'all' ? 'rgba(55,53,47,0.08)' : 'transparent',
                  color: filterRank === 'all' ? c.text : c.textSub,
                  fontWeight: filterRank === 'all' ? 600 : 400,
                }}
                onClick={() => setFilterRank('all')}
              >
                すべて
              </button>
              {RANK_VALUES.map((r) => {
                const active = filterRank === r
                return (
                  <button
                    key={r}
                    style={{
                      ...rankPillBase,
                      backgroundColor: active ? RANK_ACTIVE[r].bg : 'transparent',
                      color: active ? RANK_ACTIVE[r].color : c.textSub,
                      fontWeight: active ? 700 : 400,
                    }}
                    onClick={() => setFilterRank(active ? 'all' : r)}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
            <button
              style={{ ...detailBtn, ...(activeDetail > 0 ? detailBtnActive : {}) }}
              onClick={() => setShowDetailFilter(true)}
            >
              詳細
              {activeDetail > 0 && <span style={detailBadge}>{activeDetail}</span>}
            </button>
          </div>
        </div>

        {/* 3段目: 科目ピル */}
        <div style={subjectScroll}>
          <FilterPill active={filterSubject === 'all'} onClick={() => setFilterSubject('all')}>
            All
          </FilterPill>
          {subjects.map((s) => (
            <FilterPill key={s} active={filterSubject === s} onClick={() => setFilterSubject(s)}>
              {s}
            </FilterPill>
          ))}
        </div>
      </div>

      <div style={mainContent}>
        {showAddForm && (
          <AddProblemModal
            onSubmit={handleAddProblem}
            onClose={() => setShowAddForm(false)}
            onUpdate={handleUpdate}
            subCategories={subCategories}
          />
        )}

        {error && <p style={errorText}>{error}</p>}

        {initialLoading && !error && (
          <div style={cardGrid}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} isLast={i === 3} />
            ))}
          </div>
        )}

        {!initialLoading && grouped.length === 0 && (
          <div style={emptyState}>
            <p style={mutedText}>該当する問題は見つかりませんでした</p>
          </div>
        )}

        {grouped.map(({ subject, items }) => (
          <section key={subject} style={section}>
            {subject !== 'all' && (
              <div style={sectionHeader}>
                <span style={sectionLabel}>{subject}</span>
                <span style={badge}>{items.length}</span>
              </div>
            )}
            <div style={cardGrid}>
              {items.map((p, i) => (
                <Fragment key={p.id}>
                  <ProblemCard problem={p} onClick={() => setQuickProblem(p)} />
                  {i < items.length - 1 && <div style={cardDivider} />}
                </Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>

      {quickProblem && (
        <ProblemQuickModal
          problem={quickProblem}
          onClose={() => setQuickProblem(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onNavigate={(p) => setQuickProblem(p)}
        />
      )}

      {!showAddForm && !quickProblem && !showDegConfig && !showDetailFilter && (
        <button style={fab} onClick={() => setShowAddForm(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* 左下固定コピーボタン */}
      <button
        onClick={handleCopyScreen}
        title="画面の内容をコピー"
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(55,53,47,0.12)',
          backgroundColor: '#fff',
          color: 'rgba(55,53,47,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: quickProblem ? 1201 : 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        </svg>
      </button>

      {isCopyModalOpen && (
        <StatusCopyModal
          text={copyText}
          copied={noteCopied}
          onCopy={handleFinalCopy}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}

      {showNoteToTickets && (
        <NoteToTicketsModal
          problems={grouped.flatMap((g) => g.items)}
          allSubCategories={subCategories}
          onClose={() => setShowNoteToTickets(false)}
          onCreated={(count) => {
            setShowNoteToTickets(false)
            console.log(`${count}件のチケットを作成しました`)
          }}
        />
      )}

      {showDegConfig && (
        <DegBugfixConfigModal
          subjects={subjects}
          initialSubject={filterSubject === 'all' ? null : filterSubject}
          onClose={() => setShowDegConfig(false)}
          onStart={handleDegStart}
        />
      )}

      {showDetailFilter && (
        <BottomSheet onClose={() => setShowDetailFilter(false)} height="85vh">
          <div style={sheetFlexHeaderStyle}>
            <span style={detailModalTitle}>詳細検索</span>
            <button style={sheetCloseBtnStyle} onClick={() => setShowDetailFilter(false)}>×</button>
          </div>
          <div style={sheetBodyStyle}>

            {/* 小分類 */}
            <div style={detailSection}>
              <p style={detailLabel}>小分類</p>
              <select
                style={detailSelect}
                value={detailFilter.subCategory}
                onChange={(e) => setDetailFilter((f) => ({ ...f, subCategory: e.target.value }))}
              >
                <option value="">すべて</option>
                {availableSubCategories.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>

            {/* 習熟度 */}
            <div style={detailSection}>
              <p style={detailLabel}>習熟度</p>
              <div style={segControl}>
                <button
                  style={{ ...segBtn, ...(detailFilter.proficiency === 'all' ? segBtnActive : {}) }}
                  onClick={() => setDetailFilter((f) => ({ ...f, proficiency: 'all' }))}
                >
                  すべて
                </button>
                {PROFICIENCY_VALUES.map((v) => (
                  <button
                    key={v}
                    style={{ ...segBtn, ...(detailFilter.proficiency === v ? segBtnActive : {}) }}
                    onClick={() => setDetailFilter((f) => ({ ...f, proficiency: v as Proficiency }))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* 属性 */}
            <div style={detailSection}>
              <p style={detailLabel}>属性</p>
              <div style={pillGroup}>
                <button
                  style={{ ...filterPillBtn, ...(detailFilter.failureType === 'all' ? pillBtnActive : {}) }}
                  onClick={() => setDetailFilter((f) => ({ ...f, failureType: 'all' }))}
                >
                  すべて
                </button>
                {FAILURE_TYPE_VALUES.map((v) => (
                  <button
                    key={v}
                    style={{ ...filterPillBtn, ...(detailFilter.failureType === v ? pillBtnActive : {}) }}
                    onClick={() => setDetailFilter((f) => ({ ...f, failureType: v as FailureType }))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* フラグ */}
            <div style={detailSection}>
              <p style={detailLabel}>フラグ</p>
              <div style={pillGroup}>
                <button
                  style={{ ...filterPillBtn, ...(detailFilter.isGoodQuestion === true ? pillBtnActive : {}) }}
                  onClick={() => setDetailFilter((f) => ({ ...f, isGoodQuestion: f.isGoodQuestion === true ? null : true }))}
                >
                  ★ 良問
                </button>
                <button
                  style={{ ...filterPillBtn, ...(detailFilter.isFormula === true ? pillBtnActive : {}) }}
                  onClick={() => setDetailFilter((f) => ({ ...f, isFormula: f.isFormula === true ? null : true }))}
                >
                  公式
                </button>
              </div>
            </div>

            {/* 解いた日 */}
            <div style={detailSection}>
              <p style={detailLabel}>解いた日</p>
              <div style={dateRow}>
                <input
                  type="date"
                  style={dateInput}
                  value={detailFilter.solvedFrom}
                  onChange={(e) => setDetailFilter((f) => ({ ...f, solvedFrom: e.target.value }))}
                />
                <span style={{ fontSize: 13, color: c.textSub }}>〜</span>
                <input
                  type="date"
                  style={dateInput}
                  value={detailFilter.solvedTo}
                  onChange={(e) => setDetailFilter((f) => ({ ...f, solvedTo: e.target.value }))}
                />
              </div>
            </div>

            {/* クリア */}
            {activeDetail > 0 && (
              <button
                style={clearBtn}
                onClick={() => setDetailFilter(DETAIL_INIT)}
              >
                フィルターをクリア
              </button>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ── Styles ──

const ticketizeBtn: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: 'rgba(35,131,226,0.08)',
  color: c.blue,
  border: '1px solid rgba(35,131,226,0.2)',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
}

const degBugfixBtn: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: 'rgba(124,58,237,0.08)',
  color: '#7c3aed',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
}

const container: React.CSSProperties = { minHeight: '100vh', backgroundColor: c.bg, color: c.text }

const stickyHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${c.border}`,
  padding: '12px 16px 8px',
}

const headerInner: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxWidth: '720px',
  margin: '0 auto 10px',
}

const titleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const rankRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
}

const rankPills: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  flexWrap: 'nowrap',
}

const rankPillBase: React.CSSProperties = {
  padding: '4px 11px',
  fontSize: '12px',
  borderRadius: '4px',
  border: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 0.15s',
  fontFamily: 'inherit',
}

const detailBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: c.textSub,
  border: `1px solid rgba(55,53,47,0.14)`,
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const detailBtnActive: React.CSSProperties = {
  color: c.blue,
  borderColor: 'rgba(35,131,226,0.35)',
  backgroundColor: 'rgba(35,131,226,0.06)',
}

const detailBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '16px',
  height: '16px',
  borderRadius: '8px',
  backgroundColor: c.blue,
  color: '#fff',
  fontSize: '10px',
  fontWeight: 700,
  padding: '0 4px',
}

const subjectScroll: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  overflowX: 'auto',
  maxWidth: '720px',
  margin: '0 auto',
  paddingBottom: '4px',
  scrollbarWidth: 'none',
}

const mainContent: React.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '40px 20px 100px',
}

const section: React.CSSProperties = { marginBottom: '32px' }

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
}

const sectionLabel: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 700,
  color: c.textHint,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const badge: React.CSSProperties = {
  fontSize: font.xs,
  backgroundColor: 'rgba(55,53,47,0.06)',
  color: c.textSub,
  padding: '1px 6px',
  borderRadius: '10px',
  fontWeight: 600,
}

const cardGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  overflow: 'hidden',
}

const cardDivider: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(0,0,0,0.05)',
  margin: '0 16px',
}

const fab: React.CSSProperties = {
  position: 'fixed',
  bottom: '80px',
  right: '20px',
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  backgroundColor: c.blue,
  color: c.bg,
  border: 'none',
  boxShadow: '0 4px 12px rgba(35,131,226,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 1000,
}

const mutedText: React.CSSProperties = {
  color: 'rgba(55,53,47,0.4)',
  textAlign: 'center',
  marginTop: '60px',
  fontSize: font.base,
}

const errorText: React.CSSProperties = {
  color: c.red,
  textAlign: 'center',
  padding: '2rem',
  fontSize: font.base,
}

const emptyState: React.CSSProperties = { padding: '60px 0' }

const skeletonCard: React.CSSProperties = {
  height: '108px',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  overflow: 'hidden',
}
const skRow: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' }
const sk: React.CSSProperties = {
  borderRadius: '4px',
  backgroundColor: 'rgba(55,53,47,0.08)',
  animation: 'weakSkeleton 1.4s ease-in-out infinite',
}

// ── Detail modal styles ──

const detailModalTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: c.text,
}

const detailSection: React.CSSProperties = {
  marginBottom: '24px',
}

const detailLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: c.textSub,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '10px',
}

const detailSelect: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  border: `1px solid rgba(55,53,47,0.14)`,
  borderRadius: '8px',
  backgroundColor: '#fff',
  color: c.text,
  outline: 'none',
}

const segControl: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  backgroundColor: 'rgba(55,53,47,0.05)',
  borderRadius: '8px',
  padding: '3px',
}

const segBtn: React.CSSProperties = {
  flex: 1,
  border: 'none',
  borderRadius: '6px',
  padding: '7px 4px',
  fontSize: '13px',
  cursor: 'pointer',
  background: 'transparent',
  color: 'rgba(55,53,47,0.4)',
  fontWeight: 400,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

const segBtnActive: React.CSSProperties = {
  backgroundColor: '#fff',
  color: c.text,
  fontWeight: 700,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}

const pillGroup: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
}

const filterPillBtn: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 500,
  border: `1px solid rgba(55,53,47,0.14)`,
  borderRadius: '999px',
  background: 'transparent',
  color: c.textSub,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

const pillBtnActive: React.CSSProperties = {
  backgroundColor: 'rgba(55,53,47,0.08)',
  color: c.text,
  fontWeight: 700,
  borderColor: 'rgba(55,53,47,0.25)',
}

const dateRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const dateInput: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  fontSize: '13px',
  border: `1px solid rgba(55,53,47,0.14)`,
  borderRadius: '8px',
  backgroundColor: '#fff',
  color: c.text,
  outline: 'none',
}

const clearBtn: React.CSSProperties = {
  width: '100%',
  padding: '11px',
  fontSize: '13px',
  fontWeight: 600,
  color: c.red,
  border: `1px solid rgba(235,87,87,0.2)`,
  borderRadius: '8px',
  background: 'rgba(235,87,87,0.04)',
  cursor: 'pointer',
  marginTop: '8px',
}
