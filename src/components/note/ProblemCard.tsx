import type {Problem, Proficiency} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
      {/* SNS Header: SubCategory @Subject */}
      <div style={topRow}>
        <span style={subCatMain}>{problem.subCategory || '全般'}</span>
        <span style={subjectHandle}>@{problem.subject}</span>
        <span style={dotSeparator}>·</span>
        <span style={dateText}>{problem.solvedAt.replace(/-/g, '/')}</span>
      </div>

      {/* Main Content (Note) */}
      <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
          }}
      >
        {problem.note}
      </ReactMarkdown>

      {/* Hashtags: #Failure, #Material, #QuestionRef */}
      <div style={tagRow}>
        {problem.failureTypes.map((ft) => (
          <span key={ft} style={hashtag}>
            #{ft}
          </span>
        ))}
        {problem.material && <span style={hashtag}>#{problem.material}</span>}
        <span style={hashtag}>#{problem.questionRef}</span>
      </div>

      {/* Defeat reason (Quote styling) */}
      {problem.defeatReason && (
        <div style={defeatBox}>
          <p style={defeatText}>
            <span style={{ fontWeight: 700, marginRight: '4px' }}>敗因:</span>
            {problem.defeatReason}
          </p>
        </div>
      )}

      {/* Bottom Status Area */}
      <div style={bottomRow}>
        <div style={statusGroup}>
          <span style={{ ...profText, color: profColor }}>{problem.proficiency}</span>
          {problem.isGoodQuestion && <span style={starText}>★</span>}
        </div>
      </div>
    </div>
  )
}

// --- Styles ---

const card: React.CSSProperties = {
  padding: '16px',
  marginBottom: '12px', // カード間の垂直余白のみ保持
  borderRadius: '16px',
  backgroundColor: '#fff',
  border: `1px solid rgba(0,0,0,0.08)`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const topRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const subCatMain: React.CSSProperties = {
  fontSize: font.base,
  fontWeight: 800,
  color: c.text,
}

const subjectHandle: React.CSSProperties = {
  fontSize: font.sm,
  fontWeight: 400,
  color: c.textSub,
}

const dotSeparator: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
}

const dateText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
}

const tagRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: '12px',
  rowGap: '4px',
  marginTop: '2px',
}

const hashtag: React.CSSProperties = {
  fontSize: font.sm,
  color: '#1d9bf0', // SNSリンク色
  fontWeight: 400,
}

const defeatBox: React.CSSProperties = {
  marginTop: '4px',
  padding: '10px 14px',
  borderRadius: '12px',
  border: `1px solid ${c.border}`,
  backgroundColor: '#f8f9fa',
}

const defeatText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.text,
  margin: 0,
  lineHeight: 1.4,
}

const bottomRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '4px',
}

const statusGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const starText: React.CSSProperties = {
  fontSize: '14px',
  color: '#f2ab26',
}

const profText: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 900,
}