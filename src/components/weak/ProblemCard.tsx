import type { Problem, Proficiency } from "../../types/workspace";
import { c, font } from "../../styles/notion";

type Props = {
  problem: Problem
  onClick?: () => void
}

const PROFICIENCY_STYLE: Record<Proficiency, { backgroundColor: string; color: string }> = {
  '○': { backgroundColor: '#e6f6eb', color: '#19a576' },
  '△': { backgroundColor: '#fff5e0', color: '#f2ab26' },
  '×': { backgroundColor: 'rgba(235, 87, 87, 0.08)', color: c.red },
}

export function ProblemCard({ problem, onClick }: Props) {
  const profStyle = PROFICIENCY_STYLE[problem.proficiency]

  return (
    <div style={card} onClick={onClick}>
      {/* Top row: subject chip + questionRef + proficiency badge + 良問 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={subjectChip}>{problem.subject}</span>
        <span style={{ fontSize: font.base, fontWeight: 600, color: c.text, flex: 1 }}>
          {problem.questionRef}
        </span>
        <span style={{ ...badge, ...profStyle }}>{problem.proficiency}</span>
        {problem.isGoodQuestion && (
          <span style={{ fontSize: font.base, color: '#f2ab26' }}>★</span>
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
        <p style={{ fontSize: font.sm, color: c.red, margin: 0, fontWeight: 500 }}>
          敗因: {problem.defeatReason}
        </p>
      )}

      {/* Note */}
      {problem.note && (
        <p style={{
          fontSize: font.base,
          color: c.textSub,
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
          <span style={{ fontSize: font.xs, color: c.textHint }}>{problem.material}</span>
        )}
        <span style={{ fontSize: font.xs, color: c.textHint, marginLeft: 'auto' }}>
          {problem.solvedAt.replace(/-/g, '/')}
        </span>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  backgroundColor: '#fff',
  border: `1px solid ${c.border}`,
  borderRadius: '8px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  cursor: 'pointer',
}

const subjectChip: React.CSSProperties = {
  backgroundColor: 'rgba(55, 53, 47, 0.06)',
  color: c.textSub,
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: font.xs,
  fontWeight: 600,
}

const badge: React.CSSProperties = {
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: font.xs,
  fontWeight: 700,
}

const failureChip: React.CSSProperties = {
  border: `1px solid ${c.border}`,
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: font.xs,
  color: c.textSub,
}
