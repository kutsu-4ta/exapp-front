'use client'

import { useEffect, useState, useCallback } from 'react'
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
      .catch((e) => setError(e instanceof Error ? e.message : 'エラーが発生しました'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = useCallback(async (input: ProblemInput) => {
    const p = await addProblem(input)
    setProblems((prev) => [p, ...prev])
  }, [])

  const handleUpdate = useCallback(async (id: number, input: ProblemInput) => {
    const updated = await updateProblem(id, input)
    setProblems((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await deleteProblem(id)
    setProblems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Filtering
  const filtered = problems
    .filter((p) => filterSubject === 'all' || p.subject === filterSubject)
    .filter((p) => filterProficiency === 'all' || p.proficiency === filterProficiency)
    .filter((p) => filterFailureType === 'all' || p.failureTypes.includes(filterFailureType as FailureType))

  // Grouping: SUBJECTS order first, then any others
  const extraSubjects = [...new Set(filtered.map((p) => p.subject).filter((s) => !SUBJECTS.includes(s as never)))]
  const subjectOrder = [...SUBJECTS, ...extraSubjects]
  const grouped = subjectOrder
    .map((subject) => ({ subject, items: filtered.filter((p) => p.subject === subject) }))
    .filter(({ items }) => items.length > 0)

  return (
    <div style={content}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a1108', margin: 0 }}>弱点管理</h1>
        {!showAddForm && (
          <button type="button" onClick={() => setShowAddForm(true)} style={addBtn}>
            ＋ 問題を追加
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <ProblemForm
          onSubmit={async (input) => {
            await handleAdd(input)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Filter bar */}
      {!loading && !error && (
        <FilterBar
          filterSubject={filterSubject}
          onSubjectChange={setFilterSubject}
          filterProficiency={filterProficiency}
          onProficiencyChange={setFilterProficiency}
          filterFailureType={filterFailureType}
          onFailureTypeChange={setFilterFailureType}
        />
      )}

      {/* States */}
      {loading && (
        <p style={muted}>読み込み中…</p>
      )}
      {error && (
        <p style={{ fontSize: '0.875rem', color: '#c0392b' }}>{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <p style={muted}>
          {problems.length === 0 ? '「＋ 問題を追加」から問題を登録してください' : '条件に一致する問題がありません'}
        </p>
      )}

      {/* Grouped list */}
      {!loading && !error && grouped.map(({ subject, items }) => (
        <div key={subject} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5c3a1e', margin: 0, letterSpacing: '0.04em' }}>
              {subject}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#b5a99a' }}>{items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

type FilterBarProps = {
  filterSubject: string
  onSubjectChange: (v: string) => void
  filterProficiency: Proficiency | 'all'
  onProficiencyChange: (v: Proficiency | 'all') => void
  filterFailureType: FailureType | 'all'
  onFailureTypeChange: (v: FailureType | 'all') => void
}

function FilterBar({
  filterSubject, onSubjectChange,
  filterProficiency, onProficiencyChange,
  filterFailureType, onFailureTypeChange,
}: FilterBarProps) {
  return (
    <div style={filterCard}>
      {/* Subject row */}
      <div style={filterRow}>
        <FilterPill active={filterSubject === 'all'} onClick={() => onSubjectChange('all')}>全科目</FilterPill>
        {SUBJECTS.map((s) => (
          <FilterPill key={s} active={filterSubject === s} onClick={() => onSubjectChange(s)}>
            {s}
          </FilterPill>
        ))}
      </div>

      {/* Proficiency row */}
      <div style={filterRow}>
        <FilterPill active={filterProficiency === 'all'} onClick={() => onProficiencyChange('all')}>全て</FilterPill>
        {PROFICIENCY_VALUES.map((p) => (
          <FilterPill key={p} active={filterProficiency === p} onClick={() => onProficiencyChange(p)}>
            {p}
          </FilterPill>
        ))}
      </div>

      {/* Failure type row */}
      <div style={filterRow}>
        <FilterPill active={filterFailureType === 'all'} onClick={() => onFailureTypeChange('all')}>全て</FilterPill>
        {FAILURE_TYPE_VALUES.map((ft) => (
          <FilterPill key={ft} active={filterFailureType === ft} onClick={() => onFailureTypeChange(ft)}>
            {ft}
          </FilterPill>
        ))}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.25rem 0.75rem',
        minHeight: '32px',
        borderRadius: '20px',
        border: active ? 'none' : '1px solid #edeae6',
        backgroundColor: active ? '#5c3a1e' : 'transparent',
        color: active ? '#ffffff' : '#8a7b6e',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const content: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '1.25rem 1.25rem 4rem',
}

const addBtn: React.CSSProperties = {
  padding: '0.375rem 0.875rem',
  minHeight: '36px',
  border: '1px solid #edeae6',
  borderRadius: '20px',
  backgroundColor: 'transparent',
  color: '#5c3a1e',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const filterCard: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #edeae6',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.625rem',
  marginBottom: '1.25rem',
}

const filterRow: React.CSSProperties = {
  display: 'flex',
  gap: '0.375rem',
  overflowX: 'auto',
  paddingBottom: '2px',
}

const muted: React.CSSProperties = {
  color: '#b5a99a',
  fontSize: '0.875rem',
  letterSpacing: '0.04em',
  textAlign: 'center',
  marginTop: '3rem',
}
