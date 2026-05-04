import type {Problem, ProblemInput, Proficiency, SubCategory} from "../../types/workspace";
import {ProblemForm} from "./ProblemForm";
import {useState} from "react";


type Props = {
  problem: Problem
  subCategories?: SubCategory[]
  onUpdate: (id: number, input: ProblemInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const PROFICIENCY_STYLE: Record<Proficiency, { backgroundColor: string; color: string }> = {
  '○': { backgroundColor: '#e8f5e2', color: '#3a7a2a' },
  '△': { backgroundColor: '#fdf3df', color: '#c8860a' },
  '×': { backgroundColor: '#fce8e6', color: '#c0392b' },
}

export function ProblemCard({ problem, subCategories = [], onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (editing) {
    return (
      <ProblemForm
        initial={{
          subject: problem.subject,
          materialId: null,
          materialName: problem.material,
          subCategory: problem.subCategory,
          questionRef: problem.questionRef,
          note: problem.note,
          defeatReason: problem.defeatReason,
          proficiency: problem.proficiency,
          failureTypes: problem.failureTypes,
          isGoodQuestion: problem.isGoodQuestion,
          solvedAt: problem.solvedAt,
        }}
        subCategories={subCategories}
        onSubmit={async (input) => {
          await onUpdate(problem.id, input)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  async function handleDelete() {
    if (!confirm('この問題を削除しますか？')) return
    setDeleting(true)
    try {
      await onDelete(problem.id)
    } finally {
      setDeleting(false)
    }
  }

  const profStyle = PROFICIENCY_STYLE[problem.proficiency]

  return (
    <div style={card}>
      {/* Top row: subject chip + questionRef + proficiency badge + 良問 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={subjectChip}>{problem.subject}</span>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a1108', flex: 1 }}>
          {problem.questionRef}
        </span>
        <span style={{ ...badge, ...profStyle }}>{problem.proficiency}</span>
        {problem.isGoodQuestion && (
          <span style={{ fontSize: '0.875rem', color: '#c8860a' }}>★</span>
        )}
      </div>

      {/* Failure type chips */}
      {problem.failureTypes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {problem.failureTypes.map((ft) => (
            <span key={ft} style={failureChip}>{ft}</span>
          ))}
        </div>
      )}

      {/* Defeat reason */}
      {problem.defeatReason && (
        <p style={{ fontSize: '0.8125rem', color: '#eb5757', margin: 0, fontWeight: 500 }}>
          敗因: {problem.defeatReason}
        </p>
      )}

      {/* Note */}
      {problem.note && (
        <p style={{
          fontSize: '0.875rem',
          color: '#7a6858',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          margin: 0,
        }}>
          {problem.note}
        </p>
      )}

      {/* Material + solvedAt + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {problem.material && (
          <span style={{ fontSize: '0.75rem', color: '#b5a99a' }}>{problem.material}</span>
        )}
        <span style={{ fontSize: '0.75rem', color: '#b5a99a', marginLeft: 'auto' }}>
          {problem.solvedAt.replace(/-/g, '/')}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={actionBtn}
        >
          編集
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{ ...actionBtn, color: '#c0392b' }}
        >
          削除
        </button>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #edeae6',
  borderRadius: '10px',
  padding: '0.875rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const subjectChip: React.CSSProperties = {
  backgroundColor: '#f0e8dd',
  color: '#5c3a1e',
  borderRadius: '4px',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const badge: React.CSSProperties = {
  borderRadius: '4px',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const failureChip: React.CSSProperties = {
  border: '1px solid #e4dbd0',
  borderRadius: '4px',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  color: '#7a6858',
}

const actionBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '0.25rem 0.375rem',
  fontSize: '0.75rem',
  color: '#8a7b6e',
  cursor: 'pointer',
  letterSpacing: '0.02em',
}
