import type {FailureType, Problem, ProblemInput, Proficiency} from '../types/workspace'
import {FAILURE_TYPE_VALUES, PROFICIENCY_VALUES} from '../types/workspace'
import {useSettingsStore} from '../lib/store/settings'
import {ProblemCard} from '../components/note/ProblemCard'
import {ProblemQuickModal} from '../components/note/ProblemQuickModal'
import {addProblem, fetchProblems, updateProblem} from '../lib/api/problem'
import {getCached, invalidateCache, setCached} from '../lib/pageCache'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FilterPill} from '../components/note/FilterPill'
import {AddProblemModal} from '../components/note/AddProblemModal'
import {c, font, pageHeading} from '../styles/notion'
import {flashBugfixBtn} from "@/styles/flashBugficUI.ts";
import type {FlashBugfixConfig} from "@/lib/api/morningQuiz.ts";
import {useNavigate} from "react-router-dom";
import {FlashBugfixConfigModal} from "@/components/practice/FlashBugfixConfigModal.tsx";

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

export default function NoteListPage() {
  const navigate = useNavigate()

  const subjects = useSettingsStore((s) => s.subjects)
  const subCategories = useSettingsStore((s) => s.subCategories)
  const [problems, setProblems] = useState<Problem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [quickProblem, setQuickProblem] = useState<Problem | null>(null)

  const didMountRef = useRef(false)

  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterQuery, setFilterQuery] = useState<string>('')
  const [filterProficiency, setFilterProficiency] = useState<Proficiency | 'all'>('all')
  const [filterFailureType, setFilterFailureType] = useState<FailureType | 'all'>('all')

  const items = subCategories.filter((sc) => sc.subject === filterSubject)
  const [showFlashConfig, setShowFlashConfig] = useState(false)
  const handleFlashStart = (config: FlashBugfixConfig) => {
    setShowFlashConfig(false)
    navigate(`/subjects/${encodeURIComponent(filterSubject)}/flash-bugfix`, { state: { config } })
  }

  // 初回ロード
  useEffect(() => {
    const cached = getCached<Problem[]>('note-problems')
    if (cached) {
      setProblems(cached)
      setInitialLoading(false)
    }
    fetchProblems()
      .then((p) => {
        setProblems(p)
        setCached('note-problems', p)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
      .finally(() => setInitialLoading(false))
  }, [])

  // フィルター変化時の再フェッチ（debounce 250ms）
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const subjects = filterSubject === 'all' ? undefined : [filterSubject]
    const q = filterQuery.trim() || undefined
    setFilterLoading(true)
    const timer = setTimeout(() => {
      fetchProblems({ subjects, q })
        .then(setProblems)
        .catch(console.error)
        .finally(() => setFilterLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [filterSubject, filterQuery])

  const handleAddProblem = useCallback(async (input: ProblemInput) => {
    const p = await addProblem(input)

    setProblems((prev) => [p, ...prev])
    invalidateCache('note-problems')
    return p
  }, [])

  const handleProblemUpdate = useCallback(async (id: number, input: ProblemInput) => {
    const updated = await updateProblem(id, input)

    setProblems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))

    invalidateCache('note-problems')

    return updated
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
        .filter((p) => filterProficiency === 'all' || p.proficiency === filterProficiency)
        .filter(
            (p) =>
                filterFailureType === 'all' || p.failureTypes.includes(filterFailureType as FailureType)
        )

    // All のときは科目分けせず、そのまま降順
    if (filterSubject === 'all') {
      return [
        {
          subject: 'all',
          items: [...filtered].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          ),
        },
      ]
    }

    // 個別科目のときは今まで通り
    const subjectList =
        subjects.length > 0 ? subjects : [...new Set(filtered.map((p) => p.subject))]

    return subjectList
        .map((s) => ({
          subject: s,
          items: filtered.filter((p) => p.subject === s),
        }))
        .filter((g) => g.items.length > 0)
  }, [problems, filterSubject, filterProficiency, filterFailureType, subjects])

  return (
    <div style={container}>
      <div style={stickyHeader}>
        <div
          style={{
            ...headerContent,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          {/* 1段目: タイトルとメインアクション */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <h1 style={{ ...pageHeading, marginBottom: 0 }}>Note</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '24px',
                    marginBottom: '8px',
                  }}
              >
                {filterSubject === 'all' ? (<p></p>) :
                  <button style={flashBugfixBtn} onClick={() => setShowFlashConfig(true)}>
                    ⚡ Flash Bugfix
                  </button>
                }
              </div>
            </div>
          </div>

          {/* 2段目: フィルタコントロール */}
          <div
            style={{
              ...controls,
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '8px',
            }}
          >
            <div style={searchWrap}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'rgba(55,53,47,0.4)', flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="キーワード検索"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={searchInput}
              />
              {filterLoading && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    animation: 'spin 0.8s linear infinite',
                    color: 'rgba(55,53,47,0.4)',
                    flexShrink: 0,
                  }}
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              )}
            </div>
            <select
              style={select}
              value={filterProficiency}
              onChange={(e) => setFilterProficiency(e.target.value as Proficiency | 'all')}
            >
              <option value="all">習熟度: すべて</option>
              {PROFICIENCY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select
              style={select}
              value={filterFailureType}
              onChange={(e) => setFilterFailureType(e.target.value as FailureType | 'all')}
            >
              <option value="all">属性: すべて</option>
              {FAILURE_TYPE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
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
            onUpdate={handleProblemUpdate}
            onClose={() => setShowAddForm(false)}
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
        />
      )}

      {!showAddForm && !quickProblem && (
        <button style={fab} onClick={() => setShowAddForm(true)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      {showFlashConfig && (
          <FlashBugfixConfigModal
              subjectName={filterSubject}
              subCategories={items}
              onClose={() => setShowFlashConfig(false)}
              onStart={handleFlashStart}
          />
      )}
    </div>
  )
}

const container: React.CSSProperties = { minHeight: '100vh', backgroundColor: c.bg, color: c.text }

const stickyHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${c.border}`,
  padding: '12px 16px',
}
const headerContent: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '720px',
  margin: '0 auto 12px',
}
const controls: React.CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' }

const select: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '12px',
  borderRadius: '4px',
  border: `1px solid rgba(55, 53, 47, 0.16)`,
  backgroundColor: 'transparent',
  color: c.textSub,
  outline: 'none',
  cursor: 'pointer',
}
const searchWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flex: 1,
  minWidth: 0,
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid rgba(55, 53, 47, 0.16)',
  backgroundColor: 'transparent',
}
const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  fontSize: '12px',
  backgroundColor: 'transparent',
  color: c.text,
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
  backgroundColor: 'rgba(55, 53, 47, 0.06)',
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
  boxShadow: '0 4px 12px rgba(35, 131, 226, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 1000,
}
const mutedText: React.CSSProperties = {
  color: 'rgba(55, 53, 47, 0.4)',
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
