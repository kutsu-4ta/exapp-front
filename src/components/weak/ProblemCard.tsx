import type { Problem, Proficiency } from "../../types/workspace";
import { c, font } from "../../styles/notion";

type Props = {
  problem: Problem
  onClick?: () => void
}

const PROF_COLOR: Record<Proficiency, string> = {
  '○': '#19a576',
  '△': '#f2ab26',
  '×': c.red,
}

export function ProblemCard({ problem, onClick }: Props) {
  const profColor = PROF_COLOR[problem.proficiency] ?? c.textSub

  return (
      <div style={card} onClick={onClick}>
        {/* SNS Header Style: Subject & SubCategory */}
        <div style={topRow}>
          <span style={subjectLabel}>{problem.subject}</span>
          {problem.subCategory && (
              <span style={subCatLabel}>@{problem.subCategory}</span>
          )}
          <span style={dotSeparator}>·</span>
          <span style={dateText}>{problem.solvedAt.replace(/-/g, '/')}</span>
        </div>

        {/* Main Content: Note or QuestionRef */}
        <div style={contentBody}>
          {/* 問題番号は目立たせず、内容のプレフィックスとして配置 */}
          <span style={questionRefInline}>Q.{problem.questionRef}</span>
          {problem.note && <p style={noteText}>{problem.note}</p>}
        </div>

        {/* Failure type chips */}
        {problem.failureTypes.length > 0 && (
            <div style={failureRow}>
              {problem.failureTypes.map((ft) => (
                  <span key={ft} style={failureChip}>#{ft}</span>
              ))}
            </div>
        )}

        {/* Defeat reason (Quote styling) */}
        {problem.defeatReason && (
            <div style={defeatBox}>
              <p style={defeatText}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>敗因:</span>
                {problem.defeatReason}
              </p>
            </div>
        )}

        {/* Bottom Actions (SNS icons style) */}
        <div style={bottomRow}>
          <div style={statusGroup}>
            <span style={{ ...profText, color: profColor }}>{problem.proficiency}</span>
            {problem.isGoodQuestion && <span style={starText}>★</span>}
          </div>
          {problem.material && <span style={materialText}>{problem.material}</span>}
        </div>
      </div>
  )
}

const card: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: `1px solid ${c.border}`,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: '#fff',
  transition: 'background-color 0.2s',
}

const topRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const subjectLabel: React.CSSProperties = {
  fontSize: font.base,
  fontWeight: 700,
  color: c.text,
}

const subCatLabel: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const dotSeparator: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  padding: '0 2px',
}

const dateText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
}

const contentBody: React.CSSProperties = {
  marginTop: '2px',
}

const questionRefInline: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  marginRight: '8px',
  fontWeight: 500,
}

const noteText: React.CSSProperties = {
  display: 'inline', // 問題番号の横から開始
  fontSize: font.base,
  color: c.text,
  margin: 0,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const failureRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '4px',
}

const failureChip: React.CSSProperties = {
  fontSize: font.sm,
  color: '#1d9bf0', // SNSのハッシュタグ風カラー
}

const defeatBox: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px 12px',
  borderRadius: '12px',
  border: `1px solid ${c.border}`,
  backgroundColor: '#f8f9fa',
}

const defeatText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.text,
  margin: 0,
}

const bottomRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '8px',
}

const statusGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const materialText: React.CSSProperties = {
  fontSize: font.xs,
  color: c.textSub,
  backgroundColor: '#eee',
  padding: '2px 6px',
  borderRadius: '4px',
}

const starText: React.CSSProperties = {
  fontSize: '14px',
  color: '#f2ab26',
}

const profText: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 900,
}