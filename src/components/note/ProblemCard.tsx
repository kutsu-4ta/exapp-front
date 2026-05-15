import type {Problem} from '../../types/workspace'
import {c, font} from '../../styles/notion'
import {MarkdownContent} from "@/components/common/MarkdownContent.tsx";
import {PROF_COLORS, subjectBadgeText, subjectPalette} from "@/styles/subjectUI.ts";

type Props = {
  problem: Problem
  onClick?: () => void
}

export function ProblemCard({ problem, onClick }: Props) {
  const profColor = PROF_COLORS[problem.proficiency] ?? c.textSub
  const badgeText = subjectBadgeText(problem.subject)
  const palette = subjectPalette(problem.subject)

  return (
    <div style={card} onClick={onClick}>
      {/* SNS Header: SubCategory @Subject */}
      <div style={topRow}>
        <div
            style={{
              ...avatar,
              backgroundColor: palette.bg,
              color: "black",
            }}
        >
          {badgeText}
        </div>

        <span style={userName}>
    {problem.subCategory || '全般'}
  </span>

        <span style={userHandle}>
    @{problem.material}_{problem.questionRef}
  </span>

        <span style={dotSeparator}>·</span>

        <span style={dateText}>
    {problem.solvedAt.replace(/-/g, '/')}
  </span>
      </div>

      {/* Main Content (Note) */}
      <MarkdownContent>
        {problem.note}
      </MarkdownContent>

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
const dotSeparator: React.CSSProperties = {
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

const topRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const userName: React.CSSProperties = {
  fontSize: font.base,
  fontWeight: 700,
  color: c.text,
}

const userHandle: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
}

const dateText: React.CSSProperties = {
  fontSize: font.sm,
  color: c.textSub,
  marginLeft: 'auto',
}
const avatar: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 800,
  flexShrink: 0,
}