import type {Problem, Proficiency} from "../../types/workspace";
import {useNavigate} from "react-router-dom";


type Props = {
  problem: Problem
}

const PROFICIENCY_STYLE: Record<Proficiency, { backgroundColor: string; color: string }> = {
  '○': { backgroundColor: '#e8f5e2', color: '#3a7a2a' },
  '△': { backgroundColor: '#fdf3df', color: '#c8860a' },
  '×': { backgroundColor: '#fce8e6', color: '#c0392b' },
}

export function ProblemCard({ problem }: Props) {
  const navigate = useNavigate()

  const profStyle = PROFICIENCY_STYLE[problem.proficiency]

  return (
    <div style={card} onClick={() => navigate(`/weak/${problem.id}`)}>
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

      {/* Material + solvedAt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {problem.material && (
          <span style={{ fontSize: '0.75rem', color: '#b5a99a' }}>{problem.material}</span>
        )}
        <span style={{ fontSize: '0.75rem', color: '#b5a99a', marginLeft: 'auto' }}>
          {problem.solvedAt.replace(/-/g, '/')}
        </span>
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
  cursor: 'pointer',
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

