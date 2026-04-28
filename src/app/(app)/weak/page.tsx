'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  SUBJECTS,
  PROFICIENCY_VALUES,
  FAILURE_TYPE_VALUES,
  type Problem,
  type ProblemInput,
  type Proficiency,
  type FailureType,
} from '@/types/workspace'
import { fetchProblems, addProblem, updateProblem, deleteProblem } from '@/lib/api/problem'
import { ProblemCard } from '@/components/weak/ProblemCard'
import { ProblemForm } from '@/components/weak/ProblemForm'

export default function WeakPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterProficiency, setFilterProficiency] = useState<Proficiency | 'all'>('all')
  const [filterFailureType, setFilterFailureType] = useState<FailureType | 'all'>('all')

  useEffect(() => {
    fetchProblems()
        .then(setProblems)
        .catch((e) => setError(e instanceof Error ? e.message : '読み込みエラー'))
        .finally(() => setLoading(false))
  }, [])

  const handleAdd = useCallback(async (input: ProblemInput) => {
    const p = await addProblem(input)
    setProblems((prev) => [p, ...prev])
    setShowAddForm(false)
  }, [])

  const handleUpdate = useCallback(async (id: number, input: ProblemInput) => {
    const updated = await updateProblem(id, input)
    setProblems((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('削除してもよろしいですか？')) return
    await deleteProblem(id)
    setProblems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // フィルタリングとグルーピングのロジックをメモ化
  const grouped = useMemo(() => {
    const filtered = problems
        .filter((p) => filterSubject === 'all' || p.subject === filterSubject)
        .filter((p) => filterProficiency === 'all' || p.proficiency === filterProficiency)
        .filter((p) => filterFailureType === 'all' || p.failureTypes.includes(filterFailureType as FailureType))

    return SUBJECTS.map((s) => ({
      subject: s,
      items: filtered.filter((p) => p.subject === s),
    })).filter((g) => g.items.length > 0)
  }, [problems, filterSubject, filterProficiency, filterFailureType])

  return (
      <div style={container}>
        {/* Sticky Header with Filters */}
        <div style={stickyHeader}>
          <div style={headerContent}>
            <h1 style={title}>弱点管理</h1>
            <div style={controls}>
              <select
                  style={select}
                  value={filterProficiency}
                  onChange={(e) => setFilterProficiency(e.target.value as any)}
              >
                <option value="all">すべての習熟度</option>
                {PROFICIENCY_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select
                  style={select}
                  value={filterFailureType}
                  onChange={(e) => setFilterFailureType(e.target.value as any)}
              >
                <option value="all">すべてのミス傾向</option>
                {FAILURE_TYPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={subjectScroll}>
            <FilterPill active={filterSubject === 'all'} onClick={() => setFilterSubject('all')}>全科目</FilterPill>
            {SUBJECTS.map((s) => (
                <FilterPill key={s} active={filterSubject === s} onClick={() => setFilterSubject(s)}>
                  {s}
                </FilterPill>
            ))}
          </div>
        </div>

        <div style={mainContent}>
          {showAddForm && (
              <div style={modalOverlay}>
                <div style={modalContent}>
                  <ProblemForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
                </div>
              </div>
          )}

          {loading && <p style={mutedText}>データを照合中...</p>}
          {error && <p style={errorText}>{error}</p>}

          {!loading && grouped.length === 0 && (
              <div style={emptyState}>
                <p style={mutedText}>該当する問題が見つかりません</p>
              </div>
          )}

          {grouped.map(({ subject, items }) => (
              <section key={subject} style={section}>
                <div style={sectionHeader}>
                  <h2 style={sectionTitle}>{subject}</h2>
                  <span style={countBadge}>{items.length}</span>
                </div>
                <div style={cardGrid}>
                  {items.map((p) => (
                      <ProblemCard key={p.id} problem={p} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
          ))}
        </div>

        {/* Floating Action Button */}
        {!showAddForm && (
            <button style={fab} onClick={() => setShowAddForm(true)} title="問題を追加">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
        )}
      </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
      <button type="button" onClick={onClick} style={{
        ...pillBase,
        backgroundColor: active ? '#5c3a1e' : '#fff',
        color: active ? '#fff' : '#8a7b6e',
        borderColor: active ? '#5c3a1e' : '#edeae6',
        fontWeight: active ? 700 : 400,
      }}>
        {children}
      </button>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#fdfcfb' }

const stickyHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(253, 252, 251, 0.95)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid #edeae6',
  padding: '0.75rem 1rem',
}

const headerContent: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '640px',
  margin: '0 auto 0.75rem',
}

const title: React.CSSProperties = { fontSize: '1rem', fontWeight: 800, color: '#1a1108', margin: 0 }

const controls: React.CSSProperties = { display: 'flex', gap: '0.5rem' }

const select: React.CSSProperties = {
  padding: '0.3rem 0.5rem',
  fontSize: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #edeae6',
  backgroundColor: '#fff',
  color: '#5c3a1e',
  outline: 'none',
}

const subjectScroll: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  maxWidth: '640px',
  margin: '0 auto',
  paddingBottom: '4px',
  msOverflowStyle: 'none',
}

const mainContent: React.CSSProperties = { maxWidth: '640px', margin: '0 auto', padding: '1.25rem' }

const section: React.CSSProperties = { marginBottom: '2rem' }

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.75rem',
}

const sectionTitle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 700, color: '#5c3a1e', margin: 0 }

const countBadge: React.CSSProperties = {
  fontSize: '0.7rem',
  backgroundColor: '#f0ece8',
  color: '#8a7b6e',
  padding: '1px 6px',
  borderRadius: '10px',
  fontWeight: 700,
}

const cardGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }

const pillBase: React.CSSProperties = {
  padding: '0.25rem 0.875rem',
  fontSize: '0.8125rem',
  borderRadius: '20px',
  border: '1px solid',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const fab: React.CSSProperties = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  width: '56px',
  height: '56px',
  borderRadius: '28px',
  backgroundColor: '#5c3a1e',
  color: '#fff',
  border: 'none',
  boxShadow: '0 4px 16px rgba(92, 58, 30, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 1000,
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(26, 17, 8, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '1rem',
}

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const mutedText: React.CSSProperties = { color: '#b5a99a', textAlign: 'center', marginTop: '4rem', fontSize: '0.875rem' }
const errorText: React.CSSProperties = { color: '#c0392b', textAlign: 'center', padding: '2rem' }
const emptyState: React.CSSProperties = { padding: '4rem 0' }